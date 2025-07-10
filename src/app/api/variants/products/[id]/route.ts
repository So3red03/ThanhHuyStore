import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { NextResponse } from 'next/server';

interface IParams {
  id: string;
}

/**
 * GET: Fetch a specific variant product with full details
 */
export async function GET(request: Request, { params }: { params: IParams }) {
  try {
    // Validate ObjectId format for MongoDB
    if (!params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ error: 'Invalid product ID format' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: {
        id: params.id,
        productType: 'VARIANT',
        isDeleted: false
      },
      include: {
        category: true,
        productAttributes: {
          include: {
            values: {
              orderBy: { position: 'asc' }
            }
          },
          orderBy: { position: 'asc' }
        },
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        },
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, image: true }
            }
          },
          orderBy: { createdDate: 'desc' }
        },
        _count: {
          select: {
            variants: true,
            reviews: true
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching variant product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT: Update a variant product
 */
export async function PUT(request: Request, { params }: { params: IParams }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, brand, basePrice, categoryId, images, attributes, variants } = body;

    // Check if product exists and is variant type
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: params.id,
        productType: 'VARIANT',
        isDeleted: false
      }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update in transaction
    const result = await prisma.$transaction(async tx => {
      // 1. Update basic product info
      const updatedProduct = await tx.product.update({
        where: { id: params.id },
        data: {
          name,
          description,
          brand,
          basePrice: basePrice ? parseFloat(basePrice) : undefined,
          categoryId,
          thumbnail: body.thumbnail || null,
          galleryImages: body.galleryImages || [],
          updatedAt: new Date()
        }
      });

      // 2. If attributes are provided, update them
      if (attributes) {
        // Delete existing attributes and their values
        await tx.attributeValue.deleteMany({
          where: {
            attribute: {
              productId: params.id
            }
          }
        });

        await tx.productAttribute.deleteMany({
          where: { productId: params.id }
        });

        // Create new attributes
        for (let i = 0; i < attributes.length; i++) {
          const attr = attributes[i];
          const createdAttr = await tx.productAttribute.create({
            data: {
              productId: params.id,
              name: attr.name,
              label: attr.label,
              type: attr.type,
              displayType: attr.displayType,
              isRequired: attr.isRequired ?? true,
              isVariation: attr.isVariation ?? true,
              position: i,
              description: attr.description
            }
          });

          // Create attribute values
          for (let j = 0; j < (attr.values || []).length; j++) {
            const value = attr.values[j];
            await tx.attributeValue.create({
              data: {
                attributeId: createdAttr.id,
                value: value.value,
                label: value.label,
                description: value.description,
                colorCode: value.colorCode,
                imageUrl: value.imageUrl,
                priceAdjustment: parseFloat(value.priceAdjustment || '0'),
                position: j
              }
            });
          }
        }
      }

      // 3. If variants are provided, update them
      if (variants) {
        // Delete existing variants
        await tx.productVariant.deleteMany({
          where: { productId: params.id }
        });

        // Create new variants
        for (const variant of variants) {
          if (!variant.sku || !variant.attributes || !variant.price) {
            continue;
          }

          await tx.productVariant.create({
            data: {
              productId: params.id,
              sku: variant.sku,
              attributes: variant.attributes,
              price: parseFloat(variant.price),
              stock: parseInt(variant.stock || '0'),
              thumbnail: variant.thumbnail || null,
              galleryImages: variant.galleryImages || []
            }
          });
        }
      }

      return updatedProduct;
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating variant product:', error);

    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE: Soft delete a variant product
 */
export async function DELETE(request: Request, { params }: { params: IParams }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Soft delete the product
    const deletedProduct = await prisma.product.update({
      where: {
        id: params.id,
        productType: 'VARIANT'
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: currentUser.id
      }
    });

    return NextResponse.json({
      success: true,
      data: deletedProduct,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting variant product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

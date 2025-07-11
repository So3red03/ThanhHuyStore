import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../../libs/prismadb';
import { NextResponse } from 'next/server';
import { AuditLogger, AuditEventType, AuditSeverity } from '../../../../utils/auditLogger';

interface IParams {
  id: string;
}

/**
 * GET: Fetch specific variant product with full details
 */
export async function GET(request: Request, { params }: { params: IParams }) {
  try {
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
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdDate: 'desc' }
        },
        productPromotions: {
          where: { isActive: true },
          include: { promotion: true }
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
      return NextResponse.json({ error: 'Variant product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching variant product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT: Update variant product
 */
export async function PUT(request: Request, { params }: { params: IParams }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, brand, categoryId, images, attributes, variants } = body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id, productType: 'VARIANT' }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Variant product not found' }, { status: 404 });
    }

    // Update in transaction
    const result = await prisma.$transaction(async tx => {
      // Update main product
      const updatedProduct = await tx.product.update({
        where: { id: params.id },
        data: {
          name,
          description,
          brand,
          categoryId,
          thumbnail: body.thumbnail || null,
          galleryImages: body.galleryImages || [],
          updatedAt: new Date()
        }
      });

      // If attributes are provided, update them
      if (attributes && attributes.length > 0) {
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
              label: attr.label || attr.name,
              type: attr.type || 'SELECT',
              displayType: attr.displayType || 'BUTTON',
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

      // If variants are provided, update them
      if (variants && variants.length > 0) {
        // Deactivate existing variants
        await tx.productVariant.updateMany({
          where: { productId: params.id },
          data: { isActive: false }
        });

        // Create/update variants
        let minPrice = null;
        let totalStock = 0;

        for (const variant of variants) {
          if (!variant.sku || !variant.attributes || !variant.price) {
            continue;
          }

          const variantPrice = parseFloat(variant.price);
          const variantStock = parseInt(variant.stock || '0');

          if (minPrice === null || variantPrice < minPrice) {
            minPrice = variantPrice;
          }
          totalStock += variantStock;

          // Check if variant exists
          const existingVariant = await tx.productVariant.findFirst({
            where: {
              productId: params.id,
              sku: variant.sku
            }
          });

          if (existingVariant) {
            // Update existing variant
            await tx.productVariant.update({
              where: { id: existingVariant.id },
              data: {
                attributes: variant.attributes,
                price: variantPrice,
                stock: variantStock,
                thumbnail: variant.thumbnail || null,
                galleryImages: variant.galleryImages || [],
                isActive: true
              }
            });
          } else {
            // Create new variant
            await tx.productVariant.create({
              data: {
                productId: params.id,
                sku: variant.sku,
                attributes: variant.attributes,
                price: variantPrice,
                stock: variantStock,
                thumbnail: variant.thumbnail || null,
                galleryImages: variant.galleryImages || []
              }
            });
          }
        }

        // Update product price and stock
        if (minPrice !== null) {
          await tx.product.update({
            where: { id: params.id },
            data: {
              price: minPrice,
              inStock: totalStock
            }
          });
        }
      }

      return updatedProduct;
    });

    // Audit log
    await AuditLogger.log({
      eventType: AuditEventType.PRODUCT_UPDATED,
      severity: AuditSeverity.MEDIUM,
      userId: currentUser.id,
      userEmail: currentUser.email!,
      userRole: 'ADMIN',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      description: `Cập nhật sản phẩm variant: ${name}`,
      details: {
        productName: name,
        productType: 'VARIANT',
        changes: {
          name: { old: existingProduct.name, new: name },
          description: { old: existingProduct.description, new: description },
          categoryId: { old: existingProduct.categoryId, new: categoryId }
        }
      },
      resourceId: params.id,
      resourceType: 'Product'
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating variant product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE: Delete variant product (soft delete)
 */
export async function DELETE(request: Request, { params }: { params: IParams }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id, productType: 'VARIANT' }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Variant product not found' }, { status: 404 });
    }

    // Soft delete product and deactivate variants
    await prisma.$transaction(async tx => {
      // Soft delete main product
      await tx.product.update({
        where: { id: params.id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: currentUser.id
        }
      });

      // Deactivate all variants
      await tx.productVariant.updateMany({
        where: { productId: params.id },
        data: { isActive: false }
      });
    });

    // Audit log
    await AuditLogger.log({
      eventType: AuditEventType.PRODUCT_DELETED,
      severity: AuditSeverity.HIGH,
      userId: currentUser.id,
      userEmail: currentUser.email!,
      userRole: 'ADMIN',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      description: `Xóa sản phẩm variant: ${existingProduct.name}`,
      details: {
        productName: existingProduct.name,
        productType: 'VARIANT',
        price: existingProduct.price,
        inStock: existingProduct.inStock
      },
      resourceId: params.id,
      resourceType: 'Product'
    });

    return NextResponse.json({ message: 'Variant product deleted successfully' });
  } catch (error) {
    console.error('Error deleting variant product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

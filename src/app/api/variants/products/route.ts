import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { NextResponse } from 'next/server';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';

/**
 * GET: Fetch all variant products with their attributes and variants
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      productType: 'VARIANT',
      isDeleted: false
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Get products with full variant data
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
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
          _count: {
            select: {
              variants: true,
              reviews: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching variant products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST: Create a new variant product
 */
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      brand = 'Apple',
      basePrice,
      categoryId,
      images = [],
      attributes = [],
      variants = []
    } = body;

    // Validation
    if (!name || !description || !basePrice || !categoryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!Array.isArray(attributes) || attributes.length === 0) {
      return NextResponse.json({ error: 'At least one attribute is required for variant products' }, { status: 400 });
    }

    // Create product with attributes and variants in transaction
    const result = await prisma.$transaction(async tx => {
      // 1. Create the product
      const product = await tx.product.create({
        data: {
          name,
          description,
          brand,
          productType: 'VARIANT',
          basePrice: parseFloat(basePrice),
          categoryId,
          images,
          inStock: null, // Variant products don't have direct stock
          price: null // Variant products don't have direct price
        }
      });

      // 2. Create attributes
      const createdAttributes = [];
      for (let i = 0; i < attributes.length; i++) {
        const attr = attributes[i];
        const createdAttr = await tx.productAttribute.create({
          data: {
            productId: product.id,
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

        // 3. Create attribute values
        const createdValues = [];
        for (let j = 0; j < (attr.values || []).length; j++) {
          const value = attr.values[j];
          const createdValue = await tx.attributeValue.create({
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
          createdValues.push(createdValue);
        }

        createdAttributes.push({
          ...createdAttr,
          values: createdValues
        });
      }

      // 4. Create variants if provided
      const createdVariants = [];
      for (const variant of variants) {
        if (!variant.sku || !variant.attributes || !variant.price) {
          continue; // Skip invalid variants
        }

        const createdVariant = await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: variant.sku,
            attributes: variant.attributes,
            price: parseFloat(variant.price),
            stock: parseInt(variant.stock || '0'),
            images: variant.images || []
          }
        });
        createdVariants.push(createdVariant);
      }

      return {
        product,
        attributes: createdAttributes,
        variants: createdVariants
      };
    });

    // 🎯 AUDIT LOG: Variant Product Created
    await AuditLogger.log({
      eventType: AuditEventType.PRODUCT_CREATED,
      severity: AuditSeverity.MEDIUM,
      userId: currentUser.id,
      userEmail: currentUser.email!,
      userRole: 'ADMIN',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      description: `Tạo sản phẩm variant: ${name}`,
      details: {
        productName: name,
        productType: 'VARIANT',
        basePrice: parseFloat(basePrice),
        attributesCount: result.attributes.length,
        variantsCount: result.variants.length,
        brand,
        categoryId
      },
      resourceId: result.product.id,
      resourceType: 'Product'
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Variant product created successfully'
    });
  } catch (error) {
    console.error('Error creating variant product:', error);

    // Handle unique constraint errors
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

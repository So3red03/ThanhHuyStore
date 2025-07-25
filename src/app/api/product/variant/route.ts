import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';
import { AuditLogger, AuditEventType, AuditSeverity } from '../../../utils/auditLogger';

/**
 * GET: Fetch all variant products
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
 * POST: Create new variant product
 */
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const { name, description, brand = 'Apple', categoryId, attributes = [], variants = [], priority } = body;

    // Detailed validation with specific error messages
    // For variant products, only name, description, and categoryId are required
    const missingFields = [];
    if (!name) missingFields.push('name (tên sản phẩm)');
    if (!description) missingFields.push('description (mô tả)');
    if (!categoryId) missingFields.push('categoryId (danh mục)');

    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', { name, description, categoryId, missingFields });
      return NextResponse.json(
        {
          error: `Thiếu các trường bắt buộc: ${missingFields.join(', ')}`,
          missingFields,
          receivedData: { name, description, categoryId }
        },
        { status: 400 }
      );
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
          categoryId,
          thumbnail: null,
          galleryImages: [],
          inStock: null, // Variant products don't have direct stock
          price: null, // Variant products don't have direct price
          priority: priority !== undefined ? parseInt(priority) : 0
        }
      });

      // 2. Create product attributes
      const createdAttributes = [];
      for (let i = 0; i < attributes.length; i++) {
        const attr = attributes[i];
        const createdAttr = await tx.productAttribute.create({
          data: {
            productId: product.id,
            name: attr.name,
            label: attr.label || attr.name, // Use name as label if label is missing
            type: attr.type || 'SELECT', // Default type if missing
            displayType: attr.displayType || 'BUTTON', // Default displayType if missing
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

      // 4. Create product variants
      const createdVariants = [];
      let minPrice = null;
      let totalStock = 0;

      for (const variant of variants) {
        if (!variant.sku || !variant.attributes || !variant.price) {
          continue; // Skip invalid variants
        }

        const variantPrice = parseFloat(variant.price);
        const variantStock = parseInt(variant.stock || '0');

        // Track min price for product price calculation
        if (minPrice === null || variantPrice < minPrice) {
          minPrice = variantPrice;
        }

        // Track total stock
        totalStock += variantStock;

        const createdVariant = await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: variant.sku,
            attributes: variant.attributes,
            price: variantPrice,
            stock: variantStock,
            thumbnail: variant.thumbnail || null,
            galleryImages: variant.galleryImages || []
          }
        });
        createdVariants.push(createdVariant);
      }

      // 5. Update product with calculated price and total stock
      if (minPrice !== null) {
        await tx.product.update({
          where: { id: product.id },
          data: {
            price: minPrice, // Set price to minimum variant price
            inStock: totalStock // Set total stock from all variants
          }
        });
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
        attributesCount: result.attributes.length,
        variantsCount: result.variants.length,
        brand,
        categoryId
      },
      resourceId: result.product.id,
      resourceType: 'Product'
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating variant product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

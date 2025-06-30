import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { NextResponse } from 'next/server';

interface IParams {
  id: string;
}

/**
 * GET: Fetch all variants for a specific product
 */
export async function GET(request: Request, { params }: { params: IParams }) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where: any = { productId: params.id };
    if (!includeInactive) {
      where.isActive = true;
    }

    const variants = await prisma.productVariant.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, basePrice: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(variants);
  } catch (error) {
    console.error('Error fetching product variants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST: Create new variants for a product
 */
export async function POST(request: Request, { params }: { params: IParams }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { variants } = body;

    if (!Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json({ error: 'Variants array is required' }, { status: 400 });
    }

    // Check if product exists and is variant type
    const product = await prisma.product.findUnique({
      where: {
        id: params.id,
        productType: 'VARIANT',
        isDeleted: false
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Validate and create variants
    const createdVariants = [];
    const errors = [];

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];

      // Validation
      if (!variant.sku || !variant.attributes || !variant.price) {
        errors.push(`Variant ${i + 1}: Missing required fields (sku, attributes, price)`);
        continue;
      }

      try {
        const createdVariant = await prisma.productVariant.create({
          data: {
            productId: params.id,
            sku: variant.sku,
            attributes: variant.attributes,
            price: parseFloat(variant.price),
            stock: parseInt(variant.stock || '0'),
            images: variant.images || []
          }
        });
        createdVariants.push(createdVariant);
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'P2002') {
          errors.push(`Variant ${i + 1}: SKU '${variant.sku}' already exists`);
        } else {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Variant ${i + 1}: ${errorMessage}`);
        }
      }
    }

    return NextResponse.json({
      success: createdVariants.length > 0,
      data: createdVariants,
      errors: errors.length > 0 ? errors : undefined,
      message: `${createdVariants.length} variants created successfully${
        errors.length > 0 ? `, ${errors.length} failed` : ''
      }`
    });
  } catch (error) {
    console.error('Error creating variants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT: Bulk update variants for a product
 */
export async function PUT(request: Request, { params }: { params: IParams }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, variantIds, data } = body;

    if (!action || !Array.isArray(variantIds)) {
      return NextResponse.json({ error: 'Action and variantIds are required' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'updatePrices':
        if (!data.priceAdjustment && !data.newPrice) {
          return NextResponse.json({ error: 'Price adjustment or new price is required' }, { status: 400 });
        }

        if (data.newPrice) {
          // Set specific price
          result = await prisma.productVariant.updateMany({
            where: {
              id: { in: variantIds },
              productId: params.id
            },
            data: { price: parseFloat(data.newPrice) }
          });
        } else {
          // Apply percentage adjustment
          const adjustment = parseFloat(data.priceAdjustment) / 100;
          const variants = await prisma.productVariant.findMany({
            where: {
              id: { in: variantIds },
              productId: params.id
            }
          });

          for (const variant of variants) {
            const newPrice = variant.price * (1 + adjustment);
            await prisma.productVariant.update({
              where: { id: variant.id },
              data: { price: newPrice }
            });
          }
          result = { count: variants.length };
        }
        break;

      case 'updateStock':
        if (data.stockAdjustment === undefined && data.newStock === undefined) {
          return NextResponse.json({ error: 'Stock adjustment or new stock is required' }, { status: 400 });
        }

        if (data.newStock !== undefined) {
          // Set specific stock
          result = await prisma.productVariant.updateMany({
            where: {
              id: { in: variantIds },
              productId: params.id
            },
            data: { stock: parseInt(data.newStock) }
          });
        } else {
          // Apply stock adjustment
          const adjustment = parseInt(data.stockAdjustment);
          const variants = await prisma.productVariant.findMany({
            where: {
              id: { in: variantIds },
              productId: params.id
            }
          });

          for (const variant of variants) {
            const newStock = Math.max(0, variant.stock + adjustment);
            await prisma.productVariant.update({
              where: { id: variant.id },
              data: { stock: newStock }
            });
          }
          result = { count: variants.length };
        }
        break;

      case 'toggleActive':
        const activeStatus = data.isActive ?? true;
        result = await prisma.productVariant.updateMany({
          where: {
            id: { in: variantIds },
            productId: params.id
          },
          data: { isActive: activeStatus }
        });
        break;

      case 'delete':
        result = await prisma.productVariant.deleteMany({
          where: {
            id: { in: variantIds },
            productId: params.id
          }
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Bulk ${action} completed successfully`
    });
  } catch (error) {
    console.error('Error bulk updating variants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

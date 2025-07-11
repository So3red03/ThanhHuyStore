import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../../../libs/prismadb';
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

    const variants = await prisma.productVariant.findMany({
      where: {
        productId: params.id,
        ...(includeInactive ? {} : { isActive: true })
      },
      include: {
        product: {
          select: { id: true, name: true, price: true }
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
 * POST: Create new variant for existing product
 */
export async function POST(request: Request, { params }: { params: IParams }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sku, attributes, price, stock, thumbnail, galleryImages } = body;

    // Validation
    if (!sku || !attributes || !price) {
      return NextResponse.json({ error: 'Missing required fields: sku, attributes, price' }, { status: 400 });
    }

    // Check if product exists and is variant type
    const product = await prisma.product.findUnique({
      where: { id: params.id, productType: 'VARIANT' }
    });

    if (!product) {
      return NextResponse.json({ error: 'Variant product not found' }, { status: 404 });
    }

    // Check if SKU already exists
    const existingSku = await prisma.productVariant.findFirst({
      where: { sku }
    });

    if (existingSku) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
    }

    // Create variant
    const variant = await prisma.productVariant.create({
      data: {
        productId: params.id,
        sku,
        attributes,
        price: parseFloat(price),
        stock: parseInt(stock || '0'),
        thumbnail: thumbnail || null,
        galleryImages: galleryImages || []
      }
    });

    // Update product price if this variant has lower price
    const currentMinPrice = await prisma.productVariant.aggregate({
      where: { productId: params.id, isActive: true },
      _min: { price: true }
    });

    if (currentMinPrice._min.price && parseFloat(price) < currentMinPrice._min.price) {
      await prisma.product.update({
        where: { id: params.id },
        data: { price: parseFloat(price) }
      });
    }

    // Update total stock
    const totalStock = await prisma.productVariant.aggregate({
      where: { productId: params.id, isActive: true },
      _sum: { stock: true }
    });

    await prisma.product.update({
      where: { id: params.id },
      data: { inStock: totalStock._sum.stock || 0 }
    });

    return NextResponse.json(variant);
  } catch (error) {
    console.error('Error creating product variant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT: Update stock for multiple variants
 */
export async function PUT(request: Request, { params }: { params: IParams }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { variants } = body; // Array of { id, stock }

    if (!Array.isArray(variants)) {
      return NextResponse.json({ error: 'Variants must be an array' }, { status: 400 });
    }

    // Update variants in transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedVariants = [];

      for (const variantUpdate of variants) {
        if (!variantUpdate.id || variantUpdate.stock === undefined) {
          continue;
        }

        const updated = await tx.productVariant.update({
          where: {
            id: variantUpdate.id,
            productId: params.id
          },
          data: {
            stock: parseInt(variantUpdate.stock)
          }
        });

        updatedVariants.push(updated);
      }

      // Update total product stock
      const totalStock = await tx.productVariant.aggregate({
        where: { productId: params.id, isActive: true },
        _sum: { stock: true }
      });

      await tx.product.update({
        where: { id: params.id },
        data: { inStock: totalStock._sum.stock || 0 }
      });

      return updatedVariants;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating variant stocks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

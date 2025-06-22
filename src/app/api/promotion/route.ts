import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    description,
    discountType,
    discountValue,
    maxDiscount,
    startDate,
    endDate,
    applyToAll,
    productIds,
    categoryIds
  } = body;

  try {
    // Create promotion
    const promotion = await prisma.promotion.create({
      data: {
        title,
        description,
        discountType,
        discountValue: parseFloat(discountValue),
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        applyToAll: applyToAll || false,
        productIds: productIds || [],
        categoryIds: categoryIds || []
      }
    });

    // Create ProductPromotion records for specific products
    if (productIds && productIds.length > 0) {
      // Get products to calculate promotional prices
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds }
        }
      });

      // Create ProductPromotion records for each product
      for (const product of products) {
        let promotionalPrice;

        if (discountType === 'PERCENTAGE') {
          promotionalPrice = product.price * (1 - parseFloat(discountValue) / 100);
        } else {
          // FIXED discount
          promotionalPrice = product.price - parseFloat(discountValue);
        }

        // Ensure promotional price is not negative
        promotionalPrice = Math.max(0, promotionalPrice);

        await prisma.productPromotion.create({
          data: {
            productId: product.id,
            promotionId: promotion.id,
            promotionalPrice,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            priority: 1 // Default priority
          }
        });
      }
    }

    // Create ProductPromotion records for category-based promotions
    if (categoryIds && categoryIds.length > 0) {
      // Find products in both parent categories and their subcategories
      const categoryProducts = await prisma.product.findMany({
        where: {
          OR: [
            // Direct products in selected categories
            { categoryId: { in: categoryIds } },
            // Products in subcategories of selected categories
            {
              category: {
                parentId: { in: categoryIds }
              }
            }
          ]
        }
      });

      for (const product of categoryProducts) {
        let promotionalPrice;

        if (discountType === 'PERCENTAGE') {
          promotionalPrice = product.price * (1 - parseFloat(discountValue) / 100);
        } else {
          // FIXED discount
          promotionalPrice = product.price - parseFloat(discountValue);
        }

        // Ensure promotional price is not negative
        promotionalPrice = Math.max(0, promotionalPrice);

        await prisma.productPromotion.create({
          data: {
            productId: product.id,
            promotionId: promotion.id,
            promotionalPrice,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            priority: 2 // Category promotions have higher priority
          }
        });
      }
    }

    return NextResponse.json(promotion);
  } catch (error) {
    console.error('Error creating promotion:', error);
    return NextResponse.json({ error: 'Failed to create promotion' }, { status: 500 });
  }
}

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const promotions = await prisma.promotion.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Fetch related products and categories for each promotion
    const promotionsWithDetails = await Promise.all(
      promotions.map(async promotion => {
        const products = await prisma.product.findMany({
          where: {
            id: { in: promotion.productIds }
          },
          select: {
            id: true,
            name: true,
            price: true
          }
        });

        const categories = await prisma.category.findMany({
          where: {
            id: { in: promotion.categoryIds }
          },
          select: {
            id: true,
            name: true
          }
        });

        return {
          ...promotion,
          products,
          categories
        };
      })
    );

    return NextResponse.json(promotionsWithDetails);
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json({ error: 'Failed to fetch promotions' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const promotionId = searchParams.get('id');

  if (!promotionId) {
    return NextResponse.json({ error: 'Promotion ID is required' }, { status: 400 });
  }

  try {
    // Check if promotion exists first
    const promotion = await prisma.promotion.findUnique({
      where: { id: promotionId }
    });

    if (!promotion) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 });
    }

    // Delete all ProductPromotion records for this promotion first
    await prisma.productPromotion.deleteMany({
      where: {
        promotionId: promotionId
      }
    });

    // Delete the promotion
    await prisma.promotion.delete({
      where: { id: promotionId }
    });

    return NextResponse.json({ message: 'Promotion deleted successfully' });
  } catch (error) {
    console.error('Error deleting promotion:', error);

    // Handle specific Prisma errors
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Promotion not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to delete promotion' }, { status: 500 });
  }
}

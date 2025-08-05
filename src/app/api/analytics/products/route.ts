import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { EventType } from '@prisma/client';
import { getDefaultImage } from '../../../utils/product';

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Create date filter - if days is 0, get all data
    const dateFilter =
      days > 0
        ? {
            timestamp: {
              gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            }
          }
        : {};

    // Get top viewed products
    const topViewedProducts = await prisma.analyticsEvent.groupBy({
      by: ['entityId'],
      where: {
        eventType: EventType.PRODUCT_VIEW,
        entityType: 'product',
        entityId: { not: null },
        ...dateFilter
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: limit
    });

    // Get product details
    const productIds = topViewedProducts.map(p => p.entityId).filter(Boolean) as string[];
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      },
      include: {
        category: true,
        // Include variants for variant products
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        },
        // Include product attributes for variant products
        productAttributes: {
          include: {
            values: {
              orderBy: { position: 'asc' }
            }
          },
          orderBy: { position: 'asc' }
        }
      }
    });

    // Combine data
    const topProducts = topViewedProducts.map(item => {
      const product = products.find(p => p.id === item.entityId);
      return {
        id: item.entityId,
        name: product?.name || 'Unknown Product',
        category: product?.category?.name || 'Unknown Category',
        price: product?.price || 0,
        image: product ? getDefaultImage(product) : '/noavatar.png',
        views: item._count.id,
        inStock: product?.inStock || 0
      };
    });

    // Get category performance
    const categoryPerformance = await prisma.analyticsEvent.groupBy({
      by: ['metadata'],
      where: {
        eventType: EventType.PRODUCT_VIEW,
        entityType: 'product',
        ...dateFilter
      },
      _count: {
        id: true
      }
    });

    const startDate = days > 0 ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : new Date(0);

    return NextResponse.json({
      topViewedProducts: topProducts,
      categoryPerformance,
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('[ANALYTICS_PRODUCTS]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

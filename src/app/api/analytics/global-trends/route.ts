import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import { EventType } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const limit = parseInt(searchParams.get('limit') || '20');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 1. Get trending products (most viewed globally)
    const trendingProducts = await prisma.analyticsEvent.groupBy({
      by: ['entityId'],
      where: {
        eventType: EventType.PRODUCT_VIEW,
        entityType: 'product',
        entityId: { not: null },
        timestamp: {
          gte: startDate
        }
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

    // 2. Get products with detailed info including reviews
    const productIds = trendingProducts.map(p => p.entityId).filter(Boolean) as string[];
    
    const productsWithReviews = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        inStock: { gt: 0 }
      },
      include: {
        reviews: {
          select: {
            rating: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // 3. Calculate review scores and merge with view counts
    const enrichedProducts = productsWithReviews.map(product => {
      const viewData = trendingProducts.find(t => t.entityId === product.id);
      const viewCount = viewData?._count.id || 0;
      
      // Calculate average rating
      const ratings = product.reviews.map(r => r.rating);
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0;
      
      // Calculate recommendation score (views + rating boost)
      const ratingBoost = avgRating * 2; // Rating multiplier
      const recommendationScore = viewCount + ratingBoost;

      return {
        ...product,
        viewCount,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: ratings.length,
        recommendationScore,
        category: product.category
      };
    });

    // 4. Sort by recommendation score
    const sortedProducts = enrichedProducts.sort((a, b) => b.recommendationScore - a.recommendationScore);

    // 5. Get collaborative filtering data (users who viewed X also viewed Y)
    const collaborativeData = await getCollaborativeFilteringData(productIds.slice(0, 10));

    // 6. Get category trends
    const categoryTrends = await getCategoryTrends(startDate);

    return NextResponse.json({
      success: true,
      data: {
        trendingProducts: sortedProducts,
        collaborativeFiltering: collaborativeData,
        categoryTrends,
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString()
        },
        metadata: {
          totalProducts: sortedProducts.length,
          avgRating: sortedProducts.reduce((sum, p) => sum + p.avgRating, 0) / sortedProducts.length || 0,
          totalViews: sortedProducts.reduce((sum, p) => sum + p.viewCount, 0)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching global trends:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function for collaborative filtering
async function getCollaborativeFilteringData(productIds: string[]) {
  try {
    const collaborativeData: Record<string, string[]> = {};

    for (const productId of productIds) {
      // Find users who viewed this product
      const usersWhoViewed = await prisma.analyticsEvent.findMany({
        where: {
          entityId: productId,
          eventType: EventType.PRODUCT_VIEW,
          userId: { not: null }
        },
        select: {
          userId: true
        },
        distinct: ['userId']
      });

      const userIds = usersWhoViewed.map(u => u.userId).filter(Boolean) as string[];

      if (userIds.length > 0) {
        // Find other products these users also viewed
        const alsoViewed = await prisma.analyticsEvent.groupBy({
          by: ['entityId'],
          where: {
            userId: { in: userIds },
            entityId: { not: productId },
            eventType: EventType.PRODUCT_VIEW,
            entityType: 'product'
          },
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          },
          take: 5
        });

        collaborativeData[productId] = alsoViewed
          .map(item => item.entityId)
          .filter(Boolean) as string[];
      }
    }

    return collaborativeData;
  } catch (error) {
    console.error('Error getting collaborative filtering data:', error);
    return {};
  }
}

// Helper function for category trends
async function getCategoryTrends(startDate: Date) {
  try {
    // Get product views by category
    const categoryViews = await prisma.analyticsEvent.findMany({
      where: {
        eventType: EventType.PRODUCT_VIEW,
        entityType: 'product',
        timestamp: {
          gte: startDate
        }
      },
      include: {
        // We need to join with products to get category info
      }
    });

    // Group by category (this would need to be done in application logic)
    // For now, return empty array - can be enhanced later
    return [];
  } catch (error) {
    console.error('Error getting category trends:', error);
    return [];
  }
}

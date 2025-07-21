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

    console.log('🔍 [Global Trends API] Starting with params:', { days, limit, startDate });
    console.log('🔍 [Global Trends API] Prisma object:', !!prisma);
    console.log('🔍 [Global Trends API] Prisma.analyticsEvent:', !!prisma?.analyticsEvent);

    // API này tính toán recommendationScore dựa trên (theo độ ưu tiên):
    // 1. Số lượng bán thực tế (sales) - trọng số x10 (ưu tiên cao nhất)
    // 2. Số lượt xem (views) - trọng số x1
    // 3. Đánh giá (rating) - bonus x2
    // 4. Thời gian gần đây (trong khoảng days)

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
    // Lấy thông tin chi tiết của các sản phẩm "hot", bao gồm:
    // điểm đánh giá (reviews.rating)
    // danh mục (category)
    // còn hàng (inStock > 0)
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

    // 3. Get sales data for these products (from completed orders)
    const completedOrders = await prisma.order.findMany({
      where: {
        status: 'completed',
        createdAt: {
          gte: startDate
        }
      },
      select: {
        products: true
      }
    });

    // 4. Calculate sales count for each product
    const salesMap = new Map<string, number>();
    completedOrders.forEach(order => {
      order.products.forEach(product => {
        if (productIds.includes(product.id)) {
          const currentCount = salesMap.get(product.id) || 0;
          salesMap.set(product.id, currentCount + product.quantity);
        }
      });
    });

    // 5. Calculate comprehensive scores including sales data
    const enrichedProducts = productsWithReviews.map(product => {
      const viewData = trendingProducts.find(t => t.entityId === product.id);

      // Tổng số lần sản phẩm này được xem trong startDate ngày gần đây.
      const viewCount = viewData?._count.id || 0;

      // Tổng số lượng bán trong startDate ngày gần đây
      const salesCount = salesMap.get(product.id) || 0;

      // Calculate average rating
      const ratings = product.reviews.map(r => r.rating);
      const avgRating = ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;

      // NEW: Enhanced recommendation score prioritizing actual sales
      // Sales có trọng số cao nhất (x10), views (x1), rating boost (x2)
      const salesScore = salesCount * 10; // Ưu tiên sản phẩm bán chạy
      const viewScore = viewCount * 1; // Lượt xem
      const ratingBoost = avgRating * 2; // Bonus từ đánh giá
      const recommendationScore = salesScore + viewScore + ratingBoost;

      return {
        ...product,
        viewCount,
        salesCount, // Thêm field này
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: ratings.length,
        recommendationScore,
        category: product.category
      };
    });

    // 6. Sort by recommendation score
    const sortedProducts = enrichedProducts.sort((a, b) => b.recommendationScore - a.recommendationScore);

    // 7. Get collaborative filtering data (users who viewed X also viewed Y)
    const collaborativeData = await getCollaborativeFilteringData(productIds.slice(0, 10));

    return NextResponse.json({
      success: true,
      data: {
        trendingProducts: sortedProducts,
        collaborativeFiltering: collaborativeData,
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Bổ sung cho đề xuất sản phẩm: “Người xem sản phẩm X cũng xem sản phẩm Y”.
async function getCollaborativeFilteringData(productIds: string[]) {
  try {
    const collaborativeData: Record<string, string[]> = {};

    for (const productId of productIds) {
      // Truy vấn tất cả userId (có đăng nhập) đã từng xem sản phẩm này
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
        // Ý nghĩa: Những người này còn xem thêm sản phẩm nào khác (ngoài productId)?
        const alsoViewed = await prisma.analyticsEvent.groupBy({
          by: ['entityId'], // gom nhóm theo sản phẩm
          where: {
            userId: { in: userIds }, // chỉ xét những user vừa tìm được
            entityId: { not: productId }, // loại bỏ chính sản phẩm đang xét
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

        collaborativeData[productId] = alsoViewed.map(item => item.entityId).filter(Boolean) as string[];
      }
    }

    return collaborativeData;
  } catch (error) {
    console.error('Error getting collaborative filtering data:', error);
    return {};
  }
}

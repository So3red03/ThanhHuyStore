import prisma from '../prismadb';

interface ProductRecommendation {
  productId: string;
  productName: string;
  viewCount: number;
  category: string;
  reason: string;
}

interface PromotionSuggestion {
  type: 'low_stock' | 'high_view_low_purchase' | 'category_trend';
  title: string;
  description: string;
  productIds: string[];
  priority: 'high' | 'medium' | 'low';
  data: any;
}

interface UserBehaviorInsight {
  totalUsers: number;
  activeUsers: number;
  topViewedProducts: any[];
  categoryTrends: any[];
  conversionRate: number;
}

export class AnalyticsInsightService {
  // Phân tích & đề xuất sản phẩm dựa trên dữ liệu lịch sử người dùng
  static async getProductRecommendations(days: number = 7): Promise<ProductRecommendation[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Lấy sản phẩm được xem nhiều nhất
    const topViewedProducts = await prisma.analyticsEvent.groupBy({
      by: ['entityId'],
      where: {
        eventType: 'PRODUCT_VIEW',
        entityType: 'product',
        entityId: { not: null },
        timestamp: { gte: startDate }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    // Lấy thông tin chi tiết sản phẩm
    const productIds = topViewedProducts.map(p => p.entityId).filter(Boolean) as string[];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { category: true }
    });

    return topViewedProducts.map(viewData => {
      const product = products.find(p => p.id === viewData.entityId);
      return {
        productId: viewData.entityId!,
        productName: product?.name || 'Unknown Product',
        viewCount: viewData._count.id,
        category: product?.category?.name || 'Unknown Category',
        reason: `Được xem ${viewData._count.id} lần trong ${days} ngày qua`
      };
    });
  }

  // Chiến dịch khuyến mãi theo tồn kho và hành vi người dùng
  static async getPromotionSuggestions(days: number = 7): Promise<PromotionSuggestion[]> {
    const suggestions: PromotionSuggestion[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 1. Sản phẩm tồn kho cao
    const lowStockProducts = await prisma.product.findMany({
      where: {
        productType: 'SIMPLE',
        inStock: { lte: 10, gt: 0 }
      },
      include: { category: true },
      take: 5
    });

    if (lowStockProducts.length > 0) {
      suggestions.push({
        type: 'low_stock',
        title: 'Khuyến mãi sản phẩm sắp hết hàng',
        description: `${lowStockProducts.length} sản phẩm có tồn kho thấp cần khuyến mãi để bán hết`,
        productIds: lowStockProducts.map(p => p.id),
        priority: 'high',
        data: {
          products: lowStockProducts.map(p => ({
            name: p.name,
            stock: p.inStock,
            category: p.category?.name
          }))
        }
      });
    }

    // 2. Sản phẩm được xem nhiều nhưng ít mua
    const highViewProducts = await prisma.analyticsEvent.groupBy({
      by: ['entityId'],
      where: {
        eventType: 'PRODUCT_VIEW',
        entityType: 'product',
        entityId: { not: null },
        timestamp: { gte: startDate }
      },
      _count: { id: true },
      having: { id: { _count: { gte: 20 } } },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });

    if (highViewProducts.length > 0) {
      suggestions.push({
        type: 'high_view_low_purchase',
        title: 'Khuyến mãi sản phẩm được quan tâm',
        description: `${highViewProducts.length} sản phẩm được xem nhiều nhưng chưa có đơn hàng`,
        productIds: highViewProducts.map(p => p.entityId!),
        priority: 'medium',
        data: {
          products: highViewProducts.map(p => ({
            productId: p.entityId,
            viewCount: p._count.id
          }))
        }
      });
    }

    return suggestions;
  }

  // Đề xuất sản phẩm liên quan khi người dùng xem một sản phẩm
  static async getRelatedProductSuggestions(days: number = 7): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Phân tích patterns xem sản phẩm theo session
    const viewEvents = await prisma.analyticsEvent.findMany({
      where: {
        eventType: 'PRODUCT_VIEW',
        entityType: 'product',
        entityId: { not: null },
        timestamp: { gte: startDate }
      },
      orderBy: { timestamp: 'asc' },
      take: 1000
    });

    // Group by session để tìm patterns
    const sessionPatterns = new Map();
    viewEvents.forEach(event => {
      if (!event.sessionId) return;

      if (!sessionPatterns.has(event.sessionId)) {
        sessionPatterns.set(event.sessionId, []);
      }
      sessionPatterns.get(event.sessionId).push(event.entityId);
    });

    // Tìm sản phẩm thường được xem cùng nhau
    const productPairs = new Map();
    sessionPatterns.forEach(products => {
      for (let i = 0; i < products.length; i++) {
        for (let j = i + 1; j < products.length; j++) {
          const pair = [products[i], products[j]].sort().join('-');
          productPairs.set(pair, (productPairs.get(pair) || 0) + 1);
        }
      }
    });

    // Sắp xếp theo tần suất và lấy thông tin sản phẩm
    const sortedPairs = Array.from(productPairs.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Lấy thông tin chi tiết sản phẩm
    const allProductIds = [...new Set(sortedPairs.flatMap(([pair]) => pair.split('-')))];
    const products = await prisma.product.findMany({
      where: { id: { in: allProductIds } },
      select: { id: true, name: true }
    });

    const productMap = new Map(products.map(p => [p.id, p.name]));

    return sortedPairs.map(([pair, count]) => {
      const [productId1, productId2] = pair.split('-');
      const product1Name = productMap.get(productId1) || 'Sản phẩm không xác định';
      const product2Name = productMap.get(productId2) || 'Sản phẩm không xác định';

      return {
        products: [productId1, productId2],
        productNames: [product1Name, product2Name],
        frequency: count,
        suggestion: `"${product1Name}" và "${product2Name}" thường được xem cùng nhau`
      };
    });
  }

  // Phân tích hành vi người dùng tổng quan
  static async getUserBehaviorInsights(days: number = 7): Promise<UserBehaviorInsight> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Tổng số users
    const totalUsers = await prisma.user.count();

    // Users hoạt động (có analytics events)
    const activeUsers = await prisma.analyticsEvent.groupBy({
      by: ['userId'],
      where: {
        timestamp: { gte: startDate },
        userId: { not: null }
      }
    });

    // Top sản phẩm được xem
    const topViewedProducts = await this.getProductRecommendations(days);

    // Category trends
    const categoryTrends = await prisma.analyticsEvent.groupBy({
      by: ['entityId'],
      where: {
        eventType: 'PRODUCT_VIEW',
        entityType: 'product',
        timestamp: { gte: startDate }
      },
      _count: { id: true }
    });

    // Conversion rate (orders vs views)
    const totalViews = await prisma.analyticsEvent.count({
      where: {
        eventType: 'PRODUCT_VIEW',
        timestamp: { gte: startDate }
      }
    });

    const totalOrders = await prisma.order.count({
      where: {
        createdAt: { gte: startDate }
      }
    });

    const conversionRate = totalViews > 0 ? (totalOrders / totalViews) * 100 : 0;

    return {
      totalUsers,
      activeUsers: activeUsers.length,
      topViewedProducts: topViewedProducts.slice(0, 5),
      categoryTrends: [],
      conversionRate: Math.round(conversionRate * 100) / 100
    };
  }

  // Tạo báo cáo tổng hợp cho Discord
  static async generateInsightReport(days: number = 7) {
    const [productRecommendations, promotionSuggestions, relatedProducts, userBehavior] = await Promise.all([
      this.getProductRecommendations(days),
      this.getPromotionSuggestions(days),
      this.getRelatedProductSuggestions(days),
      this.getUserBehaviorInsights(days)
    ]);

    return {
      period: `${days} ngày qua`,
      productRecommendations,
      promotionSuggestions,
      relatedProducts,
      userBehavior,
      summary: {
        totalRecommendations: productRecommendations.length,
        totalPromotions: promotionSuggestions.length,
        totalRelatedPatterns: relatedProducts.length,
        conversionRate: userBehavior.conversionRate
      }
    };
  }
}

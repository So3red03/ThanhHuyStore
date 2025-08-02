import prisma from '../prismadb';
import { NotificationService } from '../notifications/notificationService';

interface ProductPerformanceData {
  id: string;
  name: string;
  price: number;
  inStock: number;
  priority: number;
  createdAt: Date;
  categoryId: string;
  category: {
    name: string;
  };
  viewCount7d: number;
  viewCount30d: number;
  salesCount7d: number;
  salesCount30d: number;
  totalRevenue30d: number;
  avgRating: number;
  reviewCount: number;
}

interface AIRecommendation {
  productId?: string; // Optional for non-product recommendations
  productName?: string;
  orderId?: string; // For order-related recommendations
  customerId?: string; // For customer-related recommendations
  type:
    | 'PROMOTION_SUGGESTION'
    | 'PRIORITY_BOOST'
    | 'STOCK_ALERT'
    | 'MARKETING_PUSH'
    | 'PENDING_ORDER_ALERT' // New: Đơn hàng pending quá lâu
    | 'CUSTOMER_RETENTION' // New: Khách hàng chưa mua lại
    | 'INVENTORY_CRITICAL' // New: Tồn kho thấp nguy hiểm
    | 'PERFORMANCE_ANOMALY'; // New: Hiệu suất bất thường
  title: string;
  message: string;
  reasoning: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number; // 0-100
  suggestedAction: any;
  expectedImpact: string;
}

export class AIRecommendationService {
  /**
   * Phân tích hiệu suất sản phẩm dựa trên AnalyticsEvent và Order data
   */
  static async analyzeProductPerformance(days: number = 30): Promise<ProductPerformanceData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDate7d = new Date();
    startDate7d.setDate(startDate7d.getDate() - 7);

    // Lấy tất cả sản phẩm với thông tin cơ bản
    const products = await prisma.product.findMany({
      include: {
        category: {
          select: { name: true }
        },
        reviews: {
          select: { rating: true }
        }
      }
    });

    // Lấy analytics data cho tất cả sản phẩm
    const analyticsData = await prisma.analyticsEvent.groupBy({
      by: ['entityId'],
      where: {
        eventType: 'PRODUCT_VIEW',
        entityType: 'product',
        timestamp: { gte: startDate }
      },
      _count: { id: true }
    });

    const analytics7d = await prisma.analyticsEvent.groupBy({
      by: ['entityId'],
      where: {
        eventType: 'PRODUCT_VIEW',
        entityType: 'product',
        timestamp: { gte: startDate7d }
      },
      _count: { id: true }
    });

    // Lấy dữ liệu bán hàng từ Order
    const salesData = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { in: ['confirmed', 'completed'] }
      },
      select: {
        products: true,
        amount: true,
        createdAt: true
      }
    });

    const sales7d = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate7d },
        status: { in: ['confirmed', 'completed'] }
      },
      select: {
        products: true,
        amount: true
      }
    });

    // Xử lý dữ liệu bán hàng
    const salesMap30d = new Map<string, { count: number; revenue: number }>();
    const salesMap7d = new Map<string, number>();

    salesData.forEach(order => {
      order.products.forEach((product: any) => {
        const productId = product.id;
        const quantity = product.quantity || 1;
        const price = product.price || 0;

        if (!salesMap30d.has(productId)) {
          salesMap30d.set(productId, { count: 0, revenue: 0 });
        }
        const current = salesMap30d.get(productId)!;
        current.count += quantity;
        current.revenue += price * quantity;
      });
    });

    sales7d.forEach(order => {
      order.products.forEach((product: any) => {
        const productId = product.id;
        const quantity = product.quantity || 1;
        salesMap7d.set(productId, (salesMap7d.get(productId) || 0) + quantity);
      });
    });

    // Tạo map cho analytics
    const analyticsMap = new Map(analyticsData.map(item => [item.entityId, item._count.id]));
    const analytics7dMap = new Map(analytics7d.map(item => [item.entityId, item._count.id]));

    // Kết hợp dữ liệu
    return products.map(product => {
      const sales30d = salesMap30d.get(product.id) || { count: 0, revenue: 0 };
      const sales7d = salesMap7d.get(product.id) || 0;
      const views30d = analyticsMap.get(product.id) || 0;
      const views7d = analytics7dMap.get(product.id) || 0;

      // Tính rating trung bình
      const ratings = product.reviews.map(r => r.rating);
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      return {
        id: product.id,
        name: product.name,
        price: product.price || 0,
        inStock: product.inStock || 0,
        priority: product.priority,
        createdAt: product.createdAt,
        categoryId: product.categoryId,
        category: product.category,
        viewCount7d: views7d,
        viewCount30d: views30d,
        salesCount7d: sales7d,
        salesCount30d: sales30d.count,
        totalRevenue30d: sales30d.revenue,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: ratings.length
      };
    });
  }

  /**
   * Phân tích đơn hàng pending quá lâu
   */
  static async analyzePendingOrders(): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];

    // Tìm đơn hàng pending > 3 ngày
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const pendingOrders = await prisma.order.findMany({
      where: {
        status: 'pending',
        createdAt: { lt: threeDaysAgo }
      },
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'asc' },
      take: 10 // Top 10 oldest pending orders
    });

    for (const order of pendingOrders) {
      const daysPending = Math.floor((Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24));

      recommendations.push({
        orderId: order.id,
        customerId: order.userId,
        type: 'PENDING_ORDER_ALERT',
        title: '⚠️ Đơn hàng pending quá lâu',
        message: `Đơn hàng #${order.id.slice(-6)} của ${
          order.user?.name
        } đã pending ${daysPending} ngày. Cần xử lý ngay!`,
        reasoning: `Order pending ${daysPending} days, customer may cancel`,
        urgency: daysPending > 7 ? 'CRITICAL' : daysPending > 5 ? 'HIGH' : 'MEDIUM',
        confidence: 95,
        suggestedAction: {
          action: 'PROCESS_ORDER',
          orderId: order.id,
          customerName: order.user?.name,
          daysPending: daysPending
        },
        expectedImpact: 'Prevent order cancellation, improve customer satisfaction'
      });
    }

    return recommendations;
  }

  /**
   * Phân tích khách hàng cần retention
   */
  static async analyzeCustomerRetention(): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];

    // Tìm khách VIP chưa mua > 30 ngày
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const inactiveVIPs = await prisma.user.findMany({
      where: {
        role: 'USER',
        orders: {
          some: {
            amount: { gte: 10000000 } // VIP: đã mua > 10M
          }
        }
      },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    for (const customer of inactiveVIPs) {
      const lastOrder = customer.orders[0];
      if (!lastOrder || lastOrder.createdAt < thirtyDaysAgo) {
        const daysSinceLastOrder = lastOrder
          ? Math.floor((Date.now() - lastOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        recommendations.push({
          customerId: customer.id,
          type: 'CUSTOMER_RETENTION',
          title: '💎 Khách VIP cần retention',
          message: `${customer.name} (VIP) chưa mua ${daysSinceLastOrder} ngày. Gửi voucher đặc biệt?`,
          reasoning: `VIP customer inactive for ${daysSinceLastOrder} days`,
          urgency: daysSinceLastOrder > 60 ? 'HIGH' : 'MEDIUM',
          confidence: 80,
          suggestedAction: {
            action: 'SEND_VIP_VOUCHER',
            customerId: customer.id,
            customerName: customer.name,
            suggestedDiscount: 15,
            daysSinceLastOrder: daysSinceLastOrder
          },
          expectedImpact: 'Re-engage VIP customer, potential 5-10M revenue'
        });
      }
    }

    return recommendations.slice(0, 5); // Top 5 VIP customers
  }

  /**
   * Phân tích inventory critical
   */
  static async analyzeInventoryCritical(): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];

    // Tìm sản phẩm tồn kho < 5 và có sales velocity cao
    const products = await prisma.product.findMany({
      where: {
        inStock: { lt: 5, gt: 0 } // 1-4 sản phẩm còn lại
      },
      include: {
        category: { select: { name: true } }
      }
    });

    for (const product of products) {
      // Tính sales velocity (đơn giản) - sử dụng Order model với products array
      const salesLast7Days = await prisma.order.count({
        where: {
          products: {
            some: {
              id: product.id // CartProductType uses 'id' field, not 'productId'
            }
          },
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      });

      if (salesLast7Days > 0) {
        // Có bán trong 7 ngày qua
        const dailyVelocity = salesLast7Days / 7;
        const daysUntilOutOfStock = Math.ceil(product.inStock! / dailyVelocity);

        recommendations.push({
          productId: product.id,
          productName: product.name,
          type: 'INVENTORY_CRITICAL',
          title: '📦 Tồn kho nguy hiểm',
          message: `${product.name} chỉ còn ${product.inStock} chiếc, dự kiến hết hàng trong ${daysUntilOutOfStock} ngày`,
          reasoning: `Low stock (${product.inStock}), high velocity (${salesLast7Days} sold/7d)`,
          urgency: daysUntilOutOfStock <= 2 ? 'CRITICAL' : 'HIGH',
          confidence: 90,
          suggestedAction: {
            action: 'RESTOCK_URGENT',
            productId: product.id,
            currentStock: product.inStock,
            suggestedRestock: Math.max(20, salesLast7Days * 4), // 4 weeks supply
            daysUntilOutOfStock: daysUntilOutOfStock
          },
          expectedImpact: 'Prevent stockout, maintain sales momentum'
        });
      }
    }

    return recommendations;
  }

  /**
   * Tạo AI recommendations dựa trên performance data
   */
  static async generateAIRecommendations(performanceData: ProductPerformanceData[]): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];
    const now = new Date();

    for (const product of performanceData) {
      const daysInStock = Math.floor((now.getTime() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const conversionRate = product.viewCount30d > 0 ? (product.salesCount30d / product.viewCount30d) * 100 : 0;

      // 1. Sản phẩm hiệu suất thấp - cần khuyến mãi
      if (daysInStock > 30 && product.salesCount30d < 5 && conversionRate < 2) {
        const suggestedDiscount = this.calculateOptimalDiscount(product, conversionRate);

        recommendations.push({
          productId: product.id,
          productName: product.name,
          type: 'PROMOTION_SUGGESTION',
          title: '🎯 Đề xuất Khuyến mãi',
          message: `${product.name} đã ${daysInStock} ngày chỉ bán ${product.salesCount30d} sản phẩm. Đề xuất giảm ${suggestedDiscount}% để tăng doanh số`,
          reasoning: `Hiệu suất thấp: ${daysInStock} ngày, ${
            product.salesCount30d
          } bán, tỷ lệ chuyển đổi ${conversionRate.toFixed(1)}%`,
          urgency: daysInStock > 60 ? 'HIGH' : 'MEDIUM',
          confidence: 85,
          suggestedAction: {
            discountPercent: suggestedDiscount,
            currentPrice: product.price,
            newPrice: product.price * (1 - suggestedDiscount / 100),
            duration: '7 ngày'
          },
          expectedImpact: `+${Math.round(suggestedDiscount * 10)}% doanh số`
        });
      }

      // 2. Sản phẩm trending - tăng priority
      if (product.viewCount7d > product.viewCount30d * 0.4 && product.priority < 5) {
        recommendations.push({
          productId: product.id,
          productName: product.name,
          type: 'PRIORITY_BOOST',
          title: '📈 Đề xuất Tăng Priority',
          message: `${product.name} có ${product.viewCount7d} lượt xem tuần này (+${Math.round(
            (product.viewCount7d / (product.viewCount30d / 4) - 1) * 100
          )}%). Đề xuất tăng priority lên ${Math.min(product.priority + 3, 10)}`,
          reasoning: `Trending: ${product.viewCount7d} views/7d, tăng trưởng mạnh`,
          urgency: 'MEDIUM',
          confidence: 75,
          suggestedAction: {
            currentPriority: product.priority,
            newPriority: Math.min(product.priority + 3, 10),
            reason: 'Trending product'
          },
          expectedImpact: '+30% visibility'
        });
      }

      // 3. Tồn kho cao + lượt xem cao - cơ hội marketing
      if (product.inStock > 50 && product.viewCount30d > 100 && product.salesCount30d < 20) {
        recommendations.push({
          productId: product.id,
          productName: product.name,
          type: 'MARKETING_PUSH',
          title: '📧 Cơ hội Email Marketing',
          message: `${product.name} có ${product.viewCount30d} lượt xem nhưng chỉ ${product.salesCount30d} bán. Tồn kho ${product.inStock}. Đề xuất chạy email campaign`,
          reasoning: `High interest (${product.viewCount30d} views), low conversion (${conversionRate.toFixed(
            1
          )}%), high stock (${product.inStock})`,
          urgency: 'MEDIUM',
          confidence: 70,
          suggestedAction: {
            campaignType: 'PRODUCT_FOCUS',
            targetSegment: 'Đã xem sản phẩm',
            estimatedReach: Math.min(product.viewCount30d * 0.6, 500),
            suggestedDiscount: 10
          },
          expectedImpact: `+${Math.round(product.viewCount30d * 0.1)} đơn hàng`
        });
      }

      // 4. Sản phẩm có review tốt nhưng priority thấp
      if (product.avgRating >= 4.5 && product.reviewCount >= 3 && product.priority < 7) {
        recommendations.push({
          productId: product.id,
          productName: product.name,
          type: 'PRIORITY_BOOST',
          title: '⭐ Sản phẩm Chất lượng Cao',
          message: `${product.name} có ${product.avgRating}⭐ (${product.reviewCount} reviews). Đề xuất tăng priority để tăng visibility`,
          reasoning: `High rating: ${product.avgRating}/5 với ${product.reviewCount} reviews`,
          urgency: 'LOW',
          confidence: 80,
          suggestedAction: {
            currentPriority: product.priority,
            newPriority: Math.min(product.priority + 2, 10),
            reason: 'High customer satisfaction'
          },
          expectedImpact: '+20% visibility'
        });
      }
    }

    // Sắp xếp theo urgency và confidence
    return recommendations.sort((a, b) => {
      const urgencyOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.confidence - a.confidence;
    });
  }

  /**
   * Tính toán mức giảm giá tối ưu
   */
  private static calculateOptimalDiscount(product: ProductPerformanceData, conversionRate: number): number {
    // Logic đơn giản: càng ế càng giảm nhiều, conversion rate thấp thì giảm nhiều hơn
    const daysInStock = Math.floor((new Date().getTime() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const conversionFactor = Math.max(0.1, conversionRate / 100); // Normalize conversion rate

    // Base discount dựa trên thời gian tồn kho
    let baseDiscount = 5;
    if (daysInStock > 90) baseDiscount = 25; // 3 tháng -> 25%
    else if (daysInStock > 60) baseDiscount = 20; // 2 tháng -> 20%
    else if (daysInStock > 45) baseDiscount = 15; // 1.5 tháng -> 15%
    else if (daysInStock > 30) baseDiscount = 10; // 1 tháng -> 10%

    // Adjust dựa trên conversion rate (conversion thấp = giảm giá nhiều hơn)
    const adjustedDiscount = Math.round(baseDiscount / conversionFactor);
    return Math.min(adjustedDiscount, 30); // Cap tối đa 30%
  }

  /**
   * Gửi AI Recommendations cho admin (TÁCH BIỆT khỏi Notification System)
   * AI Recommendations = Proactive suggestions, không phải reactive notifications
   */
  static async sendAIRecommendations(recommendations: AIRecommendation[]): Promise<void> {
    // Lấy danh sách admin
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'STAFF'] } }
    });

    // Chỉ gửi top 5 recommendations quan trọng nhất
    const topRecommendations = recommendations.slice(0, 5);

    // Anti-spam: Kiểm tra recommendations đã gửi trong 24h qua
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const admin of admins) {
      for (const rec of topRecommendations) {
        // Kiểm tra xem đã có recommendation tương tự trong 24h qua chưa
        const existingRecommendation = await prisma.notification.findFirst({
          where: {
            userId: admin.id,
            productId: rec.productId,
            type: 'AI_ASSISTANT', // Sử dụng type riêng cho AI Recommendations
            title: rec.title,
            createdAt: { gte: last24Hours }
          }
        });

        // Chỉ tạo AI recommendation mới nếu chưa có
        if (!existingRecommendation) {
          await NotificationService.createNotification({
            userId: admin.id,
            productId: rec.productId,
            type: 'AI_ASSISTANT', // AI Recommendation type
            title: rec.title,
            message: rec.message,
            data: {
              // AI Recommendation metadata
              aiRecommendation: true,
              aiAssistant: true, // Flag để phân biệt với notification thường
              eventType: rec.type, // PROMOTION_SUGGESTION, PRIORITY_BOOST, etc.
              reasoning: rec.reasoning,
              urgency: rec.urgency,
              confidence: rec.confidence,
              suggestedAction: rec.suggestedAction,
              expectedImpact: rec.expectedImpact,
              productId: rec.productId,
              productName: rec.productName,
              analysisTimestamp: new Date().toISOString(),
              // Action tracking
              actionTaken: false,
              actionTimestamp: null,
              actionType: null
            }
          });
        } else {
          console.log(`⏭️ Skipped duplicate AI recommendation for ${admin.id} - ${rec.productName} (${rec.title})`);
        }
      }
    }
  }

  /**
   * Chạy AI recommendations đầy đủ và gửi recommendations
   */
  static async runAIRecommendations(): Promise<{
    analyzed: number;
    recommendations: number;
    notifications: number;
    skipped: number;
  }> {
    try {
      console.log('🤖 Starting Comprehensive AI Analysis...');

      // 1. Phân tích hiệu suất sản phẩm
      const performanceData = await this.analyzeProductPerformance(30);
      console.log(`📊 Analyzed ${performanceData.length} products`);

      // 2. Tạo product-based recommendations
      const productRecommendations = await this.generateAIRecommendations(performanceData);
      console.log(`💡 Generated ${productRecommendations.length} product recommendations`);

      // 3. Phân tích đơn hàng pending
      const pendingOrderRecommendations = await this.analyzePendingOrders();
      console.log(`⏰ Found ${pendingOrderRecommendations.length} pending order alerts`);

      // 4. Phân tích customer retention
      const customerRetentionRecommendations = await this.analyzeCustomerRetention();
      console.log(`💎 Found ${customerRetentionRecommendations.length} VIP retention opportunities`);

      // 5. Phân tích inventory critical
      const inventoryRecommendations = await this.analyzeInventoryCritical();
      console.log(`📦 Found ${inventoryRecommendations.length} critical inventory alerts`);

      // 6. Combine all recommendations
      const allRecommendations = [
        ...productRecommendations,
        ...pendingOrderRecommendations,
        ...customerRetentionRecommendations,
        ...inventoryRecommendations
      ];

      // Sort by urgency and confidence
      allRecommendations.sort((a, b) => {
        const urgencyWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        const aScore = urgencyWeight[a.urgency] * a.confidence;
        const bScore = urgencyWeight[b.urgency] * b.confidence;
        return bScore - aScore;
      });

      console.log(`🎯 Total recommendations: ${allRecommendations.length}`);

      // 7. Gửi AI recommendations cho admin (với anti-spam)
      let recommendationsSent = 0;
      let recommendationsSkipped = 0;

      if (allRecommendations.length > 0) {
        // Đếm số recommendations thực tế được gửi
        const admins = await prisma.user.findMany({
          where: { role: { in: ['ADMIN', 'STAFF'] } }
        });

        const topRecommendations = allRecommendations.slice(0, 8); // Increased to 8 for more coverage
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

        for (const admin of admins) {
          for (const rec of topRecommendations) {
            const existingRecommendation = await prisma.notification.findFirst({
              where: {
                userId: admin.id,
                productId: rec.productId || undefined,
                orderId: rec.orderId || undefined,
                type: 'AI_ASSISTANT',
                title: rec.title,
                createdAt: { gte: last24Hours }
              }
            });

            if (!existingRecommendation) {
              recommendationsSent++;
            } else {
              recommendationsSkipped++;
            }
          }
        }

        await this.sendAIRecommendations(allRecommendations);
        console.log(
          `🤖 Sent ${recommendationsSent} new AI recommendations, skipped ${recommendationsSkipped} duplicates`
        );
      }

      return {
        analyzed: performanceData.length,
        recommendations: allRecommendations.length,
        notifications: recommendationsSent,
        skipped: recommendationsSkipped
      };
    } catch (error) {
      console.error('❌ AI Recommendations failed:', error);
      throw error;
    }
  }
}

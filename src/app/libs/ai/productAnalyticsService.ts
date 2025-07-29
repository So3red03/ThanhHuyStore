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
  productId: string;
  productName: string;
  type: 'PROMOTION_SUGGESTION' | 'PRIORITY_BOOST' | 'STOCK_ALERT' | 'MARKETING_PUSH';
  title: string;
  message: string;
  reasoning: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number; // 0-100
  suggestedAction: any;
  expectedImpact: string;
}

export class ProductAnalyticsService {
  
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
          reasoning: `Hiệu suất thấp: ${daysInStock} ngày, ${product.salesCount30d} bán, tỷ lệ chuyển đổi ${conversionRate.toFixed(1)}%`,
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
          message: `${product.name} có ${product.viewCount7d} lượt xem tuần này (+${Math.round((product.viewCount7d / (product.viewCount30d / 4) - 1) * 100)}%). Đề xuất tăng priority lên ${Math.min(product.priority + 3, 10)}`,
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
          reasoning: `High interest (${product.viewCount30d} views), low conversion (${conversionRate.toFixed(1)}%), high stock (${product.inStock})`,
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
      const urgencyOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.confidence - a.confidence;
    });
  }

  /**
   * Tính toán mức giảm giá tối ưu
   */
  private static calculateOptimalDiscount(product: ProductPerformanceData, conversionRate: number): number {
    // Logic đơn giản: càng ế càng giảm nhiều
    const daysInStock = Math.floor((new Date().getTime() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysInStock > 90) return 25; // 3 tháng -> 25%
    if (daysInStock > 60) return 20; // 2 tháng -> 20%  
    if (daysInStock > 45) return 15; // 1.5 tháng -> 15%
    if (daysInStock > 30) return 10; // 1 tháng -> 10%
    
    return 5; // Mặc định 5%
  }

  /**
   * Gửi AI notifications cho admin
   */
  static async sendAINotifications(recommendations: AIRecommendation[]): Promise<void> {
    // Lấy danh sách admin
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'STAFF'] } }
    });

    // Chỉ gửi top 5 recommendations quan trọng nhất
    const topRecommendations = recommendations.slice(0, 5);

    for (const admin of admins) {
      for (const rec of topRecommendations) {
        await NotificationService.createNotification({
          userId: admin.id,
          productId: rec.productId,
          type: rec.type === 'PROMOTION_SUGGESTION' ? 'PROMOTION_SUGGESTION' : 'SYSTEM_ALERT',
          title: rec.title,
          message: rec.message,
          data: {
            aiRecommendation: true,
            reasoning: rec.reasoning,
            urgency: rec.urgency,
            confidence: rec.confidence,
            suggestedAction: rec.suggestedAction,
            expectedImpact: rec.expectedImpact,
            productId: rec.productId,
            productName: rec.productName
          }
        });
      }
    }
  }

  /**
   * Chạy phân tích AI đầy đủ và gửi notifications
   */
  static async runAIAnalysis(): Promise<{ 
    analyzed: number; 
    recommendations: number; 
    notifications: number; 
  }> {
    try {
      console.log('🤖 Starting AI Product Analysis...');
      
      // 1. Phân tích hiệu suất sản phẩm
      const performanceData = await this.analyzeProductPerformance(30);
      console.log(`📊 Analyzed ${performanceData.length} products`);
      
      // 2. Tạo AI recommendations
      const recommendations = await this.generateAIRecommendations(performanceData);
      console.log(`💡 Generated ${recommendations.length} recommendations`);
      
      // 3. Gửi notifications cho admin
      if (recommendations.length > 0) {
        await this.sendAINotifications(recommendations);
        console.log(`📨 Sent ${Math.min(recommendations.length, 5)} notifications to admins`);
      }
      
      return {
        analyzed: performanceData.length,
        recommendations: recommendations.length,
        notifications: Math.min(recommendations.length, 5)
      };
      
    } catch (error) {
      console.error('❌ AI Analysis failed:', error);
      throw error;
    }
  }
}

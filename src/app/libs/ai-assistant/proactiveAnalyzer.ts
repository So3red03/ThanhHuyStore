import prisma from '@/app/libs/prismadb';
import { NotificationService } from '@/app/libs/notifications/notificationService';

/**
 * ProactiveAnalyzer - Strategic AI Recommendations
 * Analyzes business patterns and provides strategic insights
 * Interval: 2 hours for strategic analysis
 */
export class ProactiveAnalyzer {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isAnalyzing = false;
  private interval = 2 * 60 * 1000; // Default 2 minutes, will be updated from settings

  async startStrategicAnalysis() {
    if (this.isAnalyzing) {
      console.log('🤖 ProactiveAnalyzer: Already analyzing - ignoring duplicate start');
      return;
    }

    // Get interval from settings
    await this.updateIntervalFromSettings();

    console.log('🤖 ProactiveAnalyzer: Starting strategic analysis...');
    console.log(`⏰ ProactiveAnalyzer: Analyzing every ${this.interval / (60 * 1000)} minutes`);

    this.isAnalyzing = true;

    // Start monitoring with fixed interval
    this.monitoringInterval = setInterval(async () => {
      try {
        const isEnabled = await this.isProactiveAnalysisEnabled();
        if (isEnabled) {
          await this.runStrategicAnalysis();
        } else {
          console.log('🤖 ProactiveAnalyzer: Disabled - stopping analysis');
          this.stopAnalysis();
        }
      } catch (error) {
        console.error('🤖 ProactiveAnalyzer: Error during analysis:', error);
      }
    }, this.interval);

    // Initial analysis after 30 seconds (quick start for testing)
    setTimeout(async () => {
      await this.runStrategicAnalysis();
    }, 30 * 1000);
  }

  stopAnalysis() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isAnalyzing = false;
    console.log('🤖 ProactiveAnalyzer: Stopped analysis');
  }

  private async isProactiveAnalysisEnabled(): Promise<boolean> {
    try {
      const settings = await prisma.adminSettings.findFirst();
      return settings?.aiAssistantEnabled ?? true;
    } catch (error) {
      console.error('Error checking proactive analysis settings:', error);
      return false;
    }
  }

  private async runStrategicAnalysis() {
    try {
      console.log('🧠 ProactiveAnalyzer: Starting strategic analysis...');

      const analysisTypes = [
        'CRITICAL_INVENTORY_ANALYSIS', // MOVED FROM ReactiveMonitor
        'URGENT_ORDER_ANALYSIS', // MOVED FROM ReactiveMonitor
        'PRODUCT_OPTIMIZATION',
        'CUSTOMER_RETENTION',
        'INVENTORY_PLANNING',
        'PRICING_STRATEGY'
      ];

      let totalRecommendations = 0;
      let totalNotifications = 0;

      for (const type of analysisTypes) {
        // All analysis types use 2min cooldown as requested
        const cooldown = '2m';
        const shouldAnalyze = await this.shouldRunAnalysis(type, cooldown);

        if (shouldAnalyze) {
          console.log(`🎯 Running ${type} analysis...`);
          const result = await this.runSpecificAnalysis(type);

          totalRecommendations += result.recommendations;
          totalNotifications += result.notifications;

          await this.markAnalysisCompleted(type);
        } else {
          console.log(`⏭️ Skipping ${type} - recently analyzed`);
        }
      }

      console.log(`✅ ProactiveAnalyzer: Completed strategic analysis`);
      console.log(`📊 Generated ${totalRecommendations} recommendations, sent ${totalNotifications} notifications`);
    } catch (error) {
      console.error('🤖 ProactiveAnalyzer: Error in strategic analysis:', error);
    }
  }

  private async runSpecificAnalysis(type: string): Promise<{ recommendations: number; notifications: number }> {
    switch (type) {
      case 'CRITICAL_INVENTORY_ANALYSIS':
        return this.analyzeCriticalInventory();

      case 'URGENT_ORDER_ANALYSIS':
        return this.analyzeUrgentOrders();

      case 'PRODUCT_OPTIMIZATION':
        return this.analyzeProductOptimization();

      case 'CUSTOMER_RETENTION':
        return this.analyzeCustomerRetention();

      case 'INVENTORY_PLANNING':
        return this.analyzeInventoryPlanning();

      case 'PRICING_STRATEGY':
        return this.analyzePricingStrategy();

      default:
        return { recommendations: 0, notifications: 0 };
    }
  }

  // 💡 ANALYSIS 0: Critical Inventory (moved from ReactiveMonitor)
  private async analyzeCriticalInventory(): Promise<{ recommendations: number; notifications: number }> {
    try {
      const criticalProducts = await prisma.product.findMany({
        where: {
          inStock: { lte: 5 },
          isDeleted: false,
          productType: 'SIMPLE'
        },
        select: {
          id: true,
          name: true,
          inStock: true,
          createdAt: true
        },
        take: 20 // Limit for performance
      });

      let recommendations = 0;
      let notifications = 0;

      for (const product of criticalProducts) {
        const shouldRecommend = await this.shouldSendRecommendation(`critical_inventory_${product.id}`, '2m');

        if (shouldRecommend) {
          const urgencyLevel = (product.inStock || 0) <= 2 ? 'CRITICAL' : 'HIGH';

          await this.sendStrategicRecommendation({
            type: 'CRITICAL_INVENTORY_ANALYSIS',
            productId: product.id,
            title: '📦 Phân tích tồn kho nguy hiểm',
            message: `Sản phẩm "${product.name}" chỉ còn ${product.inStock} cái. ${
              urgencyLevel === 'CRITICAL' ? 'CẦN NHẬP HÀNG NGAY!' : 'Nên lên kế hoạch nhập hàng.'
            } Đây là phân tích chiến lược để tránh hết hàng.`,
            priority: urgencyLevel,
            contextData: {
              currentStock: product.inStock,
              threshold: 5,
              urgencyLevel,
              analysisType: 'strategic_inventory'
            }
          });

          await this.markRecommendationSent(`critical_inventory_${product.id}`);
          recommendations++;
          notifications++;
        }
      }

      console.log(
        `📦 Critical Inventory Analysis: Found ${criticalProducts.length} critical products, generated ${recommendations} recommendations`
      );
      return { recommendations, notifications };
    } catch (error) {
      console.error('Error in critical inventory analysis:', error);
      return { recommendations: 0, notifications: 0 };
    }
  }

  // 💡 ANALYSIS 1: Urgent Orders (moved from ReactiveMonitor)
  private async analyzeUrgentOrders(): Promise<{ recommendations: number; notifications: number }> {
    try {
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

      const urgentOrders = await prisma.order.findMany({
        where: {
          status: 'pending',
          createdAt: { lte: oneDayAgo }
        },
        include: {
          user: {
            select: { name: true, email: true }
          }
        },
        take: 10 // Limit for performance
      });

      let recommendations = 0;
      let notifications = 0;

      for (const order of urgentOrders) {
        const daysPending = Math.floor((Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const shouldRecommend = await this.shouldSendRecommendation(`urgent_order_${order.id}`, '2m');

        if (shouldRecommend) {
          await this.sendStrategicRecommendation({
            type: 'URGENT_ORDER_ANALYSIS',
            title: '⏰ Phân tích đơn hàng quá hạn',
            message: `Đơn hàng #${order.id.slice(-6)} của ${
              order.user?.name || 'Khách hàng'
            } đã pending ${daysPending} ngày. Cần có kế hoạch xử lý để tránh khách hàng hủy đơn. Giá trị đơn: ${(
              order.amount / 1000000
            ).toFixed(1)}M VND.`,
            priority: daysPending >= 1 ? 'CRITICAL' : 'HIGH',
            contextData: {
              orderId: order.id,
              customerName: order.user?.name,
              daysPending: daysPending,
              totalAmount: order.amount,
              analysisType: 'strategic_order_management'
            }
          });

          await this.markRecommendationSent(`urgent_order_${order.id}`);
          recommendations++;
          notifications++;
        }
      }

      console.log(
        `⏰ Urgent Order Analysis: Found ${urgentOrders.length} urgent orders, generated ${recommendations} recommendations`
      );
      return { recommendations, notifications };
    } catch (error) {
      console.error('Error in urgent order analysis:', error);
      return { recommendations: 0, notifications: 0 };
    }
  }

  // 💡 ANALYSIS 2: Product Optimization
  private async analyzeProductOptimization(): Promise<{ recommendations: number; notifications: number }> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Get products and their order data
      const products = await prisma.product.findMany({
        where: {
          isDeleted: false,
          productType: 'SIMPLE'
        },
        take: 50 // Limit for performance
      });

      // Get orders with products from last 30 days
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: { in: ['completed'] }
        },
        select: {
          products: true
        }
      });

      let recommendations = 0;
      let notifications = 0;

      for (const product of products) {
        // Calculate sales from orders
        let sales = 0;
        for (const order of orders) {
          for (const orderProduct of order.products) {
            if (orderProduct.id === product.id) {
              sales += orderProduct.quantity;
            }
          }
        }

        // For now, assume views = sales * 20 (rough estimate)
        // TODO: Implement proper analytics tracking
        const estimatedViews = sales * 20;
        const conversionRate = estimatedViews > 0 ? (sales / estimatedViews) * 100 : 0;

        // Low performance products (estimated high views, low sales)
        if (sales >= 2 && sales <= 5 && estimatedViews >= 50) {
          const shouldRecommend = await this.shouldSendRecommendation(`product_optimization_${product.id}`, '7d');

          if (shouldRecommend) {
            await this.sendStrategicRecommendation({
              type: 'PRODUCT_OPTIMIZATION',
              productId: product.id,
              title: '💡 Gợi ý tối ưu sản phẩm',
              message: `Sản phẩm "${product.name}" có ít đơn hàng (${sales} đơn). Gợi ý: Giảm giá 10-15% hoặc cải thiện mô tả để tăng doanh số.`,
              priority: 'MEDIUM',
              contextData: {
                estimatedViews,
                sales,
                conversionRate: Math.round(conversionRate * 10) / 10,
                currentPrice: product.price,
                suggestedDiscount: '10-15%'
              }
            });

            await this.markRecommendationSent(`product_optimization_${product.id}`);
            recommendations++;
            notifications++;
          }
        }
      }

      console.log(
        `📈 Product Optimization: Analyzed ${products.length} products, generated ${recommendations} recommendations`
      );
      return { recommendations, notifications };
    } catch (error) {
      console.error('Error in product optimization analysis:', error);
      return { recommendations: 0, notifications: 0 };
    }
  }

  // 💡 ANALYSIS 2: Customer Retention
  private async analyzeCustomerRetention(): Promise<{ recommendations: number; notifications: number }> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

      // Find VIP customers who haven't ordered recently
      const inactiveVipCustomers = await prisma.user.findMany({
        where: {
          role: 'USER', // Correct role name
          orders: {
            some: {
              createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
              status: { in: ['completed'] }, // Correct status
              amount: { gte: 1000000 } // VIP threshold: 1M VND
            },
            none: {
              createdAt: { gte: thirtyDaysAgo }
            }
          }
        },
        include: {
          orders: {
            where: {
              status: { in: ['completed'] }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        },
        take: 20 // Limit for performance
      });

      let recommendations = 0;
      let notifications = 0;

      if (inactiveVipCustomers.length > 0) {
        const shouldRecommend = await this.shouldSendRecommendation('customer_retention_campaign', '7d');

        if (shouldRecommend) {
          const totalValue = inactiveVipCustomers.reduce(
            (sum: number, customer) =>
              sum + customer.orders.reduce((orderSum: number, order) => orderSum + order.amount, 0),
            0
          );

          await this.sendStrategicRecommendation({
            type: 'CUSTOMER_RETENTION',
            title: '💎 Chiến dịch giữ chân khách VIP',
            message: `Có ${inactiveVipCustomers.length} khách VIP không mua hàng trong 30 ngày (tổng giá trị: ${(
              totalValue / 1000000
            ).toFixed(1)}M VND). Gợi ý: Gửi email khuyến mãi đặc biệt 15-20%.`,
            priority: 'HIGH',
            contextData: {
              inactiveVipCount: inactiveVipCustomers.length,
              totalValue: Math.round(totalValue),
              suggestedDiscount: '15-20%',
              campaignType: 'VIP_RETENTION'
            }
          });

          await this.markRecommendationSent('customer_retention_campaign');
          recommendations++;
          notifications++;
        }
      }

      console.log(
        `💎 Customer Retention: Found ${inactiveVipCustomers.length} inactive VIP customers, generated ${recommendations} recommendations`
      );
      return { recommendations, notifications };
    } catch (error) {
      console.error('Error in customer retention analysis:', error);
      return { recommendations: 0, notifications: 0 };
    }
  }

  // 💡 ANALYSIS 3: Inventory Planning
  private async analyzeInventoryPlanning(): Promise<{ recommendations: number; notifications: number }> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Find products with low to medium stock (including critical levels)
      const products = await prisma.product.findMany({
        where: {
          isDeleted: false,
          productType: 'SIMPLE',
          inStock: { gte: 1, lte: 50 } // Include low stock products
        },
        // No include needed, we'll calculate sales separately
        take: 50 // Increased limit to catch more products
      });

      // Get orders for sales calculation
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: { in: ['completed'] }
        },
        select: {
          products: true
        }
      });

      let recommendations = 0;
      let notifications = 0;

      for (const product of products) {
        // Calculate sales from orders
        let salesLast30Days = 0;
        for (const order of orders) {
          for (const orderProduct of order.products) {
            if (orderProduct.id === product.id) {
              salesLast30Days += orderProduct.quantity;
            }
          }
        }
        const dailyVelocity = salesLast30Days / 30;
        const daysOfStock = dailyVelocity > 0 ? (product.inStock || 0) / dailyVelocity : 999;

        // LOW STOCK ALERT: Products with stock <= 10 (immediate attention)
        if ((product.inStock || 0) <= 10) {
          const shouldRecommend = await this.shouldSendRecommendation(`low_stock_${product.id}`, '2m');

          if (shouldRecommend) {
            const urgencyLevel = (product.inStock || 0) <= 5 ? 'CRITICAL' : 'HIGH';
            const suggestedOrder = Math.max(20, Math.ceil(dailyVelocity * 30)); // At least 20 or 30 days supply

            await this.sendStrategicRecommendation({
              type: 'LOW_STOCK_ALERT',
              productId: product.id,
              title: '⚠️ Cảnh báo tồn kho thấp',
              message: `Sản phẩm "${product.name}" chỉ còn ${product.inStock} cái. ${
                urgencyLevel === 'CRITICAL' ? 'CẦN NHẬP HÀNG NGAY!' : 'Nên nhập hàng sớm.'
              } Gợi ý: ${suggestedOrder} cái.`,
              priority: urgencyLevel,
              contextData: {
                currentStock: product.inStock,
                dailyVelocity: Math.round(dailyVelocity * 10) / 10,
                urgencyLevel,
                suggestedOrder,
                salesLast30Days
              }
            });

            await this.markRecommendationSent(`low_stock_${product.id}`);
            recommendations++;
            notifications++;
          }
        }
        // RESTOCK PLANNING: Products that will run out in 10-20 days (good time to restock)
        else if (daysOfStock >= 10 && daysOfStock <= 20 && salesLast30Days >= 5) {
          const shouldRecommend = await this.shouldSendRecommendation(`inventory_planning_${product.id}`, '14d');

          if (shouldRecommend) {
            const suggestedOrder = Math.ceil(dailyVelocity * 45); // 45 days of stock

            await this.sendStrategicRecommendation({
              type: 'INVENTORY_PLANNING',
              productId: product.id,
              title: '📦 Kế hoạch nhập hàng thông minh',
              message: `Sản phẩm "${product.name}" sẽ hết hàng trong ${Math.round(
                daysOfStock
              )} ngày. Gợi ý nhập thêm ${suggestedOrder} cái để đủ dùng 45 ngày.`,
              priority: 'MEDIUM',
              contextData: {
                currentStock: product.inStock,
                dailyVelocity: Math.round(dailyVelocity * 10) / 10,
                daysOfStock: Math.round(daysOfStock),
                suggestedOrder,
                salesLast30Days
              }
            });

            await this.markRecommendationSent(`inventory_planning_${product.id}`);
            recommendations++;
            notifications++;
          }
        }
      }

      console.log(
        `📦 Inventory Planning: Analyzed ${products.length} products, generated ${recommendations} recommendations`
      );
      return { recommendations, notifications };
    } catch (error) {
      console.error('Error in inventory planning analysis:', error);
      return { recommendations: 0, notifications: 0 };
    }
  }

  // 💡 ANALYSIS 4: Pricing Strategy (placeholder)
  private async analyzePricingStrategy(): Promise<{ recommendations: number; notifications: number }> {
    // TODO: Implement pricing strategy analysis
    // This could analyze:
    // - Competitor pricing
    // - Price elasticity
    // - Seasonal pricing opportunities
    // - Bundle pricing suggestions

    console.log('💰 Pricing Strategy: Analysis not implemented yet');
    return { recommendations: 0, notifications: 0 };
  }

  // Helper: Check if analysis should run (anti-spam)
  private async shouldRunAnalysis(analysisType: string, cooldown: string): Promise<boolean> {
    try {
      const cooldownMs = this.parseCooldown(cooldown);
      const lastAnalysis = await prisma.aIMemory.findFirst({
        where: {
          alertId: `analysis_${analysisType}`,
          status: 'ACTIVE'
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!lastAnalysis) return true;

      const timeSince = Date.now() - lastAnalysis.createdAt.getTime();
      return timeSince >= cooldownMs;
    } catch (error) {
      console.error('Error checking analysis cooldown:', error);
      return false;
    }
  }

  // Helper: Check if recommendation should be sent (anti-spam)
  private async shouldSendRecommendation(recommendationKey: string, cooldown: string): Promise<boolean> {
    try {
      const cooldownMs = this.parseCooldown(cooldown);
      const lastRecommendation = await prisma.aIMemory.findFirst({
        where: {
          alertId: recommendationKey,
          status: 'ACTIVE'
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!lastRecommendation) return true;

      const timeSince = Date.now() - lastRecommendation.createdAt.getTime();
      return timeSince >= cooldownMs;
    } catch (error) {
      console.error('Error checking recommendation cooldown:', error);
      return false;
    }
  }

  // Helper: Parse cooldown string to milliseconds
  private parseCooldown(cooldown: string): number {
    const match = cooldown.match(/^(\d+)([smhd])$/);
    if (!match) return 2 * 60 * 60 * 1000; // Default 2 hours

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 2 * 60 * 60 * 1000;
    }
  }

  // Helper: Mark analysis as completed
  private async markAnalysisCompleted(analysisType: string) {
    try {
      const alertId = `analysis_${analysisType}`;

      await prisma.aIMemory.upsert({
        where: { alertId },
        update: {
          status: 'ACTIVE',
          reminderCount: { increment: 1 },
          contextData: JSON.stringify({
            completedAt: new Date().toISOString(),
            type: 'analysis'
          })
        },
        create: {
          alertId,
          eventType: 'STRATEGIC_ANALYSIS',
          status: 'ACTIVE',
          reminderCount: 1,
          contextData: JSON.stringify({
            completedAt: new Date().toISOString(),
            type: 'analysis'
          })
        }
      });
    } catch (error) {
      console.error('Error marking analysis as completed:', error);
    }
  }

  // Helper: Mark recommendation as sent
  private async markRecommendationSent(recommendationKey: string) {
    try {
      await prisma.aIMemory.upsert({
        where: { alertId: recommendationKey },
        update: {
          status: 'ACTIVE',
          reminderCount: { increment: 1 },
          contextData: JSON.stringify({
            sentAt: new Date().toISOString(),
            type: 'recommendation'
          })
        },
        create: {
          alertId: recommendationKey,
          eventType: 'STRATEGIC_RECOMMENDATION',
          status: 'ACTIVE',
          reminderCount: 1,
          contextData: JSON.stringify({
            sentAt: new Date().toISOString(),
            type: 'recommendation'
          })
        }
      });
    } catch (error) {
      console.error('Error marking recommendation as sent:', error);
    }
  }

  // Send strategic recommendation notification
  private async sendStrategicRecommendation(recommendationData: {
    type: string;
    title: string;
    message: string;
    priority: string;
    productId?: string;
    contextData?: any;
  }) {
    try {
      // Get all admin users
      const adminUsers = await prisma.user.findMany({
        where: {
          // role: { in: ['ADMIN', 'STAFF'] }
          role: 'ADMIN'
        }
      });

      // Send notification to each admin
      for (const admin of adminUsers) {
        await NotificationService.createNotification({
          userId: admin.id,
          type: 'AI_ASSISTANT',
          title: recommendationData.title,
          message: recommendationData.message,
          productId: recommendationData.productId,
          data: {
            aiAssistant: true,
            eventType: recommendationData.type,
            isStrategic: true,
            priority: recommendationData.priority,
            productId: recommendationData.productId, // Ensure productId is in data
            ...recommendationData.contextData
          }
        });
      }

      console.log(`📤 ProactiveAnalyzer: Sent strategic recommendation to ${adminUsers.length} admins`);
    } catch (error) {
      console.error('Error sending strategic recommendation:', error);
    }
  }

  // Helper: Update analysis interval from settings
  private async updateIntervalFromSettings() {
    try {
      const settings = await prisma.adminSettings.findFirst();
      if (settings?.aiRecommendationInterval) {
        // aiRecommendationInterval is in minutes, convert to milliseconds
        this.interval = settings.aiRecommendationInterval * 60 * 1000;
        console.log(
          `⚙️ ProactiveAnalyzer: Updated interval to ${settings.aiRecommendationInterval} minutes from settings`
        );
      } else {
        console.log(`⚙️ ProactiveAnalyzer: Using default interval ${this.interval / (60 * 1000)} minutes`);
      }
    } catch (error) {
      console.error('Error getting recommendation interval from settings:', error);
      console.log(`⚙️ ProactiveAnalyzer: Using default interval ${this.interval / (60 * 1000)} minutes`);
    }
  }
}

// Export singleton instance
export const proactiveAnalyzer = new ProactiveAnalyzer();

// Event Monitor - Real-time Business Event Detection & Processing
import prisma from '@/app/libs/prismadb';
import { AIMemoryService } from './memoryService';
import { processBusinessEvent, detectBusinessContext } from './eventTriggers';
import { BusinessEvent, BusinessEventType } from './types';
import { NotificationService } from '../notifications/notificationService';
import { VietnameseHolidayService } from './vietnameseHolidays';
import { AIRecommendationService } from '../ai/aiRecommendationService';

export class EventMonitor {
  private static instance: EventMonitor;
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastLogTime = 0;

  static getInstance(): EventMonitor {
    if (!EventMonitor.instance) {
      EventMonitor.instance = new EventMonitor();
    }
    return EventMonitor.instance;
  }

  // Check if AI Assistant is enabled
  private async isAIAssistantEnabled(): Promise<boolean> {
    try {
      const settings = await prisma.adminSettings.findFirst();
      return settings?.aiAssistantEnabled ?? true; // Default enabled
    } catch (error) {
      console.error('Error checking AI Assistant status:', error);
      return true; // Default enabled on error
    }
  }

  // Start real-time monitoring with fixed interval (simplified)
  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('🤖 AI Assistant: Already monitoring - skipping duplicate start');
      return;
    }

    // Check if AI Assistant is enabled
    const enabled = await this.isAIAssistantEnabled();
    if (!enabled) {
      console.log('🤖 AI Assistant: Disabled - skipping monitoring');
      return;
    }

    // Stop any existing interval first (safety check)
    if (this.monitoringInterval) {
      console.log('🤖 AI Assistant: Clearing existing interval before starting new one');
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isMonitoring = true;
    console.log('🤖 AI Assistant: Starting SIMPLIFIED monitoring (1 reminder per event)...');

    // Fixed interval - 2 minutes (simplified logic doesn't need dynamic interval)
    const interval = 2 * 60 * 1000; // 2 minutes
    console.log(`🤖 AI Assistant: Monitoring every ${interval / 1000} seconds`);

    // Monitor with fixed interval
    this.monitoringInterval = setInterval(async () => {
      const stillEnabled = await this.isAIAssistantEnabled();
      if (stillEnabled) {
        await this.checkBusinessEvents();
      } else {
        console.log('🤖 AI Assistant: Disabled during runtime - stopping monitoring');
        this.stopMonitoring();
      }
    }, interval);

    // Initial check
    await this.checkBusinessEvents();
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('🤖 AI Assistant: Stopped monitoring');
  }

  // Main business event checking logic
  private async checkBusinessEvents() {
    try {
      // Only log monitoring activity every 10 minutes to reduce spam
      const now = Date.now();
      const shouldLogActivity = !this.lastLogTime || now - this.lastLogTime >= 10 * 60 * 1000;

      if (shouldLogActivity) {
        console.log('🤖 AI Assistant: Running business event check...');
        this.lastLogTime = now;
      }

      // ENHANCED MODE: Essential + Business Intelligence events + AI Recommendations
      await Promise.all([
        this.checkInventoryEvents(),
        this.checkSalesEvents(),
        // 🎯 NEW BUSINESS INTELLIGENCE EVENTS:
        this.checkSeasonalMarketingOpportunities(),
        this.checkPendingOrdersAlert(),
        this.checkBirthdayCampaignOpportunities(),
        // 🤖 AI RECOMMENDATION SERVICE INTEGRATION:
        this.runAIRecommendations(),
        // 🚫 DISABLED NOISY EVENTS:
        // this.checkPaymentEvents(),
        // this.checkReviewEvents(),
        // this.checkCartAbandonmentEvents(),
        // this.checkHighValueCustomerEvents(),
        // this.checkAverageOrderValueEvents(),
        // this.checkCompetitorPriceEvents(),
        this.processEscalations()
      ]);
    } catch (error) {
      console.error('Error in business event monitoring:', error);
    }
  }

  // Check inventory-related events
  private async checkInventoryEvents() {
    try {
      const products = await prisma.product.findMany({
        where: {
          isDeleted: false,
          productType: 'SIMPLE'
        },
        select: {
          id: true,
          name: true,
          inStock: true
        }
      });

      for (const product of products) {
        if (product.inStock === null) continue;

        const eventData = {
          productId: product.id,
          productName: product.name,
          quantity: product.inStock,
          // Add specific context for better notifications
          currentStock: product.inStock,
          threshold: this.getInventoryThreshold(product.inStock),
          estimatedDays: this.calculateEstimatedDays(product.inStock, product.id),
          pendingOrders: await this.getPendingOrdersCount(product.id),
          rejectedOrders: 0, // TODO: Implement rejected orders tracking
          lostRevenue: 0 // TODO: Calculate lost revenue
        };

        const trigger = processBusinessEvent(eventData);
        if (trigger) {
          await this.processBusinessEventTrigger(trigger, eventData);
        }
      }
    } catch (error) {
      console.error('Error checking inventory events:', error);
    }
  }

  // Check sales-related events
  private async checkSalesEvents() {
    try {
      const products = await prisma.product.findMany({
        where: {
          isDeleted: false
        },
        select: {
          id: true,
          name: true
        }
      });

      for (const product of products) {
        const salesData = await this.calculateSalesChange(product.id);

        if (salesData.salesIncrease >= 200 || salesData.salesDecrease >= 20) {
          const eventData = {
            productId: product.id,
            productName: product.name,
            // Add specific context for better notifications
            dropPercentage: salesData.salesDecrease || 0,
            increasePercentage: salesData.salesIncrease || 0,
            ...salesData
          };

          const trigger = processBusinessEvent(eventData);
          if (trigger) {
            await this.processBusinessEventTrigger(trigger, eventData);
          }
        }
      }
    } catch (error) {
      console.error('Error checking sales events:', error);
    }
  }

  // Check payment-related events
  private async checkPaymentEvents() {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      const totalOrders = await prisma.order.count({
        where: {
          createdAt: { gte: thirtyMinutesAgo }
        }
      });

      const failedOrders = await prisma.order.count({
        where: {
          createdAt: { gte: thirtyMinutesAgo },
          status: 'canceled' // Assuming cancelled orders are payment failures
        }
      });

      if (totalOrders > 0) {
        const failureRate = (failedOrders / totalOrders) * 100;

        if (failureRate >= 10) {
          const eventData = {
            failureRate: Math.round(failureRate),
            timeWindow: 30,
            failedCount: failedOrders,
            totalCount: totalOrders
          };

          const trigger = processBusinessEvent(eventData);
          if (trigger) {
            await this.processBusinessEventTrigger(trigger, eventData);
          }
        }
      }
    } catch (error) {
      console.error('Error checking payment events:', error);
    }
  }

  // Check review-related events
  private async checkReviewEvents() {
    try {
      const products = await prisma.product.findMany({
        where: {
          isDeleted: false
        },
        include: {
          reviews: {
            where: {
              createdDate: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
              }
            }
          }
        }
      });

      for (const product of products) {
        if (product.reviews.length === 0) continue;

        const averageRating = product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length;
        const negativeCount = product.reviews.filter(review => review.rating <= 2).length;

        if (averageRating <= 3.0 || negativeCount >= 3) {
          const eventData = {
            productId: product.id,
            productName: product.name,
            averageRating: Math.round(averageRating * 10) / 10,
            negativeCount,
            totalReviews: product.reviews.length
          };

          const trigger = processBusinessEvent(eventData);
          if (trigger) {
            await this.processBusinessEventTrigger(trigger, eventData);
          }
        }
      }
    } catch (error) {
      console.error('Error checking review events:', error);
    }
  }

  // Process escalations for existing memories
  private async processEscalations() {
    try {
      const activeMemories = await AIMemoryService.getActiveMemories();

      for (const memory of activeMemories) {
        const newEscalationLevel = await AIMemoryService.checkEscalation(memory);

        if (newEscalationLevel !== memory.escalationLevel) {
          // Generate escalated notification
          const personalityResponse = AIMemoryService.generatePersonalityResponse(memory, newEscalationLevel);

          await this.sendAINotification({
            type: memory.eventType as BusinessEventType,
            title: personalityResponse.title,
            message: personalityResponse.message,
            priority: newEscalationLevel,
            productId: memory.productId,
            productName: memory.productName,
            contextData: memory.contextData,
            memoryId: memory.alertId
          });

          // Record escalation action
          await AIMemoryService.recordAdminAction(memory.alertId, {
            type: 'VIEWED',
            timestamp: new Date(),
            userId: 'SYSTEM',
            details: { escalated: true, newLevel: newEscalationLevel }
          });
        }
      }
    } catch (error) {
      console.error('Error processing escalations:', error);
    }
  }

  // Process business event trigger
  private async processBusinessEventTrigger(trigger: any, eventData: any) {
    try {
      // Create or update AI memory
      const memory = await AIMemoryService.createOrUpdateMemory({
        eventType: trigger.eventType,
        productId: eventData.productId,
        productName: eventData.productName,
        contextData: eventData,
        businessImpact: trigger.businessImpact
      });

      // Check if we should send notification (avoid spam) - now async
      const shouldNotify = await this.shouldSendNotification(memory);

      if (shouldNotify) {
        const personalityResponse = AIMemoryService.generatePersonalityResponse(memory, trigger.priority);

        // CRITICAL FIX: Update reminderCount BEFORE sending notification
        const updatedMemory = await AIMemoryService.incrementReminderCount(memory.alertId);

        await this.sendAINotification({
          type: trigger.eventType,
          title: personalityResponse.title,
          message: personalityResponse.message,
          priority: trigger.priority,
          productId: eventData.productId,
          productName: eventData.productName,
          contextData: eventData,
          memoryId: updatedMemory.alertId
        });

        console.log(`📤 Sent reminder ${updatedMemory.reminderCount} for ${memory.alertId}`);
      }
    } catch (error) {
      console.error('Error processing business event trigger:', error);
    }
  }

  // Send AI notification to admin
  private async sendAINotification(data: {
    type: BusinessEventType;
    title: string;
    message: string;
    priority: string;
    productId?: string;
    productName?: string;
    contextData: any;
    memoryId?: string;
  }) {
    try {
      // Get only ADMIN users to avoid duplicate notifications
      const adminUsers = await prisma.user.findMany({
        where: {
          role: 'ADMIN' // Only send to ADMIN, not STAFF to avoid duplicates
        }
      });

      // Send notification to each admin
      for (const admin of adminUsers) {
        await NotificationService.createNotification({
          userId: admin.id,
          productId: data.productId,
          type: 'AI_ASSISTANT', // Use AI_ASSISTANT type instead of SYSTEM_ALERT
          title: data.title,
          message: data.message,
          data: {
            aiAssistant: true,
            eventType: data.type,
            priority: data.priority,
            businessContext: detectBusinessContext(),
            memoryId: data.memoryId, // Include memoryId for resolve/dismiss actions
            ...data.contextData
          }
        });
      }
    } catch (error) {
      console.error('Error sending AI notification:', error);
    }
  }

  // Get appropriate inventory threshold based on current stock
  private getInventoryThreshold(currentStock: number): number {
    if (currentStock <= 0) return 0;
    if (currentStock <= 5) return 5;
    if (currentStock <= 10) return 10;
    return 15; // Default threshold for higher stock
  }

  // Helper methods - Enhanced anti-spam logic (now async for dynamic settings)
  private async shouldSendNotification(memory: any): Promise<boolean> {
    // Check if admin is responsive first (now async)
    const isResponsive = await AIMemoryService.isAdminResponsive(memory);

    // If admin is responsive, stop sending notifications completely
    if (isResponsive) {
      console.log(`🛑 Admin responsive - stopping notifications for ${memory.alertId}`);
      return false;
    }

    // Use the intelligent anti-spam logic from AIMemoryService (now async)
    const shouldSend = await AIMemoryService.shouldSendNotification(memory);
    return shouldSend;
  }

  private async calculateEstimatedDays(stock: number, productId: string): Promise<number> {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Calculate average daily sales from products array
      const recentOrders = await prisma.order.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
          status: { in: ['pending', 'confirmed', 'completed'] }
        }
      });

      const totalSold = recentOrders.reduce((sum, order) => {
        const productItems = order.products.filter((p: any) => p.id === productId);
        return sum + productItems.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0);
      }, 0);

      const averageDailySales = totalSold / 7;
      return averageDailySales > 0 ? Math.ceil(stock / averageDailySales) : 999;
    } catch (error) {
      console.error('Error calculating estimated days:', error);
      return 999;
    }
  }

  private async getPendingOrdersCount(productId: string): Promise<number> {
    try {
      const pendingOrders = await prisma.order.findMany({
        where: {
          status: 'pending'
        }
      });

      return pendingOrders.filter(order => order.products.some((p: any) => p.id === productId)).length;
    } catch (error) {
      console.error('Error getting pending orders count:', error);
      return 0;
    }
  }

  private async calculateSalesChange(productId: string): Promise<{
    salesIncrease: number;
    salesDecrease: number;
    timeWindow: number;
  }> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      // Sales in last hour
      const recentSales = await this.getSalesInPeriod(productId, oneHourAgo, now);

      // Sales in previous hour
      const previousSales = await this.getSalesInPeriod(productId, twoHoursAgo, oneHourAgo);

      if (previousSales === 0) {
        return { salesIncrease: recentSales > 0 ? 100 : 0, salesDecrease: 0, timeWindow: 1 };
      }

      const changePercent = ((recentSales - previousSales) / previousSales) * 100;

      return {
        salesIncrease: changePercent > 0 ? changePercent : 0,
        salesDecrease: changePercent < 0 ? Math.abs(changePercent) : 0,
        timeWindow: 1
      };
    } catch (error) {
      console.error('Error calculating sales change:', error);
      return { salesIncrease: 0, salesDecrease: 0, timeWindow: 1 };
    }
  }

  private async getSalesInPeriod(productId: string, startDate: Date, endDate: Date): Promise<number> {
    try {
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: { in: ['pending', 'confirmed', 'completed'] }
        }
      });

      return orders.reduce((sum, order) => {
        const productItems = order.products.filter((p: any) => p.id === productId);
        return sum + productItems.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0);
      }, 0);
    } catch (error) {
      console.error('Error getting sales in period:', error);
      return 0;
    }
  }

  // ADVANCED E-COMMERCE MONITORING METHODS

  // 🎯 NEW BUSINESS INTELLIGENCE EVENT CHECKERS

  // Check for seasonal marketing opportunities
  private async checkSeasonalMarketingOpportunities() {
    try {
      const opportunities = VietnameseHolidayService.getMarketingOpportunities();

      for (const opportunity of opportunities) {
        if (opportunity.urgency === 'high' && opportunity.daysUntil >= 7 && opportunity.daysUntil <= 14) {
          const eventData = {
            holidayName: opportunity.holiday.name,
            daysUntilHoliday: opportunity.daysUntil,
            marketingPotential: opportunity.holiday.marketingPotential,
            suggestedProducts: opportunity.holiday.suggestedProducts,
            campaignIdeas: opportunity.holiday.campaignIdeas
          };

          // Create a custom trigger for seasonal marketing
          const trigger = {
            name: 'seasonal_marketing',
            eventType: 'SEASONAL_MARKETING' as const,
            priority: 'WARNING' as const,
            businessImpact: 'MEDIUM' as const,
            message: () => `Cơ hội marketing theo mùa: ${eventData.holidayName}`,
            suggestedActions: ['Tạo campaign marketing', 'Chuẩn bị sản phẩm phù hợp']
          };
          await this.processBusinessEventTrigger(trigger, eventData);
        }
      }
    } catch (error) {
      console.error('Error checking seasonal marketing opportunities:', error);
    }
  }

  // Check for pending orders that need attention
  private async checkPendingOrdersAlert() {
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const pendingOrders = await prisma.order.findMany({
        where: {
          status: 'pending',
          createdAt: { lte: threeDaysAgo }
        }
      });

      for (const order of pendingOrders) {
        const pendingDays = Math.floor((Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24));

        // Get user info separately
        const user = await prisma.user.findUnique({
          where: { id: order.userId },
          select: { name: true, email: true }
        });

        const eventData = {
          orderId: order.id,
          customerName: user?.name || 'Unknown',
          customerEmail: user?.email,
          pendingDays,
          orderTotal: order.amount
        };

        // Create a custom trigger for order management
        const trigger = {
          name: 'order_management',
          eventType: 'ORDER_MANAGEMENT' as const,
          priority: 'URGENT' as const,
          businessImpact: 'HIGH' as const,
          message: () => `Đơn hàng pending ${eventData.pendingDays} ngày: ${eventData.customerName}`,
          suggestedActions: ['Liên hệ khách hàng', 'Kiểm tra thanh toán', 'Xử lý đơn hàng']
        };
        await this.processBusinessEventTrigger(trigger, eventData);
      }
    } catch (error) {
      console.error('Error checking pending orders:', error);
    }
  }

  // Check for birthday campaign opportunities
  private async checkBirthdayCampaignOpportunities() {
    try {
      const today = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(today.getDate() + 7);

      // Count users with birthdays in next 7 days (simplified - assumes birthday field exists)
      // In production, you'd have a proper birthday field in User model
      const upcomingBirthdays = await prisma.user.count({
        where: {
          // This is a placeholder - implement proper birthday logic
          role: 'USER',
          // Placeholder logic - in production implement proper birthday field
          id: { not: undefined }
        }
      });

      // Simplified logic - in production, implement proper birthday tracking
      const estimatedBirthdays = Math.floor(upcomingBirthdays * 0.02); // Rough estimate

      if (estimatedBirthdays >= 5) {
        const eventData = {
          upcomingBirthdays: estimatedBirthdays,
          period: '7 days',
          campaignType: 'birthday'
        };

        // Create a custom trigger for customer engagement
        const trigger = {
          name: 'customer_engagement',
          eventType: 'CUSTOMER_ENGAGEMENT' as const,
          priority: 'INFO' as const,
          businessImpact: 'MEDIUM' as const,
          message: () => `Cơ hội engagement: ${eventData.upcomingBirthdays} khách hàng có sinh nhật`,
          suggestedActions: ['Gửi email chúc mừng', 'Tạo voucher sinh nhật', 'Campaign marketing cá nhân hóa']
        };
        await this.processBusinessEventTrigger(trigger, eventData);
      }
    } catch (error) {
      console.error('Error checking birthday opportunities:', error);
    }
  }

  // 🤖 AI RECOMMENDATION SERVICE INTEGRATION
  private async runAIRecommendations() {
    try {
      // Get AI recommendation interval from settings (dynamic)
      const settings = await prisma.adminSettings.findFirst();
      const recommendationIntervalMinutes = settings?.aiRecommendationInterval || 2;
      const runInterval = recommendationIntervalMinutes * 60 * 1000; // Convert to milliseconds

      // DEBUG: Log current settings
      console.log(
        `🔍 DEBUG: AI Recommendation Interval = ${recommendationIntervalMinutes} minutes (from DB: ${settings?.aiRecommendationInterval})`
      );
      console.log(`🔍 DEBUG: Run interval = ${runInterval}ms`);
      console.log(`🔍 DEBUG: Settings object keys:`, settings ? Object.keys(settings) : 'null');

      // Check if we should run AI recommendations
      const now = Date.now();
      const lastRunKey = 'ai_recommendations_last_run';

      // Get last run time from memory or use 0
      const lastRunTime = await this.getLastRunTime(lastRunKey);
      const timeSinceLastRun = now - lastRunTime;

      if (timeSinceLastRun < runInterval) {
        // Skip this run - too soon
        console.log(
          `🤖 AI Recommendations: Skipping - last run ${Math.floor(
            timeSinceLastRun / 1000 / 60
          )} minutes ago (need ${recommendationIntervalMinutes} minutes)`
        );
        return;
      }

      console.log('🤖 AI Assistant: Running AI Recommendations...');

      // Run AI recommendations
      const result = await AIRecommendationService.runAIRecommendations();

      console.log(
        `🤖 AI Recommendations: Analyzed ${result.analyzed} products, generated ${result.recommendations} recommendations, sent ${result.notifications} notifications`
      );

      // Update last run time
      await this.setLastRunTime(lastRunKey, now);
    } catch (error) {
      console.error('🤖 AI Recommendations failed:', error);
    }
  }

  // Helper methods for tracking last run times
  private async getLastRunTime(key: string): Promise<number> {
    try {
      // Store in AIMemory for persistence
      const memory = await prisma.aIMemory.findFirst({
        where: { alertId: `system_${key}` }
      });

      if (memory?.contextData) {
        const data = JSON.parse(memory.contextData);
        return data.lastRunTime || 0;
      }

      return 0;
    } catch (error) {
      console.error(`Error getting last run time for ${key}:`, error);
      return 0;
    }
  }

  private async setLastRunTime(key: string, timestamp: number): Promise<void> {
    try {
      const alertId = `system_${key}`;

      // Upsert AIMemory record
      await prisma.aIMemory.upsert({
        where: { alertId },
        create: {
          alertId,
          eventType: 'SYSTEM_TRACKING',
          contextData: JSON.stringify({ lastRunTime: timestamp }),
          status: 'ACTIVE',
          escalationLevel: 'INFO'
        },
        update: {
          contextData: JSON.stringify({ lastRunTime: timestamp }),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error(`Error setting last run time for ${key}:`, error);
    }
  }
}

// Export singleton instance
export const eventMonitor = EventMonitor.getInstance();

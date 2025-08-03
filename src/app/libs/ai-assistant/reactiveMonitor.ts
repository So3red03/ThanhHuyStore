import prisma from '@/app/libs/prismadb';
import { NotificationService } from '@/app/libs/notifications/notificationService';

/**
 * ReactiveMonitor - Emergency Alerts Only
 * Monitors critical business events that need immediate attention
 * Interval: 30 seconds for emergencies
 */
export class ReactiveMonitor {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private readonly interval = 30 * 1000; // 30 seconds for emergencies

  async startEmergencyMonitoring() {
    if (this.isMonitoring) {
      console.log('🚨 ReactiveMonitor: Already monitoring - ignoring duplicate start');
      return;
    }

    console.log('🚨 ReactiveMonitor: Starting emergency monitoring...');
    console.log(`⏰ ReactiveMonitor: Checking every ${this.interval / 1000} seconds`);

    this.isMonitoring = true;

    // Start monitoring with fixed interval
    this.monitoringInterval = setInterval(async () => {
      try {
        const isEnabled = await this.isReactiveMonitoringEnabled();
        if (isEnabled) {
          await this.checkEmergencies();
        } else {
          console.log('🚨 ReactiveMonitor: Disabled - stopping monitoring');
          this.stopMonitoring();
        }
      } catch (error) {
        console.error('🚨 ReactiveMonitor: Error during monitoring:', error);
      }
    }, this.interval);

    // Initial check
    await this.checkEmergencies();
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('🚨 ReactiveMonitor: Stopped monitoring');
  }

  private async isReactiveMonitoringEnabled(): Promise<boolean> {
    try {
      const settings = await prisma.adminSettings.findFirst();
      return settings?.aiAssistantEnabled ?? true;
    } catch (error) {
      console.error('Error checking reactive monitoring settings:', error);
      return false;
    }
  }

  private async checkEmergencies() {
    try {
      console.log('🔍 ReactiveMonitor: Checking emergencies...');

      await Promise.all([
        this.checkFailedPayments(), // REAL-TIME: Payment failures need immediate attention
        this.checkNewOrders(), // REAL-TIME: New orders need immediate notification
        this.checkNewComments(), // REAL-TIME: New comments need immediate response
        this.checkSystemErrors() // REAL-TIME: System errors need immediate attention
      ]);

      console.log('✅ ReactiveMonitor: Emergency check completed');
    } catch (error) {
      console.error('🚨 ReactiveMonitor: Error in emergency check:', error);
    }
  }

  // MOVED TO ProactiveAnalyzer: Critical inventory needs strategic planning, not immediate alerts

  // 🚨 EMERGENCY 2: Failed Payments (>= 10% failure rate)
  private async checkFailedPayments() {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      const [totalOrders, failedOrders] = await Promise.all([
        prisma.order.count({
          where: {
            createdAt: { gte: thirtyMinutesAgo }
          }
        }),
        prisma.order.count({
          where: {
            createdAt: { gte: thirtyMinutesAgo },
            status: 'canceled'
          }
        })
      ]);

      if (totalOrders > 0) {
        const failureRate = (failedOrders / totalOrders) * 100;

        if (failureRate >= 10) {
          const memoryKey = 'emergency_payment_failure';
          // REAL-TIME: No cooldown for payment failures - each spike needs immediate attention
          const shouldAlert = await this.shouldSendEmergencyAlert(memoryKey, '0s');

          if (shouldAlert) {
            await this.sendEmergencyAlert({
              type: 'PAYMENT_FAILURE_SPIKE',
              title: '🚨 KHẨN CẤP: Tỷ lệ thanh toán thất bại cao!',
              message: `${Math.round(
                failureRate
              )}% đơn hàng thất bại trong 30 phút qua (${failedOrders}/${totalOrders}). Kiểm tra hệ thống thanh toán!`,
              contextData: {
                failureRate: Math.round(failureRate),
                failedCount: failedOrders,
                totalCount: totalOrders,
                timeWindow: 30
              }
            });

            await this.markEmergencyAlertSent(memoryKey, {
              failureRate: Math.round(failureRate),
              failedCount: failedOrders,
              totalCount: totalOrders
            });
            console.log(`🚨 Sent payment failure alert: ${failureRate}% failure rate`);
          }
        }
      }
    } catch (error) {
      console.error('Error checking failed payments:', error);
    }
  }

  // MOVED TO ProactiveAnalyzer: Urgent orders need strategic follow-up, not immediate alerts

  // 🚨 EMERGENCY 4: New Orders (immediate notification)
  private async checkNewOrders() {
    try {
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);

      const newOrders = await prisma.order.findMany({
        where: {
          createdAt: { gte: thirtySecondsAgo },
          status: { in: ['pending'] }
        },
        include: {
          user: {
            select: { name: true, email: true }
          }
        },
        take: 10 // Limit for performance
      });

      console.log(`🛒 ReactiveMonitor: Found ${newOrders.length} new orders`);

      for (const order of newOrders) {
        const memoryKey = `new_order_${order.id}`;
        // REAL-TIME: No cooldown for new orders - each order needs immediate notification
        const shouldAlert = await this.shouldSendEmergencyAlert(memoryKey, '0s');

        if (shouldAlert) {
          await this.sendEmergencyAlert({
            type: 'NEW_ORDER_RECEIVED',
            orderId: order.id,
            title: '🛒 Đơn hàng mới!',
            message: `Đơn hàng mới #${order.id.slice(-6)} từ ${order.user?.name || 'Khách hàng'} - Giá trị: ${(
              order.amount / 1000000
            ).toFixed(1)}M VND. Cần xử lý ngay!`,
            contextData: {
              orderId: order.id,
              customerName: order.user?.name,
              customerEmail: order.user?.email,
              orderValue: order.amount,
              orderStatus: order.status
            }
          });

          await this.markEmergencyAlertSent(memoryKey, {
            orderId: order.id,
            customerName: order.user?.name,
            orderValue: order.amount,
            orderStatus: order.status
          });
          console.log(
            `🛒 Sent new order alert: Order ${order.id.slice(-6)} - ${(order.amount / 1000000).toFixed(1)}M VND`
          );
        }
      }
    } catch (error) {
      console.error('Error checking new orders:', error);
    }
  }

  // 🚨 EMERGENCY 5: New Comments (immediate notification)
  private async checkNewComments() {
    try {
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);

      // Check product reviews (comments on products)
      const newProductReviews = await prisma.review.findMany({
        where: {
          createdDate: { gte: thirtySecondsAgo }
        },
        include: {
          user: {
            select: { name: true, email: true }
          },
          product: {
            select: { name: true }
          }
        },
        take: 10 // Limit for performance
      });

      // Check article reviews (comments on articles)
      const newArticleReviews = await prisma.articleReview.findMany({
        where: {
          createdDate: { gte: thirtySecondsAgo }
        },
        include: {
          user: {
            select: { name: true, email: true }
          },
          article: {
            select: { title: true }
          }
        },
        take: 10 // Limit for performance
      });

      console.log(
        `💬 ReactiveMonitor: Found ${newProductReviews.length} product reviews, ${newArticleReviews.length} article reviews`
      );

      // Handle product reviews
      for (const review of newProductReviews) {
        const memoryKey = `new_product_review_${review.id}`;
        // REAL-TIME: No cooldown for new comments - each comment needs immediate response
        const shouldAlert = await this.shouldSendEmergencyAlert(memoryKey, '0s');

        if (shouldAlert) {
          await this.sendEmergencyAlert({
            type: 'NEW_PRODUCT_REVIEW',
            productId: review.productId,
            title: '💬 Đánh giá sản phẩm mới!',
            message: `${review.user?.name || 'Khách hàng'} vừa đánh giá sản phẩm "${review.product?.name}" - ${
              review.rating
            }⭐: "${review.comment.slice(0, 100)}${review.comment.length > 100 ? '...' : ''}"`,
            contextData: {
              reviewId: review.id,
              productId: review.productId,
              productName: review.product?.name,
              customerName: review.user?.name,
              rating: review.rating,
              comment: review.comment
            }
          });

          await this.markEmergencyAlertSent(memoryKey, {
            reviewId: review.id,
            productId: review.productId,
            productName: review.product?.name,
            rating: review.rating
          });
          console.log(`💬 Sent product review alert: ${review.product?.name} - ${review.rating}⭐`);
        }
      }

      // Handle article reviews
      for (const review of newArticleReviews) {
        const memoryKey = `new_article_review_${review.id}`;
        // REAL-TIME: No cooldown for new comments - each comment needs immediate response
        const shouldAlert = await this.shouldSendEmergencyAlert(memoryKey, '0s');

        if (shouldAlert) {
          await this.sendEmergencyAlert({
            type: 'NEW_ARTICLE_REVIEW',
            title: '💬 Bình luận bài viết mới!',
            message: `${review.user?.name || 'Khách hàng'} vừa bình luận bài viết "${review.article?.title}": "${(
              review.comment || ''
            ).slice(0, 100)}${(review.comment || '').length > 100 ? '...' : ''}"`,
            contextData: {
              reviewId: review.id,
              articleId: review.articleId,
              articleTitle: review.article?.title,
              customerName: review.user?.name,
              rating: review.rating,
              comment: review.comment
            }
          });

          await this.markEmergencyAlertSent(memoryKey, {
            reviewId: review.id,
            articleId: review.articleId,
            articleTitle: review.article?.title,
            rating: review.rating
          });
          console.log(`💬 Sent article review alert: ${review.article?.title}`);
        }
      }
    } catch (error) {
      console.error('Error checking new comments:', error);
    }
  }

  // 🚨 EMERGENCY 6: System Errors (placeholder for now)
  private async checkSystemErrors() {
    // TODO: Implement system error monitoring
    // This could check for:
    // - Database connection issues
    // - API response time spikes
    // - Error rate increases
    // - Memory/CPU usage spikes
    console.log('🔧 ReactiveMonitor: System error monitoring - TODO');
  }

  // Helper: Check if we should send emergency alert (anti-spam)
  private async shouldSendEmergencyAlert(memoryKey: string, cooldown: string): Promise<boolean> {
    try {
      const cooldownMs = this.parseCooldown(cooldown);
      const lastAlert = await prisma.aIMemory.findFirst({
        where: {
          alertId: memoryKey,
          status: 'ACTIVE'
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!lastAlert) return true;

      // Check if admin resolved/dismissed this alert
      if (lastAlert.status === 'RESOLVED' || lastAlert.status === 'DISMISSED') {
        console.log(`🚫 Alert ${memoryKey} was ${lastAlert.status} by admin - not resending`);
        return false;
      }

      const timeSince = Date.now() - lastAlert.createdAt.getTime();
      const shouldSend = timeSince >= cooldownMs;

      if (!shouldSend) {
        console.log(`⏳ Alert ${memoryKey} still in cooldown (${Math.round(timeSince / 1000 / 60)}min ago)`);
      }

      return shouldSend;
    } catch (error) {
      console.error('Error checking emergency alert cooldown:', error);
      return false;
    }
  }

  // Helper: Parse cooldown string to milliseconds
  private parseCooldown(cooldown: string): number {
    const match = cooldown.match(/^(\d+)([smhd])$/);
    if (!match) return 60 * 60 * 1000; // Default 1 hour

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
        return 60 * 60 * 1000;
    }
  }

  // Helper: Mark emergency alert as sent
  private async markEmergencyAlertSent(memoryKey: string, contextData?: any) {
    try {
      // Enhanced memory creation with better tracking - use upsert to prevent duplicates
      await prisma.aIMemory.upsert({
        where: { alertId: memoryKey },
        update: {
          status: 'ACTIVE',
          reminderCount: { increment: 1 },
          contextData: JSON.stringify({
            sentAt: new Date().toISOString(),
            type: 'emergency',
            businessImpact: 'HIGH',
            ...contextData
          })
        },
        create: {
          alertId: memoryKey,
          eventType: 'EMERGENCY_ALERT',
          status: 'ACTIVE',
          reminderCount: 1,
          productId: contextData?.productId,
          productName: contextData?.productName,
          contextData: JSON.stringify({
            sentAt: new Date().toISOString(),
            type: 'emergency',
            businessImpact: 'HIGH',
            ...contextData
          })
        }
      });

      console.log(`💾 Saved emergency alert memory: ${memoryKey}`);
    } catch (error) {
      console.error('Error marking emergency alert as sent:', error);
    }
  }

  // Send emergency alert notification
  private async sendEmergencyAlert(alertData: {
    type: string;
    title: string;
    message: string;
    productId?: string;
    productName?: string;
    orderId?: string;
    contextData?: any;
  }) {
    try {
      // Get all admin users
      const adminUsers = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'STAFF'] }
        }
      });

      // Send notification to each admin
      for (const admin of adminUsers) {
        await NotificationService.createNotification({
          userId: admin.id,
          type: 'AI_ASSISTANT',
          title: alertData.title,
          message: alertData.message,
          productId: alertData.productId,
          orderId: alertData.orderId,
          data: {
            aiAssistant: true,
            eventType: alertData.type,
            isEmergency: true,
            ...alertData.contextData
          }
        });
      }

      console.log(`📤 ReactiveMonitor: Sent emergency alert to ${adminUsers.length} admins`);
    } catch (error) {
      console.error('Error sending emergency alert:', error);
    }
  }
}

// Export singleton instance
export const reactiveMonitor = new ReactiveMonitor();

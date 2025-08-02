// AI Memory Service - Persistent Intelligence & Escalation Logic
import prisma from '@/app/libs/prismadb';
import { AIMemory, AdminAction, AlertPriority, BusinessImpact, EscalationRule } from './types';

export class AIMemoryService {
  // Escalation Rules - Smart progression based on business context
  private static escalationRules: EscalationRule[] = [
    {
      eventType: 'INVENTORY_LOW',
      initialLevel: 'WARNING',
      escalationSteps: [
        { timeThreshold: 60, newLevel: 'URGENT' }, // 1 hour
        { timeThreshold: 240, newLevel: 'CRITICAL' } // 4 hours
      ]
    },
    {
      eventType: 'INVENTORY_CRITICAL',
      initialLevel: 'URGENT',
      escalationSteps: [
        { timeThreshold: 30, newLevel: 'CRITICAL' } // 30 minutes
      ]
    },
    {
      eventType: 'SALES_DROP',
      initialLevel: 'WARNING',
      escalationSteps: [
        { timeThreshold: 120, newLevel: 'URGENT' }, // 2 hours
        { timeThreshold: 360, newLevel: 'CRITICAL' } // 6 hours
      ]
    },
    {
      eventType: 'PAYMENT_FAILURES',
      initialLevel: 'URGENT',
      escalationSteps: [
        { timeThreshold: 15, newLevel: 'CRITICAL' } // 15 minutes
      ]
    }
  ];

  // Create or update AI memory for an alert
  static async createOrUpdateMemory(alertData: {
    eventType: string;
    productId?: string;
    productName?: string;
    contextData: any;
    businessImpact: BusinessImpact;
  }): Promise<AIMemory> {
    const alertId = this.generateAlertId(alertData.eventType, alertData.productId);

    try {
      // Check if memory already exists
      const existingMemory = await prisma.aIMemory.findUnique({
        where: { alertId }
      });

      // Skip if already resolved or dismissed
      if (existingMemory && (existingMemory.status === 'RESOLVED' || existingMemory.status === 'DISMISSED')) {
        console.log(`🚫 [MEMORY] Skipping ${alertId} - Status: ${existingMemory.status}`);
        return this.parseMemoryFromDB(existingMemory);
      }

      if (existingMemory) {
        // Update existing memory - DON'T auto-increment reminderCount here
        // reminderCount should only be incremented when actually sending notification
        const updated = await prisma.aIMemory.update({
          where: { alertId },
          data: {
            contextData: JSON.stringify(alertData.contextData),
            businessImpact: alertData.businessImpact
            // Keep existing reminderCount and lastReminded
          }
        });

        return this.parseMemoryFromDB(updated);
      } else {
        // Create new memory - Start with reminderCount = 0
        const created = await prisma.aIMemory.create({
          data: {
            alertId,
            eventType: alertData.eventType,
            productId: alertData.productId,
            productName: alertData.productName,
            firstDetected: new Date(),
            lastReminded: new Date(0), // Set to epoch so first check will pass time interval
            reminderCount: 0, // Start at 0, will be incremented when actually sending
            escalationLevel: 'INFO',
            businessImpact: alertData.businessImpact,
            status: 'ACTIVE',
            contextData: JSON.stringify(alertData.contextData),
            adminActions: JSON.stringify([])
          }
        });

        return this.parseMemoryFromDB(created);
      }
    } catch (error) {
      console.error('Error creating/updating AI memory:', error);
      throw error;
    }
  }

  // Get memory for specific alert
  static async getMemory(alertId: string): Promise<AIMemory | null> {
    try {
      const memory = await prisma.aIMemory.findUnique({
        where: { alertId }
      });

      return memory ? this.parseMemoryFromDB(memory) : null;
    } catch (error) {
      console.error('Error getting AI memory:', error);
      return null;
    }
  }

  // Get all active memories
  static async getActiveMemories(): Promise<AIMemory[]> {
    try {
      const memories = await prisma.aIMemory.findMany({
        where: {
          status: 'ACTIVE'
        },
        orderBy: {
          lastReminded: 'desc'
        }
      });

      return memories.map(this.parseMemoryFromDB);
    } catch (error) {
      console.error('Error getting active memories:', error);
      return [];
    }
  }

  // Record admin action
  static async recordAdminAction(alertId: string, action: AdminAction): Promise<void> {
    try {
      const memory = await prisma.aIMemory.findUnique({
        where: { alertId }
      });

      if (memory) {
        const existingActions = JSON.parse(memory.adminActions || '[]');
        const updatedActions = [...existingActions, action];

        await prisma.aIMemory.update({
          where: { alertId },
          data: {
            adminActions: JSON.stringify(updatedActions),
            status: action.type === 'RESOLVED' ? 'RESOLVED' : action.type === 'DISMISSED' ? 'DISMISSED' : 'ACTIVE'
          }
        });
      }
    } catch (error) {
      console.error('Error recording admin action:', error);
    }
  }

  // Check and apply escalation rules
  static async checkEscalation(memory: AIMemory): Promise<AlertPriority> {
    const rule = this.escalationRules.find(r => r.eventType === memory.eventType);
    if (!rule) return memory.escalationLevel;

    const minutesSinceFirst = Math.floor((new Date().getTime() - memory.firstDetected.getTime()) / (1000 * 60));

    let newLevel = rule.initialLevel;

    for (const step of rule.escalationSteps) {
      if (minutesSinceFirst >= step.timeThreshold) {
        if (!step.condition || step.condition(memory)) {
          newLevel = step.newLevel;
        }
      }
    }

    // Update escalation level if changed
    if (newLevel !== memory.escalationLevel) {
      await prisma.aIMemory.update({
        where: { alertId: memory.alertId },
        data: { escalationLevel: newLevel }
      });
    }

    return newLevel;
  }

  // Get AI settings from database
  static async getAISettings() {
    try {
      const settings = await prisma.adminSettings.findFirst();
      if (!settings) {
        // Return default values if no settings found
        return {
          aiInfoMaxReminders: 1,
          aiInfoInterval: 60, // 1 hour - không quan trọng vì chỉ nhắc 1 lần
          aiWarningMaxReminders: 1, // Chỉ nhắc 1 lần
          aiWarningInterval: 60,
          aiUrgentMaxReminders: 1, // Chỉ nhắc 1 lần
          aiUrgentInterval: 60,
          aiCriticalMaxReminders: 1, // Chỉ nhắc 1 lần
          aiCriticalInterval: 60,
          aiBackoffMultiplier: 1.0, // Không cần backoff
          aiDismissThreshold: 1, // Dismiss sau 1 lần
          aiDebugMode: true
        };
      }
      return {
        aiInfoMaxReminders: settings.aiInfoMaxReminders,
        aiInfoInterval: settings.aiInfoInterval,
        aiWarningMaxReminders: settings.aiWarningMaxReminders,
        aiWarningInterval: settings.aiWarningInterval,
        aiUrgentMaxReminders: settings.aiUrgentMaxReminders,
        aiUrgentInterval: settings.aiUrgentInterval,
        aiCriticalMaxReminders: settings.aiCriticalMaxReminders,
        aiCriticalInterval: settings.aiCriticalInterval,
        aiBackoffMultiplier: settings.aiBackoffMultiplier,
        aiDismissThreshold: settings.aiDismissThreshold,
        aiDebugMode: settings.aiDebugMode
      };
    } catch (error) {
      console.error('Error getting AI settings:', error);
      // Return defaults on error
      return {
        aiInfoMaxReminders: 1,
        aiInfoInterval: 60,
        aiWarningMaxReminders: 1, // Chỉ nhắc 1 lần
        aiWarningInterval: 60,
        aiUrgentMaxReminders: 1, // Chỉ nhắc 1 lần
        aiUrgentInterval: 60,
        aiCriticalMaxReminders: 1, // Chỉ nhắc 1 lần
        aiCriticalInterval: 60,
        aiBackoffMultiplier: 1.0,
        aiDismissThreshold: 1,
        aiDebugMode: true
      };
    }
  }

  // Simplified logic - Chỉ nhắc 1 lần duy nhất cho mỗi event
  static async shouldSendNotification(memory: AIMemory): Promise<boolean> {
    const aiSettings = await this.getAISettings();

    // Nếu đã nhắc rồi thì không nhắc nữa
    if (memory.reminderCount > 0) {
      if (aiSettings.aiDebugMode) {
        console.log(`🚫 Already reminded for ${memory.alertId} (count: ${memory.reminderCount}) - SKIP`);
      }
      return false;
    }

    // Chỉ nhắc lần đầu tiên
    if (aiSettings.aiDebugMode) {
      console.log(`✅ First reminder for ${memory.alertId} - SEND`);
    }

    return true;
  }

  // Check if admin has been responsive to avoid spam (now uses dynamic settings)
  static async isAdminResponsive(memory: AIMemory): Promise<boolean> {
    const recentActions = memory.adminActions.filter(action => {
      const actionTime = new Date(action.timestamp).getTime();
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return actionTime >= oneDayAgo;
    });

    // If admin has taken action in last 24h, they're responsive
    if (recentActions.length > 0) {
      const hasPositiveAction = recentActions.some(action =>
        ['CLICKED', 'RESOLVED', 'ACKNOWLEDGED'].includes(action.type)
      );

      if (hasPositiveAction) {
        console.log(`✅ Admin responsive for ${memory.alertId} - stopping reminders`);
        return true;
      }
    }

    // Get dynamic dismiss threshold from settings
    const aiSettings = await this.getAISettings();
    const dismissCount = memory.adminActions.filter(a => a.type === 'DISMISSED').length;

    if (dismissCount >= aiSettings.aiDismissThreshold) {
      console.log(
        `🙄 Admin dismissing ${memory.alertId} repeatedly (${dismissCount}/${aiSettings.aiDismissThreshold}) - stopping reminders`
      );
      return false;
    }

    return false;
  }

  // Increment reminder count when sending notification
  static async incrementReminderCount(alertId: string): Promise<AIMemory> {
    try {
      const updated = await prisma.aIMemory.update({
        where: { alertId },
        data: {
          reminderCount: { increment: 1 },
          lastReminded: new Date()
        }
      });
      return this.parseMemoryFromDB(updated);
    } catch (error) {
      console.error('Error incrementing reminder count:', error);
      throw error;
    }
  }

  // Reset reminder count when admin takes positive action
  static async resetReminderCount(alertId: string): Promise<void> {
    try {
      await prisma.aIMemory.update({
        where: { alertId },
        data: {
          reminderCount: 0,
          lastReminded: new Date()
        }
      });
      console.log(`🔄 Reset reminder count for ${alertId} due to admin action`);
    } catch (error) {
      console.error('Error resetting reminder count:', error);
    }
  }

  // Generate AI personality response based on escalation level and context
  static generatePersonalityResponse(
    memory: AIMemory,
    escalationLevel: AlertPriority
  ): {
    title: string;
    message: string;
    emoji: string;
    tone: string;
  } {
    const productName = memory.productName || 'sản phẩm';

    const responses = {
      INFO: {
        title: `💡 ${productName}`,
        message: this.getPoliteMessage(memory),
        emoji: '💡',
        tone: 'POLITE'
      },
      WARNING: {
        title: `⚠️ ${productName}`,
        message: this.getConcernedMessage(memory),
        emoji: '⚠️',
        tone: 'CONCERNED'
      },
      URGENT: {
        title: `🚨 ${productName}`,
        message: this.getUrgentMessage(memory),
        emoji: '🚨',
        tone: 'URGENT'
      },
      CRITICAL: {
        title: `💀 ${productName}`,
        message: this.getCriticalMessage(memory),
        emoji: '💀',
        tone: 'CRITICAL'
      }
    };

    return responses[escalationLevel] || responses.INFO;
  }

  // Helper methods for personality messages - ACTIONABLE & SPECIFIC
  private static getPoliteMessage(memory: AIMemory): string {
    const contextData = typeof memory.contextData === 'string' ? JSON.parse(memory.contextData) : memory.contextData;

    switch (memory.eventType) {
      case 'INVENTORY_LOW':
        const currentStock = contextData?.currentStock || contextData?.quantity || 'không rõ';
        const threshold = contextData?.threshold || 5;
        return `SẮP HẾT HÀNG: còn ${currentStock}/${threshold} cái. Cần nhập hàng ngay!`;
      case 'INVENTORY_CRITICAL':
        const criticalStock = contextData?.currentStock || contextData?.quantity || 'không rõ';
        return `SẮP HẾT HÀNG: chỉ còn ${criticalStock} cái! Nguy cơ hết hàng cao!`;
      case 'INVENTORY_OUT':
        return `HẾT HÀNG: đã hết! Đang từ chối đơn hàng!`;
      case 'SALES_DROP':
        const dropPercent = contextData?.dropPercentage || 'không rõ';
        return `DOANH SỐ GIẢM: giảm ${dropPercent}% so với tuần trước. Cần review giá/marketing!`;
      case 'ORDER_MANAGEMENT':
        const pendingDays = contextData?.pendingDays || 'không rõ';
        const customerName = contextData?.customerName || 'Khách hàng';
        return `ĐƠN HÀNG PENDING: ${customerName} - ${pendingDays} ngày chưa xử lý!`;
      default:
        return `Cảnh báo: cần xem xét.`;
    }
  }

  private static getConcernedMessage(memory: AIMemory): string {
    const contextData = typeof memory.contextData === 'string' ? JSON.parse(memory.contextData) : memory.contextData;

    switch (memory.eventType) {
      case 'INVENTORY_LOW':
        const currentStock = contextData?.currentStock || contextData?.quantity || 0;
        const threshold = contextData?.threshold || 5;
        return `SẮP HẾT HÀNG: còn ${currentStock}/${threshold} cái. CẦN NHẬP HÀNG GẤP!`;
      case 'INVENTORY_CRITICAL':
        const criticalStock = contextData?.currentStock || contextData?.quantity || 0;
        return `NGUY CƠ HẾT HÀNG: chỉ còn ${criticalStock} cái!`;
      case 'INVENTORY_OUT':
        return `HẾT HÀNG: đã hết! Đang từ chối đơn hàng!`;
      case 'SALES_DROP':
        const dropPercent = contextData?.dropPercentage || 'không rõ';
        return `DOANH SỐ GIẢM: giảm ${dropPercent}%. Cần action ngay!`;
      case 'ORDER_MANAGEMENT':
        const pendingDays = contextData?.pendingDays || 'không rõ';
        const customerName = contextData?.customerName || 'Khách hàng';
        return `ĐƠN HÀNG PENDING: ${customerName} - ${pendingDays} ngày. Cần xử lý!`;
      default:
        return `Cảnh báo: cần xử lý`;
    }
  }

  private static getUrgentMessage(memory: AIMemory): string {
    const contextData = typeof memory.contextData === 'string' ? JSON.parse(memory.contextData) : memory.contextData;

    switch (memory.eventType) {
      case 'INVENTORY_LOW':
        const currentStock = contextData?.currentStock || contextData?.quantity || 0;
        const threshold = contextData?.threshold || 5;
        return `HẾT HÀNG: chỉ còn ${currentStock}/${threshold} cái! NGUY CƠ HẾT HÀNG!`;
      case 'INVENTORY_CRITICAL':
        const criticalStock = contextData?.currentStock || contextData?.quantity || 0;
        return `HẾT HÀNG: chỉ còn ${criticalStock} cái! SẮP HẾT!`;
      case 'INVENTORY_OUT':
        return `HẾT HÀNG: đã hết! ĐANG TỪ CHỐI ĐƠN HÀNG!`;
      case 'SALES_DROP':
        const dropPercent = contextData?.dropPercentage || 'không rõ';
        return `DOANH SỐ: giảm ${dropPercent}%! CẦN ACTION NGAY!`;
      case 'ORDER_MANAGEMENT':
        const pendingDays = contextData?.pendingDays || 'không rõ';
        const customerName = contextData?.customerName || 'Khách hàng';
        return `ĐƠN HÀNG: ${customerName} - ${pendingDays} ngày chưa xử lý!`;
      default:
        return `Cần xử lý ngay!`;
    }
  }

  private static getCriticalMessage(memory: AIMemory): string {
    const contextData = typeof memory.contextData === 'string' ? JSON.parse(memory.contextData) : memory.contextData;

    switch (memory.eventType) {
      case 'INVENTORY_LOW':
        const currentStock = contextData?.currentStock || contextData?.quantity || 0;
        const threshold = contextData?.threshold || 5;
        return `CRITICAL HẾT HÀNG: ${currentStock}/${threshold} cái! ĐANG TỪ CHỐI ĐƠN HÀNG!`;
      case 'INVENTORY_CRITICAL':
        const criticalStock = contextData?.currentStock || contextData?.quantity || 0;
        return `CRITICAL HẾT HÀNG: ${criticalStock} cái! NGUY CƠ CỰC CAO!`;
      case 'INVENTORY_OUT':
        return `CRITICAL HẾT HÀNG: 0 cái! ĐANG TỪ CHỐI TẤT CẢ ĐƠN HÀNG!`;
      case 'SALES_DROP':
        const dropPercent = contextData?.dropPercentage || 'không rõ';
        return `CRITICAL DOANH SỐ: sụp đổ ${dropPercent}%! THIỆT HẠI NẶNG!`;
      case 'ORDER_MANAGEMENT':
        const pendingDays = contextData?.pendingDays || 'không rõ';
        const customerName = contextData?.customerName || 'Khách hàng';
        return `CRITICAL ĐƠN HÀNG: ${customerName} - ${pendingDays} ngày! MẤT KHÁCH HÀNG!`;
      default:
        return `CRITICAL: KHẨN CẤP CỰC KỲ!`;
    }
  }

  // Utility methods
  private static generateAlertId(eventType: string, productId?: string): string {
    // Use consistent ID without timestamp to prevent duplicates
    return `${eventType}_${productId || 'SYSTEM'}`;
  }

  private static parseMemoryFromDB(dbMemory: any): AIMemory {
    return {
      alertId: dbMemory.alertId,
      eventType: dbMemory.eventType,
      productId: dbMemory.productId,
      productName: dbMemory.productName,
      firstDetected: dbMemory.firstDetected,
      lastReminded: dbMemory.lastReminded,
      reminderCount: dbMemory.reminderCount,
      escalationLevel: dbMemory.escalationLevel as AlertPriority,
      businessImpact: dbMemory.businessImpact as BusinessImpact,
      status: dbMemory.status,
      adminActions: JSON.parse(dbMemory.adminActions || '[]'),
      contextData: JSON.parse(dbMemory.contextData || '{}')
    };
  }
}

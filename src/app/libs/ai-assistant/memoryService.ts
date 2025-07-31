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
          aiInfoInterval: 240,
          aiWarningMaxReminders: 2,
          aiWarningInterval: 120,
          aiUrgentMaxReminders: 2,
          aiUrgentInterval: 60,
          aiCriticalMaxReminders: 3,
          aiCriticalInterval: 30,
          aiBackoffMultiplier: 2.0,
          aiDismissThreshold: 2,
          aiDebugMode: false
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
        aiInfoInterval: 240,
        aiWarningMaxReminders: 2,
        aiWarningInterval: 120,
        aiUrgentMaxReminders: 2,
        aiUrgentInterval: 60,
        aiCriticalMaxReminders: 3,
        aiCriticalInterval: 30,
        aiBackoffMultiplier: 2.0,
        aiDismissThreshold: 2,
        aiDebugMode: false
      };
    }
  }

  // Anti-spam logic - Check if should send notification (FIXED LOGIC)
  static async shouldSendNotification(memory: AIMemory): Promise<boolean> {
    const now = new Date();
    const timeSinceLastReminder = now.getTime() - memory.lastReminded.getTime();

    // Get dynamic settings from database
    const aiSettings = await this.getAISettings();

    // Smart throttling based on escalation level and reminder count - DYNAMIC
    const throttleRules = {
      INFO: {
        minInterval: aiSettings.aiInfoInterval * 60 * 1000, // Convert minutes to ms
        maxReminders: aiSettings.aiInfoMaxReminders,
        backoffMultiplier: aiSettings.aiBackoffMultiplier
      },
      WARNING: {
        minInterval: aiSettings.aiWarningInterval * 60 * 1000,
        maxReminders: aiSettings.aiWarningMaxReminders,
        backoffMultiplier: aiSettings.aiBackoffMultiplier
      },
      URGENT: {
        minInterval: aiSettings.aiUrgentInterval * 60 * 1000,
        maxReminders: aiSettings.aiUrgentMaxReminders,
        backoffMultiplier: aiSettings.aiBackoffMultiplier
      },
      CRITICAL: {
        minInterval: aiSettings.aiCriticalInterval * 60 * 1000,
        maxReminders: aiSettings.aiCriticalMaxReminders,
        backoffMultiplier: aiSettings.aiBackoffMultiplier
      }
    };

    const rule = throttleRules[memory.escalationLevel as keyof typeof throttleRules];
    if (!rule) return false;

    // CRITICAL FIX: Check max reminders BEFORE sending, not after
    // reminderCount starts at 0, so if we've already sent maxReminders, stop
    if (memory.reminderCount >= rule.maxReminders) {
      if (aiSettings.aiDebugMode) {
        console.log(
          `🚫 Max reminders reached for ${memory.alertId} (${memory.reminderCount}/${rule.maxReminders}) - STOPPING`
        );
      }
      return false;
    }

    // Calculate dynamic interval with exponential backoff
    // Use reminderCount because it represents how many we've already sent
    const dynamicInterval = rule.minInterval * Math.pow(rule.backoffMultiplier, memory.reminderCount);

    // Check if enough time has passed
    const shouldSend = timeSinceLastReminder >= dynamicInterval;

    // Debug logging
    if (aiSettings.aiDebugMode) {
      if (!shouldSend) {
        const remainingTime = Math.ceil((dynamicInterval - timeSinceLastReminder) / (1000 * 60));
        console.log(
          `⏳ Throttled ${memory.alertId}: ${remainingTime} minutes remaining (sent: ${memory.reminderCount}/${rule.maxReminders})`
        );
      } else {
        console.log(`✅ Ready to send reminder ${memory.reminderCount + 1}/${rule.maxReminders} for ${memory.alertId}`);
      }
    }

    return shouldSend;
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
    const reminderCount = memory.reminderCount;
    const productName = memory.productName || 'sản phẩm';

    const responses = {
      INFO: {
        title: `💡 Thông tin về ${productName}`,
        message: this.getPoliteMessage(memory),
        emoji: '💡',
        tone: 'POLITE'
      },
      WARNING: {
        title: `⚠️ Cần chú ý: ${productName}`,
        message: this.getConcernedMessage(memory, reminderCount),
        emoji: '⚠️',
        tone: 'CONCERNED'
      },
      URGENT: {
        title: `🚨 KHẨN CẤP: ${productName}`,
        message: this.getUrgentMessage(memory, reminderCount),
        emoji: '🚨',
        tone: 'URGENT'
      },
      CRITICAL: {
        title: `💀 CRITICAL: ${productName}`,
        message: this.getCriticalMessage(memory, reminderCount),
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
        const currentStock = contextData?.currentStock || 'không rõ';
        const threshold = contextData?.threshold || 5;
        return `📦 ${memory.productName} còn ${currentStock} cái (ngưỡng: ${threshold}). Cần nhập hàng sớm ạ.`;
      case 'SALES_DROP':
        const dropPercent = contextData?.dropPercentage || 'không rõ';
        return `📉 Doanh số ${memory.productName} giảm ${dropPercent}% so với tuần trước. Cần review giá/marketing ạ.`;
      default:
        return `ℹ️ Thông tin về ${memory.productName} cần anh xem ạ.`;
    }
  }

  private static getConcernedMessage(memory: AIMemory, reminderCount: number): string {
    const contextData = typeof memory.contextData === 'string' ? JSON.parse(memory.contextData) : memory.contextData;
    const timePhrase = reminderCount > 1 ? `(lần ${reminderCount})` : '';

    switch (memory.eventType) {
      case 'INVENTORY_LOW':
        const currentStock = contextData?.currentStock || 0;
        const threshold = contextData?.threshold || 5;
        return `⚠️ ${memory.productName} chỉ còn ${currentStock}/${threshold} cái ${timePhrase}. CẦN NHẬP HÀNG GẤP!`;
      case 'SALES_DROP':
        const dropPercent = contextData?.dropPercentage || 'không rõ';
        return `⚠️ Doanh số ${memory.productName} giảm ${dropPercent}% ${timePhrase}. Cần action ngay!`;
      default:
        return `⚠️ ${memory.productName} cần xử lý ${timePhrase}`;
    }
  }

  private static getUrgentMessage(memory: AIMemory, reminderCount: number): string {
    const contextData = typeof memory.contextData === 'string' ? JSON.parse(memory.contextData) : memory.contextData;

    switch (memory.eventType) {
      case 'INVENTORY_LOW':
        const currentStock = contextData?.currentStock || 0;
        const threshold = contextData?.threshold || 5;
        return `🚨 KHẨN CẤP! ${memory.productName} chỉ còn ${currentStock} cái! (lần ${reminderCount}) NGUY CƠ HẾT HÀNG!`;
      case 'SALES_DROP':
        const dropPercent = contextData?.dropPercentage || 'không rõ';
        return `🚨 KHẨN CẤP! Doanh số ${memory.productName} giảm ${dropPercent}%! (lần ${reminderCount}) CẦN ACTION NGAY!`;
      default:
        return `🚨 KHẨN CẤP! ${memory.productName} cần xử lý ngay! (lần ${reminderCount})`;
    }
  }

  private static getCriticalMessage(memory: AIMemory, reminderCount: number): string {
    const contextData = typeof memory.contextData === 'string' ? JSON.parse(memory.contextData) : memory.contextData;

    switch (memory.eventType) {
      case 'INVENTORY_LOW':
        const currentStock = contextData?.currentStock || 0;
        return `💀 HẾT HÀNG! ${memory.productName} = ${currentStock} cái! (lần ${reminderCount}) ĐANG TỪ CHỐI ĐƠN HÀNG!`;
      case 'SALES_DROP':
        const dropPercent = contextData?.dropPercentage || 'không rõ';
        return `💀 CRITICAL! Doanh số ${memory.productName} sụp đổ ${dropPercent}%! (lần ${reminderCount}) THIỆT HẠI NẶNG!`;
      default:
        return `💀 CRITICAL! ${memory.productName} - KHẨN CẤP CỰC KỲ! (lần ${reminderCount})`;
    }
  }

  // Utility methods
  private static generateAlertId(eventType: string, productId?: string): string {
    return `${eventType}_${productId || 'SYSTEM'}_${Date.now()}`;
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

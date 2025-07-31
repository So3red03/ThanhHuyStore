// AI Assistant Types - Event-driven Business Intelligence System

export type AlertPriority = 'INFO' | 'WARNING' | 'URGENT' | 'CRITICAL';
export type BusinessImpact = 'LOW' | 'MEDIUM' | 'HIGH' | 'SEVERE';
export type AlertStatus = 'ACTIVE' | 'RESOLVED' | 'DISMISSED' | 'EXPIRED';

export interface BusinessEvent {
  id: string;
  type: BusinessEventType;
  timestamp: Date;
  data: any;
  source: string;
  severity: AlertPriority;
}

export type BusinessEventType =
  | 'INVENTORY_LOW'
  | 'INVENTORY_CRITICAL'
  | 'INVENTORY_OUT'
  | 'SALES_SPIKE'
  | 'SALES_DROP'
  | 'PAYMENT_FAILURES'
  | 'REVIEW_NEGATIVE'
  | 'COMPETITOR_PRICE_CHANGE'
  | 'SYSTEM_ERROR'
  | 'CUSTOMER_COMPLAINT'
  | 'CART_ABANDONMENT_SPIKE'
  | 'HIGH_VALUE_CUSTOMER_LOST'
  | 'AVERAGE_ORDER_VALUE_DROP'
  | 'COMPETITOR_PRICE_ADVANTAGE'
  // 🎯 NEW BUSINESS INTELLIGENCE EVENTS
  | 'SEASONAL_MARKETING'
  | 'CONVERSION_OPTIMIZATION'
  | 'ORDER_MANAGEMENT'
  | 'RETURN_ANALYSIS'
  | 'CUSTOMER_ENGAGEMENT';

export interface AIMemory {
  alertId: string;
  eventType: BusinessEventType;
  productId?: string;
  productName?: string;
  firstDetected: Date;
  lastReminded: Date;
  reminderCount: number;
  escalationLevel: AlertPriority;
  businessImpact: BusinessImpact;
  status: AlertStatus;
  adminActions: AdminAction[];
  contextData: any;
  estimatedLoss?: number;
  competitorData?: any;
}

export interface AdminAction {
  type: 'VIEWED' | 'CLICKED' | 'DISMISSED' | 'RESOLVED' | 'ACKNOWLEDGED';
  timestamp: Date;
  userId: string;
  details?: any;
}

export interface AIPersonality {
  level: AlertPriority;
  tone: 'POLITE' | 'CONCERNED' | 'URGENT' | 'CRITICAL';
  message: string;
  emoji: string;
  actionRequired: boolean;
}

export interface BusinessContext {
  timeOfDay: 'PEAK' | 'NORMAL' | 'OFF';
  dayOfWeek: 'WEEKDAY' | 'WEEKEND';
  season: 'NORMAL' | 'HOLIDAY' | 'SALE_SEASON';
  competitorActivity: 'LOW' | 'MEDIUM' | 'HIGH';
  marketTrend: 'STABLE' | 'GROWING' | 'DECLINING';
}

export interface EscalationRule {
  eventType: BusinessEventType;
  initialLevel: AlertPriority;
  escalationSteps: {
    timeThreshold: number; // minutes
    newLevel: AlertPriority;
    condition?: (memory: AIMemory) => boolean;
  }[];
}

export interface AIAssistantConfig {
  enableRealTimeMonitoring: boolean;
  escalationRules: EscalationRule[];
  businessHours: {
    start: number;
    end: number;
  };
  maxReminders: number;
  personalityEnabled: boolean;
}

// Event Triggers Configuration
export interface EventTrigger {
  name: string;
  condition: (data: any) => boolean;
  eventType: BusinessEventType;
  priority: AlertPriority;
  businessImpact: BusinessImpact;
  message: (data: any) => string;
  suggestedActions: string[];
}

// Real-time Monitoring Thresholds
export interface MonitoringThresholds {
  inventory: {
    low: number;
    critical: number;
    outOfStock: number;
  };
  sales: {
    dropPercentage: number;
    spikePercentage: number;
    timeWindow: number; // minutes
  };
  payments: {
    failureRate: number;
    timeWindow: number;
  };
  reviews: {
    ratingThreshold: number;
    negativeCount: number;
  };
  customer: {
    highValueThreshold: number; // VND
    inactivityDays: number;
    cartAbandonmentRate: number; // percentage
  };
  order: {
    averageValueDropPercentage: number;
    timeWindow: number; // days
  };
  competitor: {
    priceAdvantagePercentage: number;
    monitoringProducts: string[];
  };
}

// AI Response Templates
export interface AIResponseTemplate {
  eventType: BusinessEventType;
  priority: AlertPriority;
  templates: {
    [key in AlertPriority]: {
      title: string;
      message: string;
      emoji: string;
      actions: string[];
    };
  };
}

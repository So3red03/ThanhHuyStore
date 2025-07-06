import prisma from '../libs/prismadb';

export enum AuditEventType {
  // Admin Actions
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  ADMIN_LOGOUT = 'ADMIN_LOGOUT',
  ADMIN_SETTINGS_UPDATED = 'ADMIN_SETTINGS_UPDATED',

  // Product Management
  PRODUCT_CREATED = 'PRODUCT_CREATED',
  PRODUCT_UPDATED = 'PRODUCT_UPDATED',
  PRODUCT_DELETED = 'PRODUCT_DELETED',

  // User Management
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',

  // Order Management
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',

  // Voucher Management
  VOUCHER_CREATED = 'VOUCHER_CREATED',
  VOUCHER_UPDATED = 'VOUCHER_UPDATED',
  VOUCHER_DELETED = 'VOUCHER_DELETED',
  VOUCHER_USED = 'VOUCHER_USED',

  // Article Management
  ARTICLE_CREATED = 'ARTICLE_CREATED',
  ARTICLE_UPDATED = 'ARTICLE_UPDATED',
  ARTICLE_DELETED = 'ARTICLE_DELETED',

  // Category Management
  CATEGORY_CREATED = 'CATEGORY_CREATED',
  CATEGORY_UPDATED = 'CATEGORY_UPDATED',
  CATEGORY_DELETED = 'CATEGORY_DELETED',

  // Product Variant Management
  PRODUCT_VARIANT_CREATED = 'PRODUCT_VARIANT_CREATED',
  PRODUCT_VARIANT_UPDATED = 'PRODUCT_VARIANT_UPDATED',
  PRODUCT_VARIANT_DELETED = 'PRODUCT_VARIANT_DELETED',

  // Promotion Management
  PROMOTION_CREATED = 'PROMOTION_CREATED',
  PROMOTION_UPDATED = 'PROMOTION_UPDATED',
  PROMOTION_DELETED = 'PROMOTION_DELETED',

  // Banner Management
  BANNER_CREATED = 'BANNER_CREATED',
  BANNER_UPDATED = 'BANNER_UPDATED',
  BANNER_DELETED = 'BANNER_DELETED',

  // Order Management (additional events)
  ORDER_COMPLETED = 'ORDER_COMPLETED',

  // Payment Processing
  PAYMENT_INTENT_CREATED = 'PAYMENT_INTENT_CREATED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',

  // Security Events
  FAILED_LOGIN_ATTEMPT = 'FAILED_LOGIN_ATTEMPT',
  USER_LOGIN_SUCCESS = 'USER_LOGIN_SUCCESS',
  SUSPICIOUS_ORDER = 'SUSPICIOUS_ORDER',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  PRICE_MANIPULATION_ATTEMPT = 'PRICE_MANIPULATION_ATTEMPT',

  // Inventory Management
  INVENTORY_UPDATED = 'INVENTORY_UPDATED',
  LOW_STOCK_ALERT = 'LOW_STOCK_ALERT',
  STOCK_DEPLETION = 'STOCK_DEPLETION',

  // Business Events
  SHIPPING_CREATED = 'SHIPPING_CREATED',

  // System Events
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  API_ERROR = 'API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR'
}

export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum AuditCategory {
  ADMIN = 'ADMIN',
  SECURITY = 'SECURITY',
  BUSINESS = 'BUSINESS',
  SYSTEM = 'SYSTEM'
}

export interface AuditLogData {
  eventType: AuditEventType;
  category?: AuditCategory;
  severity: AuditSeverity;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  description: string;
  details?: Record<string, any>;
  metadata?: Record<string, any>;
  resourceId?: string;
  resourceType?: string;
  oldValue?: any;
  newValue?: any;
}

export class AuditLogger {
  static async log(data: AuditLogData): Promise<void> {
    try {
      // Auto-determine category if not provided
      const category = data.category || this.determineCategory(data.eventType);

      await prisma.auditLog.create({
        data: {
          eventType: data.eventType,
          category,
          severity: data.severity,
          userId: data.userId,
          userEmail: data.userEmail,
          userRole: data.userRole,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          description: data.description,
          details: data.details || {},
          metadata: data.metadata || {},
          resourceId: data.resourceId,
          resourceType: data.resourceType,
          oldValue: data.oldValue,
          newValue: data.newValue,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Fallback to console logging for critical events
      if (data.severity === AuditSeverity.CRITICAL) {
        console.error('CRITICAL AUDIT EVENT:', data);
      }
    }
  }

  // Auto-determine category based on event type
  static determineCategory(eventType: AuditEventType): AuditCategory {
    if (
      eventType.includes('ADMIN') ||
      eventType.includes('USER') ||
      eventType.includes('PRODUCT') ||
      eventType.includes('VOUCHER') ||
      eventType.includes('ARTICLE') ||
      eventType.includes('CATEGORY') ||
      eventType.includes('VARIANT') ||
      eventType.includes('PROMOTION') ||
      eventType.includes('BANNER') ||
      eventType.includes('ORDER') ||
      eventType.includes('PAYMENT') ||
      eventType.includes('INVENTORY') ||
      eventType.includes('SETTINGS')
    ) {
      return AuditCategory.ADMIN;
    }

    if (
      eventType.includes('FAILED') ||
      eventType.includes('SUSPICIOUS') ||
      eventType.includes('RATE_LIMIT') ||
      eventType.includes('MANIPULATION')
    ) {
      return AuditCategory.SECURITY;
    }

    if (
      eventType.includes('ORDER') ||
      eventType.includes('PAYMENT') ||
      eventType.includes('INVENTORY') ||
      eventType.includes('SHIPPING')
    ) {
      return AuditCategory.BUSINESS;
    }

    return AuditCategory.SYSTEM;
  }

  // Helper methods for common audit events
  static async logAdminAction(
    eventType: AuditEventType,
    userId: string,
    userEmail: string,
    description: string,
    metadata?: Record<string, any>,
    ipAddress?: string
  ) {
    await this.log({
      eventType,
      severity: AuditSeverity.MEDIUM,
      userId,
      userEmail,
      userRole: 'ADMIN',
      ipAddress,
      description,
      metadata
    });
  }

  static async logSecurityEvent(
    eventType: AuditEventType,
    severity: AuditSeverity,
    description: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userId?: string
  ) {
    await this.log({
      eventType,
      severity,
      userId,
      ipAddress,
      description,
      metadata
    });
  }

  static async logBusinessEvent(
    eventType: AuditEventType,
    userId: string,
    description: string,
    resourceId?: string,
    resourceType?: string,
    metadata?: Record<string, any>
  ) {
    await this.log({
      eventType,
      severity: AuditSeverity.LOW,
      userId,
      description,
      resourceId,
      resourceType,
      metadata
    });
  }

  static async logOrderEvent(
    eventType: AuditEventType,
    orderId: string,
    userId: string,
    description: string,
    oldValue?: any,
    newValue?: any,
    metadata?: Record<string, any>
  ) {
    await this.log({
      eventType,
      severity: AuditSeverity.MEDIUM,
      userId,
      description,
      resourceId: orderId,
      resourceType: 'ORDER',
      oldValue,
      newValue,
      metadata
    });
  }

  // Get client IP helper
  static getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const remoteAddr = request.headers.get('remote-addr');

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    return realIP || remoteAddr || 'unknown';
  }

  // Get user agent helper
  static getUserAgent(request: Request): string {
    return request.headers.get('user-agent') || 'unknown';
  }
}

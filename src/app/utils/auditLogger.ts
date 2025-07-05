import prisma from '../libs/prismadb';

export enum AuditEventType {
  // Admin Actions
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  ADMIN_LOGOUT = 'ADMIN_LOGOUT',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  PRODUCT_CREATED = 'PRODUCT_CREATED',
  PRODUCT_UPDATED = 'PRODUCT_UPDATED',
  PRODUCT_DELETED = 'PRODUCT_DELETED',
  VOUCHER_CREATED = 'VOUCHER_CREATED',
  VOUCHER_UPDATED = 'VOUCHER_UPDATED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  
  // Security Events
  FAILED_LOGIN_ATTEMPT = 'FAILED_LOGIN_ATTEMPT',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  SUSPICIOUS_ORDER = 'SUSPICIOUS_ORDER',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  PRICE_MANIPULATION_ATTEMPT = 'PRICE_MANIPULATION_ATTEMPT',
  
  // Business Events
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  INVENTORY_UPDATED = 'INVENTORY_UPDATED',
  VOUCHER_USED = 'VOUCHER_USED',
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

export interface AuditLogData {
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  description: string;
  metadata?: Record<string, any>;
  resourceId?: string;
  resourceType?: string;
  oldValue?: any;
  newValue?: any;
}

export class AuditLogger {
  static async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          eventType: data.eventType,
          severity: data.severity,
          userId: data.userId,
          userEmail: data.userEmail,
          userRole: data.userRole,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          description: data.description,
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

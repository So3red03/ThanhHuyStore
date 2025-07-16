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

  // User Activity Events (migrated from Activity model)
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PRODUCT_REVIEWED = 'PRODUCT_REVIEWED', // Combined comment + rating

  // Phase 3: Complex Events
  USER_REGISTRATION = 'USER_REGISTRATION',
  USER_LOGIN = 'USER_LOGIN',
  CART_UPDATED = 'CART_UPDATED',
  WISHLIST_UPDATED = 'WISHLIST_UPDATED',
  NEWSLETTER_SUBSCRIBED = 'NEWSLETTER_SUBSCRIBED',
  SEARCH_PERFORMED = 'SEARCH_PERFORMED',

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

  // Get client IP helper - optimized for production deployment
  static getClientIP(request: Request): string {
    // Priority order for production environments (Cloudflare, Nginx, Apache, Load Balancers)
    const ipHeaders = [
      'cf-connecting-ip', // Cloudflare (highest priority for production)
      'x-forwarded-for', // Standard proxy header
      'x-real-ip', // Nginx proxy
      'x-client-ip', // Apache proxy
      'x-cluster-client-ip', // Load balancer
      'forwarded', // RFC 7239 standard
      'remote-addr' // Direct connection fallback
    ];

    // Get all possible IPs
    const possibleIPs: string[] = [];

    for (const header of ipHeaders) {
      const value = request.headers.get(header);
      if (value) {
        // Handle comma-separated IPs (x-forwarded-for chain: client, proxy1, proxy2...)
        const ips = value
          .split(',')
          .map(ip => ip.trim())
          .filter(ip => ip);
        possibleIPs.push(...ips);
      }
    }

    // In production, prioritize public IPs over private ones
    if (process.env.NODE_ENV === 'production') {
      for (const ip of possibleIPs) {
        if (this.isValidPublicIP(ip)) {
          return ip;
        }
      }
    }

    // For development or if no public IP found, return first valid IP
    for (const ip of possibleIPs) {
      if (this.isValidIPFormat(ip)) {
        return ip;
      }
    }

    return possibleIPs[0] || 'unknown';
  }

  // Validate IP format (IPv4 and IPv6)
  private static isValidIPFormat(ip: string): boolean {
    if (!ip || ip === 'unknown') return false;

    // IPv4 validation
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    // IPv6 validation (simplified)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;

    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  // Validate if IP is a valid public IP address
  private static isValidPublicIP(ip: string): boolean {
    if (!this.isValidIPFormat(ip)) return false;

    // Check if it's a private/local IP
    return !this.isPrivateIP(ip);
  }

  // Check if IP is private/local/reserved
  private static isPrivateIP(ip: string): boolean {
    // IPv4 private ranges
    const privateRanges = [
      /^127\./, // Loopback
      /^10\./, // Private Class A
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B
      /^192\.168\./, // Private Class C
      /^169\.254\./, // Link-local
      /^0\./, // Invalid range
      /^224\./, // Multicast
      /^255\./ // Broadcast
    ];

    // IPv6 private/local ranges
    if (ip.includes(':')) {
      return (
        ip.startsWith('::1') || // Loopback
        ip.startsWith('fc') || // Unique local
        ip.startsWith('fd') || // Unique local
        ip.startsWith('fe80')
      ); // Link-local
    }

    return privateRanges.some(range => range.test(ip));
  }

  // Get user agent helper
  static getUserAgent(request: Request): string {
    return request.headers.get('user-agent') || 'unknown';
  }

  // ========================================
  // UNIFIED EVENT LOGGER (Activity → AuditLog Migration)
  // ========================================

  /**
   * Log user activity events (migrated from Activity model)
   * This replaces ActivityTracker functionality
   */
  static async logUserActivity(data: {
    eventType: AuditEventType;
    userId: string;
    title: string;
    description: string;
    uiData?: any;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await this.log({
        eventType: data.eventType,
        category: AuditCategory.BUSINESS, // User activities are business events
        severity: AuditSeverity.LOW,
        userId: data.userId,
        description: data.description,
        details: {
          title: data.title,
          uiData: data.uiData || {},
          isUserActivity: true // Flag to identify user activities
        },
        metadata: data.metadata || {}
      });
    } catch (error) {
      console.error('Failed to log user activity:', error);
      // Don't throw - user activities shouldn't break user flow
    }
  }

  // ========================================
  // MIGRATION HELPER FUNCTIONS (Phase 1 & 2)
  // ========================================

  /**
   * 🟢 PHASE 1.1: Profile Events
   */
  static async trackProfileUpdate(userId: string, changes?: Record<string, any>): Promise<void> {
    await this.logUserActivity({
      eventType: AuditEventType.PROFILE_UPDATED,
      userId,
      title: 'Cập nhật thông tin cá nhân',
      description: 'Tài khoản vừa cập nhật hồ sơ',
      uiData: { userId },
      metadata: { changes }
    });
  }

  static async trackPasswordChange(userId: string): Promise<void> {
    await this.logUserActivity({
      eventType: AuditEventType.PASSWORD_CHANGED,
      userId,
      title: 'Thay đổi mật khẩu',
      description: 'Tài khoản vừa thay đổi mật khẩu',
      uiData: { userId }
    });
  }

  /**
   * 🟢 PHASE 1.2: Review Events (Combined comment + rating)
   */
  static async trackProductReview(
    userId: string,
    productId: string,
    productName: string,
    rating: number,
    comment?: string
  ): Promise<void> {
    const hasComment = Boolean(comment && comment.trim());

    await this.logUserActivity({
      eventType: AuditEventType.PRODUCT_REVIEWED,
      userId,
      title: hasComment ? 'Bình luận và đánh giá sản phẩm' : 'Đánh giá sản phẩm',
      description: hasComment
        ? `Đã bình luận và đánh giá sản phẩm ${productName}`
        : `Đã đánh giá sản phẩm ${productName}`,
      uiData: {
        productId,
        productName,
        rating,
        hasComment,
        comment: comment || null
      }
    });
  }

  /**
   * 🟡 PHASE 2.1: Order Events
   */
  static async trackOrderCreated(userId: string, orderId: string, products: any[]): Promise<void> {
    await this.logUserActivity({
      eventType: AuditEventType.ORDER_CREATED,
      userId,
      title: 'Đơn hàng được tạo',
      description: `Tài khoản vừa đặt hàng ${products.length} sản phẩm`,
      uiData: {
        orderId,
        products: products.slice(0, 3).map(product => ({
          id: product.id,
          name: product.name,
          image:
            product.thumbnail ||
            (product.galleryImages && product.galleryImages.length > 0 ? product.galleryImages[0] : null) ||
            product.selectedImg?.images?.[0] ||
            '/noavatar.png'
        }))
      }
    });
  }

  static async trackOrderUpdated(userId: string, orderId: string, changes: Record<string, any>): Promise<void> {
    await this.logUserActivity({
      eventType: AuditEventType.ORDER_STATUS_CHANGED,
      userId,
      title: 'Cập nhật đơn hàng',
      description: `Đơn hàng #${orderId} vừa được cập nhật`,
      uiData: { orderId, changes }
    });
  }

  static async trackOrderCancelled(userId: string, orderId: string, reason?: string): Promise<void> {
    await this.logUserActivity({
      eventType: AuditEventType.ORDER_CANCELLED,
      userId,
      title: 'Hủy đơn hàng',
      description: `Đơn hàng #${orderId} đã bị hủy`,
      uiData: { orderId, reason }
    });
  }

  /**
   * 🟡 PHASE 2.2: Payment Events
   */
  static async trackPaymentSuccess(
    userId: string,
    orderId: string,
    amount: number,
    paymentMethod?: string
  ): Promise<void> {
    await this.logUserActivity({
      eventType: AuditEventType.PAYMENT_SUCCESS,
      userId,
      title: 'Thanh toán thành công',
      description: `Đã thanh toán đơn hàng #${orderId}`,
      uiData: { orderId, amount, paymentMethod }
    });
  }

  // ========================================
  // 🔴 PHASE 3: COMPLEX EVENTS
  // ========================================

  /**
   * 🔴 PHASE 3.1: User Lifecycle Events
   */
  static async trackUserRegistration(
    userId: string,
    registrationMethod: 'email' | 'google' | 'facebook',
    userInfo: { name: string; email: string }
  ): Promise<void> {
    await this.logUserActivity({
      eventType: AuditEventType.USER_REGISTRATION,
      userId,
      title: 'Đăng ký tài khoản',
      description: `Tài khoản mới được tạo qua ${registrationMethod}`,
      uiData: {
        registrationMethod,
        userName: userInfo.name,
        userEmail: userInfo.email
      }
    });
  }

  static async trackUserLogin(
    userId: string,
    loginMethod: 'email' | 'google' | 'facebook',
    deviceInfo?: string
  ): Promise<void> {
    await this.logUserActivity({
      eventType: AuditEventType.USER_LOGIN,
      userId,
      title: 'Đăng nhập',
      description: `Đăng nhập qua ${loginMethod}`,
      uiData: {
        loginMethod,
        deviceInfo: deviceInfo || 'Unknown device'
      }
    });
  }

  /**
   * 🔴 PHASE 3.2: Shopping Behavior Events
   */
  static async trackCartUpdated(
    userId: string,
    action: 'add' | 'remove' | 'update',
    productInfo: { id: string; name: string; quantity: number }
  ): Promise<void> {
    const actionText = {
      add: 'Thêm vào giỏ hàng',
      remove: 'Xóa khỏi giỏ hàng',
      update: 'Cập nhật giỏ hàng'
    }[action];

    await this.logUserActivity({
      eventType: AuditEventType.CART_UPDATED,
      userId,
      title: actionText,
      description: `${actionText}: ${productInfo.name}`,
      uiData: {
        action,
        productId: productInfo.id,
        productName: productInfo.name,
        quantity: productInfo.quantity
      }
    });
  }

  static async trackWishlistUpdated(
    userId: string,
    action: 'add' | 'remove',
    productInfo: { id: string; name: string; image?: string }
  ): Promise<void> {
    const actionText = action === 'add' ? 'Thêm vào yêu thích' : 'Xóa khỏi yêu thích';

    await this.logUserActivity({
      eventType: AuditEventType.WISHLIST_UPDATED,
      userId,
      title: actionText,
      description: `${actionText}: ${productInfo.name}`,
      uiData: {
        action,
        productId: productInfo.id,
        productName: productInfo.name,
        productImage: productInfo.image
      }
    });
  }

  /**
   * 🔴 PHASE 3.3: Engagement Events
   */
  static async trackNewsletterSubscribed(userId: string, email: string, source: string = 'website'): Promise<void> {
    await this.logUserActivity({
      eventType: AuditEventType.NEWSLETTER_SUBSCRIBED,
      userId,
      title: 'Đăng ký nhận tin',
      description: 'Đăng ký nhận bản tin email',
      uiData: {
        email,
        source
      }
    });
  }

  static async trackSearchPerformed(
    userId: string,
    searchQuery: string,
    resultsCount: number,
    filters?: Record<string, any>
  ): Promise<void> {
    await this.logUserActivity({
      eventType: AuditEventType.SEARCH_PERFORMED,
      userId,
      title: 'Tìm kiếm sản phẩm',
      description: `Tìm kiếm: "${searchQuery}"`,
      uiData: {
        searchQuery,
        resultsCount,
        filters: filters || {}
      }
    });
  }

  // ========================================
  // 🔴 PHASE 3.4: GENERATED ACTIVITIES (Most Complex)
  // ========================================

  /**
   * Generate activities from existing user data
   * This replaces the complex generateActivitiesFromUserData logic
   */
  static async generateUserActivitiesFromData(
    userId: string,
    userData: {
      orders?: any[];
      reviews?: any[];
      profile?: any;
      loginHistory?: any[];
    }
  ): Promise<void> {
    try {
      const activities: Array<{
        eventType: AuditEventType;
        title: string;
        description: string;
        uiData: any;
        timestamp: Date;
      }> = [];

      // Generate from orders
      if (userData.orders) {
        for (const order of userData.orders) {
          // Order created activity
          activities.push({
            eventType: AuditEventType.ORDER_CREATED,
            title: 'Đơn hàng được tạo',
            description: `Tài khoản vừa đặt hàng ${order.products?.length || 0} sản phẩm`,
            uiData: {
              orderId: order.id,
              products:
                order.products?.slice(0, 3).map((product: any) => ({
                  id: product.id,
                  name: product.name,
                  image:
                    product.thumbnail ||
                    (product.galleryImages && product.galleryImages.length > 0 ? product.galleryImages[0] : null) ||
                    product.selectedImg?.images?.[0] ||
                    '/noavatar.png'
                })) || []
            },
            timestamp: new Date(order.createDate)
          });

          // Payment success activity (if paid)
          if (order.status === 'paid' || order.paymentStatus === 'paid') {
            activities.push({
              eventType: AuditEventType.PAYMENT_SUCCESS,
              title: 'Thanh toán thành công',
              description: `Đã thanh toán đơn hàng #${order.id}`,
              uiData: {
                orderId: order.id,
                amount: order.amount,
                paymentMethod: order.paymentMethod
              },
              timestamp: new Date(order.createDate)
            });
          }
        }
      }

      // Generate from reviews
      if (userData.reviews) {
        for (const review of userData.reviews) {
          activities.push({
            eventType: AuditEventType.PRODUCT_REVIEWED,
            title: review.comment ? 'Bình luận và đánh giá sản phẩm' : 'Đánh giá sản phẩm',
            description: `Đã ${review.comment ? 'bình luận và ' : ''}đánh giá sản phẩm ${
              review.product?.name || 'N/A'
            }`,
            uiData: {
              productId: review.productId,
              productName: review.product?.name || 'N/A',
              rating: review.rating,
              hasComment: Boolean(review.comment),
              comment: review.comment
            },
            timestamp: new Date(review.createdDate)
          });
        }
      }

      // Batch insert activities
      if (activities.length > 0) {
        await this.batchLogUserActivities(userId, activities);
      }
    } catch (error) {
      console.error('Error generating user activities from data:', error);
      // Don't throw - this is background processing
    }
  }

  /**
   * Batch insert multiple user activities efficiently
   */
  private static async batchLogUserActivities(
    userId: string,
    activities: Array<{
      eventType: AuditEventType;
      title: string;
      description: string;
      uiData: any;
      timestamp: Date;
    }>
  ): Promise<void> {
    try {
      const auditLogEntries = activities.map(activity => ({
        eventType: activity.eventType,
        category: AuditCategory.BUSINESS,
        severity: AuditSeverity.LOW,
        userId,
        description: activity.description,
        details: {
          title: activity.title,
          uiData: activity.uiData,
          isUserActivity: true,
          isGenerated: true // Flag to identify generated activities
        },
        metadata: {},
        timestamp: activity.timestamp,
        createdAt: new Date()
      }));

      // Batch insert using createMany
      await prisma.auditLog.createMany({
        data: auditLogEntries
      });
    } catch (error) {
      console.error('Error batch logging user activities:', error);
      throw error;
    }
  }
}

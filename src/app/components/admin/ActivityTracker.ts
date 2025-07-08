// 🚀 MIGRATED: ActivityTracker class removed - all functionality moved to AuditLogger
// This file now only exports the tracking functions that use AuditLogger

import { AuditLogger } from '@/app/utils/auditLogger';

// ========================================
// 🚀 UNIFIED EVENT TRACKING FUNCTIONS
// All functions now use AuditLogger instead of ActivityTracker
// ========================================

// 🟢 PHASE 1: Profile Events
export const trackProfileUpdated = async (userId: string, changes?: Record<string, any>) => {
  await AuditLogger.trackProfileUpdate(userId, changes);
};

export const trackPasswordChanged = async (userId: string) => {
  await AuditLogger.trackPasswordChange(userId);
};

// 🟢 PHASE 1.2: Review Events (Combined comment + rating)
export const trackProductReview = async (
  userId: string,
  productId: string,
  productName: string,
  rating: number,
  comment?: string
) => {
  await AuditLogger.trackProductReview(userId, productId, productName, rating, comment);
};

// 🟡 PHASE 2.1: Order Events
export const trackOrderCreated = async (userId: string, orderId: string, products: any[]) => {
  await AuditLogger.trackOrderCreated(userId, orderId, products);
};

export const trackOrderUpdated = async (userId: string, orderId: string, newStatus: string) => {
  const statusText =
    {
      in_transit: 'Đang giao hàng',
      delivered: 'Đã giao',
      returned: 'Đã hoàn trả'
    }[newStatus] || newStatus;

  await AuditLogger.trackOrderUpdated(userId, orderId, { status: statusText });
};

export const trackOrderCancelled = async (userId: string, orderId: string, reason?: string) => {
  await AuditLogger.trackOrderCancelled(userId, orderId, reason);
};

// 🟡 PHASE 2.2: Payment Events
export const trackPaymentSuccess = async (userId: string, orderId: string, amount: number, paymentMethod?: string) => {
  await AuditLogger.trackPaymentSuccess(userId, orderId, amount, paymentMethod);
};

// ========================================
// 🔴 PHASE 3: COMPLEX EVENTS
// ========================================

// 🔴 PHASE 3.1: User Lifecycle Events
export const trackUserRegistration = async (
  userId: string,
  registrationMethod: 'email' | 'google' | 'facebook',
  userInfo: { name: string; email: string }
) => {
  await AuditLogger.trackUserRegistration(userId, registrationMethod, userInfo);
};

export const trackUserLogin = async (
  userId: string,
  loginMethod: 'email' | 'google' | 'facebook',
  deviceInfo?: string
) => {
  await AuditLogger.trackUserLogin(userId, loginMethod, deviceInfo);
};

// 🔴 PHASE 3.2: Shopping Behavior Events
export const trackCartUpdated = async (
  userId: string,
  action: 'add' | 'remove' | 'update',
  productInfo: { id: string; name: string; quantity: number }
) => {
  await AuditLogger.trackCartUpdated(userId, action, productInfo);
};

export const trackWishlistUpdated = async (
  userId: string,
  action: 'add' | 'remove',
  productInfo: { id: string; name: string; image?: string }
) => {
  await AuditLogger.trackWishlistUpdated(userId, action, productInfo);
};

// 🔴 PHASE 3.3: Engagement Events
export const trackNewsletterSubscribed = async (userId: string, email: string, source: string = 'website') => {
  await AuditLogger.trackNewsletterSubscribed(userId, email, source);
};

export const trackSearchPerformed = async (
  userId: string,
  searchQuery: string,
  resultsCount: number,
  filters?: Record<string, any>
) => {
  await AuditLogger.trackSearchPerformed(userId, searchQuery, resultsCount, filters);
};

// 🔴 PHASE 3.4: Generated Activities (Most Complex)
export const generateUserActivitiesFromData = async (
  userId: string,
  userData: {
    orders?: any[];
    reviews?: any[];
    profile?: any;
    loginHistory?: any[];
  }
) => {
  await AuditLogger.generateUserActivitiesFromData(userId, userData);
};

// trackEmailChanged removed as requested in Phase 1.1

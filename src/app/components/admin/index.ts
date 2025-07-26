// Activity Tracking Components
export { default as ActivityTimeline } from './ActivityTimeline';
export { default as AllActivitiesTimeline } from './AllActivitiesTimeline';

// Activity Tracking Hooks and Utils
export { useUserActivities } from '../../hooks/useUserActivities';

// 🚀 UNIFIED EVENT TRACKING FUNCTIONS (All Phases)
export {
  // Phase 1: Profile Events
  trackProfileUpdated,
  trackPasswordChanged,

  // Phase 1.2: Review Events (Combined)
  trackProductReview,

  // Phase 2: Order & Payment Events
  trackOrderCreated,
  trackOrderUpdated,
  trackOrderCancelled,
  trackPaymentSuccess,

  // Phase 3: Complex Events
  trackUserRegistration,
  trackUserLogin,
  trackCartUpdated,
  trackWishlistUpdated,
  trackNewsletterSubscribed,
  trackSearchPerformed,
  generateUserActivitiesFromData
} from './ActivityTracker';

// Types
export type { ActivityItem } from './ActivityTimeline';

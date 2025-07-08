# 🚀 Unified Event Tracking Guide

## 📊 **Overview**

Hệ thống tracking events đã được merge từ Activity model vào AuditLog model để tạo ra **single source of truth** cho tất cả events trong hệ thống.

## 🎯 **Migration Status**

### **✅ Completed (All Phases):**

- 🟢 **Profile Events**: `trackProfileUpdate`, `trackPasswordChange`
- 🟢 **Review Events**: `trackProductReview` (combined comment + rating)
- 🟡 **Order Events**: `trackOrderCreated`, `trackOrderUpdated`, `trackOrderCancelled`
- 🟡 **Payment Events**: `trackPaymentSuccess`
- 🔴 **User Lifecycle**: `trackUserRegistration`, `trackUserLogin`
- 🔴 **Shopping Behavior**: `trackCartUpdated`, `trackWishlistUpdated`
- 🔴 **Engagement**: `trackNewsletterSubscribed`, `trackSearchPerformed`
- 🔴 **Generated Activities**: `generateUserActivitiesFromData`

### **❌ Removed:**

- ~~`trackEmailChange`~~ (as requested)
- ~~`trackProductComment`~~ (merged into `trackProductReview`)

## 🔧 **How to Add New Event Tracking**

### **📋 Step-by-Step Guide:**

#### **Step 1: Add Event Type to AuditLogger**

```typescript
// File: src/app/utils/auditLogger.ts
export enum AuditEventType {
  // ... existing events
  NEW_EVENT_TYPE = 'NEW_EVENT_TYPE' // ← Add your event
}
```

#### **Step 2: Create Helper Function**

```typescript
// File: src/app/utils/auditLogger.ts
/**
 * Track new event type
 */
static async trackNewEvent(
  userId: string,
  eventData: any
): Promise<void> {
  await this.logUserActivity({
    eventType: AuditEventType.NEW_EVENT_TYPE,
    userId,
    title: 'Event Title for UI',
    description: 'Event description',
    uiData: {
      // Data for ActivityTimeline display
      key: eventData.value
    },
    metadata: {
      // Additional metadata for audit
      additionalInfo: eventData.extra
    }
  });
}
```

#### **Step 3: Export from ActivityTracker**

```typescript
// File: src/app/components/admin/ActivityTracker.ts
export const trackNewEvent = async (userId: string, eventData: any) => {
  await AuditLogger.trackNewEvent(userId, eventData);
};
```

#### **Step 4: Add UI Mapping**

```typescript
// File: src/app/components/admin/useUserActivities.ts
const mapEventTypeToActivityType = (eventType: string): string => {
  const mapping: Record<string, string> = {
    // ... existing mappings
    NEW_EVENT_TYPE: 'new_event_type' // ← Add mapping
  };
  return mapping[eventType] || eventType.toLowerCase();
};
```

#### **Step 5: Update ActivityTimeline UI (if needed)**

```typescript
// File: src/app/components/admin/ActivityTimeline.tsx
const renderActivityContent = (activity: ActivityItem) => {
  switch (activity.type) {
    // ... existing cases
    case 'new_event_type':
      return (
        <div>
          <p className='text-gray-500'>{activity.description}</p>
          {/* Custom UI for your event */}
        </div>
      );
  }
};
```

#### **Step 6: Use in Your Code**

```typescript
// In your API route or component
import { trackNewEvent } from '@/app/components/admin/ActivityTracker';

// Track the event
await trackNewEvent(userId, {
  value: 'some data',
  extra: 'additional info'
});
```

## 📝 **Event Categories**

### **🟢 User Activities (BUSINESS category)**

- Profile updates
- Product interactions
- Order activities
- Payment events

### **🟡 Admin Actions (ADMIN category)**

- Product management
- User management
- System settings

### **🔴 Security Events (SECURITY category)**

- Failed login attempts
- Suspicious activities
- Security violations

### **⚫ System Events (SYSTEM category)**

- Errors and exceptions
- System maintenance
- API failures

## 🎨 **UI Data Structure**

### **For ActivityTimeline Display:**

```typescript
uiData: {
  // Required for timeline
  userId: string;

  // For order events
  orderId?: string;
  products?: Array<{
    id: string;
    name: string;
    image: string;
  }>;

  // For product events
  productId?: string;
  productName?: string;
  rating?: number;
  comment?: string;

  // For payment events
  amount?: number;
  paymentMethod?: string;
}
```

## 🔍 **Query Examples**

### **Get User Activities:**

```typescript
// Frontend
const response = await fetch(`/api/audit-logs?userId=${userId}&category=BUSINESS&limit=20`);

// Backend
const userActivities = await prisma.auditLog.findMany({
  where: {
    userId: userId,
    category: 'BUSINESS'
  },
  orderBy: { timestamp: 'desc' },
  take: 20
});
```

### **Get Admin Audit Logs:**

```typescript
const adminLogs = await prisma.auditLog.findMany({
  where: {
    category: { in: ['ADMIN', 'SECURITY'] }
  },
  orderBy: { timestamp: 'desc' }
});
```

## 🚨 **Best Practices**

### **✅ Do:**

- Use descriptive event types
- Include relevant uiData for timeline display
- Add metadata for audit purposes
- Use appropriate severity levels
- Handle errors gracefully (don't break user flow)

### **❌ Don't:**

- Track sensitive data in uiData
- Create duplicate event types
- Block user actions if tracking fails
- Track too frequently (performance impact)

## 🧪 **Testing Your Events**

### **1. Check ActivityTimeline:**

```bash
# Navigate to user profile
/admin/users/[userId]
# Verify your event appears in timeline
```

### **2. Check Audit Logs:**

```bash
# Navigate to admin audit logs
/admin/dashboard (Notifications tab)
# Verify event appears with correct category
```

### **3. Database Verification:**

```sql
-- Check if event was logged
SELECT * FROM AuditLog
WHERE eventType = 'YOUR_EVENT_TYPE'
ORDER BY timestamp DESC
LIMIT 5;
```

## 📊 **Migration Benefits**

### **Before (Activity + AuditLog):**

- ❌ Duplicate tracking logic
- ❌ Two separate databases
- ❌ Inconsistent data
- ❌ Complex maintenance

### **After (Unified AuditLog):**

- ✅ Single source of truth
- ✅ Consistent tracking
- ✅ Better performance
- ✅ Easier maintenance
- ✅ Enhanced security context

## 🎉 **Success Metrics**

- **UI Unchanged**: ActivityTimeline works exactly the same
- **Data Consistency**: All events properly tracked
- **Performance**: No degradation in load times
- **Maintainability**: Easier to add new events
- **Security**: Better audit trail with IP/user context

---

**Ready to add your first unified event? Follow the step-by-step guide above!** 🚀

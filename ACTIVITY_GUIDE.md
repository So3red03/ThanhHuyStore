# 📋 Hướng dẫn thêm Activity Type mới

## 🎯 Khi nào cần dính đến Model khác?

### ✅ **Chỉ cần Activity Model (Đơn giản)**
Những activity này **KHÔNG** cần thay đổi model khác:

- **Profile activities**: `PROFILE_UPDATED`, `PASSWORD_CHANGED`, `EMAIL_CHANGED`
- **Comment activities**: `COMMENT` (chỉ tracking, không lưu comment mới)
- **Review activities**: `REVIEW` (chỉ tracking, không lưu review mới)
- **Notification activities**: `NOTIFICATION_SENT`, `NOTIFICATION_READ`

**Lý do:** Chỉ là **tracking/logging** các hành động đã xảy ra.

### ⚠️ **Cần Model khác (Phức tạp)**
Những activity này **CẦN** thay đổi/tạo model khác:

- **Return/Exchange**: `ORDER_RETURN_REQUESTED`, `ORDER_EXCHANGE_REQUESTED`
  - **Cần:** Model `ReturnRequest` để lưu chi tiết yêu cầu
- **Wishlist**: `PRODUCT_ADDED_TO_WISHLIST`, `PRODUCT_REMOVED_FROM_WISHLIST`
  - **Cần:** Model `Wishlist` để lưu danh sách yêu thích
- **Cart**: `PRODUCT_ADDED_TO_CART`, `CART_ABANDONED`
  - **Cần:** Model `Cart` để lưu giỏ hàng
- **Coupon**: `COUPON_USED`, `COUPON_EXPIRED`
  - **Cần:** Model `Coupon`, `UserCoupon` để lưu mã giảm giá
- **Loyalty**: `POINTS_EARNED`, `POINTS_REDEEMED`
  - **Cần:** Model `LoyaltyPoint` để lưu điểm tích lũy

**Lý do:** Cần **business logic** và **data storage** cho tính năng mới.

---

## 📝 Các bước thêm Activity mới

### 🔥 **LOẠI 1: Activity đơn giản (chỉ tracking)**

#### **Bước 1: Cập nhật Prisma Schema**
```prisma
// File: prisma/schema.prisma
enum ActivityType {
  // ... existing types
  NOTIFICATION_READ        // ← Thêm type mới
}
```

#### **Bước 2: Cập nhật TypeScript Interface**
```typescript
// File: src/app/components/admin/ActivityTimeline.tsx
export interface ActivityItem {
  type: 'order_created' | ... | 'notification_read'; // ← Thêm type
}
```

#### **Bước 3: Cập nhật ActivityTracker Mapping**
```typescript
// File: src/app/components/admin/ActivityTracker.ts
private mapTypeToEnum(type: string): string {
  const mapping: Record<string, string> = {
    // ... existing
    notification_read: 'NOTIFICATION_READ', // ← Thêm mapping
  };
}

private mapEnumToType(enumType: string): string {
  const mapping: Record<string, string> = {
    // ... existing
    NOTIFICATION_READ: 'notification_read', // ← Thêm mapping ngược
  };
}
```

#### **Bước 4: Thêm Helper Function**
```typescript
// File: src/app/actions/createActivity.ts
export async function createNotificationReadActivity(
  userId: string,
  notificationId: string
) {
  return createActivity({
    userId,
    type: 'NOTIFICATION_READ',
    title: 'Đọc thông báo',
    description: 'Đã đọc thông báo mới',
    data: { notificationId }
  });
}
```

#### **Bước 5: Thêm Tracking Function**
```typescript
// File: src/app/components/admin/ActivityTracker.ts
export const trackNotificationRead = (userId: string, notificationId: string) => {
  const tracker = ActivityTracker.getInstance();
  tracker.addActivity({
    type: 'notification_read',
    title: 'Đọc thông báo',
    description: 'Đã đọc thông báo mới',
    data: { userId, notificationId }
  });
};
```

#### **Bước 6: Thêm UI Styling**
```typescript
// File: src/app/components/admin/ActivityTimeline.tsx
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'notification_read': return '📖'; // ← Thêm icon
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'notification_read': 
      return { bg: 'bg-[#E8F4FD]', dot: 'bg-[#1E90FF]' }; // ← Thêm màu
  }
};
```

#### **Bước 7: Database Migration**
```bash
npx prisma db push
```

#### **Bước 8: Sử dụng trong Code**
```typescript
// Trong notification API
import { trackNotificationRead } from '@/app/components/admin';

// Khi user đọc notification
await trackNotificationRead(userId, notificationId);
```

---

### 🔥 **LOẠI 2: Activity phức tạp (cần model mới)**

#### **Ví dụ: Thêm Return Request Activity**

#### **Bước 1: Tạo Model mới trong Prisma**
```prisma
// File: prisma/schema.prisma
model ReturnRequest {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  userId      String   @db.ObjectId
  orderId     String   @db.ObjectId
  reason      String
  status      ReturnStatus @default(PENDING)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id])
  order       Order    @relation(fields: [orderId], references: [id])
}

enum ReturnStatus {
  PENDING
  APPROVED
  REJECTED
  COMPLETED
}

// Cập nhật User model
model User {
  // ... existing fields
  returnRequests  ReturnRequest[]  // ← Thêm relation
}

// Cập nhật Order model  
model Order {
  // ... existing fields
  returnRequests  ReturnRequest[]  // ← Thêm relation
}

// Thêm ActivityType
enum ActivityType {
  // ... existing
  ORDER_RETURN_REQUESTED
  ORDER_RETURN_APPROVED
  ORDER_RETURN_REJECTED
}
```

#### **Bước 2: Tạo Actions cho Model mới**
```typescript
// File: src/app/actions/createReturnRequest.ts
export async function createReturnRequest(data: {
  userId: string;
  orderId: string;
  reason: string;
}) {
  const returnRequest = await prisma.returnRequest.create({
    data,
    include: { user: true, order: true }
  });
  
  // Tạo activity tracking
  await createActivity({
    userId: data.userId,
    type: 'ORDER_RETURN_REQUESTED',
    title: 'Yêu cầu hoàn hàng',
    description: `Yêu cầu hoàn trả đơn hàng #${data.orderId}`,
    data: {
      returnRequestId: returnRequest.id,
      orderId: data.orderId,
      reason: data.reason
    }
  });
  
  return returnRequest;
}
```

#### **Bước 3: Tạo API Endpoints**
```typescript
// File: src/app/api/return-requests/route.ts
export async function POST(request: NextRequest) {
  const { userId, orderId, reason } = await request.json();
  
  const returnRequest = await createReturnRequest({
    userId, orderId, reason
  });
  
  return NextResponse.json(returnRequest);
}
```

#### **Bước 4: Thêm Activity Tracking** (như LOẠI 1)

#### **Bước 5: Database Migration**
```bash
npx prisma db push
```

#### **Bước 6: Tạo UI Components**
```typescript
// File: src/app/components/ReturnRequestForm.tsx
// Component để user tạo return request
```

---

## 🎯 **Ma trận quyết định**

| Activity Type | Cần Model mới? | Lý do | Độ phức tạp |
|---------------|----------------|-------|-------------|
| `PROFILE_UPDATED` | ❌ | Chỉ tracking | 🟢 Đơn giản |
| `NOTIFICATION_READ` | ❌ | Chỉ tracking | 🟢 Đơn giản |
| `ORDER_RETURN_REQUESTED` | ✅ | Cần lưu return data | 🟡 Trung bình |
| `PRODUCT_ADDED_TO_WISHLIST` | ✅ | Cần Wishlist model | 🟡 Trung bình |
| `COUPON_USED` | ✅ | Cần Coupon system | 🔴 Phức tạp |
| `POINTS_EARNED` | ✅ | Cần Loyalty system | 🔴 Phức tạp |

---

## 📋 **Checklist khi thêm Activity**

### ✅ **Cho mọi Activity:**
- [ ] Thêm enum trong `ActivityType`
- [ ] Cập nhật `ActivityItem` interface
- [ ] Thêm mapping trong `ActivityTracker`
- [ ] Tạo helper function trong `createActivity.ts`
- [ ] Thêm tracking function
- [ ] Thêm icon và màu sắc
- [ ] Chạy `npx prisma db push`
- [ ] Test với demo data
- [ ] Update exports

### ✅ **Cho Activity cần Model mới:**
- [ ] Thiết kế database schema
- [ ] Tạo Prisma model
- [ ] Tạo relations với existing models
- [ ] Tạo actions cho CRUD operations
- [ ] Tạo API endpoints
- [ ] Tạo UI components
- [ ] Implement business logic
- [ ] Test end-to-end flow

---

## 🚨 **Lưu ý quan trọng**

1. **Luôn backup database** trước khi thay đổi schema
2. **Test thoroughly** với dữ liệu thật
3. **Consider performance** khi thêm relations mới
4. **Update documentation** khi có tính năng mới
5. **Handle edge cases** và error scenarios

---

## 📞 **Khi nào cần hỏi thêm?**

- Không chắc activity cần model mới hay không
- Cần thiết kế database schema phức tạp
- Cần implement business logic đặc biệt
- Gặp lỗi khi migration database

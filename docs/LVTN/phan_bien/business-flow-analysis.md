# CÂU HỎI PHẢN BIỆN - LUỒNG NGHIỆP VỤ VÀ LOGIC

## 🔄 PHẦN 1: ORDER CREATION FLOW

### Câu hỏi 1: Order creation process

**Hỏi:** "Quy trình tạo đơn hàng của em như thế nào? Từ cart đến completed order?"

**Trả lời:**

- User add products to cart (client-side storage)
- Checkout: validate products, calculate amounts server-side
- Create payment intent với unique paymentIntentId
- Process payment theo method (COD/MoMo/Stripe)
- Update order status và send confirmation email
- Admin có thể track qua kanban board

### Câu hỏi 2: Payment method handling

**Hỏi:** "Em xử lý 3 payment methods khác nhau như thế nào?"

**Trả lời:**

- COD: Tạo order ngay với status pending
- MoMo: Generate payment URL, chờ callback để update status
- Stripe: Create payment intent, chờ webhook confirmation
- Tất cả đều có server-side validation và audit logging
- Consistent error handling across methods

### Câu hỏi 3: Admin order creation

**Hỏi:** "Tại sao admin có thể tạo đơn hàng? Use case nào?"

**Trả lời:**

- Support phone orders từ customers
- Manual order entry cho offline sales
- Test orders cho development/QA
- Emergency orders khi system issues
- Tất cả admin orders có audit trail với HIGH severity

### Câu hỏi 4: Order validation logic

**Hỏi:** "Em validate gì khi tạo order? Server-side hay client-side?"

**Trả lời:**

- Server-side validation cho tất cả critical data
- Product existence, pricing, stock availability
- Voucher validity và usage limits
- User permissions và rate limiting
- Không trust client-side calculations

## 🔄 PHẦN 2: VOUCHER VÀ PROMOTION LOGIC

### Câu hỏi 5: Voucher application logic

**Hỏi:** "Em apply voucher như thế nào? Validate gì?"

**Trả lời:**

- Validate voucher code existence và active status
- Check date validity (startDate <= now <= endDate)
- Verify quantity available (usedCount < quantity)
- Check minOrderValue requirement
- Validate user eligibility cho PERSONAL vouchers
- Server-side validation, không trust client

### Câu hỏi 6: Promotion vs Voucher

**Hỏi:** "Em có phân biệt Promotion và Voucher không? Khác nhau như thế nào?"

**Trả lời:**

- Promotion: Apply trực tiếp lên product/category
- Voucher: User input code để apply discount
- Promotion có ProductPromotion linking table
- Voucher có targetUserIds cho PERSONAL type
- Cả 2 đều có audit logging khi admin manage

### Câu hỏi 7: Discount calculation

**Hỏi:** "Em tính discount như thế nào? Percentage hay fixed amount?"

**Trả lời:**

- Support cả PERCENTAGE và FIXED_AMOUNT
- Percentage: (originalAmount \* discountValue) / 100
- Fixed: trừ trực tiếp discountValue
- Validate discount không vượt quá originalAmount
- Final amount = originalAmount - discountAmount

## 🔄 PHẦN 3: EMAIL VÀ NOTIFICATION FLOW

### Câu hỏi 8: Email confirmation process

**Hỏi:** "Em có gửi email confirmation không? Khi nào gửi?"

**Trả lời:**

- Gửi email confirmation khi order thành công
- Attach PDF invoice nếu có
- HTML template với order details đầy đủ
- Handle email failures gracefully
- Retry mechanism cho failed deliveries

### Câu hỏi 9: Admin notifications

**Hỏi:** "Admin có nhận notification khi có order mới không?"

**Trả lời:**

- Gửi notification cho tất cả admin users
- Include order details và payment method
- Support multiple notification channels
- Can be configured trong AdminSettings
- Real-time updates cho admin dashboard

### Câu hỏi 10: Error handling strategy

**Hỏi:** "Khi có lỗi trong order process, em xử lý như thế nào?"

**Trả lời:**

- Comprehensive try-catch blocks
- Detailed error logging với context
- User-friendly error messages
- Graceful degradation khi possible
- Rollback mechanisms cho failed transactions

---

## 🔍 PHÂN TÍCH CÁC EDGE CASES

### 1. **Concurrent User Actions**

#### Scenario: 2 admin cùng lúc cập nhật đơn hàng

```typescript
// HIỆN TẠI - RACE CONDITION
// Admin A: Cập nhật status = 'confirmed'
// Admin B: Cập nhật deliveryStatus = 'in_transit'
// Kết quả: Đơn hàng có thể có trạng thái không hợp lệ

// ✅ GIẢI PHÁP: Optimistic Locking
const updateOrderWithLock = async (orderId, updates) => {
  const currentOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: { updatedAt: true }
  });

  const updatedOrder = await prisma.order.update({
    where: {
      id: orderId,
      updatedAt: currentOrder.updatedAt // Optimistic lock
    },
    data: {
      ...updates,
      updatedAt: new Date()
    }
  });

  return updatedOrder;
};
```

### 2. **Payment Timeout Scenarios**

#### Scenario: User đóng browser sau khi tạo order nhưng trước khi thanh toán

```typescript
// HIỆN TẠI - THIẾU XỬ LÝ
// Order được tạo với status = 'pending'
// Inventory đã được reserve
// Voucher đã được reserve
// Nhưng không có timeout mechanism

// ✅ GIẢI PHÁP: Payment Timeout Handler
const schedulePaymentTimeout = async (orderId, timeoutMinutes = 15) => {
  setTimeout(async () => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true }
    });

    if (order && order.status === 'pending') {
      // Auto-cancel và rollback
      await rollbackOrder(orderId, 'Payment timeout');
    }
  }, timeoutMinutes * 60 * 1000);
};
```

### 3. **Voucher Edge Cases**

#### Scenario: Voucher hết hạn trong lúc user đang checkout

```typescript
// HIỆN TẠI - KHÔNG XỬ LÝ
// User validate voucher lúc 23:59:50
// Voucher hết hạn lúc 00:00:00
// User submit order lúc 00:00:10
// Order vẫn được tạo với discount

// ✅ GIẢI PHÁP: Re-validate trong transaction
const createOrderWithVoucherRevalidation = async (orderData, voucherCode) => {
  return await prisma.$transaction(async tx => {
    if (voucherCode) {
      const voucher = await tx.voucher.findUnique({
        where: { code: voucherCode }
      });

      // Re-validate voucher trong transaction
      if (voucher.endDate < new Date()) {
        throw new Error('Voucher đã hết hạn');
      }
    }

    return await tx.order.create({ data: orderData });
  });
};
```

---

## 📊 BUSINESS METRICS & KPIs ANALYSIS

### 1. **Order Conversion Funnel Issues**

```sql
-- Phân tích conversion rate có vấn đề
WITH OrderFunnel AS (
  SELECT
    DATE(createdAt) as order_date,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
    COUNT(CASE WHEN status = 'canceled' THEN 1 END) as canceled_orders
  FROM Order
  WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  GROUP BY DATE(createdAt)
)
SELECT
  *,
  ROUND(confirmed_orders / total_orders * 100, 2) as confirmation_rate,
  ROUND(completed_orders / total_orders * 100, 2) as completion_rate,
  ROUND(canceled_orders / total_orders * 100, 2) as cancellation_rate
FROM OrderFunnel
WHERE confirmation_rate < 70 OR completion_rate < 60 -- Threshold cảnh báo
ORDER BY order_date DESC;
```

### 2. **Voucher Effectiveness Analysis**

```sql
-- Phân tích hiệu quả voucher có vấn đề
SELECT
  v.code,
  v.discountType,
  v.discountValue,
  v.quantity,
  v.usedCount,
  COUNT(DISTINCT o.userId) as unique_users,
  AVG(o.originalAmount) as avg_order_before_discount,
  AVG(o.amount) as avg_order_after_discount,
  SUM(o.discountAmount) as total_discount_given,
  CASE
    WHEN v.usedCount = 0 THEN 'UNUSED'
    WHEN v.usedCount / v.quantity < 0.1 THEN 'LOW_USAGE'
    WHEN COUNT(DISTINCT o.userId) = 1 THEN 'SINGLE_USER_ABUSE'
    WHEN AVG(o.originalAmount) < v.minOrderValue THEN 'MIN_ORDER_VIOLATION'
    ELSE 'NORMAL'
  END as voucher_status
FROM Voucher v
LEFT JOIN Order o ON v.id = o.voucherId
WHERE v.createdAt >= DATE_SUB(NOW(), INTERVAL 90 DAY)
GROUP BY v.id
HAVING voucher_status != 'NORMAL'
ORDER BY total_discount_given DESC;
```

### 3. **Inventory Management Issues**

```sql
-- Phát hiện sản phẩm có vấn đề về inventory
WITH InventoryAnalysis AS (
  SELECT
    p.id,
    p.name,
    p.inStock as current_stock,
    COALESCE(SUM(
      CASE
        WHEN o.status IN ('confirmed', 'completed')
        THEN JSON_EXTRACT(o.products, CONCAT('$[', idx.idx, '].quantity'))
        ELSE 0
      END
    ), 0) as sold_quantity,
    COALESCE(SUM(
      CASE
        WHEN o.status = 'pending'
        THEN JSON_EXTRACT(o.products, CONCAT('$[', idx.idx, '].quantity'))
        ELSE 0
      END
    ), 0) as reserved_quantity
  FROM Product p
  LEFT JOIN Order o ON JSON_CONTAINS(o.products, JSON_OBJECT('id', p.id))
  LEFT JOIN (
    SELECT 0 as idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
  ) idx ON idx.idx < JSON_LENGTH(o.products)
  WHERE o.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  GROUP BY p.id
)
SELECT
  *,
  (current_stock + sold_quantity) as original_stock,
  CASE
    WHEN current_stock < 0 THEN 'NEGATIVE_STOCK'
    WHEN current_stock < reserved_quantity THEN 'OVERSOLD'
    WHEN current_stock = 0 AND reserved_quantity > 0 THEN 'STOCK_MISMATCH'
    WHEN sold_quantity = 0 AND current_stock > 100 THEN 'DEAD_STOCK'
    ELSE 'NORMAL'
  END as inventory_status
FROM InventoryAnalysis
WHERE inventory_status != 'NORMAL'
ORDER BY
  CASE inventory_status
    WHEN 'NEGATIVE_STOCK' THEN 1
    WHEN 'OVERSOLD' THEN 2
    WHEN 'STOCK_MISMATCH' THEN 3
    ELSE 4
  END;
```

## 🔄 PHẦN 4: ADMIN MANAGEMENT FLOW

### Câu hỏi 11: Admin order management

**Hỏi:** "Admin có thể update order status không? Quy trình như thế nào?"

**Trả lời:**

- Admin có thể update order và delivery status
- Kanban board interface cho easy management
- Validate status transitions (pending → confirmed → completed)
- Audit logging cho tất cả admin changes
- Real-time updates cho order tracking

### Câu hỏi 12: Settings management

**Hỏi:** "Admin có thể config hệ thống không? Config những gì?"

**Trả lời:**

- AdminSettings model cho system configuration
- Enable/disable payment methods
- Notification preferences (email, discord, push)
- Analytics tracking settings
- Session timeout và security parameters

### Câu hỏi 13: User management

**Hỏi:** "Admin có thể manage users không?"

**Trả lời:**

- View user list và order history
- Create orders on behalf of users
- Manage user roles và permissions
- Track user activities qua audit logs
- Handle customer service requests

### Câu hỏi 14: Analytics và reporting

**Hỏi:** "Admin có dashboard để xem analytics không?"

**Trả lời:**

- Basic analytics dashboard với key metrics
- Order statistics và revenue tracking
- Product performance analysis
- User behavior insights
- Export capabilities cho detailed reports

## 🔄 PHẦN 5: RATE LIMITING VÀ SECURITY

### Câu hỏi 15: Rate limiting implementation

**Hỏi:** "Em có implement rate limiting không? Ngăn chặn abuse?"

**Trả lời:**

- Max 5 orders per hour per user
- Server-side validation cho tất cả requests
- IP-based tracking cho suspicious activities
- Progressive delays cho repeated failures
- Admin có thể override limits nếu cần

### Câu hỏi 16: Data validation strategy

**Hỏi:** "Em validate data như thế nào? Client hay server?"

**Trả lời:**

- Primary validation ở server-side
- Client validation chỉ cho UX improvement
- Prisma ORM để prevent SQL injection
- Input sanitization cho all user inputs
- Type checking với TypeScript

### Câu hỏi 17: Concurrent operations

**Hỏi:** "Nếu 2 users cùng lúc order sản phẩm cuối cùng thì sao?"

**Trả lời:**

- Hiện tại chưa có atomic inventory locking
- Có thể xảy ra race condition
- Cần implement database transactions
- First-come-first-served basis
- Error handling cho insufficient stock

### Câu hỏi 18: System monitoring

**Hỏi:** "Em có monitor system health không?"

**Trả lời:**

- Comprehensive audit logging
- Error tracking và reporting
- Performance monitoring cơ bản
- Admin dashboard cho system overview
- Manual monitoring cho critical issues

## 🎯 ĐÁNH GIÁ BUSINESS FLOW TỔNG QUAN

### Điểm Mạnh:

- ✅ Clear order creation flow
- ✅ Multi-payment method support
- ✅ Comprehensive audit logging
- ✅ Admin management capabilities
- ✅ Email notification system
- ✅ Voucher và promotion support

### Các Điểm Cần Cải Thiện:

- 🔄 Inventory race condition handling
- 🔄 Real-time notifications
- 🔄 Advanced error recovery
- 🔄 Performance optimization
- 🔄 Automated testing coverage

### Mức Độ Hoàn Thiện: **KHÁ TỐT** 🟡

**Kết luận:** Business flow đã implement được các tính năng cơ bản của e-commerce. Cần cải thiện concurrency handling và real-time features để ready cho production scale lớn.
)
SELECT
\*,
(current_stock + sold_quantity) as original_stock,
CASE
WHEN current_stock < 0 THEN 'NEGATIVE_STOCK'
WHEN current_stock < reserved_quantity THEN 'OVERSOLD'
WHEN current_stock = 0 AND reserved_quantity > 0 THEN 'STOCK_MISMATCH'
WHEN sold_quantity = 0 AND current_stock > 100 THEN 'DEAD_STOCK'
ELSE 'NORMAL'
END as inventory_status
FROM InventoryAnalysis
WHERE inventory_status != 'NORMAL'
ORDER BY
CASE inventory_status
WHEN 'NEGATIVE_STOCK' THEN 1
WHEN 'OVERSOLD' THEN 2
WHEN 'STOCK_MISMATCH' THEN 3
ELSE 4
END;

```

---

## 🚨 CRITICAL BUSINESS RULES VIOLATIONS

### 1. **Financial Integrity Issues**

- Đơn hàng có thể có `amount` = 0 hoặc âm
- `discountAmount` có thể lớn hơn `originalAmount`
- Thiếu validation cho currency conversion

### 2. **Order Lifecycle Violations**

- Đơn hàng có thể "delivered" mà không qua "in_transit"
- Đơn hàng "canceled" vẫn có thể update delivery status
- Thiếu validation cho business hours

### 3. **Inventory Consistency Issues**

- Sản phẩm có thể có stock âm
- Không có audit trail cho inventory changes
- Thiếu reorder point management

### 4. **Customer Experience Issues**

- User có thể nhận email confirmation nhiều lần
- Voucher có thể được áp dụng cho order đã canceled
- Thiếu notification khi order status thay đổi

**Khuyến nghị:** Cần implement comprehensive business rule engine và validation framework.
```

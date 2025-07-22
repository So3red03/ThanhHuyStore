# 🔥 Plan Xử Lý Vấn Đề Restore Quantity Khi Hủy Đơn Hàng

## 📋 Tổng Quan Vấn Đề

### ✅ Hiện Tại Đã Có:

- **API `/api/orders/rollback-inventory`**: Restore inventory + voucher rollback hoàn chỉnh
- **Tự động gọi rollback**: Trong MoMo callback khi payment failed
- **Transaction atomic**: Đảm bảo consistency khi restore

### ❌ Vấn Đề Phát Hiện:

1. **User Cancel Order** (`/api/orders/cancel`) - KHÔNG restore inventory
2. **Admin Cancel Order** (`/api/orders/admin-cancel`) - KHÔNG restore inventory
3. **Discord Cancel Order** (`/api/discord/interactions`) - KHÔNG restore inventory
4. **Rollback API chỉ support PENDING orders** - Không handle confirmed orders

## 🎯 Phân Tích Chi Tiết Các API Hủy Đơn Hàng

### 1. `/api/orders/cancel/route.ts` - User Cancel

```typescript
// ❌ THIẾU: Chỉ update status, KHÔNG restore inventory
const updatedOrder = await prisma.order.update({
  where: { id: orderId },
  data: {
    status: OrderStatus.canceled,
    cancelReason: reason,
    cancelDate: new Date()
  }
});
// ❌ KHÔNG gọi rollback-inventory API
```

### 2. `/api/orders/admin-cancel/route.ts` - Admin Cancel

```typescript
// ❌ THIẾU: Chỉ update status, KHÔNG restore inventory
const updatedOrder = await prisma.order.update({
  where: { id: orderId },
  data: {
    status: OrderStatus.canceled,
    cancelReason: reason,
    cancelDate: new Date()
  }
});
// ❌ KHÔNG gọi rollback-inventory API
```

### 3. `/api/discord/interactions/route.ts` - Discord Cancel

```typescript
// ❌ THIẾU: Chỉ update status, KHÔNG restore inventory
await prisma.order.update({
  where: { id: orderId },
  data: {
    status: newStatus,
    ...(cancelReason && {
      cancelReason: cancelReason,
      cancelDate: new Date()
    })
  }
});
// ❌ KHÔNG gọi rollback-inventory API
```

### 4. `/api/orders/rollback-inventory/route.ts` - Hiện Tại

```typescript
// ✅ ĐÚNG: Restore inventory + voucher atomically
// ❌ HẠN CHẾ: Chỉ cho phép PENDING orders
if (order.status !== OrderStatus.pending) {
  return NextResponse.json(
    {
      error: `Cannot rollback order with status: ${order.status}`
    },
    { status: 400 }
  );
}
```

## 🔧 Plan Sửa Chữa Chi Tiết

### Phase 1: Cải Thiện Rollback API

**File**: `src/app/api/orders/rollback-inventory/route.ts`

#### 1.1 Mở Rộng Support Cho Confirmed Orders

```typescript
// Thay đổi từ:
if (order.status !== OrderStatus.pending)

// Thành:
if (order.status !== OrderStatus.pending && order.status !== OrderStatus.confirmed)
```

#### 1.2 Xử Lý Variant Products Đúng Cách

```typescript
// ❌ HIỆN TẠI: Chỉ restore simple products
await tx.product.update({
  where: { id: product.id },
  data: { inStock: { increment: product.quantity } }
});

// ✅ CẦN SỬA: Xử lý cả variant products
for (const product of order.products as any[]) {
  if (product.variantId) {
    // Restore variant stock
    await tx.productVariant.update({
      where: { id: product.variantId },
      data: { stock: { increment: product.quantity } }
    });

    // Recalculate main product stock
    const totalStock = await tx.productVariant.aggregate({
      where: { productId: product.id, isActive: true },
      _sum: { stock: true }
    });

    await tx.product.update({
      where: { id: product.id },
      data: { inStock: totalStock._sum.stock || 0 }
    });
  } else {
    // Simple product
    await tx.product.update({
      where: { id: product.id },
      data: { inStock: { increment: product.quantity } }
    });
  }
}
```

### Phase 2: Tích Hợp Rollback Vào Các API Cancel

#### 2.1 User Cancel API

**File**: `src/app/api/orders/cancel/route.ts`

```typescript
// Thêm sau khi update order status thành công:
try {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  await fetch(`${baseUrl}/api/orders/rollback-inventory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      reason: `User cancelled: ${reason}`
    })
  });
} catch (rollbackError) {
  console.error('Error triggering inventory rollback:', rollbackError);
  // Log nhưng không fail toàn bộ operation
}
```

#### 2.2 Admin Cancel API

**File**: `src/app/api/orders/admin-cancel/route.ts`

```typescript
// Thêm sau khi update order status thành công:
try {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  await fetch(`${baseUrl}/api/orders/rollback-inventory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      reason: `Admin cancelled: ${reason}`
    })
  });
} catch (rollbackError) {
  console.error('Error triggering inventory rollback:', rollbackError);
  // Log nhưng không fail toàn bộ operation
}
```

#### 2.3 Discord Cancel API

**File**: `src/app/api/discord/interactions/route.ts`

```typescript
// Thêm sau khi update order status thành công (chỉ khi action === 'reject'):
if (action === 'reject') {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    await fetch(`${baseUrl}/api/orders/rollback-inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        reason: cancelReason
      })
    });
  } catch (rollbackError) {
    console.error('Error triggering inventory rollback:', rollbackError);
    // Log nhưng không fail toàn bộ operation
  }
}
```

### Phase 3: Xử Lý Edge Cases

#### 3.1 Kiểm Tra Trạng Thái Delivery

```typescript
// Chỉ restore inventory nếu chưa ship
if (order.deliveryStatus === 'not_shipped') {
  // Proceed with rollback
} else {
  // Log warning nhưng không rollback
  console.warn(`Order ${orderId} already shipped, skipping inventory rollback`);
}
```

#### 3.2 Idempotency Protection

```typescript
// Kiểm tra order đã bị cancel chưa để tránh double rollback
const order = await prisma.order.findUnique({
  where: { id: orderId },
  select: { status: true /* other fields */ }
});

if (order.status === OrderStatus.canceled) {
  return NextResponse.json({
    success: true,
    message: 'Order already cancelled, no rollback needed'
  });
}
```

## 🧪 Testing Plan

### Test Cases Cần Kiểm Tra:

1. **Simple Product Cancel**:

   - Tạo order với simple product → Cancel → Verify stock restored

2. **Variant Product Cancel**:

   - Tạo order với variant product → Cancel → Verify variant stock + main product stock restored

3. **Mixed Products Cancel**:

   - Tạo order với cả simple + variant → Cancel → Verify cả 2 loại đều restored

4. **Voucher Rollback**:

   - Tạo order với voucher → Cancel → Verify voucher usage count restored

5. **Different Cancel Methods**:

   - Test user cancel, admin cancel, Discord cancel → Tất cả đều restore inventory

6. **Edge Cases**:
   - Cancel order đã shipped → Không restore
   - Cancel order đã cancelled → Idempotent
   - Network failure trong rollback → Graceful handling

## 📝 Checklist Implementation

- [ ] **Phase 1**: Cải thiện rollback API

  - [ ] Support confirmed orders
  - [ ] Xử lý variant products đúng cách
  - [ ] Thêm delivery status check
  - [ ] Thêm idempotency protection

- [ ] **Phase 2**: Tích hợp vào cancel APIs

  - [ ] User cancel API
  - [ ] Admin cancel API
  - [ ] Discord cancel API

- [ ] **Phase 3**: Testing & Validation

  - [ ] Unit tests cho rollback logic
  - [ ] Integration tests cho cancel flows
  - [ ] Manual testing với UI

- [ ] **Phase 4**: Documentation & Monitoring
  - [ ] Update API documentation
  - [ ] Add monitoring/alerting cho rollback failures
  - [ ] Update README.md

## ⚠️ Lưu Ý Quan Trọng

1. **Không Fail Toàn Bộ Operation**: Nếu rollback fail, vẫn cho phép cancel order thành công
2. **Async Rollback**: Gọi rollback API async để không block user experience
3. **Audit Logging**: Đảm bảo tất cả rollback actions đều được log
4. **Transaction Safety**: Rollback API đã có transaction, các cancel API chỉ cần gọi
5. **Backward Compatibility**: Không breaking changes cho existing functionality

## 🔍 Phân Tích Thêm Về Variant Products

### Vấn Đề Hiện Tại Trong Rollback API:

```typescript
// ❌ HIỆN TẠI: Chỉ restore simple products
for (const product of order.products as any[]) {
  await tx.product.update({
    where: { id: product.id },
    data: { inStock: { increment: product.quantity } }
  });
}
```

### Cách Xử Lý Đúng:

1. **Kiểm tra product có variantId không**
2. **Nếu có variant**: Restore variant stock + recalculate main product stock
3. **Nếu simple**: Restore trực tiếp main product stock

### Tham Khảo Logic Từ Create Order:

<augment_code_snippet path="src/app/api/orders/create-payment-intent/route.ts" mode="EXCERPT">

```typescript
// 2a. Reserve variant inventory atomically
await tx.productVariant.update({
  where: { id: product.variantId },
  data: { stock: { decrement: product.quantity } }
});

// 2b. Update main product stock (sum of all variant stocks)
const totalStock = await tx.productVariant.aggregate({
  where: {
    productId: product.id,
    isActive: true
  },
  _sum: { stock: true }
});

await tx.product.update({
  where: { id: product.id },
  data: { inStock: totalStock._sum.stock || 0 }
});
```

</augment_code_snippet>

## 🚨 Các Trường Hợp Cần Xử Lý Đặc Biệt

### 1. Order Đã Shipped

- **Không restore inventory** vì hàng đã giao
- **Log warning** để tracking
- **Vẫn mark order as cancelled** cho audit trail

### 2. Double Cancellation

- **Kiểm tra status trước khi rollback**
- **Return success** nếu đã cancelled (idempotent)
- **Tránh double rollback** inventory

### 3. Partial Shipment (Future Enhancement)

- Hiện tại chưa support partial shipment
- Nếu có trong tương lai cần xử lý riêng từng item

### 4. Network Failures

- **Rollback API call fail**: Log error nhưng không fail cancel operation
- **User experience**: Cancel vẫn thành công từ UI perspective
- **Background job**: Có thể implement retry mechanism sau

## 📊 Impact Analysis

### Trước Khi Fix:

- ❌ User cancel order → Inventory không được restore
- ❌ Admin cancel order → Inventory không được restore
- ❌ Discord cancel order → Inventory không được restore
- ❌ Variant products → Rollback logic sai

### Sau Khi Fix:

- ✅ Tất cả cancel methods đều restore inventory
- ✅ Variant products được xử lý đúng cách
- ✅ Voucher rollback hoạt động đầy đủ
- ✅ Edge cases được handle gracefully
- ✅ Backward compatibility được đảm bảo

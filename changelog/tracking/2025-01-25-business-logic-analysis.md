# Business Logic Analysis & Critical Issues - 2025-01-25

## 🚨 CRITICAL ISSUES FOUND

### 1. **INVENTORY MANAGEMENT - RACE CONDITIONS**

#### ❌ Problem: No Atomic Stock Updates

**File:** `src/app/api/create-payment-intent/route.ts`

- Stock validation happens BEFORE order creation
- No inventory reservation during checkout process
- Multiple users can buy the same last item simultaneously

**Current Flow:**

```typescript
// 1. Check stock (line 50-54)
if (dbProduct.inStock < product.quantity) {
  errors.push('Insufficient stock');
}
// 2. Create order (line 347-363) - NO STOCK DEDUCTION
// 3. Stock only updated manually via updateStock API
```

#### 🔧 Required Fix:

```typescript
// Use database transactions
const createOrderWithInventory = async orderData => {
  return await prisma.$transaction(async tx => {
    // 1. Lock and reserve inventory
    // 2. Create order
    // 3. Deduct stock atomically
    // 4. Handle payment
  });
};
```

### 2. **VOUCHER SYSTEM - DOUBLE SPENDING**

#### ❌ Problem: Voucher Usage Not Tracked Properly

**Files:**

- `src/app/api/voucher/validate/route.ts` - Only validates
- `src/app/api/voucher/use/route.ts` - Separate usage tracking
- `src/app/api/create-payment-intent/route.ts` - No voucher usage recording

**Current Flow:**

```typescript
// 1. Validate voucher (lines 320-345)
if (voucherValidation.ok) {
  discountAmount = validationResult.discountAmount;
  // ❌ NO USAGE RECORDING HERE
}
// 2. Create order with voucher data
// 3. Voucher usage never recorded in UserVoucher table
```

#### 🔧 Required Fix:

- Record voucher usage atomically with order creation
- Implement voucher usage rollback on payment failure

### 3. **RETURN/EXCHANGE SYSTEM - INCOMPLETE**

#### ❌ Problem: Return System Not Implemented

**File:** `src/app/api/returns/[id]/process/route.ts`

- All return processing logic is commented out (lines 22-146)
- No inventory restoration on returns
- No refund processing logic

**Current State:**

```typescript
// TODO: Implement after schema sync
return NextResponse.json({
  success: true,
  message: 'Tính năng đổi/trả hàng sẽ được kích hoạt sau khi cập nhật database schema'
});
```

### 4. **ORDER STATUS TRANSITIONS - INCONSISTENT**

#### ❌ Problem: No Business Rules Validation

**Files:**

- `src/app/api/order/[id]/route.ts` - Direct status updates
- `src/app/(admin)/admin/manage-orders/ManageOrdersClient.tsx` - Multiple API calls

**Issues:**

- Can mark order as "delivered" without "in_transit"
- No validation of status transition rules
- Parallel API calls can cause inconsistent states

**Current Code:**

```typescript
// Lines 261-264 - Parallel updates without validation
await Promise.all([
  axios.put(`/api/order/${id}`, { status: OrderStatus.completed }),
  axios.put('/api/order', { id, deliveryStatus: DeliveryStatus.delivered })
]);
```

### 5. **PAYMENT SECURITY - MISSING VALIDATIONS**

#### ❌ Problem: Insufficient Payment Verification

**File:** `src/app/api/callbackMomo/route.ts`

- No signature verification (line 80-82 comments)
- Amount validation exists but insufficient
- No duplicate payment prevention

### 6. **PROMOTION SYSTEM - NOT IMPLEMENTED**

#### ❌ Problem: Promotion Logic Missing

**File:** `src/app/api/create-payment-intent/route.ts`

```typescript
// Lines 59-60: Promotion logic removed
// Note: Promotion logic removed as promotion fields don't exist in current Product model
// TODO: Implement promotion logic when ProductPromotion table is ready
```

## 🔧 RECOMMENDED FIXES

### Priority 1: Critical Security & Data Integrity

1. **Implement Atomic Order Creation**
2. **Fix Voucher Double-Spending**
3. **Add Payment Signature Verification**
4. **Implement Order Status Validation**

### Priority 2: Business Logic Completion

1. **Complete Return/Exchange System**
2. **Implement Promotion System**
3. **Add Inventory Restoration Logic**
4. **Implement Refund Processing**

### Priority 3: Performance & UX

1. **Add Inventory Reservation**
2. **Implement Real-time Stock Updates**
3. **Add Order Status Webhooks**
4. **Optimize Database Queries**

## 📊 IMPACT ASSESSMENT

### Financial Risk:

- **HIGH**: Inventory overselling
- **HIGH**: Voucher fraud
- **MEDIUM**: Payment fraud

### Operational Risk:

- **HIGH**: Inconsistent order states
- **MEDIUM**: Manual inventory management
- **LOW**: Missing return processing

### Customer Experience:

- **HIGH**: Order fulfillment issues
- **MEDIUM**: Voucher problems
- **LOW**: Status tracking confusion

## 🎯 IMPLEMENTATION PLAN

### Phase 1: Critical Fixes (Immediate - 1-2 days)

#### 1.1 Fix Inventory Race Conditions

**Files to modify:**

- `src/app/api/create-payment-intent/route.ts`
- `src/app/api/updateStock/[id]/route.ts`

**Implementation:**

```typescript
// Atomic order creation with inventory management
const createOrderWithInventory = async (orderData, products) => {
  return await prisma.$transaction(async tx => {
    // 1. Lock and validate inventory
    for (const product of products) {
      const dbProduct = await tx.product.findUnique({
        where: { id: product.id },
        select: { inStock: true }
      });

      if (dbProduct.inStock < product.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      // 2. Reserve inventory
      await tx.product.update({
        where: { id: product.id },
        data: { inStock: { decrement: product.quantity } }
      });
    }

    // 3. Create order
    const order = await tx.order.create({ data: orderData });
    return order;
  });
};
```

#### 1.2 Fix Voucher Double-Spending

**Files to modify:**

- `src/app/api/create-payment-intent/route.ts`
- `src/app/api/voucher/use/route.ts`

**Implementation:**

```typescript
// Atomic voucher usage with order creation
if (voucher) {
  await tx.userVoucher.create({
    data: {
      userId: currentUser.id,
      voucherId: voucher.id,
      usedAt: new Date(),
      orderId: order.id
    }
  });

  await tx.voucher.update({
    where: { id: voucher.id },
    data: { usedCount: { increment: 1 } }
  });
}
```

### Phase 2: Business Logic Completion (3-5 days)

#### 2.1 Implement Order Status Validation

**Files to modify:**

- `src/app/api/order/[id]/route.ts`
- `src/app/components/admin/kanban/KanbanBoard.tsx`

#### 2.2 Complete Return/Exchange System

**Files to modify:**

- `src/app/api/returns/[id]/process/route.ts`
- `prisma/schema.prisma` (add ReturnRequest model)

#### 2.3 Add Payment Signature Verification

**Files to modify:**

- `src/app/api/callbackMomo/route.ts`

### Phase 3: Advanced Features (1-2 weeks)

#### 3.1 Implement Promotion System

#### 3.2 Add Real-time Inventory Updates

#### 3.3 Implement Refund Processing

## 🚨 CRITICAL ACTIONS NEEDED NOW

1. **Stop production deployments** until inventory race condition is fixed
2. **Monitor voucher usage** for potential fraud
3. **Review recent orders** for inventory discrepancies
4. **Implement emergency stock alerts**

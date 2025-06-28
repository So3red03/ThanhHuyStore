# 🔧 DETAILED FIX PLAN - Critical Issues

## OVERVIEW
Kế hoạch sửa 3 vấn đề critical theo thứ tự ưu tiên, với code changes cụ thể và testing plan.

---

## 🎯 FIX #1: INVENTORY RACE CONDITION (Highest Priority)

### **Problem Analysis**
```typescript
// Current problematic flow in create-payment-intent/route.ts
// 1. Validate stock (line 50-54)
if (dbProduct.inStock < product.quantity) {
  errors.push("Insufficient stock");
}
// 2. Create order (line 347-363) - NO STOCK DEDUCTION
// 3. Stock only updated manually later
```

### **Solution: Atomic Transaction**
**Files to modify:**
- `src/app/api/create-payment-intent/route.ts`
- `src/app/api/updateStock/[id]/route.ts` (deprecate this)

### **Implementation Plan:**

#### Step 1: Create new atomic order function
```typescript
// Add to create-payment-intent/route.ts after line 100
const createOrderWithInventoryReservation = async (
  orderData: any, 
  products: CartProductType[], 
  currentUser: any
) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Validate and reserve inventory atomically
    for (const product of products) {
      const dbProduct = await tx.product.findUnique({
        where: { id: product.id },
        select: { id: true, name: true, inStock: true, price: true }
      });

      if (!dbProduct) {
        throw new Error(`Product ${product.name} not found`);
      }

      if (dbProduct.inStock < product.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${dbProduct.inStock}, Requested: ${product.quantity}`);
      }

      // 2. Reserve inventory immediately
      await tx.product.update({
        where: { id: product.id },
        data: { inStock: { decrement: product.quantity } }
      });
    }

    // 3. Create order after successful inventory reservation
    const order = await tx.order.create({
      data: orderData,
      include: { user: true }
    });

    return order;
  });
};
```

#### Step 2: Replace current order creation
```typescript
// Replace lines 347-400 in create-payment-intent/route.ts
try {
  const createdOrder = await createOrderWithInventoryReservation(
    orderData, 
    products, 
    currentUser
  );
  
  console.log(`Order created successfully: ${createdOrder.id}`);
  
  return NextResponse.json({
    paymentIntent: {
      id: payment_intent_id,
      amount: finalAmount,
      currency: 'vnd'
    },
    createdOrder
  });
} catch (inventoryError) {
  console.error('Inventory reservation failed:', inventoryError);
  return NextResponse.json(
    { 
      error: 'Order creation failed', 
      details: inventoryError.message 
    },
    { status: 400 }
  );
}
```

#### Step 3: Add inventory rollback on payment failure
```typescript
// Add new API endpoint: src/app/api/orders/rollback-inventory/route.ts
export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { products: true, status: true }
    });

    if (!order || order.status !== 'pending') {
      return NextResponse.json({ error: 'Invalid order for rollback' }, { status: 400 });
    }

    // Restore inventory
    await prisma.$transaction(async (tx) => {
      for (const product of order.products as any[]) {
        await tx.product.update({
          where: { id: product.id },
          data: { inStock: { increment: product.quantity } }
        });
      }

      // Mark order as cancelled
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'canceled', cancelReason: 'Payment failed - inventory restored' }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Rollback failed:', error);
    return NextResponse.json({ error: 'Rollback failed' }, { status: 500 });
  }
}
```

### **Testing Plan:**
1. **Concurrent Order Test**: 2 users buy same last item simultaneously
2. **Payment Failure Test**: Order created but payment fails
3. **Partial Stock Test**: Order with multiple items, some out of stock

---

## 🎯 FIX #2: VOUCHER DOUBLE-SPENDING

### **Problem Analysis**
```typescript
// Current flow in create-payment-intent/route.ts (lines 320-345)
if (voucherValidation.ok) {
  discountAmount = validationResult.discountAmount;
  voucherData = voucher;
  // ❌ NO USAGE RECORDING HERE
}
```

### **Solution: Atomic Voucher Usage**

#### Step 1: Modify voucher validation to include usage tracking
```typescript
// Update create-payment-intent/route.ts voucher section (lines 320-345)
if (voucher) {
  try {
    // Validate voucher with atomic usage tracking
    const voucherResult = await prisma.$transaction(async (tx) => {
      // 1. Re-validate voucher with lock
      const voucherData = await tx.voucher.findUnique({
        where: { id: voucher.id }
      });

      if (!voucherData || !voucherData.isActive) {
        throw new Error('Voucher not valid');
      }

      if (voucherData.quantity <= voucherData.usedCount) {
        throw new Error('Voucher out of stock');
      }

      // 2. Check user usage limit
      const userUsage = await tx.userVoucher.count({
        where: { userId: currentUser.id, voucherId: voucher.id }
      });

      if (userUsage >= voucherData.maxUsagePerUser) {
        throw new Error('User reached usage limit');
      }

      // 3. Reserve voucher usage
      await tx.userVoucher.create({
        data: {
          userId: currentUser.id,
          voucherId: voucher.id,
          usedAt: new Date(),
          reservedForOrderId: payment_intent_id // Temporary reservation
        }
      });

      await tx.voucher.update({
        where: { id: voucher.id },
        data: { usedCount: { increment: 1 } }
      });

      // 4. Calculate discount
      let discountAmount = 0;
      if (voucherData.discountType === 'PERCENTAGE') {
        discountAmount = (totalVND * voucherData.discountValue) / 100;
      } else {
        discountAmount = voucherData.discountValue;
      }

      return { voucherData, discountAmount };
    });

    discountAmount = voucherResult.discountAmount;
    finalAmount = originalAmount - discountAmount;
    voucherData = voucherResult.voucherData;

  } catch (voucherError) {
    console.error('Voucher processing failed:', voucherError);
    return NextResponse.json(
      { error: 'Voucher error', details: voucherError.message },
      { status: 400 }
    );
  }
}
```

#### Step 2: Update UserVoucher schema to support reservations
```typescript
// Add to prisma/schema.prisma in UserVoucher model
model UserVoucher {
  id                  String   @id @default(auto()) @map("_id") @db.ObjectId
  userId              String   @db.ObjectId
  voucherId           String   @db.ObjectId
  usedAt              DateTime @default(now())
  orderId             String?  @db.ObjectId  // Final order ID
  reservedForOrderId  String?  // Temporary reservation
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  voucher             Voucher  @relation(fields: [voucherId], references: [id], onDelete: Cascade)
}
```

#### Step 3: Confirm voucher usage after successful payment
```typescript
// Add to orders/process-payment/route.ts after line 25
// Confirm voucher usage
if (order.voucherId) {
  await prisma.userVoucher.updateMany({
    where: {
      userId: order.userId,
      voucherId: order.voucherId,
      reservedForOrderId: order.paymentIntentId
    },
    data: {
      orderId: order.id,
      reservedForOrderId: null // Clear reservation
    }
  });
}
```

### **Testing Plan:**
1. **Double Usage Test**: Same user tries to use voucher twice
2. **Concurrent Usage Test**: Multiple users use same limited voucher
3. **Payment Failure Test**: Voucher reservation rollback

---

## 🎯 FIX #3: PAYMENT SECURITY (MoMo Signature)

### **Problem Analysis**
```typescript
// Current callbackMomo/route.ts has no signature verification
// Lines 80-82 are just comments about missing verification
```

### **Solution: Implement HMAC Signature Verification**

#### Step 1: Add signature verification utility
```typescript
// Create new file: src/app/utils/momoSecurity.ts
import crypto from 'crypto';

export class MoMoSecurity {
  private static readonly SECRET_KEY = process.env.MOMO_SECRET_KEY;

  static verifySignature(data: any, receivedSignature: string): boolean {
    if (!this.SECRET_KEY) {
      console.error('MOMO_SECRET_KEY not configured');
      return false;
    }

    // Create signature string according to MoMo documentation
    const signatureString = [
      `accessKey=${data.accessKey}`,
      `amount=${data.amount}`,
      `extraData=${data.extraData || ''}`,
      `message=${data.message || ''}`,
      `orderId=${data.orderId}`,
      `orderInfo=${data.orderInfo || ''}`,
      `orderType=${data.orderType || ''}`,
      `partnerCode=${data.partnerCode}`,
      `payType=${data.payType || ''}`,
      `requestId=${data.requestId}`,
      `responseTime=${data.responseTime}`,
      `resultCode=${data.resultCode}`,
      `transId=${data.transId}`
    ].join('&');

    const expectedSignature = crypto
      .createHmac('sha256', this.SECRET_KEY)
      .update(signatureString)
      .digest('hex');

    return expectedSignature === receivedSignature;
  }

  static logSecurityEvent(event: string, data: any) {
    console.log(`[SECURITY] ${event}:`, {
      timestamp: new Date().toISOString(),
      ...data
    });
  }
}
```

#### Step 2: Update MoMo callback with signature verification
```typescript
// Update callbackMomo/route.ts - add after line 20
import { MoMoSecurity } from '@/app/utils/momoSecurity';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { signature, ...otherData } = body;

    // 1. Verify signature first
    if (!MoMoSecurity.verifySignature(otherData, signature)) {
      MoMoSecurity.logSecurityEvent('INVALID_SIGNATURE', {
        receivedSignature: signature,
        orderId: otherData.orderId
      });
      
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // 2. Verify required fields
    const { orderId, resultCode, amount } = otherData;
    if (!orderId || resultCode === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Continue with existing logic...
```

### **Testing Plan:**
1. **Valid Signature Test**: Normal payment flow
2. **Invalid Signature Test**: Tampered signature
3. **Missing Signature Test**: No signature provided
4. **Replay Attack Test**: Same signature used twice

---

## 📋 IMPLEMENTATION TIMELINE

### **Day 1: Inventory Fix**
- [ ] Implement atomic transaction function
- [ ] Update create-payment-intent endpoint
- [ ] Add rollback mechanism
- [ ] Test concurrent orders

### **Day 2: Voucher Fix**
- [ ] Update voucher validation logic
- [ ] Modify UserVoucher schema
- [ ] Add voucher confirmation
- [ ] Test double-spending scenarios

### **Day 3: Payment Security**
- [ ] Implement signature verification
- [ ] Update MoMo callback
- [ ] Add security logging
- [ ] Test signature validation

### **Day 4: Integration Testing**
- [ ] End-to-end order flow testing
- [ ] Performance testing
- [ ] Security testing
- [ ] Documentation update

## 🚨 ROLLBACK PLAN

Nếu có vấn đề, có thể rollback bằng cách:
1. Revert code changes
2. Restore database schema
3. Clear any test data
4. Monitor for issues

**Bạn có muốn tôi bắt đầu implement theo plan này không?**

# Logic Review & Potential Issues - 2025-01-25

## ✅ TYPESCRIPT ERRORS FIXED

All 14 TypeScript errors have been resolved:
- Fixed error type handling (unknown → Error type guards)
- Fixed PDFDocument type import
- Fixed unused variables
- Regenerated Prisma client with new schema fields

## 🔍 LOGIC REVIEW FINDINGS

### 1. **POTENTIAL RACE CONDITION IN VOUCHER VALIDATION**

**Issue:** In `validateAndReserveVoucher`, there's still a potential race condition:

```typescript
// 2. Check user usage limit
const userUsage = await tx.userVoucher.count({
  where: { userId: currentUser.id, voucherId: voucher.id }
});

if (userUsage >= voucherData.maxUsagePerUser) {
  throw new Error('User reached usage limit');
}

// 3. Reserve voucher usage
await tx.userVoucher.create({...});
```

**Problem:** Between checking usage count and creating reservation, another transaction could create a voucher usage.

**Solution:** Use atomic increment with constraint checking.

### 2. **MISSING VOUCHER ROLLBACK ON STRIPE PAYMENT INTENT CANCELLATION**

**Issue:** In create-payment-intent, when Stripe payment intent is cancelled, voucher is not rolled back:

```typescript
// Cancel the Stripe payment intent if order creation failed
try {
  await stripe.paymentIntents.cancel(paymentIntent.id);
} catch (cancelError) {
  console.error('Failed to cancel Stripe payment intent:', cancelError);
}
// ❌ Missing voucher rollback here
```

**Solution:** Add voucher rollback when Stripe payment intent is cancelled.

### 3. **PAYMENT_INTENT_ID GENERATION TIMING**

**Issue:** `payment_intent_id` is used before it's defined in some cases:

```typescript
const voucherResult = await validateAndReserveVoucher(
  voucher,
  totalVND,
  currentUser,
  payment_intent_id // ❌ This might be undefined
);
```

**Solution:** Generate payment_intent_id earlier or use a different identifier.

### 4. **MISSING INVENTORY ROLLBACK ON VOUCHER FAILURE**

**Issue:** If voucher validation fails after inventory is reserved, inventory is not rolled back:

```typescript
// Voucher validation happens AFTER inventory reservation
// If voucher fails, inventory stays reserved
```

**Solution:** Move voucher validation before inventory reservation OR add rollback.

### 5. **INCOMPLETE ERROR HANDLING IN MOMO PAYMENT**

**Issue:** MoMo payment creation can fail after order is created, but no rollback is triggered:

```typescript
// Order is created first
const createdOrder = await createOrderWithInventoryReservation(...);

// Then MoMo payment is created
// If MoMo fails, order exists but payment doesn't
```

**Solution:** Create order and payment atomically or add cleanup.

### 6. **MISSING TRANSACTION TIMEOUT HANDLING**

**Issue:** Long-running transactions might timeout without proper handling.

**Solution:** Add transaction timeout and retry logic.

### 7. **POTENTIAL MEMORY LEAK IN SECURITY LOGGING**

**Issue:** Security events are logged to console but not cleaned up:

```typescript
static logSecurityEvent(event: string, data: any) {
  console.log(`[SECURITY] ${event}:`, logEntry);
  // ❌ No cleanup, could accumulate in production
}
```

**Solution:** Implement log rotation or external logging service.

## 🔧 RECOMMENDED IMMEDIATE FIXES

### Priority 1: Critical Logic Issues

1. **Fix voucher validation race condition**
2. **Add voucher rollback for Stripe cancellation**
3. **Fix payment_intent_id timing**

### Priority 2: Robustness Improvements

4. **Add inventory rollback on voucher failure**
5. **Improve MoMo payment error handling**
6. **Add transaction timeout handling**

### Priority 3: Production Readiness

7. **Implement proper security logging**
8. **Add monitoring and alerting**
9. **Performance optimization**

## 🚨 CRITICAL FIXES NEEDED

### Fix 1: Voucher Race Condition
```typescript
// Instead of separate check and create, use upsert with constraint
await tx.userVoucher.upsert({
  where: { 
    userId_voucherId: { 
      userId: currentUser.id, 
      voucherId: voucher.id 
    }
  },
  create: { /* voucher data */ },
  update: { /* should not happen */ }
});
```

### Fix 2: Payment Intent ID Timing
```typescript
// Generate ID early
const payment_intent_id = `${Date.now()}-${currentUser.id}`;

// Use consistent ID across all payment methods
```

### Fix 3: Stripe Voucher Rollback
```typescript
} catch (inventoryError) {
  // Cancel Stripe payment intent
  await stripe.paymentIntents.cancel(paymentIntent.id);
  
  // Rollback voucher reservation
  if (voucherData) {
    await rollbackVoucherReservation(payment_intent_id, currentUser.id);
  }
}
```

## 📊 RISK ASSESSMENT

| Issue | Likelihood | Impact | Priority |
|-------|------------|--------|----------|
| Voucher Race Condition | HIGH | MEDIUM | P1 |
| Stripe Voucher Rollback | MEDIUM | HIGH | P1 |
| Payment ID Timing | MEDIUM | MEDIUM | P1 |
| Inventory Rollback | LOW | HIGH | P2 |
| MoMo Error Handling | LOW | MEDIUM | P2 |
| Transaction Timeout | LOW | LOW | P3 |

## 🎯 NEXT STEPS

1. **Immediate:** Fix P1 issues (voucher race, Stripe rollback, payment ID)
2. **Short-term:** Implement P2 improvements
3. **Long-term:** Add monitoring and optimization

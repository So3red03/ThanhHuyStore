# Return & Exchange API Documentation

This folder contains all APIs related to return and exchange functionality.

## 📁 API Structure

```
/api/orders/return-request/
├── route.ts                    # Main return/exchange request creation
├── [id]/route.ts              # Return/exchange request management (approve/reject/complete)
├── admin/route.ts             # Admin: Get all return/exchange requests
└── batch-get-orders/route.ts  # Utility: Get multiple orders by IDs
```

## 🔄 Return vs Exchange Flow

### **RETURN Flow (Trả hàng)**

```
1. POST /return-request          → Customer creates return request
2. PATCH /return-request/[id]    → Admin approve/reject/complete
   - approve: Reserve inventory
   - complete: Restore inventory + process refund
   - reject: Unreserve inventory
```

### **EXCHANGE Flow (Đổi hàng)**

```
1. POST /return-request          → Customer creates exchange request
2. PATCH /return-request/[id]    → Admin approve/reject/complete
   - approve: Reserve old inventory + Create new order + Cancel original order
   - complete: Restore old inventory (new order remains active)
   - reject: Unreserve + Cancel new order + Restore original order
3. POST /exchange-payment        → Handle payment for price difference (if needed)
```

## 🎯 Key Features

### **Automatic Exchange Order Creation**

- When admin approves exchange → System automatically:
  1. Creates new order for exchange product
  2. Cancels original order with reason "Exchanged to new order #XXX"
  3. Manages inventory (reserve old, reduce new)
  4. Calculates price difference

### **Robust Revert Logic**

- When admin rejects approved exchange → System automatically:
  1. Cancels the created exchange order
  2. Restores original order status
  3. Reverts all inventory changes

### **Price Difference Handling**

- Positive difference: Customer needs to pay more
- Negative difference: Customer gets refund
- Zero difference: No additional payment needed

## 🚨 Important Notes

1. **Exchange orders are auto-created** - No manual order creation needed
2. **Original orders are cancelled** when exchange is approved
3. **Inventory is properly managed** throughout the process
4. **All changes are reversible** if exchange is rejected
5. **Payment integration** is ready for COD, MoMo pending

## 🔧 Testing

Use the admin panel at `/admin/manage-returns` to test the full flow:

1. Create exchange request from customer side
2. Approve/reject from admin side
3. Verify order creation and inventory changes
4. Test payment flow for price differences

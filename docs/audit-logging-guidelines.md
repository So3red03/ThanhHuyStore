# Audit Logging Guidelines

## 🎯 **WHAT TO LOG (Critical Actions Only)**

### **✅ SHOULD LOG - Critical Business Actions**

#### **Product Management**
- ✅ `PRODUCT_CREATED` - Admin tạo sản phẩm mới
- ✅ `PRODUCT_UPDATED` - Admin cập nhật thông tin sản phẩm
- ✅ `PRODUCT_DELETED` - Admin xóa sản phẩm
- ✅ `INVENTORY_UPDATED` - Admin cập nhật số lượng tồn kho

#### **Order Management**
- ✅ `ORDER_STATUS_CHANGED` - Admin thay đổi trạng thái đơn hàng
- ✅ `ORDER_CANCELLED` - Admin hủy đơn hàng
- ✅ `ORDER_REFUNDED` - Admin hoàn tiền đơn hàng

#### **User Management**
- ✅ `USER_CREATED` - Admin tạo user mới
- ✅ `USER_UPDATED` - Admin cập nhật thông tin user
- ✅ `USER_DELETED` - Admin xóa user
- ✅ `USER_ROLE_CHANGED` - Admin thay đổi role user
- ✅ `USER_BANNED` - Admin ban user
- ✅ `USER_UNBANNED` - Admin unban user

#### **Content Management**
- ✅ `ARTICLE_CREATED` - Admin tạo bài viết
- ✅ `ARTICLE_UPDATED` - Admin cập nhật bài viết
- ✅ `ARTICLE_DELETED` - Admin xóa bài viết
- ✅ `ARTICLE_PUBLISHED` - Admin publish bài viết
- ✅ `ARTICLE_UNPUBLISHED` - Admin unpublish bài viết

#### **Voucher/Promotion Management**
- ✅ `VOUCHER_CREATED` - Admin tạo voucher
- ✅ `VOUCHER_UPDATED` - Admin cập nhật voucher
- ✅ `VOUCHER_DELETED` - Admin xóa voucher
- ✅ `PROMOTION_CREATED` - Admin tạo promotion
- ✅ `PROMOTION_UPDATED` - Admin cập nhật promotion
- ✅ `PROMOTION_DELETED` - Admin xóa promotion

#### **System Settings**
- ✅ `ADMIN_SETTINGS_UPDATED` - Admin thay đổi cài đặt hệ thống
- ✅ `PAYMENT_SETTINGS_CHANGED` - Admin thay đổi cài đặt thanh toán
- ✅ `SHIPPING_SETTINGS_CHANGED` - Admin thay đổi cài đặt vận chuyển

#### **Security Events**
- ✅ `ADMIN_LOGIN` - Admin đăng nhập (chỉ login, không log logout)
- ✅ `FAILED_LOGIN_ATTEMPT` - Thất bại đăng nhập
- ✅ `SUSPICIOUS_ORDER` - Đơn hàng đáng ngờ
- ✅ `PAYMENT_FAILED` - Thanh toán thất bại
- ✅ `RATE_LIMIT_EXCEEDED` - Vượt quá rate limit

---

## ❌ **WHAT NOT TO LOG (Non-Critical Actions)**

### **❌ SHOULD NOT LOG - View/Read Actions**
- ❌ `Admin viewed audit logs`
- ❌ `Admin viewed dashboard`
- ❌ `Admin viewed products list`
- ❌ `Admin viewed orders list`
- ❌ `Admin viewed users list`
- ❌ `Admin searched products`
- ❌ `Admin filtered orders`

### **❌ SHOULD NOT LOG - Development/Testing**
- ❌ `Admin generated test data`
- ❌ `Admin cleared test data`
- ❌ `Admin ran development tools`
- ❌ `Admin accessed test features`

### **❌ SHOULD NOT LOG - Minor UI Actions**
- ❌ `Admin changed page size`
- ❌ `Admin sorted table`
- ❌ `Admin expanded/collapsed sections`
- ❌ `Admin refreshed data`

---

## 🔧 **IMPLEMENTATION GUIDELINES**

### **Severity Levels**
```typescript
// HIGH - Critical business impact
USER_DELETED, PRODUCT_DELETED, ORDER_CANCELLED, PAYMENT_FAILED

// MEDIUM - Important business actions  
PRODUCT_CREATED, ORDER_STATUS_CHANGED, USER_ROLE_CHANGED, SETTINGS_UPDATED

// LOW - Regular business operations
PRODUCT_UPDATED, ARTICLE_CREATED, VOUCHER_CREATED, ADMIN_LOGIN
```

### **Categories**
```typescript
ADMIN     // Admin management actions (users, products, content)
SECURITY  // Security-related events (login, suspicious activity)
BUSINESS  // Business operations (orders, payments, inventory)
SYSTEM    // System configuration changes
```

### **Example Usage**
```typescript
// ✅ GOOD - Log critical action
await AuditLogger.log({
  eventType: AuditEventType.PRODUCT_DELETED,
  severity: AuditSeverity.HIGH,
  userId: adminId,
  userEmail: adminEmail,
  description: `Product deleted: ${productName}`,
  details: { productId, productName, reason },
  resourceId: productId,
  resourceType: 'Product'
});

// ❌ BAD - Don't log view actions
// await AuditLogger.log({ eventType: 'ADMIN_VIEWED_PRODUCTS' });
```

---

## 📊 **BENEFITS OF FOCUSED LOGGING**

### **✅ Advantages**
- 🎯 **Focused on important events** - Easy to find critical actions
- 📊 **Clean audit trail** - No noise from view actions
- 🔍 **Better compliance** - Clear record of business-critical changes
- ⚡ **Better performance** - Less database writes
- 💾 **Storage efficient** - Smaller audit log size

### **🎯 **AUDIT TRAIL PURPOSE**
- 📋 **Compliance** - Who did what critical action when
- 🔍 **Investigation** - Track down issues and changes
- 📊 **Business intelligence** - Understand admin behavior patterns
- 🔐 **Security** - Detect unauthorized critical actions

---

## 🚀 **CURRENT IMPLEMENTATION STATUS**

✅ **Removed unnecessary logging:**
- ❌ Admin viewed audit logs
- ❌ Admin generated test data  
- ❌ Admin cleared test data

✅ **Focus on critical actions:**
- ✅ Product CRUD operations
- ✅ Order management
- ✅ User management  
- ✅ Content management
- ✅ System settings changes
- ✅ Security events

This approach ensures our audit logs are **meaningful, focused, and compliant** with business requirements.

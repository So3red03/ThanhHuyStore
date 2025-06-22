# Settings Integration - Test Guide

## 🧪 **CÁCH TEST SETTINGS**

### **1. Test Payment Methods**

#### **Bước 1: Vào Settings**
1. Đăng nhập admin
2. Vào `/admin/settings`
3. Click tab "Hệ thống & Bảo mật"
4. Scroll xuống phần "Phương thức thanh toán"

#### **Bước 2: Thay đổi settings**
- ✅ **Bật COD** - Tắt MoMo và Stripe
- ✅ **Bật MoMo** - Tắt COD và Stripe  
- ✅ **Bật Stripe** - Tắt COD và MoMo
- ❌ **Tắt tất cả** - Test warning message

#### **Bước 3: Test Checkout**
1. Thêm sản phẩm vào giỏ hàng
2. Vào `/cart/checkout`
3. Kiểm tra phần "Chọn hình thức thanh toán"
4. **Kết quả mong đợi**:
   - Chỉ hiển thị phương thức được bật
   - Ẩn phương thức bị tắt
   - Hiển thị warning nếu tắt tất cả

### **2. Test Settings Debug**

#### **Debug Component**
Trong checkout page có component `SettingsTest` hiển thị:
- ✅/❌ Status của từng payment method
- 📋 Danh sách enabled methods
- 🔧 Raw settings data

#### **Console Logs**
Mở Developer Tools để xem:
- Settings loading process
- API calls (nếu có)
- Error messages

### **3. Test Cases**

#### **Case 1: Chỉ COD**
```
Settings: COD=true, MoMo=false, Stripe=false
Expected: Chỉ hiển thị COD option
```

#### **Case 2: COD + MoMo**
```
Settings: COD=true, MoMo=true, Stripe=false
Expected: Hiển thị COD và MoMo options
```

#### **Case 3: Tất cả bật**
```
Settings: COD=true, MoMo=true, Stripe=true
Expected: Hiển thị cả 3 options
```

#### **Case 4: Tất cả tắt**
```
Settings: COD=false, MoMo=false, Stripe=false
Expected: Hiển thị warning message đỏ
```

## 🔧 **TECHNICAL IMPLEMENTATION**

### **Files Created/Updated:**

#### **1. useSettings Hook**
- `src/app/hooks/useSettings.ts`
- Load settings từ localStorage
- Fallback to API nếu cần
- Provide helper functions

#### **2. Settings API**
- `src/app/api/settings/route.ts`
- Public endpoint cho payment settings
- Fallback cho client-side

#### **3. CheckoutClient Integration**
- `src/app/(home)/cart/checkout/CheckoutClient.tsx`
- Conditional rendering payment methods
- Validation before payment
- Debug component

#### **4. Debug Component**
- `src/app/components/SettingsTest.tsx`
- Visual settings status
- Raw data viewer

### **Settings Flow:**

```
1. Admin changes settings in /admin/settings
   ↓
2. Settings saved to localStorage
   ↓
3. CheckoutClient loads settings via useSettings hook
   ↓
4. Payment methods rendered conditionally
   ↓
5. Validation before payment processing
```

## 🚨 **TROUBLESHOOTING**

### **Settings không áp dụng:**
1. ✅ Check localStorage có `adminSettings` key
2. ✅ Refresh trang checkout
3. ✅ Check console errors
4. ✅ Verify settings format

### **Tất cả payment methods ẩn:**
1. ✅ Check settings: ít nhất 1 method = true
2. ✅ Check useSettings hook loading
3. ✅ Verify default settings

### **Debug Steps:**
1. Mở Developer Tools
2. Check Application → Local Storage → `adminSettings`
3. Check Console cho error messages
4. Verify SettingsTest component data

## 📱 **PRODUCTION NOTES**

### **Remove Debug Component:**
```tsx
// Remove this line in production
<SettingsTest />
```

### **API Integration:**
- Settings hiện tại lưu trong localStorage
- Có thể mở rộng lưu vào database
- API endpoint `/api/settings` đã sẵn sàng

### **Security:**
- Payment settings chỉ admin mới thay đổi được
- Client-side validation + server-side validation
- Fallback to safe defaults

## ✅ **EXPECTED RESULTS**

### **Khi test thành công:**
- ✅ Settings thay đổi ngay lập tức
- ✅ Checkout chỉ hiển thị methods được bật
- ✅ Warning hiển thị khi tắt tất cả
- ✅ Validation hoạt động đúng
- ✅ Debug component hiển thị đúng data

### **Settings hoạt động 100%:**
- ✅ Payment methods control
- ✅ Real-time updates
- ✅ Proper validation
- ✅ User-friendly warnings
- ✅ Admin control

**Test ngay để xác nhận settings đã hoạt động!** 🎯

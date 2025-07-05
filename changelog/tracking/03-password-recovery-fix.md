# Password Recovery System Fix

## 🎯 **Mục tiêu**

- Fix logic thời gian hết hạn token (hiện tại không hoạt động đúng)
- Tạo page xử lý password reset với token
- Sử dụng component có sẵn trong hệ thống
- Enhance giao diện PasswordRecoveryModal

## 🐛 **Vấn đề hiện tại**

### 1. Logic thời gian hết hạn sai

```typescript
// ❌ SAI: src/app/api/password/route.ts:22
expires.setMinutes(expires.getSeconds() + 30); // Đang set minutes = seconds + 30

// ✅ ĐÚNG: Nên là
expires.setMinutes(expires.getMinutes() + 5); // Thêm 5 phút
```

### 2. Link trong email không hoạt động

- Link: `http://localhost:3000/passwordrecovery/${existingUser.id}`
- Page `/passwordrecovery/[id]` không tồn tại (đã bị xóa trong auth modal migration)
- API endpoint `/api/password/[id]` expect token nhưng link gửi user ID

### 3. Logic không nhất quán

- Email gửi user ID nhưng API expect token
- Cần sử dụng token thay vì user ID

## 📋 **Plan thực hiện**

### **Phase 1: Fix API Logic**

- [x] Fix thời gian hết hạn token trong `/api/password/route.ts`
- [x] Sửa link trong email sử dụng token thay vì user ID
- [ ] Test API với token hợp lệ và hết hạn

### **Phase 2: Tạo Password Reset Page**

- [x] Tạo `src/app/(home)/passwordrecovery/[token]/page.tsx`
- [x] Tạo `PasswordResetClient.tsx` component
- [x] Sử dụng các component có sẵn: Input, Button, Heading, Container
- [x] Implement logic kiểm tra token hợp lệ
- [x] Tạo API endpoint `/api/password/[id]/validate/route.ts`

### **Phase 3: Enhance PasswordRecoveryModal**

- [x] Cải thiện UI/UX của modal hiện tại
- [x] Thêm loading states và error handling
- [x] Thêm success state với email confirmation
- [x] Responsive design improvements

### **Phase 4: Testing & Validation**

- [ ] Test complete flow: request → email → reset → success
- [ ] Test token expiration
- [ ] Test invalid token handling
- [ ] Mobile responsiveness

## 🎨 **Component Architecture**

### Sử dụng components có sẵn:

- `Input` - cho email và password fields
- `Button` - cho submit actions
- `Heading` - cho titles
- `Container` - cho layout
- `FormWrap` - cho form wrapper
- `NullData` - cho error states

### New components cần tạo:

- `PasswordResetClient` - main reset form component
- `PasswordResetForm` - form logic component

## 🔧 **Technical Details**

### API Changes:

1. Fix token expiration logic
2. Update email link to use token
3. Ensure consistent token validation

### Page Structure:

```
src/app/(home)/passwordrecovery/[token]/
├── page.tsx (Server Component)
└── PasswordResetClient.tsx (Client Component)
```

### Flow:

1. User requests password reset → PasswordRecoveryModal
2. Email sent with token link → `/passwordrecovery/[token]`
3. User clicks link → PasswordResetClient validates token
4. User enters new password → API updates password
5. Success → redirect to login

## ✅ **Success Criteria**

- [ ] Token expires correctly after 5 minutes
- [ ] Link in email works and shows reset form
- [ ] Invalid/expired tokens show appropriate error
- [ ] Password reset completes successfully
- [ ] Enhanced UI/UX for better user experience
- [ ] Mobile responsive design

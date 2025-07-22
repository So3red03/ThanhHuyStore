# 🚀 HƯỚNG DẪN CẬP NHẬT DATABASE CHO 2 TÍNH NĂNG MỚI

## 📋 Tổng quan
Đã thêm 2 tính năng mới vào hệ thống:
1. **Wishlist (Yêu thích sản phẩm)** - Cho phép user lưu sản phẩm yêu thích
2. **Account Blocking (Khóa tài khoản)** - Cho phép admin/staff khóa tài khoản user

## 🔧 Các thay đổi Schema

### User Model - Đã thêm các fields:
```prisma
// Wishlist feature - Tính năng yêu thích sản phẩm
favoriteProductIds String[] @db.ObjectId @default([])

// Account blocking feature - Tính năng khóa tài khoản
isBlocked Boolean? @default(false)
blockedAt DateTime?
blockedBy String? // ID của admin/staff thực hiện khóa
blockReason String? // Lý do khóa tài khoản
```

## ⚠️ QUAN TRỌNG - Cách cập nhật Database an toàn

### Bước 1: Generate Prisma Client
```bash
npx prisma generate
```

### Bước 2: Push schema changes (KHÔNG dùng --force-reset)
```bash
npx prisma db push
```

**LƯU Ý**: 
- ✅ KHÔNG sử dụng `--force-reset` để tránh mất dữ liệu
- ✅ Tất cả fields mới đều là optional hoặc có default value
- ✅ MongoDB sẽ tự động thêm fields mới mà không ảnh hưởng dữ liệu cũ

### Bước 3: Kiểm tra kết quả
```bash
npx prisma studio
```

## 📁 Files đã tạo/cập nhật

### API Endpoints:
- `src/app/api/user/favorites/route.ts` - CRUD wishlist
- `src/app/api/user/favorites/[productId]/route.ts` - Check favorite status
- `src/app/api/admin/users/[id]/block/route.ts` - Block/unblock user

### Components & Hooks:
- `src/app/hooks/useFavorites.ts` - React hook cho wishlist
- `src/app/components/products/FavoriteButton.tsx` - Button yêu thích
- `src/app/components/admin/BlockUserModal.tsx` - Modal khóa tài khoản
- `src/app/wishlist/page.tsx` - Trang wishlist

### Updated Files:
- `prisma/schema.prisma` - Thêm fields mới
- `src/app/actions/getCurrentUser.ts` - Thêm check blocked + getCurrentUserForAdmin

## 🧪 Testing Plan

### 1. Test Wishlist Feature:
- [ ] Thêm sản phẩm vào wishlist
- [ ] Xóa sản phẩm khỏi wishlist  
- [ ] Xem trang wishlist
- [ ] Check favorite status

### 2. Test Account Blocking:
- [ ] Admin khóa tài khoản user
- [ ] User bị khóa không thể đăng nhập
- [ ] Admin mở khóa tài khoản
- [ ] User có thể đăng nhập lại
- [ ] Audit log được ghi đúng

### 3. Test Security:
- [ ] User không thể khóa admin
- [ ] Staff không thể khóa admin
- [ ] Không thể tự khóa chính mình
- [ ] Audit log ghi đầy đủ thông tin

## 🔐 Security Features

### Wishlist:
- Chỉ user đăng nhập mới sử dụng được
- Mỗi user chỉ quản lý wishlist của mình
- Validate productId tồn tại

### Account Blocking:
- Chỉ ADMIN và STAFF có quyền
- Không thể khóa ADMIN (trừ ADMIN khóa ADMIN)
- Không thể tự khóa chính mình
- Bắt buộc nhập lý do khóa
- Ghi audit log đầy đủ

## 🚀 Next Steps

1. **Chạy lệnh cập nhật database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

2. **Test các tính năng mới**

3. **Tích hợp vào UI hiện có**:
   - Thêm FavoriteButton vào ProductCard
   - Thêm link Wishlist vào navigation
   - Thêm button Block/Unblock vào admin user management

4. **Optional enhancements**:
   - Thêm notification khi bị khóa tài khoản
   - Export/import wishlist
   - Wishlist sharing
   - Bulk block/unblock users

## 📊 Performance Considerations

### Wishlist:
- MongoDB array operations rất nhanh
- Index trên favoriteProductIds nếu cần
- Pagination cho wishlist lớn

### Account Blocking:
- Index trên isBlocked field
- Cache blocked users list
- Audit log cleanup strategy

---

**Tác giả**: AI Assistant  
**Ngày tạo**: 2025-01-22  
**Version**: 1.0

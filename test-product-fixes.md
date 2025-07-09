# Test Plan - Product Variant Fixes

## 🎯 **Các vấn đề đã sửa:**

### 1. **Hiển thị hình ảnh sản phẩm biến thể**
- ✅ Sửa logic tìm variant có hình ảnh đầu tiên
- ✅ Fallback về hình ảnh chính nếu variant không có hình
- ✅ Xử lý cấu trúc hình ảnh đúng cho cả simple và variant

### 2. **Vấn đề description rỗng**
- ✅ Đồng bộ Editor với form state
- ✅ Load description từ initialData khi edit
- ✅ Cập nhật setValue khi text thay đổi

### 3. **Edit mode cho sản phẩm biến thể**
- ✅ Load đúng variants và attributes từ database
- ✅ Hiển thị tabs Thuộc tính và Biến thể
- ✅ Mapping đúng cấu trúc dữ liệu

### 4. **Xóa hình ảnh Firebase**
- ✅ Xử lý đúng cấu trúc URL Firebase
- ✅ Xóa hình ảnh từ cả main product và variants
- ✅ Extract path từ Firebase URL

### 5. **API Update cho variant products**
- ✅ Hỗ trợ update variants và attributes
- ✅ Sử dụng transaction để đảm bảo consistency
- ✅ Xóa và tạo lại variants/attributes

## 🧪 **Test Cases:**

### Test 1: Hiển thị hình ảnh
1. Tạo sản phẩm biến thể với hình ảnh
2. Kiểm tra hiển thị trong danh sách
3. Verify hình ảnh từ variant đầu tiên

### Test 2: Edit sản phẩm biến thể
1. Click edit sản phẩm biến thể
2. Kiểm tra tabs Thuộc tính và Biến thể hiển thị
3. Verify dữ liệu load đúng

### Test 3: Description
1. Edit sản phẩm có description
2. Kiểm tra description hiển thị trong editor
3. Thay đổi và save

### Test 4: Xóa sản phẩm
1. Xóa sản phẩm simple có hình ảnh
2. Xóa sản phẩm variant có hình ảnh
3. Verify hình ảnh bị xóa khỏi Firebase

## 🔧 **Cách test:**

1. **Build và chạy ứng dụng:**
```bash
cd D:\ThanhHuyStore
pnpm build
pnpm start
```

2. **Truy cập admin panel:**
- Đăng nhập với tài khoản admin
- Vào /admin/manage-products

3. **Test từng case:**
- Kiểm tra hiển thị hình ảnh
- Test edit sản phẩm biến thể
- Test description
- Test xóa sản phẩm

## 📝 **Expected Results:**

### ✅ **Hiển thị hình ảnh:**
- Sản phẩm simple: hiển thị hình đầu tiên
- Sản phẩm variant: hiển thị hình từ variant có ảnh đầu tiên

### ✅ **Edit sản phẩm biến thể:**
- Tab "Thuộc tính" hiển thị các attributes
- Tab "Biến thể" hiển thị danh sách variants
- Dữ liệu load đúng từ database

### ✅ **Description:**
- Hiển thị đúng nội dung khi edit
- Lưu được thay đổi

### ✅ **Xóa sản phẩm:**
- Xóa được sản phẩm khỏi database
- Xóa được hình ảnh khỏi Firebase
- Không có lỗi console

## 🚨 **Potential Issues:**

1. **Firebase permissions** - cần kiểm tra quyền xóa
2. **Database constraints** - variants có thể có foreign key
3. **Image URL format** - cần handle các format URL khác nhau

## 📊 **Monitoring:**

- Check console logs cho errors
- Monitor Firebase storage
- Verify database consistency
- Check audit logs

---

**Note:** Nếu có lỗi, check console và logs để debug chi tiết.

# Tính năng Bảo hành - ThanhHuy Store

## 1. Phân tích nghiệp vụ thực tế

### 1.1 Quy trình bảo hành trong thực tế

```
Khách hàng mua sản phẩm → Nhận sản phẩm + phiếu bảo hành → Sử dụng
                                                                ↓
Sản phẩm lỗi → Mang đến cửa hàng → Kiểm tra bảo hành → Xử lý
                                        ↓
                    Trong thời hạn BH → Sửa chữa/Thay thế/Hoàn tiền
                    Hết thời hạn BH → Từ chối hoặc sửa có phí
```

### 1.2 Các loại bảo hành phổ biến

- **Bảo hành nhà sản xuất**: Apple, Samsung (12-24 tháng)
- **Bảo hành cửa hàng**: ThanhHuy Store (6-12 tháng)
- **Bảo hành mở rộng**: Khách hàng mua thêm (24-36 tháng)

### 1.3 Điều kiện bảo hành

- ✅ **Được bảo hành**: Lỗi kỹ thuật, lỗi nhà sản xuất
- ❌ **Không được bảo hành**: Rơi vỡ, vào nước, tự sửa chữa

## 2. Áp dụng cho dự án ThanhHuy Store

### 2.1 Mục tiêu tính năng

- **Quản lý thời hạn bảo hành** cho từng sản phẩm đã bán
- **Tạo yêu cầu bảo hành** từ khách hàng
- **Xử lý yêu cầu bảo hành** từ admin/staff
- **Theo dõi lịch sử bảo hành** của sản phẩm

### 2.2 Phạm vi tính năng (cho đồ án - SIMPLIFIED)

- ✅ **Extend Order model** với warranty fields (tận dụng structure hiện có)
- ✅ **Tạo yêu cầu bảo hành** từ customer (tương tự return request)
- ✅ **Admin xử lý yêu cầu** (approve/reject/complete - reuse return logic)
- ✅ **Hiển thị trạng thái bảo hành** trên UI
- ❌ **Separate warranty models** (quá phức tạp cho 1 người)
- ❌ **Complex warranty policies** (chỉ cần Apple standard 12 tháng)

## 3. Thiết kế Database (SIMPLIFIED)

### 3.1 Tận dụng models hiện có

```typescript
// Extend Order model (không tạo model mới)
model Order {
  // Existing fields...

  // Warranty fields
  warrantyEndDate?: DateTime  // Ngày hết hạn BH (12 tháng từ createdAt)
  warrantyStatus?: WarrantyStatus @default(ACTIVE)
}

// Extend ReturnRequest model (reuse cho warranty)
model ReturnRequest {
  // Existing fields...
  type: ReturnType // RETURN | EXCHANGE | WARRANTY (thêm WARRANTY)
}

// Chỉ cần thêm 1 enum
enum WarrantyStatus {
  ACTIVE      // Đang trong thời hạn BH
  EXPIRED     // Hết hạn BH
  VOIDED      // Hủy bảo hành
}
```

### 3.2 Logic đơn giản

- **Apple products**: Tự động 12 tháng bảo hành
- **Warranty calculation**: `warrantyEndDate = order.createdAt + 12 months`
- **Warranty request**: Sử dụng ReturnRequest với `type: "WARRANTY"`

## 4. API Design (SIMPLIFIED)

### 4.1 Tận dụng APIs hiện có

```typescript
// Extend existing return APIs
GET    /api/orders/return-request              // Include WARRANTY type
POST   /api/orders/return-request              // Support WARRANTY creation
GET    /api/orders/return-request/[id]         // Handle WARRANTY requests
PUT    /api/orders/return-request/[id]         // Process WARRANTY requests

// Extend order APIs
GET    /api/orders/[id]                        // Include warranty status
POST   /api/orders/[id]/warranty-check         // Check warranty validity
```

### 4.2 Warranty-specific logic

```typescript
// Auto warranty creation khi order completed
Order.status = "completed" →
  Calculate warrantyEndDate = createdAt + 12 months →
  Set warrantyStatus = ACTIVE

// Warranty request validation
Check order.warrantyEndDate > current date →
Create ReturnRequest with type: "WARRANTY"
```

## 5. UI Integration (SIMPLIFIED)

### 5.1 Tận dụng UI hiện có

- **Warranty tab** trong `/account/orders` (cùng với returns)
- **Warranty request modal** tương tự return request modal
- **Admin warranty management** trong existing returns management

### 5.2 Warranty status display

```typescript
// Trong OrdersClient.tsx
{
  order.warrantyStatus === 'ACTIVE' && (
    <div className='warranty-status'>
      🛡️ Bảo hành đến: {formatDate(order.warrantyEndDate)}
      <button onClick={() => openWarrantyModal(order)}>Tạo yêu cầu bảo hành</button>
    </div>
  );
}
```

## 6. Kết luận - Approach đơn giản

### 6.1 Tóm tắt simplified approach

- ✅ **Không tạo models mới** - Extend Order và ReturnRequest
- ✅ **Tận dụng UI hiện có** - Warranty tab trong orders page
- ✅ **Reuse return logic** - Warranty request = ReturnRequest với type "WARRANTY"
- ✅ **Apple standard** - Tất cả sản phẩm 12 tháng bảo hành
- ✅ **Minimal code changes** - Phù hợp cho 1 người làm

### 6.2 Implementation steps

1. **Database**: Thêm warrantyEndDate, warrantyStatus vào Order model
2. **API**: Extend return APIs để support WARRANTY type
3. **UI**: Thêm warranty display trong existing order pages
4. **Logic**: Auto calculate warranty khi order completed

### 6.3 Benefits

- 🚀 **Nhanh chóng implement** - Tận dụng code hiện có
- 🎯 **Đáp ứng nghiệp vụ** - Vẫn professional và đầy đủ
- 🔧 **Dễ maintain** - Không phức tạp hóa architecture
- 📱 **User-friendly** - Consistent với UI hiện tại

**Approach này sẽ giúp implement warranty feature nhanh chóng và hiệu quả cho đồ án tốt nghiệp!** 🚀

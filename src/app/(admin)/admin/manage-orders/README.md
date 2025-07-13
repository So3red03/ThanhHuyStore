# Quản lý Đơn hàng (Order Management)

## Nghiệp vụ chuyển trạng thái

### 🔄 Quy tắc chuyển trạng thái OrderStatus

```
pending → confirmed → completed
pending → canceled
confirmed → canceled (chỉ khi deliveryStatus = not_shipped)
```

**Giải thích:**

- `pending`: Đơn hàng mới, chờ xác nhận thanh toán
- `confirmed`: Đã thanh toán, có thể bắt đầu xử lý
- `completed`: Đơn hàng hoàn tất toàn bộ quy trình
- `canceled`: Đơn hàng bị hủy (không thể hoàn tác)

### 🚚 Quy tắc chuyển trạng thái DeliveryStatus

```
not_shipped → in_transit → delivered
```

**Giải thích:**

- `not_shipped`: Chưa giao hàng, đang chuẩn bị
- `in_transit`: Đang vận chuyển
- `delivered`: Đã giao thành công

### ❌ Các chuyển đổi KHÔNG được phép

1. **Không thể hoàn tác thanh toán**: `confirmed` → `pending`
2. **Không thể hoàn tác hoàn thành**: `completed` → bất kỳ trạng thái nào
3. **Không thể hoàn tác hủy đơn**: `canceled` → bất kỳ trạng thái nào
4. **Không thể hoàn tác giao hàng**: `delivered` → `in_transit`
5. **Không thể hủy đơn đã giao**: `confirmed` + `in_transit/delivered` → `canceled`

### Hàm kiểm tra chuyển trạng thái

```typescript
const canTransitionOrderStatus = (
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  deliveryStatus?: DeliveryStatus | null
): boolean => {
  // Logic validation chi tiết
};

const canTransitionDeliveryStatus = (
  currentDelivery: DeliveryStatus | null,
  newDelivery: DeliveryStatus,
  orderStatus: OrderStatus
): boolean => {
  // Logic validation chi tiết
};
```

### UI Components thông minh

- **Dropdown có điều kiện**: Chỉ hiện options hợp lệ
- **Action buttons**: Ẩn/hiện dựa trên trạng thái
- **Drag & Drop**: Validate trước khi thực hiện

## API Endpoints

### Cập nhật trạng thái đơn hàng

- `PUT /api/orders/[id]` - Cập nhật OrderStatus
- `PUT /api/orders` - Cập nhật DeliveryStatus

### Lấy danh sách

- `GET /api/orders` - Lấy tất cả đơn hàng (admin only)

### Thêm đơn hàng

- `POST /api/orders/admin-create` - Tạo đơn hàng từ admin

## Audit Trail

Mọi thay đổi trạng thái đều được ghi log với:

- User thực hiện
- Thời gian thay đổi
- Trạng thái cũ → mới
- IP address và User Agent
- Chi tiết đơn hàng

## Hướng mở rộng tương lai

### 🔄 Tính năng hoàn trả (Return System)

**Trạng thái mở rộng:**

```
delivered → returning → returned
```

**Tính năng dự kiến:**

- **Return Request**: Khách hàng yêu cầu hoàn trả
- **Return Approval**: Admin duyệt yêu cầu
- **Return Processing**: Xử lý hoàn trả
- **Refund**: Hoàn tiền tự động

**Implementation Notes:**

- Thêm `returnReason`, `returnDate` vào Order model
- Tạo ReturnRequest model riêng
- API endpoints cho return workflow
- Email notifications cho return process
- Integration với payment gateway để refund

### 🚀 Tính năng khác

1. **Bulk Operations**: Cập nhật nhiều đơn hàng cùng lúc
2. **Advanced Analytics**: Báo cáo chi tiết theo trạng thái
3. **Automated Workflows**: Tự động chuyển trạng thái theo điều kiện
4. **Integration**: Kết nối với shipping providers
5. **Mobile App**: Ứng dụng mobile cho delivery staff

## Best Practices

### 🔒 Security

- Chỉ admin mới có quyền cập nhật trạng thái
- Validate mọi input từ client
- Log mọi thay đổi quan trọng

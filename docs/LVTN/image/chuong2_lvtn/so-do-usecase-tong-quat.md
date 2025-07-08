# Sơ đồ Use Case Tổng Quát - Hình 2-2

```
                    Sơ đồ use case tổng quát ThanhHuyStore

    Khách hàng                                                           Quản trị viên
        │                                                                      │
        │ <<include>>                                                          │
        ├─ Đăng ký tài khoản                                                  │
        │                                                                      │
        ├─ Đăng nhập (Email/Google) ──────────────────────────────────────── ├─ Đăng nhập Admin
        │                                                                      │
        │ <<include>>                                                          │
        ├─ Tìm kiếm sản phẩm Apple ───────────────────────────────────────── ├─ Quản lý sản phẩm Apple
        │                                                                      │
        │ <<include>>                                                          │
        ├─ Xem chi tiết sản phẩm ─────────────────────────────────────────── ├─ Thêm/sửa/xóa sản phẩm
        │                                                                      │
        │ <<include>>                                                          │
        ├─ Thêm vào giỏ hàng ─────────────────────────────────────────────── ├─ Quản lý danh mục
        │                                                                      │
        │ <<include>>                                                          │
        ├─ Quản lý giỏ hàng ──────────────────────────────────────────────── ├─ Quản lý đơn hàng
        │                                                                      │
        │ <<include>>                                                          │
        ├─ Thanh toán COD ────────────────────────────────────────────────── ├─ Cập nhật trạng thái đơn hàng
        │                                                                      │
        │ <<include>>                                                          │
        ├─ Thanh toán Stripe ─────────────────────────────────────────────── ├─ Quản lý người dùng
        │                                                                      │
        │ <<include>>                                                          │
        ├─ Thanh toán MoMo ───────────────────────────────────────────────── ├─ Xem báo cáo doanh thu
        │                                                                      │
        │ <<include>>                                                          │
        ├─ Theo dõi đơn hàng ─────────────────────────────────────────────── ├─ Theo dõi Activities
        │                                                                      │
        │ <<include>>                                                          │
        ├─ Nhận email xác nhận ───────────────────────────────────────────── ├─ Quản lý Notifications
        │                                                                      │
        │ <<include>>                                                          │
        ├─ Download hóa đơn PDF ──────────────────────────────────────────── ├─ Tạo/quản lý PDF
        │                                                                      │
        │ <<include>>                                                          │
        ├─ Quản lý tài khoản ─────────────────────────────────────────────── ├─ Dashboard Analytics
        │                                                                      │
        │ <<include>>                                                          │
        ├─ Xem lịch sử mua hàng ──────────────────────────────────────────── ├─ Hỗ trợ khách hàng
        │                                                                      │
        │ <<include>>                                                          │
        └─ Nhận thông báo real-time ──────────────────────────────────────── └─ Nhận Discord alerts
                                                                                │
                                                                                │
                                                                    External Systems
                                                                         │
                                                                ┌────────┼────────┐
                                                                │        │        │
                                                            Stripe    MoMo   Firebase
                                                                │        │        │
                                                            MongoDB   Pusher  Discord
```

Sơ đồ này mô tả các use case và mối quan hệ trong hệ thống ThanhHuyStore:

- **Khách hàng**: Người dùng cuối mua sắm sản phẩm Apple
- **Quản trị viên**: Người quản lý toàn bộ hệ thống và dữ liệu
- **External Systems**: Các hệ thống bên ngoài tích hợp (Stripe, MoMo, Firebase, MongoDB, Pusher, Discord)

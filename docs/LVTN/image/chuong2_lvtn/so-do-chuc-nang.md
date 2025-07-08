# Sơ đồ chức năng - Hình 2-1

```
                                    ThanhHuyStore
                                         |
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
              Quản trị viên         Hệ thống             Khách hàng
                    │                    │                    │
            ┌───────┼───────┐    ┌───────┼───────┐    ┌───────┼───────┐
            │       │       │    │       │       │    │       │       │
      Quản lý sản   │   Quản lý đơn  Xử lý thanh  │   Đăng ký/đăng   │   Quản lý giỏ
        phẩm        │      hàng      toán       │      nhập        │      hàng
            │       │       │    │       │       │    │       │       │
      Quản lý người │   Xem báo cáo  Tạo PDF     │   Tìm kiếm sản   │   Thanh toán
        dùng        │       │      hóa đơn     │      phẩm       │   (COD/Stripe/MoMo)
            │       │       │    │       │       │    │       │       │
      Quản lý danh  │   Theo dõi    Activity     │   Xem chi tiết   │   Theo dõi đơn
         mục        │   activities   tracking    │    sản phẩm     │      hàng
            │       │       │    │       │       │    │       │       │
      Cấu hình hệ   │   Quản lý     Real-time    │   Quản lý tài    │   Nhận email
        thống       │  notifications  alerts     │     khoản       │   xác nhận
            │       │       │    │       │       │    │       │       │
      Thống kê      │   Hỗ trợ      Email &      │   Xem lịch sử    │
      doanh thu     │  khách hàng    Discord     │   mua hàng      │
                    │       │    │       │       │    │       │       │
                           │                    │                    │
                    Admin Dashboard            │              Customer Portal
                                              │
                                        External APIs:
                                    Stripe, MoMo, Firebase,
                                    MongoDB, Pusher, Discord
```

Sơ đồ này mô tả cấu trúc chức năng của hệ thống ThanhHuyStore với 3 thành phần chính:

1. **Quản trị viên**: Quản lý toàn bộ hệ thống qua Admin Dashboard
2. **Hệ thống**: Xử lý logic nghiệp vụ và tích hợp với các API bên ngoài
3. **Khách hàng**: Sử dụng Customer Portal để mua sắm sản phẩm Apple

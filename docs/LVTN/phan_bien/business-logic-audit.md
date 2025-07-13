# CÂU HỎI PHẢN BIỆN - NGHIỆP VỤ BÁN HÀNG ĐIỆN TỬ

## 🎯 PHẦN 1: QUẢN LÝ ĐƠN HÀNG VÀ THANH TOÁN

### Câu hỏi 1: Các phương thức thanh toán

**Hỏi:** "Em implement những phương thức thanh toán nào? Mỗi phương thức xử lý như thế nào?"

**Trả lời:**

- Hệ thống hỗ trợ 3 phương thức: COD, MoMo, và Stripe
- COD: Tạo đơn hàng ngay lập tức với status pending, gửi email xác nhận
- MoMo: Tạo payment URL, chờ callback từ MoMo để confirm thanh toán
- Stripe: Tạo payment intent, chờ webhook để update order status
- Tất cả đều có validation server-side và audit logging

### Câu hỏi 2: Xử lý callback MoMo

**Hỏi:** "Làm sao em đảm bảo callback từ MoMo là thật chứ không phải hacker giả mạo?"

**Trả lời:**

- Hiện tại đã implement signature verification với HMAC SHA256
- Validate amount consistency giữa callback và order trong database
- Check order status để tránh duplicate processing
- Log tất cả callback attempts để audit trail
- Có rate limiting và IP validation

### Câu hỏi 3: Admin tạo đơn hàng

**Hỏi:** "Tại sao em cho phép admin tạo đơn hàng? Quy trình này như thế nào?"

**Trả lời:**

- Admin có thể tạo đơn hàng cho customer qua phone/offline orders
- Validate admin permissions trước khi cho phép tạo
- Generate unique paymentIntentId với prefix "admin\_"
- Tất cả admin actions đều được audit log với severity HIGH
- Có thể chọn user, products, payment method và delivery status

## 🎯 PHẦN 2: HỆ THỐNG VOUCHER

### Câu hỏi 4: Các loại voucher

**Hỏi:** "Em implement những loại voucher nào? Cách phân biệt và sử dụng như thế nào?"

**Trả lời:**

- Hệ thống có 2 loại: GENERAL (công khai) và PERSONAL (cá nhân)
- GENERAL: Tất cả user có thể sử dụng trong giới hạn quantity
- PERSONAL: Chỉ targetUserIds được chỉ định mới dùng được
- Có maxUsagePerUser để giới hạn số lần dùng per user
- Validate startDate, endDate, minOrderValue khi apply

### Câu hỏi 5: Voucher validation process

**Hỏi:** "Quy trình validate voucher như thế nào? Có đảm bảo không bị lạm dụng không?"

**Trả lời:**

- Validate voucher code existence và isActive status
- Check thời gian hiệu lực (startDate <= now <= endDate)
- Verify quantity còn lại (usedCount < quantity)
- Check user usage limit (maxUsagePerUser)
- Validate minOrderValue requirement
- Tất cả validation đều server-side, không trust client

### Câu hỏi 6: Voucher tracking và audit

**Hỏi:** "Em có track được ai dùng voucher nào, khi nào không?"

**Trả lời:**

- Hiện tại chưa có UserVoucher table để track usage chi tiết
- Chỉ có usedCount field trong Voucher table
- Audit log khi admin tạo/sửa/xóa voucher
- Cần implement UserVoucher tracking để better analytics
- Có thể track qua order data nhưng không chi tiết

## 🎯 PHẦN 3: AUDIT LOGGING VÀ TRACKING

### Câu hỏi 7: Hệ thống audit logging

**Hỏi:** "Em có track được ai làm gì trong hệ thống không? Audit log như thế nào?"

**Trả lời:**

- Có AuditLog model với đầy đủ thông tin: eventType, userId, ipAddress, userAgent
- Track các actions quan trọng: tạo/sửa/xóa voucher, order, product
- Phân loại theo category (ADMIN, SECURITY, BUSINESS, SYSTEM) và severity
- Log cả oldValue và newValue cho data changes
- Admin có thể xem audit trail trong dashboard

### Câu hỏi 8: Analytics tracking

**Hỏi:** "Em có track user behavior không? Track những gì?"

**Trả lời:**

- Có AnalyticsEvent model track PRODUCT_VIEW và ARTICLE_VIEW
- Track sessionId, userId, ipAddress, userAgent, referrer
- Metadata flexible để store additional data
- Có useAnalytics hook để track events từ frontend
- Track purchase events khi order thành công

### Câu hỏi 9: Notification system

**Hỏi:** "Hệ thống có gửi thông báo cho admin/user không? Như thế nào?"

**Trả lời:**

- Có NotificationService để tạo notifications
- Support nhiều loại: ORDER_PLACED, PRODUCT_REVIEW, etc.
- Gửi email confirmation khi order thành công
- Admin nhận notification khi có order mới
- Có thể attach PDF invoice vào email

## 🎯 PHẦN 4: EMAIL VÀ COMMUNICATION

### Câu hỏi 10: Email system

**Hỏi:** "Em có gửi email confirmation không? Cấu hình như thế nào?"

**Trả lời:**

- Có EmailService sử dụng nodemailer với Gmail SMTP
- Gửi email confirmation khi order thành công
- Có thể attach PDF invoice vào email
- Template HTML đẹp với thông tin đơn hàng chi tiết
- Handle email failures gracefully

### Câu hỏi 11: Email verification

**Hỏi:** "User có cần verify email không? Quy trình như thế nào?"

**Trả lời:**

- Có email verification system với token
- Gửi verification email khi user đăng ký
- Token có thời hạn 5 phút
- User phải verify trước khi login
- Có resend verification functionality

### Câu hỏi 12: Admin settings

**Hỏi:** "Admin có thể config hệ thống không? Config những gì?"

**Trả lời:**

- Có AdminSettings model để config toàn bộ hệ thống
- Enable/disable payment methods (COD, MoMo, Stripe)
- Config notifications (email, discord, push)
- Analytics tracking settings
- Session timeout và security settings

## 🎯 PHẦN 5: PROMOTION VÀ BUSINESS LOGIC

### Câu hỏi 13: Promotion system

**Hỏi:** "Em có hệ thống khuyến mãi sản phẩm không? Khác gì với voucher?"

**Trả lời:**

- Có Promotion model riêng biệt với Voucher
- Promotion áp dụng trực tiếp lên sản phẩm/category
- Có ProductPromotion table để link promotion với products
- Support discount percentage hoặc fixed amount
- Có thể set priority khi nhiều promotions overlap

### Câu hỏi 14: Rate limiting và security

**Hỏi:** "Em có ngăn chặn spam orders không? Rate limiting như thế nào?"

**Trả lời:**

- Implement rate limiting: max 5 orders per hour per user
- Validate server-side để prevent price manipulation
- Check product existence và stock availability
- Quantity limit: max 10 items per product
- IP-based rate limiting cho suspicious activities

### Câu hỏi 15: Error handling

**Hỏi:** "Khi có lỗi xảy ra (database down, payment gateway lỗi), em xử lý như thế nào?"

**Trả lời:**

- Comprehensive error handling với try-catch blocks
- Graceful degradation khi services unavailable
- Detailed error logging với context information
- User-friendly error messages, không expose technical details
- Retry mechanisms cho transient failures

## 🎯 ĐÁNH GIÁ TỔNG QUAN

### Điểm Mạnh của Hệ Thống:

- ✅ Multi-payment method support (COD, MoMo, Stripe)
- ✅ Comprehensive audit logging system
- ✅ Flexible voucher system với GENERAL/PERSONAL types
- ✅ Email notification với PDF attachments
- ✅ Analytics tracking cho user behavior
- ✅ Admin settings để config toàn hệ thống

### Các Điểm Cần Cải Thiện:

- 🔄 UserVoucher tracking table chưa implement
- 🔄 Inventory race condition vẫn có thể xảy ra
- 🔄 Return/refund system chưa hoàn thiện
- 🔄 Real-time notifications chưa có
- 🔄 Advanced fraud detection chưa implement

### Mức Độ Hoàn Thiện: **KHÁ TỐT** 🟡

**Kết luận:** Hệ thống đã implement được các tính năng cơ bản của e-commerce với audit logging tốt. Cần cải thiện một số điểm về concurrency và user experience để sẵn sàng production.

🎯 1. /orders/create-payment-intent
Thực tế làm gì:

✅ Order Creation: Tạo order hoàn chỉnh trong database
✅ Inventory Management: Reserve inventory atomically
✅ Voucher Processing: Validate và reserve voucher
✅ Payment Integration: Tạo Stripe/MoMo payment intent
✅ Notifications: Discord + admin notifications
✅ Auto-processing: Tự động gọi process-payment cho COD
Tên tốt hơn: /orders/create hoặc /orders/checkout

🎯 2. /orders/process-payment
Tên rõ ràng: Xử lý sau khi payment thành công

Thực tế làm gì:

✅ Payment Confirmation: Confirm voucher usage
✅ PDF Generation: Tạo invoice PDF
✅ Email Service: Gửi email confirmation với PDF
✅ Final Notifications: Gửi notifications cuối cùng
Tên phù hợp: Đúng với chức năng

🎯 3. /orders/rollback-inventory
Tên rõ ràng: Rollback khi payment fail

Thực tế làm gì:

✅ Inventory Restoration: Trả lại stock cho products
✅ Voucher Rollback: Hủy voucher reservation
✅ Order Cancellation: Mark order as cancelled
✅ Audit Logging: Log cancellation event

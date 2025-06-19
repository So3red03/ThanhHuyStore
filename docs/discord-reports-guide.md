# Hướng Dẫn Báo Cáo Discord & Cài Đặt Thanh Toán

## 📊 TÍNH NĂNG BÁO CÁO DISCORD

### **Mục đích**

Hệ thống gửi báo cáo thống kê kinh doanh tự động qua Discord webhook, giúp admin theo dõi tình hình bán hàng mỗi ngày.

### **Nội dung báo cáo**

- 🛒 **Tổng đơn hàng**: Số lượng đơn hàng mới
- 💰 **Doanh thu**: Tổng tiền từ đơn hàng thành công
- ✅ **Đơn thành công**: Số đơn đã giao thành công
- 👥 **Khách hàng mới**: Số người dùng mới đăng ký
- 📈 **Tỷ lệ chuyển đổi**: % đơn thành công/tổng đơn
- 🔥 **Top sản phẩm**: 5 sản phẩm bán chạy nhất
- ⚠️ **Tồn kho thấp**: Sản phẩm còn ≤10 cái

### **Cấu hình**

#### **1. Discord Webhook**

Đã được cấu hình trong file `.env`:

```env
DISCORD_REPORT_WEBHOOK_URL = https://discord.com/api/webhooks/1385111738994655365/_ZsbRTu_u91HXI5oGXKKf9coRg0lGJjia6QB3y3R48hFNz8NfhOzeT7P0ixNKRg86lOd
```

#### **2. Tần suất báo cáo**

- **Mỗi 12 giờ**: Báo cáo 2 lần/ngày
- **Mỗi 24 giờ**: Báo cáo hằng ngày (mặc định)
- **Mỗi 48 giờ**: Báo cáo 2 ngày/lần
- **Mỗi 72 giờ**: Báo cáo 3 ngày/lần
- **Mỗi tuần**: Báo cáo hằng tuần

### **Cách sử dụng**

#### **Trong Settings Page:**

1. Vào `/admin/settings`
2. Click tab "Báo cáo"
3. Bật "Báo cáo hằng ngày"
4. Chọn "Tần suất báo cáo"
5. Click "🧪 Test báo cáo Discord" để test
6. Click "Cập nhật cài đặt" để lưu

#### **API Endpoints:**

```typescript
// Test báo cáo
POST /api/admin/reports/discord
{
  "type": "test"
}

// Gửi báo cáo thực tế
POST /api/admin/reports/discord
{
  "type": "report",
  "hours": 24
}

// Lấy dữ liệu báo cáo
GET /api/admin/reports/discord?hours=24
```

## 💳 TÍNH NĂNG CÀI ĐẶT THANH TOÁN

### **Mục đích**

Cho phép admin bật/tắt linh hoạt các phương thức thanh toán theo từng giai đoạn triển khai.

### **Phương thức hỗ trợ**

#### **1. COD (Cash on Delivery)**

- ✅ **Mặc định**: Bật
- 🎯 **Phù hợp**: Thị trường Việt Nam
- 📝 **Mô tả**: Thanh toán khi nhận hàng

#### **2. MoMo E-Wallet**

- ✅ **Mặc định**: Bật
- 🎯 **Phù hợp**: Thanh toán điện tử VN
- 📝 **Mô tả**: Ví điện tử MoMo
- ⚙️ **Cần**: Cấu hình API key riêng

#### **3. Stripe (Credit/Debit Cards)**

- ❌ **Mặc định**: Tắt
- 🎯 **Phù hợp**: Thanh toán quốc tế
- 📝 **Mô tả**: Thẻ tín dụng/ghi nợ
- ⚙️ **Cần**: Cấu hình Stripe API

### **Lưu ý quan trọng**

- ⚠️ Tắt phương thức sẽ ẩn nó khỏi trang checkout
- ⚠️ Đảm bảo ít nhất 1 phương thức được bật
- ⚠️ Thay đổi sẽ áp dụng ngay lập tức

## 🚀 TRIỂN KHAI

### **Bước 1: Kiểm tra Environment**

Discord webhook đã được cấu hình sẵn trong file `.env`:

```env
DISCORD_REPORT_WEBHOOK_URL = https://discord.com/api/webhooks/1385111738994655365/_ZsbRTu_u91HXI5oGXKKf9coRg0lGJjia6QB3y3R48hFNz8NfhOzeT7P0ixNKRg86lOd
```

### **Bước 2: Test Discord Webhook**

1. Vào Settings → Báo cáo
2. Click "🧪 Test báo cáo Discord"
3. Kiểm tra Discord channel nhận được tin nhắn test

### **Bước 3: Cấu hình báo cáo**

1. Bật "Báo cáo hằng ngày"
2. Chọn tần suất phù hợp
3. Lưu cài đặt

### **Bước 4: Cấu hình thanh toán**

1. Vào Settings → Thanh toán
2. Bật/tắt các phương thức cần thiết
3. Lưu cài đặt

## 🔮 TƯƠNG LAI

### **Báo cáo nâng cao**

- 📧 Email reports
- 📱 SMS notifications
- 📊 Dashboard widgets
- 📈 Trend analysis

### **Thanh toán mở rộng**

- 🏦 Banking transfer
- 💎 Cryptocurrency
- 🎁 Gift cards
- 💰 Loyalty points

### **Tự động hóa**

- 🤖 Auto-scheduling reports
- 🔄 Dynamic payment methods
- 📊 Smart recommendations
- 🎯 Personalized settings

## 📞 HỖ TRỢ

Nếu gặp vấn đề:

1. Kiểm tra Discord webhook URL
2. Test kết nối với nút test
3. Xem console logs để debug
4. Đảm bảo database có dữ liệu

**Hệ thống báo cáo và thanh toán đã sẵn sàng sử dụng!** 🎉

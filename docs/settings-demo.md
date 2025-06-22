# Settings Page Demo - Tiếng Việt

## 🎯 Truy Cập

Để test trang Settings mới:

1. Đăng nhập với tài khoản Admin
2. Truy cập: `http://localhost:3000/admin/settings`
3. Hoặc click vào menu "Cài đặt" trong admin sidebar (nằm trên "Đăng xuất")

## 📱 Sections Tối Ưu (4 Tabs)

### 1. **Thông báo** ⭐ GỘP EMAIL

- ✅ **Thông báo hệ thống**:
  - Thông báo Discord
  - Thông báo đơn hàng
  - Thông báo đẩy
- ✅ **Email marketing**:
  - Email marketing

### 2. **Hệ thống** ⭐ GỘP BẢO MẬT + THANH TOÁN

- ✅ **Bảo mật & Phiên làm việc**:
  - Thời gian hết phiên (15 phút → 4 giờ)
- ✅ **Phân tích & Theo dõi**:
  - Theo dõi phân tích
- ✅ **Phương thức thanh toán**:
  - COD, MoMo, Stripe

### 3. **Tự động hóa**

- ✅ Cảnh báo tồn kho thấp (≤10 sản phẩm)
- ✅ Hỗ trợ Chatbot
- ✅ Đề xuất voucher tự động

### 4. **Báo cáo** ⭐ MỚI

- ✅ Báo cáo hằng ngày qua Discord
- ✅ Tần suất báo cáo (12h, 24h, 48h, 72h, tuần)
- ✅ Test button + 7 chỉ số quan trọng

## 🔧 Tính Năng

### Toggle Switches

- Smooth animation
- Blue color khi bật
- Gray color khi tắt

### Session Timeout

- Dropdown select với 5 options
- Icon MdAccessTime
- Lưu giá trị số (minutes)

### Save System

- Lưu vào localStorage với key: `adminSettings`
- Toast notification khi save thành công
- Loading state khi đang save

## 📊 Default Values

```json
{
  "discordNotifications": true,
  "orderNotifications": true,
  "emailNotifications": true,
  "pushNotifications": false,
  "analyticsTracking": true,
  "sessionTimeout": 30,
  "lowStockAlerts": true,
  "chatbotSupport": false,
  "autoVoucherSuggestion": true
}
```

## 🎨 UI Features

### Responsive Design

- Desktop: Sidebar + main content
- Mobile: Stack layout
- Smooth transitions

### Icons

- MdSettings: Header chính
- MdNotifications: Section Thông báo
- MdEmail: Section Email
- MdSecurity: Section Bảo mật
- MdStorage: Section Hệ thống
- MdSmartToy: Section Tự động hóa
- MdAccessTime: Thời gian hết phiên

### Colors

- Blue theme cho active states
- Gray theme cho inactive
- Clean white background
- Subtle shadows

## 🚀 Test Scenarios

1. **Toggle Settings**: Click các switches để test
2. **Session Timeout**: Thay đổi dropdown values
3. **Save**: Click "Update notifications" button
4. **Reload**: Refresh page để test localStorage persistence
5. **Mobile**: Test responsive trên mobile devices

## 💾 Data Storage

Settings được lưu trong localStorage:

```javascript
// Lấy settings
const settings = JSON.parse(localStorage.getItem('adminSettings') || '{}');

// Lưu settings
localStorage.setItem('adminSettings', JSON.stringify(settings));
```

## 🔮 Future Integrations

Các settings này có thể được tích hợp với:

1. **Discord Webhook**: Bật/tắt thông báo Discord
2. **Email Service**: Control email marketing
3. **Session Middleware**: Implement auto logout
4. **Analytics**: Google Analytics tracking
5. **Stock Monitoring**: Low stock alert system
6. **AI Chatbot**: Customer support automation
7. **Voucher System**: Auto promotion suggestions

## 🎉 Ready to Use!

Trang Settings đã hoàn chỉnh và sẵn sàng sử dụng ngay!

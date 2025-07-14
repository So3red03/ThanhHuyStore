# Discord Button Interaction Setup Guide

## 🎯 Overview
Hệ thống Discord Button Interaction cho phép admin duyệt/hủy đơn hàng trực tiếp từ Discord thông qua các nút bấm.

## 🔧 Setup Requirements

### 1. Discord Application Setup

1. **Tạo Discord Application:**
   - Vào [Discord Developer Portal](https://discord.com/developers/applications)
   - Tạo New Application
   - Lưu `Application ID` và `Public Key`

2. **Bot Configuration:**
   - Vào tab "Bot"
   - Tạo bot token (nếu chưa có)
   - Enable "Message Content Intent"

3. **Interaction Endpoint URL:**
   - Vào tab "General Information"
   - Set "Interactions Endpoint URL": `https://yourdomain.com/api/discord/interactions`
   - Discord sẽ verify endpoint này

### 2. Environment Variables

Thêm vào `.env.local`:

```env
# Discord Configuration
DISCORD_PUBLIC_KEY=your_discord_public_key_here
DISCORD_ORDER_WEBHOOK_URL=your_discord_webhook_url_here
```

### 3. Webhook Setup

1. **Tạo Discord Webhook:**
   - Vào Discord server channel
   - Channel Settings → Integrations → Webhooks
   - Create Webhook
   - Copy Webhook URL

2. **Test Webhook:**
   ```bash
   curl -X POST "YOUR_WEBHOOK_URL" \
   -H "Content-Type: application/json" \
   -d '{"content": "Test message"}'
   ```

## 🚀 How It Works

### Workflow:
1. **Đơn hàng mới** → Discord message với buttons
2. **Admin click button** → Discord gửi interaction đến `/api/discord/interactions`
3. **API xử lý:**
   - Verify Discord signature
   - Update order status (pending → confirmed/canceled)
   - Log audit trail
   - Send email notification to customer
   - Update Discord message (remove buttons + show result)

### Button Actions:
- ✅ **Duyệt Đơn**: `pending` → `confirmed`
- ❌ **Hủy Đơn**: `pending` → `canceled`

## 🔒 Security Features

- **Signature Verification**: Verify Discord requests using Ed25519
- **Order Status Validation**: Only allow actions on `pending` orders
- **Audit Logging**: Track all admin actions
- **Error Handling**: Graceful failure with user feedback

## 🧪 Testing

### 1. Test Order Creation:
```bash
# Tạo đơn hàng test để kiểm tra Discord notification
POST /api/orders/create-payment-intent
```

### 2. Test Button Interaction:
- Discord sẽ tự động test endpoint khi setup
- Hoặc tạo đơn hàng thật và test buttons

### 3. Verify Logs:
- Check audit logs trong admin dashboard
- Verify email được gửi đến customer

## 🐛 Troubleshooting

### Common Issues:

1. **"Invalid signature" error:**
   - Check `DISCORD_PUBLIC_KEY` trong .env
   - Verify endpoint URL trong Discord Developer Portal

2. **Buttons không hiện:**
   - Check Discord webhook URL
   - Verify message format

3. **Order not found:**
   - Check order ID trong database
   - Verify order status = 'pending'

### Debug Commands:
```bash
# Check TypeScript
pnpm exec tsc --noEmit

# Check environment variables
echo $DISCORD_PUBLIC_KEY

# Test webhook
curl -X GET https://yourdomain.com/api/discord/interactions
```

## 📝 API Endpoints

### `/api/discord/interactions` (POST)
- **Purpose**: Handle Discord button interactions
- **Authentication**: Discord signature verification
- **Actions**: approve/reject orders
- **Response**: Updated Discord message

### `/api/orders/send-notifications` (POST)
- **Purpose**: Send order notifications with buttons
- **Enhanced**: Now includes action buttons for pending orders

## 🎨 Message Format

### New Order Message:
```
🛒 ĐƠN HÀNG MỚI
👤 Thông tin khách hàng: ...
📍 Địa chỉ giao hàng: ...
🛍️ Sản phẩm đặt mua: ...
💰 Thông tin thanh toán: ...

[✅ Duyệt Đơn] [❌ Hủy Đơn]
```

### After Action:
```
✅ ĐƠN HÀNG ĐÃ ĐƯỢC DUYỆT
(Same content as above)
Đã duyệt bởi AdminName • ThanhHuy Store
```

## 🔄 Next Steps

1. **Setup Discord Application** theo hướng dẫn trên
2. **Configure environment variables**
3. **Test với đơn hàng thật**
4. **Train admin team** cách sử dụng buttons
5. **Monitor audit logs** để track performance

## 💡 Benefits

- ⚡ **Real-time approval** - Không cần vào website
- 📱 **Mobile-friendly** - Discord app trên điện thoại  
- 👥 **Team collaboration** - Multiple admins có thể thấy
- 📊 **Audit trail** - Track tất cả actions
- 🔔 **Auto notifications** - Customer được thông báo ngay

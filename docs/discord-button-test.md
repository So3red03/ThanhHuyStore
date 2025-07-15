# Discord Button Test Guide

## 🎯 Mục đích

Hướng dẫn test Discord interactive buttons để đảm bảo hệ thống hoạt động đúng.

## 🤖 Discord Bot vs Webhook

**Quan trọng:** Để interactive buttons hoạt động, hệ thống đã được cập nhật để sử dụng **Discord Bot API** thay vì webhook:

- **Webhook** (cũ): Chỉ có thể gửi message, không xử lý được button interactions
- **Discord Bot** (mới): Có thể gửi message VÀ xử lý button interactions

Khi bạn thấy bot name là "check đơn hàng nè" thay vì "Captain Hook", có nghĩa là đang sử dụng Discord Bot đúng cách!

## 🚀 Cách sử dụng

### 1. Truy cập Test Page

- Vào admin panel: `/admin/discord-test`
- Trang này cung cấp các tools để test Discord integration

### 2. Test Interactive Buttons

#### Bước 1: Gửi Test Message

1. Click nút **"🎮 Test Buttons"**
2. Hệ thống sẽ gửi message với 2 buttons: **CONFIRM** và **CANCEL**
3. Message sẽ xuất hiện trong Discord channel

#### Bước 2: Test Button Interactions

1. Vào Discord channel (ths-đơn hàng)
2. Tìm message test vừa gửi
3. Click vào button **CONFIRM** hoặc **CANCEL**
4. Bot sẽ response ngay lập tức với message xác nhận

#### Bước 3: Xác nhận kết quả

- Message gốc sẽ được update
- Buttons sẽ biến mất
- Hiển thị kết quả test với emoji và thông tin chi tiết

## 🔧 Technical Details

### Test Button Format

```
custom_id: test_approve_TEST-[timestamp]
custom_id: test_reject_TEST-[timestamp]
```

### Response Flow

1. **User clicks button** → Discord sends interaction
2. **API receives interaction** → `/api/discord/interactions`
3. **Bot processes** → Updates message with result
4. **Buttons removed** → Test completed

### Expected Response

```json
{
  "type": 7, // UPDATE_MESSAGE
  "data": {
    "embeds": [...],
    "components": [] // Buttons removed
  }
}
```

## ✅ Verification Checklist

- [ ] Test message gửi thành công
- [ ] Buttons hiển thị trong Discord
- [ ] Click CONFIRM hoạt động
- [ ] Click CANCEL hoạt động
- [ ] Message được update đúng
- [ ] Buttons biến mất sau click
- [ ] Response message hiển thị đúng thông tin

## 🐛 Troubleshooting

### Buttons không hoạt động

1. Kiểm tra `DISCORD_PUBLIC_KEY` trong .env
2. Verify Discord Application Interaction URL
3. Check console logs trong `/api/discord/interactions`

### Message không gửi được

1. Kiểm tra `DISCORD_ORDER_WEBHOOK_URL`
2. Verify webhook URL còn hoạt động
3. Check Discord channel permissions

### Bot không response

1. Kiểm tra `DISCORD_BOT_TOKEN`
2. Verify bot permissions trong server
3. Check interaction endpoint configuration

## 📝 Environment Variables Required

```env
DISCORD_ORDER_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_PUBLIC_KEY=your_public_key
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CHANNEL_ID=your_channel_id
```

## 🎮 Production vs Test

### Test Buttons

- Prefix: `test_approve_`, `test_reject_`
- Không ảnh hưởng database
- Chỉ update Discord message

### Production Buttons

- Prefix: `approve_`, `reject_`
- Update order status trong database
- Gửi email notification
- Log audit trail

---

**Lưu ý:** Test này chỉ kiểm tra Discord button interaction, không ảnh hưởng đến dữ liệu thực tế trong hệ thống.

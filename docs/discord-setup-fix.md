# Discord Button Interaction Setup Fix

## 🚨 Vấn đề hiện tại
Buttons hiển thị "Tương tác này không thành công" khi click.

## 🔧 Nguyên nhân & Giải pháp

### 1. **Discord Application Interaction Endpoint URL**

**Vấn đề:** Discord Application chưa được cấu hình Interaction Endpoint URL đúng.

**Giải pháp:**
1. Vào [Discord Developer Portal](https://discord.com/developers/applications)
2. Chọn application của bạn
3. Vào tab **"General Information"**
4. Tìm **"Interactions Endpoint URL"**
5. Nhập: `https://yourdomain.com/api/discord/interactions`
6. Click **"Save Changes"**

### 2. **Bot Permissions**

**Vấn đề:** Bot thiếu permissions để xử lý interactions.

**Giải pháp:**
1. Vào tab **"Bot"** trong Discord Developer Portal
2. Scroll xuống **"Bot Permissions"**
3. Bật các permissions sau:
   - ✅ **Send Messages**
   - ✅ **Use Slash Commands**
   - ✅ **Read Message History**
   - ✅ **Add Reactions**

### 3. **OAuth2 Scopes**

**Vấn đề:** Bot thiếu scopes cần thiết.

**Giải pháp:**
1. Vào tab **"OAuth2" → "URL Generator"**
2. Chọn scopes:
   - ✅ **bot**
   - ✅ **applications.commands**
3. Copy URL và re-invite bot vào server

## 🧪 Testing Steps

### Step 1: Kiểm tra Configuration
```bash
GET https://yourdomain.com/api/discord/debug
```

### Step 2: Test Production Buttons
```bash
POST https://yourdomain.com/api/discord/debug
```

### Step 3: Verify Interaction Endpoint
```bash
GET https://yourdomain.com/api/discord/interactions
```

## 📝 Environment Variables Check

Đảm bảo có đủ các biến môi trường:

```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN=MTM5NDE1NDkxMDE3NzgyMDc5Mw.G7CgV7.8C6niixu0YpI8MC3l4AHcMN81B0qYcZstt75CU
DISCORD_CHANNEL_ID=1380918191328333834
DISCORD_PUBLIC_KEY=32d561b54f3ff4f42ceca952c7d38d1f6cde6e39d8a3e002e37d52f1e510b792

# Webhook (for fallback)
DISCORD_ORDER_WEBHOOK_URL=https://discord.com/api/webhooks/1380918284949524490/BsoB_hBEuE5pwF7ItgqyKHSSbjv98aT7zIj71bseWCIFbIuN3NEv2RzABtZReUYvME4i

# Application URL
NEXTAUTH_URL=https://yourdomain.com
```

## 🔍 Debug Checklist

- [ ] Discord Application Interaction Endpoint URL đã set đúng
- [ ] Bot có đủ permissions trong server
- [ ] Environment variables đã cấu hình đầy đủ
- [ ] Bot đã được re-invite với đúng scopes
- [ ] Endpoint `/api/discord/interactions` hoạt động
- [ ] Signature verification đang work

## 🚀 Deployment Commands

Sau khi fix configuration:

```bash
# Build và deploy
pnpm build
vercel --prod

# Wait for deployment to complete
# Test lại buttons
```

## 📊 Expected Results

Sau khi fix:
- ✅ Buttons sẽ response ngay lập tức
- ✅ Message sẽ được update với kết quả
- ✅ Buttons sẽ biến mất sau khi click
- ✅ Follow-up messages sẽ được gửi

## 🔧 Troubleshooting

### Nếu vẫn lỗi:

1. **Check logs:**
   ```bash
   # Xem console logs trong Vercel
   vercel logs --follow
   ```

2. **Test signature verification:**
   - Đảm bảo `DISCORD_PUBLIC_KEY` đúng format
   - Check timestamp validation

3. **Verify bot status:**
   - Bot phải online trong Discord server
   - Check bot có quyền gửi message trong channel

### Common Issues:

- **401 Unauthorized:** Sai `DISCORD_PUBLIC_KEY`
- **404 Not Found:** Interaction Endpoint URL sai
- **403 Forbidden:** Bot thiếu permissions
- **Timeout:** Server response chậm >3s

---

**Lưu ý:** Discord yêu cầu response trong vòng 3 giây, nên đảm bảo server response nhanh.

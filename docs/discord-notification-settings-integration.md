# 🔔 Discord Notification Settings Integration & Format Improvements

## 🎯 **OVERVIEW**

Đã tích hợp Discord notification settings từ admin settings page để có thể bật/tắt thông báo Discord cho cả đơn hàng mới và đơn hàng hủy. Đồng thời cải thiện format Discord embed cho đơn hàng hủy theo cùng format với đơn hàng mới.

## 🔧 **TECHNICAL IMPLEMENTATION**

### ✅ **Discord Notification Helper**

**File:** `src/app/libs/discordNotificationHelper.ts`

**Purpose:** Centralized helper để kiểm tra settings và gửi Discord notifications

**Key Functions:**

```typescript
// Kiểm tra Discord notification settings
export const isDiscordNotificationEnabled = async (): Promise<boolean> => {
  const settings = await prisma.adminSettings.findFirst();

  if (!settings) {
    return true; // Default to true (backward compatibility)
  }

  // Check both discordNotifications and orderNotifications
  return settings.discordNotifications && settings.orderNotifications;
};

// Gửi Discord notification chỉ khi enabled
export const sendDiscordNotificationIfEnabled = async (webhookUrl: string, embed: any): Promise<void> => {
  const isEnabled = await isDiscordNotificationEnabled();

  if (!isEnabled) {
    console.log('Discord notifications are disabled in settings');
    return;
  }

  // Send notification...
};
```

### ✅ **Settings Integration Logic**

- **Check both flags**: `discordNotifications` AND `orderNotifications`
- **Backward compatibility**: Default to `true` nếu không có settings
- **Fail-safe**: Default to `true` nếu có lỗi database
- **Centralized control**: Một chỗ để bật/tắt tất cả Discord notifications

## 🎨 **DISCORD EMBED FORMAT IMPROVEMENTS**

### ✅ **Đơn Hàng Hủy - New Format**

**Trước đây:**

```javascript
{
  title: '🚫 ĐƠN HÀNG BỊ HỦY',
  fields: [
    { name: '📋 Thông tin đơn hàng', value: 'ID + Customer + Email' },
    { name: '💰 Giá trị đơn hàng', value: 'Total amount' },
    { name: '📦 Số sản phẩm', value: 'Product count' },
    { name: '❌ Lý do hủy', value: 'Cancel reason' }
  ]
}
```

**Sau khi cải thiện:**

```javascript
{
  title: '🚫 **ĐƠN HÀNG BỊ HỦY**',
  color: 0xff4444, // Màu đỏ
  fields: [
    {
      name: '👤 **Thông tin khách hàng**',
      value: `**Tên:** ${customer.name}\n**Email:** ${customer.email}\n**SĐT:** ${phoneNumber}`
    },
    {
      name: '📍 **Địa chỉ giao hàng**',
      value: fullAddress
    },
    {
      name: '🛍️ **Sản phẩm đã hủy**',
      value: productList // Detailed product list
    },
    {
      name: '💰 **Thông tin thanh toán**',
      value: `**Tổng tiền hàng:** ${originalAmount}₫\n**Phí ship:** ${shippingFee}₫\n**Giảm giá:** ${discountAmount}₫\n**Tổng thanh toán:** ${totalAmount}₫\n**Phương thức:** ${paymentMethod}`
    },
    {
      name: '❌ **Lý do hủy**',
      value: reason
    }
  ],
  timestamp: new Date().toISOString(),
  footer: {
    text: 'ThanhHuy Store - Đơn hàng bị hủy'
  }
}
```

### ✅ **Admin Cancel - Enhanced Format**

**Additional field cho admin cancel:**

```javascript
{
  name: '👨‍💼 **Hủy bởi Admin**',
  value: `**Admin:** ${admin.name}\n**Email:** ${admin.email}`,
  inline: false
}
```

## 📁 **FILES UPDATED**

### **1. Discord Helper (NEW)**

- `src/app/libs/discordNotificationHelper.ts`
- Centralized Discord notification logic
- Settings integration
- Error handling và fail-safe

### **2. Customer Cancel API**

- `src/app/api/orders/cancel/route.ts`
- Updated Discord format to match new order format
- Integrated settings check via helper

### **3. Admin Cancel API**

- `src/app/api/orders/admin-cancel/route.ts`
- **NO Discord notification** - Admin cancel không gửi thông báo
- Chỉ log để tracking admin actions

### **4. Create Payment Intent API**

- `src/app/api/create-payment-intent/route.ts`
- Integrated settings check via helper
- Maintained existing new order format

## 🎯 **SETTINGS CONTROL**

### ✅ **Admin Settings Page Integration**

**Location:** `/admin/settings`

**Discord Notification Toggle:**

- **Field**: `discordNotifications` (boolean)
- **Effect**: Controls Discord notifications
- **Scope**: New orders + Customer cancel orders (NOT admin cancel)

**Order Notification Toggle:**

- **Field**: `orderNotifications` (boolean)
- **Effect**: Additional layer of control
- **Logic**: Both flags must be `true` for notifications to send

### ✅ **Settings Logic**

```typescript
// Both flags must be true
const isEnabled = settings.discordNotifications && settings.orderNotifications;

if (!isEnabled) {
  console.log('Discord notifications are disabled in settings');
  return; // Skip sending notification
}
```

## 🔄 **NOTIFICATION FLOW**

### **Before (Old Flow):**

```
Order Event → Direct Discord API Call → Send Notification
```

### **After (New Flow):**

```
Order Event → Check Settings → Helper Function → Conditional Send
```

### **Detailed Flow:**

1. **Order event** occurs (new order, cancel order, admin cancel)
2. **Settings check** via `isDiscordNotificationEnabled()`
3. **Database query** to get admin settings
4. **Flag validation** (discordNotifications AND orderNotifications)
5. **Conditional send** via `sendDiscordNotificationIfEnabled()`
6. **Error handling** với proper logging

## 🎨 **VISUAL IMPROVEMENTS**

### ✅ **Consistent Format Across All Notifications:**

**New Order (Green):**

- 🛒 **ĐƠN HÀNG MỚI**
- Color: `0x00ff00` (Green)
- Detailed product list, payment info, customer details

**Cancel Order (Red):**

- 🚫 **ĐƠN HÀNG BỊ HỦY**
- Color: `0xff4444` (Red)
- Same detailed format + cancel reason
- **Only for customer cancellations**

**Admin Cancel:**

- **NO Discord notification**
- Chỉ log trong console để tracking
- Admin actions không spam Discord channel

### ✅ **Enhanced Field Structure:**

- **👤 Thông tin khách hàng** - Name, email, phone
- **📍 Địa chỉ giao hàng** - Full address
- **🛍️ Sản phẩm** - Detailed product list với quantity và price
- **💰 Thông tin thanh toán** - Breakdown of costs
- **❌ Lý do hủy** - Cancel reason (for cancel notifications)
- **👨‍💼 Hủy bởi Admin** - Admin info (for admin cancel)

## 🔒 **SECURITY & PERFORMANCE**

### ✅ **Database Optimization:**

- **Single query** để check settings
- **Caching potential** cho settings (future enhancement)
- **Fail-safe defaults** để avoid service disruption

### ✅ **Error Handling:**

- **Try-catch blocks** around all Discord calls
- **Graceful degradation** nếu Discord service down
- **Logging** cho debugging và monitoring

### ✅ **Settings Validation:**

- **Null checks** cho settings object
- **Boolean validation** cho flags
- **Backward compatibility** với existing data

## 📊 **BENEFITS**

### **Admin Control:**

- ✅ **Single toggle** để bật/tắt tất cả Discord notifications
- ✅ **Granular control** với multiple flags
- ✅ **Real-time effect** - No restart required

### **User Experience:**

- ✅ **Consistent format** across all notification types
- ✅ **Rich information** trong Discord embeds
- ✅ **Visual distinction** với colors (green/red)

### **Developer Experience:**

- ✅ **Centralized logic** dễ maintain
- ✅ **Reusable helper** functions
- ✅ **Clean separation** of concerns

### **System Reliability:**

- ✅ **Fail-safe defaults** ensure service continuity
- ✅ **Error isolation** - Discord issues don't break orders
- ✅ **Performance optimized** với minimal database calls

## 🧪 **TESTING SCENARIOS**

### **Settings Control:**

1. ✅ **Both flags ON** → Notifications send
2. ✅ **discordNotifications OFF** → No notifications
3. ✅ **orderNotifications OFF** → No notifications
4. ✅ **Both flags OFF** → No notifications
5. ✅ **No settings record** → Notifications send (default)

### **Notification Types:**

1. ✅ **New order** → Green embed với full details
2. ✅ **Customer cancel** → Red embed với cancel reason
3. ✅ **Admin cancel** → NO notification (chỉ console log)

### **Error Handling:**

1. ✅ **Database error** → Default to enabled
2. ✅ **Discord API error** → Graceful failure
3. ✅ **Invalid webhook URL** → Proper error logging

## ✅ **COMPLETED FEATURES**

1. ✅ **Discord notification helper** - Centralized logic
2. ✅ **Settings integration** - Admin control via settings page
3. ✅ **Enhanced cancel format** - Matches new order format (customer only)
4. ✅ **Admin cancel logic** - No Discord spam, chỉ console logging
5. ✅ **Consistent styling** - Colors, typography, structure
6. ✅ **Error handling** - Graceful degradation
7. ✅ **Backward compatibility** - Works với existing data
8. ✅ **Performance optimization** - Minimal database calls
9. ✅ **Security validation** - Proper input checking
10. ✅ **Comprehensive testing** - All scenarios covered

## 🎉 **RESULT**

**Discord notification system giờ đây:**

- 🎛️ **Controllable** - Admin có thể bật/tắt từ settings page
- 🎨 **Consistent** - Tất cả notifications có cùng format đẹp
- 🔒 **Reliable** - Error handling và fail-safe mechanisms
- 📱 **Rich** - Detailed information trong Discord embeds
- ⚡ **Performant** - Optimized database queries
- 🛠️ **Maintainable** - Clean, centralized code structure

**Admin giờ có full control over Discord notifications và format được cải thiện đáng kể!** 🚀

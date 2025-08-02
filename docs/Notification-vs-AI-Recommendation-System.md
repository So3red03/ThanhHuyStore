# 📢🤖 Hệ thống Notification vs AI Recommendation - ThanhHuy Store

## 📋 **TỔNG QUAN**

Hệ thống thông báo của ThanhHuy Store đã được **tách biệt rõ ràng** thành 2 phần riêng biệt:

### 📢 **NOTIFICATION SYSTEM** - Thông báo sự kiện

**Mục đích:** Thông báo các sự kiện **đã xảy ra** (reactive notifications)

### 🤖 **AI RECOMMENDATION SYSTEM** - Trợ lý thông minh

**Mục đích:** Phân tích và **đề xuất hành động** (proactive recommendations)

---

## 🎯 **PHÂN BIỆT RÕ RÀNG**

### 📢 **NOTIFICATION SYSTEM**

#### **Đặc điểm:**

- ⚡ **Timing:** Ngay lập tức khi sự kiện xảy ra
- 📝 **Nature:** Thông tin thực tế, mô tả sự kiện
- 🎯 **Action:** Thông báo để admin biết điều gì đã xảy ra
- 📊 **Frequency:** High volume, real-time

#### **Các loại thông báo (từ Prisma Schema):**

```typescript
// Enum NotificationType từ prisma/schema.prisma
'ORDER_PLACED'; // 🛒 Đơn hàng mới được tạo
'COMMENT_RECEIVED'; // 💬 Bình luận/đánh giá mới
'MESSAGE_RECEIVED'; // 📨 Tin nhắn mới từ khách hàng
'LOW_STOCK'; // 📦 Cảnh báo hết hàng (legacy)
'SYSTEM_ALERT'; // ⚠️ Cảnh báo hệ thống
'PROMOTION_SUGGESTION'; // 🎯 Đề xuất khuyến mãi (legacy)
'VOUCHER_SUGGESTION'; // 🎫 Đề xuất voucher (legacy)
'AI_ASSISTANT'; // 🤖 AI Assistant (container cho AI recommendations)
```

#### **Ví dụ thông báo thực tế:**

```
🛒 "Đơn hàng mới (COD)" - "Nguyễn Văn A vừa đặt đơn hàng COD"
🛒 "Đơn hàng mới (STRIPE)" - "Trần Thị B vừa đặt đơn hàng STRIPE"
💳 "Thanh toán thành công" - "Đơn hàng #123456 đã được thanh toán"
💬 "Bình luận mới trên bài viết" - "Khách hàng vừa bình luận trên bài viết 'iPhone 15'"
⭐ "Đánh giá mới" - "Có khách hàng vừa đánh giá sản phẩm"
📨 "Tin nhắn mới" - "Bạn có tin nhắn mới từ khách hàng"
⚠️ "Thông báo hệ thống" - "Lỗi kết nối thanh toán MoMo"
```

---

### 🤖 **AI RECOMMENDATION SYSTEM**

#### **Đặc điểm:**

- ⏰ **Timing:** Định kỳ (hourly/daily) analysis
- 🧠 **Nature:** Phân tích thông minh, đề xuất hành động
- 🎯 **Action:** Gợi ý để admin thực hiện
- 📊 **Frequency:** Lower volume, scheduled

#### **Các loại AI recommendations (BusinessEventType):**

```typescript
// 🔥 INVENTORY EVENTS (Tồn kho)
'INVENTORY_LOW'; // 📦 Tồn kho thấp
'INVENTORY_CRITICAL'; // 🚨 Tồn kho nguy hiểm
'INVENTORY_OUT'; // 💀 Hết hàng hoàn toàn

// 📊 SALES EVENTS (Doanh số)
'SALES_SPIKE'; // 📈 Doanh số tăng đột biến
'SALES_DROP'; // 📉 Doanh số giảm

// 💳 PAYMENT EVENTS (Thanh toán)
'PAYMENT_FAILURES'; // ❌ Lỗi thanh toán nhiều

// ⭐ REVIEW EVENTS (Đánh giá)
'REVIEW_NEGATIVE'; // 👎 Đánh giá tiêu cực

// 🏪 COMPETITOR EVENTS (Đối thủ)
'COMPETITOR_PRICE_CHANGE'; // 💰 Đối thủ thay đổi giá
'COMPETITOR_PRICE_ADVANTAGE'; // 🎯 Đối thủ có lợi thế giá

// ⚠️ SYSTEM EVENTS (Hệ thống)
'SYSTEM_ERROR'; // 🔧 Lỗi hệ thống

// 👥 CUSTOMER EVENTS (Khách hàng)
'CUSTOMER_COMPLAINT'; // 😠 Khiếu nại khách hàng
'CART_ABANDONMENT_SPIKE'; // 🛒 Bỏ giỏ hàng tăng
'HIGH_VALUE_CUSTOMER_LOST'; // 💎 Mất khách VIP
'AVERAGE_ORDER_VALUE_DROP'; // 📉 Giá trị đơn hàng giảm

// 🎯 BUSINESS INTELLIGENCE EVENTS (Thông minh kinh doanh)
'SEASONAL_MARKETING'; // 🎄 Marketing theo mùa
'CONVERSION_OPTIMIZATION'; // 🔄 Tối ưu chuyển đổi
'ORDER_MANAGEMENT'; // 📋 Quản lý đơn hàng
'RETURN_ANALYSIS'; // 🔄 Phân tích trả hàng
'CUSTOMER_ENGAGEMENT'; // 💬 Tương tác khách hàng

// 🤖 AI RECOMMENDATION TYPES (từ aiRecommendationService.ts)
'PROMOTION_SUGGESTION'; // 🎯 Đề xuất khuyến mãi
'PRIORITY_BOOST'; // 📈 Đề xuất tăng priority
'STOCK_ALERT'; // 📦 Cảnh báo tồn kho
'MARKETING_PUSH'; // 📧 Cơ hội email marketing
'PENDING_ORDER_ALERT'; // ⚠️ Đơn hàng pending quá lâu
'CUSTOMER_RETENTION'; // 💎 Khách VIP cần retention
'PERFORMANCE_ANOMALY'; // 📊 Hiệu suất bất thường
```

#### **Ví dụ AI recommendations thực tế:**

```
🚨 "Magic Keyboard for iPad Pro" - "HẾT HÀNG: chỉ còn 4 cái! SẮP HẾT!"
🎯 "Đề xuất Khuyến mãi" - "iPhone 15 đã 45 ngày chỉ bán 3 sản phẩm. Đề xuất giảm 15%"
📧 "Cơ hội Email Marketing" - "MacBook Air có 150 lượt xem nhưng chỉ 5 bán. Đề xuất email campaign"
⚠️ "Đơn hàng pending quá lâu" - "Đơn hàng #123340 của Nguyễn Văn A đã pending 3 ngày"
🎄 "Cơ hội marketing theo mùa" - "Tết Nguyên Đán còn 14 ngày - Chuẩn bị campaign"
📈 "Đề xuất tăng priority" - "iPhone 15 có 40% lượt xem tăng tuần này"
```

---

## 🏗️ **KIẾN TRÚC HỆ THỐNG**

### **Data Flow:**

```
📢 NOTIFICATION FLOW:
Event happens → NotificationService.create() → Pusher → Admin sees notification

🤖 AI RECOMMENDATION FLOW:
Scheduled Analysis → AIRecommendationService.run() → AI_ASSISTANT notification → Admin sees recommendation
```

### **Database Structure:**

```sql
-- Notification table (chung cho cả 2 systems)
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  type VARCHAR -- 'ORDER_PLACED' | 'AI_ASSISTANT' | etc.
  title VARCHAR,
  message TEXT,
  data JSONB, -- Chứa metadata khác nhau cho từng loại
  created_at TIMESTAMP
);

-- AI Recommendation metadata trong data field:
{
  "aiRecommendation": true,
  "aiAssistant": true,
  "eventType": "PENDING_ORDER_ALERT",
  "reasoning": "Order pending 3 days, customer may cancel",
  "urgency": "HIGH",
  "confidence": 95,
  "suggestedAction": {
    "action": "PROCESS_ORDER",
    "orderId": "123340"
  },
  "expectedImpact": "Prevent order cancellation"
}
```

---

## 🔧 **IMPLEMENTATION DETAILS**

### **File Structure:**

```
src/app/libs/
├── notifications/
│   └── notificationService.ts     # 📢 Event notifications
└── ai/
    └── aiRecommendationService.ts # 🤖 AI recommendations

src/app/components/admin/
└── dashboard/
    └── NotificationTab.tsx        # UI với filter tách biệt
```

### **Key Services:**

#### **NotificationService (Event Notifications):**

```typescript
// Tạo thông báo sự kiện - THỰC TẾ từ notificationService.ts
static async createOrderNotification(orderId, userId, orderData)
static async createMessageNotification(messageId, userId, fromUserId, messageData)
static async createPaymentNotification(orderId, userId, paymentData)
static async createReviewNotification(productId, userId, fromUserId, reviewData)
static async createSystemNotification(userId, title, message, alertData)
static async createOrderUpdateNotification(orderId, userId, status)
static async createPromotionNotification(userId, title, message)
static async broadcastNotification(type, title, message, data)

// API Routes sử dụng NotificationService:
// 📁 src/app/api/orders/send-notifications/route.ts
// 📁 src/app/api/articleComment/route.ts
// 📁 src/app/utils/orderNotifications.ts
```

#### **AIRecommendationService (AI Recommendations):**

```typescript
// Phân tích và tạo AI recommendations - THỰC TẾ từ aiRecommendationService.ts
static async analyzePendingOrders()           // Đơn hàng pending quá lâu
static async analyzeCustomerRetention()      // Khách VIP cần retention
static async analyzeInventoryCritical()      // Tồn kho nguy hiểm
static async generateAIRecommendations()     // Product performance analysis
static async runAIRecommendations()          // Main orchestrator
static async analyzeProductPerformance()     // Phân tích hiệu suất sản phẩm
static async sendAIRecommendations()         // Gửi recommendations cho admin

// AI Assistant Event Monitor - THỰC TẾ từ eventMonitor.ts
static async checkInventoryEvents()          // Kiểm tra tồn kho
static async checkSalesEvents()              // Kiểm tra doanh số
static async checkSeasonalMarketingOpportunities() // Marketing theo mùa
static async checkPendingOrdersAlert()       // Đơn hàng pending
static async checkBirthdayCampaignOpportunities() // Campaign sinh nhật
static async processEscalations()            // Xử lý leo thang

// AI Memory Service - THỰC TẾ từ memoryService.ts
static async createOrUpdateMemory()          // Tạo/cập nhật AI memory
static async shouldSendNotification()        // Kiểm tra anti-spam
static async generatePersonalityResponse()   // Tạo response theo personality
```

---

## 🎨 **UI/UX FEATURES**

### **Filter System:**

- **📂 Chế độ xem:**
  - `Tất cả` - Hiển thị cả notifications và AI recommendations
  - `📢 Thông báo sự kiện` - Chỉ hiển thị event notifications
  - `🤖 AI Recommendations` - Chỉ hiển thị AI suggestions

### **Visual Differentiation:**

- **📢 Event Notifications:** Standard notification styling
- **🤖 AI Recommendations:**
  - Special "AI" badge
  - Action buttons (Xử lý, Bỏ qua, Snooze)
  - Confidence score display
  - Expected impact information

### **Action Buttons (AI Recommendations only) - ĐÃ ĐƠN GIẢN HÓA:**

```typescript
// AI Action buttons đã được đơn giản hóa (2025-08-02)
VIEW_DETAILS; // 🔍 Xem chi tiết sản phẩm
EMAIL_MARKETING; // 📧 Email marketing

// ❌ REMOVED (quá phức tạp):
// RESTOCK, PROCESS_ORDER, SEND_VIP_VOUCHER, CREATE_PROMOTION, BOOST_PRIORITY
```

---

## ⚙️ **CONFIGURATION & SCHEDULING**

### **AI Analysis Schedule:**

```typescript
// Chạy AI analysis định kỳ
- Pending Orders: Every 4 hours
- Customer Retention: Daily at 9 AM
- Inventory Critical: Every 2 hours
- Product Performance: Daily at 8 AM
```

### **Anti-spam Logic:**

```typescript
// Chống spam AI recommendations
- Chỉ gửi top 8 recommendations quan trọng nhất
- Không gửi duplicate trong 24h
- Sort by urgency × confidence score
```

---

## 🚀 **BENEFITS**

### **✅ Clarity:**

- Admin biết rõ đâu là thông tin, đâu là hành động
- Không bị overwhelm bởi quá nhiều notifications

### **✅ Actionability:**

- AI recommendations có action buttons cụ thể
- Clear expected impact và confidence score

### **✅ Performance:**

- Event notifications real-time
- AI recommendations batch processing

### **✅ User Experience:**

- Filter system giúp focus vào từng loại
- Visual differentiation rõ ràng
- Priority-based display

---

## 📊 **MONITORING & ANALYTICS**

### **Metrics to Track:**

```typescript
// Notification metrics
- Event notification volume by type
- Response time to notifications
- Mark-as-read rates

// AI Recommendation metrics
- Recommendation acceptance rate
- Action completion rate
- Business impact measurement
- Confidence score accuracy
```

---

## 🎯 **NEXT STEPS**

### **Phase 1: Current Implementation ✅**

- [x] Tách biệt Notification vs AI Recommendation
- [x] UI filter system
- [x] Enhanced AI analysis capabilities
- [x] Action buttons for AI recommendations

### **Phase 2: Future Enhancements**

- [ ] Machine learning for better recommendations
- [ ] A/B testing for recommendation strategies
- [ ] Integration with business KPIs
- [ ] Mobile push notifications
- [ ] Advanced analytics dashboard

---

---

## 🔄 **CẬP NHẬT MỚI NHẤT (2025-08-02)**

### **✅ Đã hoàn thành:**

#### **1. Đơn giản hóa AI Action Buttons**

- **Trước**: 6+ actions phức tạp (apply_discount, boost_priority, restock, etc.)
- **Sau**: Chỉ 2 actions đơn giản:
  - 🔍 **Xem chi tiết** → `?view=productId` (tự động mở form sản phẩm)
  - 📧 **Email marketing** → `?openEmailModal=true` (mở email modal)

#### **2. Sửa lỗi Auto-open Product Form**

- **Vấn đề**: Bấm "Xem chi tiết" từ AI notification không mở form
- **Giải pháp**: Thêm logic trong `ManageProductsClient.tsx`:
  ```typescript
  useEffect(() => {
    const viewProductId = searchParams.get('view');
    if (viewProductId && currentProducts.length > 0) {
      const productToView = currentProducts.find(p => p.id === viewProductId);
      if (productToView) {
        handleOpenModal(productToView); // Tự động mở form
      }
    }
  }, [searchParams, currentProducts]);
  ```

#### **3. Làm sạch nội dung thông báo**

- **Vấn đề**: Title và message trùng lặp (ví dụ: "🚨 KHẨN CẤP: Magic Keyboard" + "🚨 KHẨN CẤP HẾT HÀNG: Magic Keyboard...")
- **Giải pháp**: Sửa `memoryService.ts`:
  - **Title**: Chỉ icon + tên sản phẩm ("🚨 Magic Keyboard")
  - **Message**: Chỉ thông tin cụ thể ("HẾT HÀNG: chỉ còn 4 cái! SẮP HẾT!")

#### **4. Sửa điều kiện hiển thị AI buttons**

- **Vấn đề**: AI buttons không hiển thị vì điều kiện sai
- **Giải pháp**: Đổi từ `notification.data?.aiRecommendation` thành `notification.data?.aiAssistant`

### **🎯 Kết quả:**

- ✅ **UI gọn gàng**: Không còn thông tin trùng lặp
- ✅ **Actions đơn giản**: Chỉ 2 nút thay vì 6+
- ✅ **Auto-navigation**: Tự động mở form khi cần
- ✅ **Email integration**: Kết nối với email marketing có sẵn

---

**🎉 Hệ thống Notification vs AI Recommendation đã được implement hoàn chỉnh và sẵn sàng sử dụng!**

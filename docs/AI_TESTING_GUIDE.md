# 🧪 AI System Testing Guide - Hướng dẫn Test Đầy đủ

## 🎯 **TL;DR - Quick Test Steps**

1. **Tạo dữ liệu test**: Seed analytics + tạo orders + products cũ
2. **Test AI button**: Click "🤖 AI Analysis" ở góc phải admin panel  
3. **Xem notifications**: AI sẽ gửi đề xuất với badges đẹp
4. **Click notification**: Navigate đến product management

---

## 📋 **Prerequisites - Điều kiện cần thiết**

### 1. **Environment Setup**
```bash
# Thêm vào .env.local
CRON_SECRET=ai-test-secret-123456789
```

### 2. **User Role**
- Phải login với role `ADMIN` hoặc `STAFF`
- Chỉ admin/staff mới thấy button AI và nhận notifications

### 3. **Database có dữ liệu**
Cần có ít nhất:
- ✅ Products với `createdAt` cũ (>30 ngày)
- ✅ AnalyticsEvent với `PRODUCT_VIEW`
- ✅ Orders với status `confirmed`/`completed`
- ✅ Reviews (optional, để test rating-based recommendations)

---

## 🚀 **Step-by-Step Testing**

### **BƯỚC 1: Tạo Test Data**

#### **1.1. Seed Analytics Events**
```bash
# Tạo 1000 PRODUCT_VIEW events
curl -X POST "http://localhost:3000/api/analytics/seed" \
  -H "Content-Type: application/json" \
  -d '{"action": "seed", "count": 1000}'
```

#### **1.2. Tạo Products cũ (Manual)**
Vào admin panel → Manage Products → Tạo vài sản phẩm, sau đó:
```sql
-- Update createdAt để giả lập sản phẩm cũ (>30 ngày)
UPDATE Product 
SET createdAt = DATE_SUB(NOW(), INTERVAL 45 DAY)
WHERE name LIKE '%iPhone%';

-- Set inStock cao để test marketing suggestions
UPDATE Product 
SET inStock = 100, priority = 0
WHERE name LIKE '%MacBook%';
```

#### **1.3. Tạo Orders với ít sales**
```typescript
// Tạo vài orders với ít quantity để simulate "sản phẩm ế"
// Có thể dùng admin panel hoặc API
POST /api/orders/admin-create
{
  "products": [
    {
      "id": "product-id-here",
      "name": "iPhone 15 Pro Max",
      "quantity": 1,  // Ít quantity
      "price": 25000000
    }
  ],
  "amount": 25000000,
  "status": "confirmed"
}
```

### **BƯỚC 2: Test AI Analysis**

#### **2.1. Manual Test - Click Button**
1. Login as ADMIN
2. Vào bất kỳ trang admin nào
3. Thấy button "🤖 AI Analysis" ở góc phải dưới
4. Click button → Loading spinner → Success notification

#### **2.2. API Test**
```bash
# Test API trực tiếp
curl -X POST "http://localhost:3000/api/ai/analyze-products" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie"

# Expected response:
{
  "success": true,
  "data": {
    "productsAnalyzed": 10,
    "recommendationsGenerated": 3,
    "notificationsSent": 3
  }
}
```

#### **2.3. Check GET endpoint**
```bash
# Xem stats và recommendations
curl "http://localhost:3000/api/ai/analyze-products"

# Expected response:
{
  "success": true,
  "data": {
    "stats": {
      "totalProducts": 10,
      "lowPerformingProducts": 2,
      "trendingProducts": 1,
      "urgentRecommendations": 1
    },
    "topRecommendations": [...]
  }
}
```

### **BƯỚC 3: Verify Notifications**

#### **3.1. Check Notifications xuất hiện**
- Sau khi click AI button, notifications sẽ xuất hiện tự động
- Hoặc refresh trang để thấy notifications

#### **3.2. Verify Notification Content**
Notifications sẽ có:
- ✅ **Title**: "🎯 Đề xuất Khuyến mãi" hoặc "📈 Đề xuất Tăng Priority"
- ✅ **Message**: Chi tiết về sản phẩm và đề xuất
- ✅ **AI Badge**: Urgency (HIGH/MEDIUM/LOW) và confidence (85%)
- ✅ **Icon**: 🤖 cho AI recommendations

#### **3.3. Test Navigation**
- Click notification → Navigate to `/admin/manage-products?highlight=productId`
- Product được highlight trong danh sách

---

## 🔍 **Expected AI Recommendations**

### **Scenario 1: Sản phẩm Ế (PROMOTION_SUGGESTION)**
```
Điều kiện: Product > 30 ngày, < 5 lượt bán, conversion rate < 2%
Notification: "🎯 Đề xuất Khuyến mãi"
Message: "iPhone 15 Pro Max đã 45 ngày chỉ bán 3 sản phẩm. Đề xuất giảm 15%"
Urgency: HIGH
Confidence: 85%
```

### **Scenario 2: Sản phẩm Trending (PRIORITY_BOOST)**
```
Điều kiện: viewCount7d > viewCount30d * 0.4, priority < 5
Notification: "📈 Đề xuất Tăng Priority"  
Message: "MacBook Air M2 có 120 lượt xem tuần này (+300%). Đề xuất tăng priority"
Urgency: MEDIUM
Confidence: 75%
```

### **Scenario 3: Cơ hội Marketing (MARKETING_PUSH)**
```
Điều kiện: inStock > 50, viewCount30d > 100, salesCount30d < 20
Notification: "📧 Cơ hội Email Marketing"
Message: "iPad Pro có 200 lượt xem nhưng chỉ 5 bán. Đề xuất chạy email campaign"
Urgency: MEDIUM  
Confidence: 70%
```

---

## 🧪 **Advanced Testing**

### **Test Cron Job**
```bash
# Test cron endpoint
curl "http://localhost:3000/api/cron/ai-analysis?secret=ai-test-secret-123456789"

# Expected: Same as manual test but with "trigger": "cron"
```

### **Test Error Handling**
```bash
# Test without auth
curl -X POST "http://localhost:3000/api/ai/analyze-products"
# Expected: 401 Unauthorized

# Test with wrong cron secret
curl "http://localhost:3000/api/cron/ai-analysis?secret=wrong-secret"
# Expected: 401 Unauthorized
```

### **Test với Database trống**
- Xóa hết AnalyticsEvent và Orders
- Chạy AI analysis → Sẽ có 0 recommendations
- Notification: "🤖 AI Analysis Hoàn thành - Đã phân tích X sản phẩm, tạo 0 đề xuất"

---

## 🚨 **Troubleshooting**

### **Không có Notifications xuất hiện**
```bash
# Check console logs
# Browser DevTools → Console → Look for:
"🤖 Starting AI Product Analysis..."
"📊 Analyzed X products"  
"💡 Generated X recommendations"
"📨 Sent X notifications to admins"
```

### **Button không hiển thị**
- Check user role: Chỉ ADMIN mới thấy button
- Check component render: NotificationSystem phải được include trong layout

### **Notifications trống**
- Check database có đủ data không
- Check products có `createdAt` > 30 ngày không
- Check có AnalyticsEvent với `PRODUCT_VIEW` không

### **API Error 500**
```bash
# Check server logs
npm run dev
# Look for error messages in terminal
```

---

## ✅ **Success Checklist**

Sau khi test thành công, bạn sẽ thấy:

- [ ] Button "🤖 AI Analysis" xuất hiện ở góc phải (chỉ admin)
- [ ] Click button → Loading spinner → Success notification
- [ ] AI notifications xuất hiện với badges đẹp
- [ ] Notifications có urgency colors (đỏ/vàng/xanh)
- [ ] Confidence scores hiển thị "X% tin cậy"
- [ ] Click notification → Navigate đến product management
- [ ] Console logs hiển thị đúng số liệu
- [ ] API endpoints trả về data hợp lệ
- [ ] Cron job hoạt động với secret

---

## 🎉 **Demo Data Setup (Quick)**

Nếu muốn test nhanh, chạy script này:

```sql
-- 1. Tạo sản phẩm cũ
INSERT INTO Product (name, price, inStock, priority, createdAt, categoryId) 
VALUES ('iPhone Test Cũ', 20000000, 5, 0, DATE_SUB(NOW(), INTERVAL 45 DAY), 'category-id');

-- 2. Tạo analytics events
-- (Dùng API seed như trên)

-- 3. Tạo ít orders
-- (Dùng admin panel tạo 1-2 orders với quantity thấp)
```

Sau đó click "🤖 AI Analysis" và enjoy! 🚀

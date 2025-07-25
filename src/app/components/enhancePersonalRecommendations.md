# Phân tích và Cải tiến Logic Personalized Recommendations

## 🎯 Mục tiêu của User

**Scenario mong muốn:**

- User xem 2 sản phẩm iPhone + 1 sản phẩm iPad
- Hệ thống nên hiển thị: 4 sản phẩm iPhone + 2 sản phẩm iPad (tỷ lệ 2:1)
- Thay vì hiện tại: random 6 sản phẩm từ các category user quan tâm

## 🔍 Phân tích Logic Hiện tại

### ✅ **Điểm mạnh:**

1. **Thu thập category preferences đúng cách:**

   ```typescript
   const interestedCategories = new Set<string>();
   // Từ view history: +3 điểm
   // Từ purchase history: +5 điểm
   // Từ collaborative filtering: +2 điểm
   ```

2. **Scoring system hợp lý:**

   - Mua hàng (5 điểm) > Xem sản phẩm (3 điểm) > Collaborative (2 điểm)
   - Có kết hợp global trending data

3. **Fallback strategy tốt:**
   - New user → Global trending
   - Không có data → Recent products

### ❌ **Vấn đề chính:**

#### 1. **Không có Category Weight Distribution**

```typescript
// Hiện tại: Chỉ cộng +1 điểm cho tất cả category quan tâm
if (interestedCategories.has(product.categoryId)) {
  score += 1; // ❌ Không phân biệt tỷ lệ quan tâm
}
```

**Vấn đề:**

- User xem 10 iPhone + 1 iPad → cả 2 category đều được +1 điểm như nhau
- Không phản ánh đúng mức độ quan tâm thực tế

#### 2. **Không có Proportional Distribution**

```typescript
.slice(0, 6); // ❌ Chỉ lấy top 6 theo điểm, không quan tâm category balance
```

**Vấn đề:**

- Có thể trả về 6 iPhone + 0 iPad
- Hoặc 3 iPhone + 3 iPad (không đúng tỷ lệ 10:1)

## 🚀 Đề xuất Cải tiến

### **Bước 1: Tính Category Weights**

```typescript
// Thay vì Set<string>, dùng Map<categoryId, weight>
const categoryWeights = new Map<string, number>();

// View history: weight = số lần xem
viewHistory.forEach(item => {
  const currentWeight = categoryWeights.get(item.category) || 0;
  categoryWeights.set(item.category, currentWeight + 1);
});

// Purchase history: weight = số lần mua (có thể x2 để tăng trọng số)
purchaseHistory.forEach(order => {
  order.products.forEach(product => {
    const currentWeight = categoryWeights.get(product.category) || 0;
    categoryWeights.set(product.category, currentWeight + 2); // Mua quan trọng hơn xem
  });
});
```

### **Bước 2: Tính Proportional Distribution**

```typescript
// Ví dụ: iPhone: 10, iPad: 2, MacBook: 1
// Total weight: 13
// Với 6 sản phẩm:
// iPhone: (10/13) * 6 = 4.6 → 5 sản phẩm
// iPad: (2/13) * 6 = 0.9 → 1 sản phẩm
// MacBook: (1/13) * 6 = 0.5 → 0 sản phẩm (fallback)

const totalWeight = Array.from(categoryWeights.values()).reduce((sum, w) => sum + w, 0);
const targetCount = 6;

const categoryDistribution = new Map<string, number>();
categoryWeights.forEach((weight, categoryId) => {
  const proportion = weight / totalWeight;
  const count = Math.round(proportion * targetCount);
  categoryDistribution.set(categoryId, Math.max(1, count)); // Tối thiểu 1 sản phẩm
});
```

### **Bước 3: Lấy sản phẩm theo tỷ lệ**

```typescript
const recommendedProducts: Product[] = [];

// Lấy sản phẩm cho từng category theo tỷ lệ
categoryDistribution.forEach((count, categoryId) => {
  const categoryProducts = scoredProducts.filter(p => p.categoryId === categoryId).slice(0, count);

  recommendedProducts.push(...categoryProducts);
});

// Fallback: Nếu không đủ 6 sản phẩm, lấy thêm từ top scored
if (recommendedProducts.length < 6) {
  const remaining = 6 - recommendedProducts.length;
  const usedIds = new Set(recommendedProducts.map(p => p.id));
  const additionalProducts = scoredProducts.filter(p => !usedIds.has(p.id)).slice(0, remaining);

  recommendedProducts.push(...additionalProducts);
}
```

## 📊 So sánh Kết quả

### **Scenario Test:**

User có lịch sử: 8 lần xem iPhone, 2 lần xem iPad, 1 lần mua MacBook

### **Logic hiện tại:**

```
interestedCategories = ["iPhone", "iPad", "MacBook"]
→ Tất cả sản phẩm trong 3 category đều +1 điểm
→ Kết quả có thể: 3 iPhone + 2 iPad + 1 MacBook (ngẫu nhiên)
```

### **Logic mới:**

```
categoryWeights = { iPhone: 8, iPad: 2, MacBook: 2 }
totalWeight = 12
→ iPhone: (8/12) * 6 = 4 sản phẩm
→ iPad: (2/12) * 6 = 1 sản phẩm
→ MacBook: (2/12) * 6 = 1 sản phẩm
→ Kết quả: 4 iPhone + 1 iPad + 1 MacBook (đúng tỷ lệ quan tâm)
```

## ✅ Đánh giá Tính khả thi

### **Ưu điểm:**

1. **Phản ánh đúng user behavior:** Tỷ lệ recommendations = tỷ lệ quan tâm thực tế
2. **Tương thích với code hiện tại:** Chỉ cần modify phần cuối của algorithm
3. **Có fallback strategy:** Nếu category không đủ sản phẩm → lấy từ category khác
4. **Performance tốt:** Không tăng complexity đáng kể

### **Thách thức:**

1. **Edge cases:** Category có ít sản phẩm hoặc hết hàng
2. **New categories:** User bắt đầu quan tâm category mới
3. **Diversity vs Relevance:** Cân bằng giữa đúng tỷ lệ và đa dạng

### **Giải pháp:**

1. **Minimum guarantee:** Mỗi category quan tâm ít nhất 1 sản phẩm
2. **Fallback distribution:** Nếu category không đủ → phân bổ lại cho category khác
3. **Diversity boost:** Thêm 1-2 sản phẩm từ trending categories mới

## 🎯 Kết luận

**Logic đề xuất là HỢP LÝ và THỰC TẾ:**

✅ **Phù hợp với user expectation:** Recommendations phản ánh đúng sở thích
✅ **Tương thích với hệ thống hiện tại:** Không cần thay đổi lớn
✅ **Scalable:** Hoạt động tốt với nhiều categories
✅ **Có fallback:** Xử lý được edge cases

**Đề xuất implement theo thứ tự:**

1. Implement category weight calculation
2. Add proportional distribution logic
3. Test với real user data
4. Fine-tune weights và fallback strategies

**Expected impact:**

- Tăng user engagement (recommendations relevant hơn)
- Tăng conversion rate (đúng sở thích user)
- Cải thiện user experience (không bị "surprise" bởi irrelevant products)

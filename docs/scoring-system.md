# Hệ thống Scoring cho Gợi ý Sản phẩm (PersonalizedRecommendations)

## Tổng quan

Hệ thống gợi ý sản phẩm sử dụng thuật toán scoring đa yếu tố để cá nhân hóa trải nghiệm người dùng. Hệ thống phân biệt giữa người dùng mới và người dùng có dữ liệu để áp dụng chiến lược gợi ý phù hợp.

## Phân loại Người dùng

### 1. Người dùng chưa đăng nhập (Guest)
- **Logic**: `getGlobalTrendingProducts()`
- **Dữ liệu**: Sản phẩm trending toàn cầu trong 7 ngày
- **Kết quả**: 6 sản phẩm phổ biến nhất

### 2. Người dùng mới (Đã đăng nhập nhưng chưa có dữ liệu)
- **Điều kiện**: `viewHistory.length === 0 && purchaseHistory.length === 0`
- **Logic**: `getGlobalTrendingProducts()` (tái sử dụng)
- **Lý do**: Không có dữ liệu cá nhân để phân tích

### 3. Người dùng có dữ liệu
- **Logic**: `getEnhancedPersonalizedRecommendations()`
- **Dữ liệu**: Kết hợp dữ liệu cá nhân + xu hướng toàn cầu

## Hệ thống Scoring cho Người dùng có Dữ liệu

### Công thức tính điểm tổng:
```
Total Score = Personal Score + Category/Brand Score + Global Trending Score
```

### Chi tiết các yếu tố:

#### 1. Personal Score (Điểm cá nhân)
- **Lịch sử xem sản phẩm**: +3 điểm/lần xem
- **Lịch sử mua hàng**: +5 điểm/lần mua
- **Collaborative Filtering**: +2 điểm (sản phẩm người khác cũng xem)

#### 2. Category/Brand Score (Điểm sở thích)
- **Thích category**: +1 điểm
- **Thích brand**: +1 điểm

#### 3. Global Trending Score (Điểm xu hướng)
- **Công thức**: `trendingProduct.recommendationScore * 0.1`
- **Trọng số thấp**: Chỉ là yếu tố phụ

### Ví dụ tính điểm:

```javascript
Sản phẩm: iPhone 15 Pro
- Đã xem 1 lần: +3 điểm
- Đã mua 1 lần: +5 điểm  
- Collaborative filtering: +2 điểm
- Thích category "Smartphone": +1 điểm
- Thích brand "Apple": +1 điểm
- Global trending score (50): +5 điểm (50 * 0.1)
= Tổng: 17 điểm
```

## Quy trình xử lý

### Bước 1: Thu thập dữ liệu
1. **Global Trends**: `/api/analytics/global-trends?days=7&limit=15`
2. **Lịch sử xem**: `/api/user/analytics` (30 ngày gần nhất)
3. **Lịch sử mua**: `/api/user/purchase-history` (đơn hoàn thành)

### Bước 2: Tính điểm
1. Khởi tạo `productScores = new Map()`
2. Duyệt qua lịch sử xem → +3 điểm
3. Duyệt qua lịch sử mua → +5 điểm
4. Áp dụng collaborative filtering → +2 điểm
5. Tính điểm category/brand → +1 điểm
6. Thêm điểm global trending → +0.1x điểm gốc

### Bước 3: Sắp xếp và lọc
1. Chỉ lấy sản phẩm còn hàng (`inStock > 0`)
2. Sắp xếp theo điểm giảm dần
3. Lấy 6 sản phẩm đầu tiên

## Trọng số ưu tiên

| Thứ tự | Yếu tố | Trọng số | Lý do |
|--------|--------|----------|-------|
| 1 | Lịch sử mua hàng | +5 | Hành vi mua = quan tâm cao nhất |
| 2 | Lịch sử xem | +3 | Đã quan tâm đến sản phẩm |
| 3 | Collaborative Filtering | +2 | Gợi ý từ hành vi người khác |
| 4 | Sở thích Category/Brand | +1 | Xu hướng cá nhân |
| 5 | Global Trending | +0.1x | Xu hướng chung (trọng số thấp) |

## Xử lý Edge Cases

### 1. Không có dữ liệu API
- **Fallback**: `getRecentProducts()` (sản phẩm mới nhất)
- **Điều kiện**: Khi tất cả API calls thất bại

### 2. Không có sản phẩm nào có điểm
- **Fallback**: `getRecentProducts()`
- **Điều kiện**: `scoredProducts.length === 0`

### 3. Dữ liệu rỗng
- **Lịch sử xem rỗng**: Bỏ qua bước tính điểm xem
- **Lịch sử mua rỗng**: Bỏ qua bước tính điểm mua
- **Collaborative data rỗng**: Bỏ qua bước collaborative filtering

## Tối ưu hóa

### 1. Tái sử dụng Logic
- Người dùng mới và guest đều dùng `getGlobalTrendingProducts()`
- Không duplicate code cho các trường hợp tương tự

### 2. Caching
- Global trends data có thể cache (ít thay đổi)
- Personal data cần fresh (thay đổi thường xuyên)

### 3. Performance
- Limit API calls: 15 trending products, 50 view history
- Chỉ xử lý sản phẩm còn hàng
- Kết quả cuối chỉ 6 sản phẩm

## Monitoring và Analytics

### Metrics cần theo dõi:
1. **Click-through rate**: Tỷ lệ click vào sản phẩm gợi ý
2. **Conversion rate**: Tỷ lệ mua sản phẩm được gợi ý
3. **API response time**: Thời gian phản hồi của các API
4. **Fallback rate**: Tần suất sử dụng fallback logic

### Debug Information:
- Log khi phát hiện người dùng mới
- Log khi sử dụng fallback
- Track scoring distribution để tune trọng số

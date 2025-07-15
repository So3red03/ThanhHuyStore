# Nâng Cấp Personalized Recommendations System

## 📊 Phân Tích Logic Hiện Tại

### ❌ Vấn đề hiện tại:

1. **Data Source hạn chế**: Chỉ dựa trên user cá nhân
2. **Thiếu Collaborative Filtering**: Không có "người khác cũng xem"
3. **Không có Review Integration**: Bỏ qua đánh giá sản phẩm
4. **Duplicate Analytics**: Tạo nhiều records cho cùng 1 lần click
5. **Thiếu Global Trends**: Không biết sản phẩm nào đang hot

### ✅ Mục tiêu nâng cấp:

- Sử dụng toàn bộ analytics data (global trends)
- Tích hợp review scoring
- Tránh duplicate analytics records
- Collaborative filtering đơn giản
- Smart fallback strategies

## 🎯 Chiến Lược Nâng Cấp

### Phase 1: Fix Analytics Tracking (Ưu tiên cao)

#### 1.1 Tối ưu trackProductInteraction

```javascript
// OLD: Tạo record mỗi lần click
await prisma.analyticsEvent.create({...});

// NEW: Upsert để tránh duplicate
await prisma.analyticsEvent.upsert({
  where: {
    userId_productId_eventType: {
      userId: userId,
      productId: productId,
      eventType: 'product_view'
    }
  },
  update: {
    updatedAt: new Date(),
    metadata: newMetadata
  },
  create: {
    userId,
    productId,
    eventType: 'product_view',
    metadata
  }
});
```

#### 1.2 Composite Unique Index

```prisma
// schema.prisma
model AnalyticsEvent {
  // ... existing fields
  updatedAt   DateTime  @updatedAt

  @@unique([userId, entityId, eventType], name: "user_entity_event_unique")
}
```

#### 1.3 Analytics Cleanup API

```javascript
// /api/analytics/cleanup
// Check duplicates: POST {"action": "check_duplicates"}
// Clean duplicates: POST {"action": "clean_duplicates"}
// Get stats: POST {"action": "stats"}
```

#### 1.4 Enhanced ProductCard Tracking

```javascript
// Improved tracking with more metadata
trackProductInteraction(product.id, {
  productName: product.name,
  category: product.categoryId,
  brand: product.brand,
  price: product.price,
  clickSource: 'ProductCard',
  interactionType: 'click',
  productType: product.type,
  inStock: product.inStock
});
```

#### 1.5 Duplicate Issue Analysis

**Vấn đề phát hiện**: 2 records cho cùng 1 sản phẩm vì có 2 tracking sources:

1. **AnalyticsTracker** (page view) → `interactionType: 'view'`
2. **ProductCard click** → `interactionType: 'click'`

**Giải pháp**:

- Merge metadata từ cả 2 sources
- Track cả page view và click trong 1 record
- Sử dụng `interactionSources` array để biết nguồn tracking

**Enhanced Metadata Structure**:

```javascript
{
  interactionCount: 3,
  interactionSources: ['ProductCard', 'AnalyticsTracker'],
  hasPageView: true,
  hasClick: true,
  allSessionIds: ['session_123', 'session_456'],
  firstInteraction: '2025-01-15T10:50:57.705Z',
  lastInteraction: '2025-01-15T10:53:03.571Z'
}
```

#### 1.6 Admin Cleanup Tool

**URL**: `/admin/analytics-cleanup`

**Features**:

- Check duplicate analytics records
- Clean duplicate records (keep latest)
- View analytics statistics
- Real-time cleanup results

#### 1.7 Final Fix Implementation

**Root Cause**: Inconsistent source naming

- `interactionType: 'click'` → `interactionSources: ['click']`
- `clickSource: 'ProductCard'` → `interactionSources: ['ProductCard']`

**Solution**: Normalize source names

```javascript
// Normalize source name to be consistent
let newSource = 'unknown';
if (metadata.clickSource) {
  newSource = metadata.clickSource; // 'ProductCard', 'AnalyticsTracker'
} else if (metadata.interactionType === 'click') {
  newSource = 'ProductCard'; // Default click source
} else if (metadata.interactionType === 'view') {
  newSource = 'AnalyticsTracker'; // Default view source
}
```

**Race Condition Handling**:

- Check for multiple existing records
- Merge all duplicates into single record
- Delete extra records automatically
- Preserve all metadata from all sources

**Expected Result**: 1 record per user+product with complete interaction history

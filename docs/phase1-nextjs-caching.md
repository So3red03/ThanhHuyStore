# Phase 1: Next.js Caching Optimization

## 🎯 Mục tiêu
Tối ưu Next.js caching để giảm database queries và tăng tốc độ load page.

## 📊 Vấn đề hiện tại
```typescript
// Thấy ở nhiều files:
export const dynamic = 'force-dynamic';
```
**Hậu quả:**
- Tắt hoàn toàn Next.js caching
- Mọi request đều hit database
- Không có static generation
- Performance kém

## 🔧 Giải pháp

### 1. Phân loại Pages theo Data Freshness

#### Static Pages (Cache 24h)
```typescript
export const revalidate = 86400; // 24 hours
```
- About pages
- Terms & conditions
- Static content pages

#### Semi-Static Pages (Cache 1-6h)
```typescript
export const revalidate = 3600; // 1 hour
export const revalidate = 21600; // 6 hours
```
- Product listing pages
- Category pages
- Article listing pages

#### Dynamic Pages (Cache 30min-1h)
```typescript
export const revalidate = 1800; // 30 minutes
export const revalidate = 3600; // 1 hour
```
- Product detail pages
- Article detail pages
- Search results

#### Real-time Pages (Keep force-dynamic)
```typescript
export const dynamic = 'force-dynamic';
```
- Cart pages
- Checkout pages
- User account pages
- Admin pages

### 2. Implementation Strategy

#### Step 1: Remove force-dynamic từ Static Pages
```typescript
// BEFORE
export const dynamic = 'force-dynamic';

// AFTER
export const revalidate = 86400; // hoặc thời gian phù hợp
```

#### Step 2: Add Revalidation cho API Routes
```typescript
// src/app/api/products/route.ts
export async function GET() {
  const products = await prisma.product.findMany();
  
  return NextResponse.json(products, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  });
}
```

#### Step 3: Optimize Fetch Calls
```typescript
// BEFORE
const products = await getProducts();

// AFTER
const products = await fetch('/api/products', {
  next: { revalidate: 3600 }
});
```

## 📋 Files cần thay đổi

### Pages cần remove force-dynamic
```
src/app/(home)/page.tsx → revalidate: 3600
src/app/(home)/news/page.tsx → revalidate: 1800
src/app/(home)/product/[productId]/page.tsx → revalidate: 3600
src/app/(home)/search/page.tsx → revalidate: 1800
src/app/(home)/news/search/page.tsx → revalidate: 1800
```

### Pages giữ force-dynamic
```
src/app/(home)/login/page.tsx
src/app/(home)/register/page.tsx
src/app/(home)/cart/page.tsx
src/app/(home)/cart/checkout/page.tsx
src/app/(home)/cart/orderconfirmation/page.tsx
src/app/(home)/account/orders/page.tsx
src/app/(home)/stripecheckout/page.tsx
src/app/(admin)/admin/page.tsx
src/app/(admin)/admin/news-dashboard/page.tsx
src/app/(admin)/admin/manage-promotions/page.tsx
```

### API Routes cần optimize
```
src/app/api/products/route.ts
src/app/api/categories/route.ts
src/app/api/articles/route.ts
src/app/api/articlePagination/[skip]/[take]/route.ts
src/app/api/voucher/active/route.ts
```

## 🔄 Implementation Steps

### Ngày 1: Audit và Planning
1. **Tạo backup**: `git commit -m "Before caching optimization"`
2. **List tất cả files** có `force-dynamic`
3. **Phân loại pages** theo data freshness requirements
4. **Xác định revalidation times** cho từng page type

### Ngày 2: Implementation
1. **Update home page**:
```typescript
// src/app/(home)/page.tsx
// REMOVE: export const dynamic = 'force-dynamic';
// ADD: export const revalidate = 3600; // 1 hour
```

2. **Update product pages**:
```typescript
// src/app/(home)/product/[productId]/page.tsx
// REMOVE: export const dynamic = 'force-dynamic';
// ADD: export const revalidate = 3600; // 1 hour
```

3. **Update news pages**:
```typescript
// src/app/(home)/news/page.tsx
// REMOVE: export const dynamic = 'force-dynamic';
// ADD: export const revalidate = 1800; // 30 minutes
```

4. **Update search pages**:
```typescript
// src/app/(home)/search/page.tsx
// REMOVE: export const dynamic = 'force-dynamic';
// ADD: export const revalidate = 1800; // 30 minutes
```

5. **Optimize API routes**:
```typescript
// Add cache headers to API responses
headers: {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
}
```

### Ngày 3: Testing
1. **Test page load speeds**
2. **Verify data freshness**
3. **Test cache invalidation**
4. **Performance benchmarking**

## 🧪 Testing Checklist

### Performance Testing
- [ ] Measure page load times before/after
- [ ] Check database query reduction
- [ ] Verify cache hit rates
- [ ] Test on different devices/networks

### Functionality Testing
- [ ] All pages load correctly
- [ ] Data is up-to-date within revalidation window
- [ ] Search functionality works
- [ ] Product details are accurate
- [ ] News articles display correctly

### Cache Testing
- [ ] Pages serve from cache when appropriate
- [ ] Cache invalidates after revalidation time
- [ ] Dynamic pages still work real-time
- [ ] Admin pages remain dynamic

## 📊 Expected Results

### Performance Improvements
- **Page load speed**: 3-5x faster
- **Database queries**: 80-90% reduction
- **Server response time**: 70-80% faster
- **CDN cache hit rate**: 80-90%

### Metrics to Track
```bash
# Before optimization
- Home page load: ~2-3s
- Product page load: ~1-2s
- Database queries per page: 5-10

# After optimization
- Home page load: ~0.5-1s
- Product page load: ~0.3-0.5s
- Database queries per page: 0-2 (from cache)
```

## ⚠️ Potential Issues

### Issue 1: Stale Data
**Problem**: Cached data might be outdated
**Solution**: Set appropriate revalidation times based on data change frequency

### Issue 2: Cache Invalidation
**Problem**: Need to invalidate cache when data changes
**Solution**: Use `revalidateTag()` or `revalidatePath()` in admin actions

### Issue 3: Dynamic Content
**Problem**: Some content needs to be real-time
**Solution**: Keep `force-dynamic` for user-specific or real-time pages

## 🔄 Rollback Plan
If caching causes issues:
1. `git revert` to backup commit
2. Identify specific problematic pages
3. Add `force-dynamic` back to those pages temporarily
4. Fix caching strategy for those specific pages

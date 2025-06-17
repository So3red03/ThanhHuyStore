# Phase 3: Testing & Optimization

## 🎯 Mục tiêu
Đảm bảo tất cả optimizations hoạt động đúng và đạt performance targets.

## 📋 Testing Checklist

### 🔍 PHASE 1 TESTING: Next.js Caching

#### Performance Testing
- [ ] **Home Page Load Time**
  - Before: _____ seconds
  - After: _____ seconds
  - Target: < 1 second
  - Status: ⏳ Pending

- [ ] **Product Page Load Time**
  - Before: _____ seconds
  - After: _____ seconds
  - Target: < 0.5 seconds
  - Status: ⏳ Pending

- [ ] **Search Page Load Time**
  - Before: _____ seconds
  - After: _____ seconds
  - Target: < 1 second
  - Status: ⏳ Pending

- [ ] **Database Query Count**
  - Before: _____ queries per page
  - After: _____ queries per page
  - Target: 80-90% reduction
  - Status: ⏳ Pending

#### Functionality Testing
- [ ] **Home Page**
  - Products display correctly: ⏳
  - Categories load properly: ⏳
  - Banner images show: ⏳
  - News section works: ⏳

- [ ] **Product Pages**
  - Product details accurate: ⏳
  - Images load correctly: ⏳
  - Reviews display: ⏳
  - Related products show: ⏳

- [ ] **Search Functionality**
  - Search results accurate: ⏳
  - Pagination works: ⏳
  - Filters function: ⏳
  - No results handled: ⏳

- [ ] **News/Articles**
  - Article list displays: ⏳
  - Article details load: ⏳
  - Categories filter: ⏳
  - Search articles works: ⏳

#### Cache Testing
- [ ] **Cache Headers Present**
  - Home page: ⏳
  - Product pages: ⏳
  - API routes: ⏳
  - Static assets: ⏳

- [ ] **Cache Invalidation**
  - Data updates after revalidation time: ⏳
  - Manual revalidation works: ⏳
  - Cache clears on admin changes: ⏳

### 🔍 PHASE 2 TESTING: Zustand Migration

#### Performance Testing
- [ ] **Re-render Count**
  - Cart operations before: _____ re-renders
  - Cart operations after: _____ re-renders
  - Target: 70% reduction
  - Status: ⏳ Pending

- [ ] **Bundle Size**
  - Before: _____ KB
  - After: _____ KB
  - Target: 15-20% reduction
  - Status: ⏳ Pending

- [ ] **Memory Usage**
  - Before: _____ MB
  - After: _____ MB
  - Target: 20-30% reduction
  - Status: ⏳ Pending

#### Cart Functionality Testing
- [ ] **Add to Cart**
  - Single product: ⏳
  - Multiple products: ⏳
  - Duplicate products: ⏳
  - Out of stock handling: ⏳

- [ ] **Cart Operations**
  - Increase quantity: ⏳
  - Decrease quantity: ⏳
  - Remove product: ⏳
  - Clear cart: ⏳

- [ ] **Cart Persistence**
  - Survives page refresh: ⏳
  - Survives browser close/open: ⏳
  - Syncs across tabs: ⏳
  - Handles localStorage errors: ⏳

- [ ] **Checkout Flow**
  - Cart info step: ⏳
  - Shipping calculation: ⏳
  - Payment selection: ⏳
  - Order confirmation: ⏳

- [ ] **Voucher System**
  - Apply voucher: ⏳
  - Remove voucher: ⏳
  - Discount calculation: ⏳
  - Voucher validation: ⏳

#### UI Functionality Testing
- [ ] **Sidebar**
  - Open/close: ⏳
  - Toggle functionality: ⏳
  - Responsive behavior: ⏳
  - State persistence: ⏳

- [ ] **Notifications**
  - Receive notifications: ⏳
  - Mark as read: ⏳
  - Mark all as read: ⏳
  - Real-time updates: ⏳

#### Integration Testing
- [ ] **Cart + UI Integration**
  - Cart count updates in navbar: ⏳
  - Cart sidebar shows correct items: ⏳
  - Cart total calculates correctly: ⏳

- [ ] **Notifications + UI Integration**
  - Notification badge updates: ⏳
  - Notification dropdown works: ⏳
  - Real-time notifications appear: ⏳

### 🔍 REGRESSION TESTING

#### Core Functionality
- [ ] **User Authentication**
  - Login works: ⏳
  - Register works: ⏳
  - Logout works: ⏳
  - Session persistence: ⏳

- [ ] **Product Management**
  - Product listing: ⏳
  - Product details: ⏳
  - Product search: ⏳
  - Product categories: ⏳

- [ ] **Order Management**
  - Place order: ⏳
  - Order history: ⏳
  - Order status: ⏳
  - Payment processing: ⏳

- [ ] **Admin Functions**
  - Admin dashboard: ⏳
  - Manage products: ⏳
  - Manage orders: ⏳
  - Analytics: ⏳

#### Cross-Browser Testing
- [ ] **Chrome**: ⏳
- [ ] **Firefox**: ⏳
- [ ] **Safari**: ⏳
- [ ] **Edge**: ⏳

#### Mobile Testing
- [ ] **iOS Safari**: ⏳
- [ ] **Android Chrome**: ⏳
- [ ] **Responsive design**: ⏳
- [ ] **Touch interactions**: ⏳

## 🛠️ Testing Tools & Commands

### Performance Testing
```bash
# Lighthouse audit
npx lighthouse http://localhost:3000 --output html --output-path ./lighthouse-report.html

# Bundle analyzer
npm run build
npx @next/bundle-analyzer

# Performance profiling
npm run dev
# Open Chrome DevTools > Performance tab
```

### Load Testing
```bash
# Install artillery (if needed)
npm install -g artillery

# Create load test config
# artillery.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Homepage"
    requests:
      - get:
          url: "/"

# Run load test
artillery run artillery.yml
```

### Cache Testing
```bash
# Test cache headers
curl -I http://localhost:3000/

# Test cache with different requests
curl -H "Cache-Control: no-cache" http://localhost:3000/

# Check Next.js cache
ls -la .next/cache/
```

### Store Testing
```javascript
// Test Zustand stores in browser console
// Access store directly
window.__ZUSTAND_STORE__ = useCartStore.getState();

// Monitor store changes
useCartStore.subscribe((state) => {
  console.log('Store updated:', state);
});
```

## 📊 Performance Benchmarks

### Target Metrics
| Metric | Before | Target | Actual | Status |
|--------|--------|--------|--------|--------|
| Home page load | 2-3s | <1s | _____ | ⏳ |
| Product page load | 1-2s | <0.5s | _____ | ⏳ |
| Cart operations | 200-500ms | <100ms | _____ | ⏳ |
| Database queries | 5-10/page | 0-2/page | _____ | ⏳ |
| Bundle size | ~500KB | <400KB | _____ | ⏳ |
| Re-renders (cart) | 10-20 | 3-6 | _____ | ⏳ |

### Web Vitals Targets
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| First Contentful Paint | <1.8s | _____ | ⏳ |
| Largest Contentful Paint | <2.5s | _____ | ⏳ |
| First Input Delay | <100ms | _____ | ⏳ |
| Cumulative Layout Shift | <0.1 | _____ | ⏳ |

## 🐛 Bug Tracking

### Known Issues
| Issue | Severity | Status | Resolution |
|-------|----------|--------|------------|
| | | | |

### Test Failures
| Test | Expected | Actual | Action |
|------|----------|--------|--------|
| | | | |

## ✅ Sign-off Criteria

### Phase 1 Complete
- [ ] All caching tests pass
- [ ] Performance targets met
- [ ] No functionality regressions
- [ ] All pages load correctly

### Phase 2 Complete
- [ ] All Zustand tests pass
- [ ] Cart functionality works perfectly
- [ ] UI interactions smooth
- [ ] No TypeScript errors

### Final Sign-off
- [ ] All tests pass
- [ ] Performance targets exceeded
- [ ] No critical bugs
- [ ] Documentation complete
- [ ] Ready for production

## 📝 Test Reports

### Daily Test Summary
**Date**: _____
**Tester**: _____
**Phase**: _____

**Tests Run**: _____ / _____
**Tests Passed**: _____ / _____
**Tests Failed**: _____ / _____

**Critical Issues**: _____
**Performance**: _____
**Next Steps**: _____

### Final Test Report
**Overall Status**: ⏳ Pending
**Performance Improvement**: _____%
**Functionality**: ✅ All working
**Recommendation**: ⏳ Pending approval

# Implementation Checklist - ThanhHuy Store Performance Optimization

## 📋 PHASE 1: Next.js Caching Optimization (Ngày 1-3)

### Ngày 1: Audit và Planning

- [ ] **1.1** Audit tất cả files có `export const dynamic = 'force-dynamic'`
- [ ] **1.2** Phân loại pages theo tần suất thay đổi data
- [ ] **1.3** Xác định revalidation strategy cho từng page type
- [ ] **1.4** Backup code hiện tại (git commit)

### Ngày 2: Implementation Caching

- [ ] **2.1** Remove `force-dynamic` từ static pages
- [ ] **2.2** Add `revalidate` cho product pages
- [ ] **2.3** Add `revalidate` cho category pages
- [ ] **2.4** Add `revalidate` cho article pages
- [ ] **2.5** Optimize API routes caching
- [ ] **2.6** Test caching behavior

### Ngày 3: Testing Caching

- [ ] **3.1** Test page load speeds
- [ ] **3.2** Verify data freshness
- [ ] **3.3** Test cache invalidation
- [ ] **3.4** Performance benchmarking
- [ ] **3.5** Fix any caching issues

## 📋 PHASE 2: Zustand Migration (Ngày 4-7)

### Ngày 4: Setup Zustand

- [ ] **4.1** Install Zustand: `npm install zustand`
- [ ] **4.2** Create stores directory: `src/stores/`
- [ ] **4.3** Create CartStore (replace useCart)
- [ ] **4.4** Create UIStore (replace SidebarProvider)
- [ ] **4.5** Create NotificationStore
- [ ] **4.6** Test store functionality

### Ngày 5: Migrate Cart System

- [ ] **5.1** Update CartProvider.tsx to use CartStore
- [ ] **5.2** Update all cart-related components
- [ ] **5.3** Update cart pages (cart, checkout, etc.)
- [ ] **5.4** Test cart functionality thoroughly
- [ ] **5.5** Verify localStorage persistence

### Ngày 6: Migrate UI & Notifications

- [ ] **6.1** Update SidebarProvider to use UIStore
- [ ] **6.2** Update notification system
- [ ] **6.3** Update all components using these stores
- [ ] **6.4** Test UI interactions
- [ ] **6.5** Test notification system

### Ngày 7: Final Testing & Optimization

- [ ] **7.1** Full application testing
- [ ] **7.2** Performance benchmarking
- [ ] **7.3** Fix any remaining issues
- [ ] **7.4** Code cleanup and optimization
- [ ] **7.5** Documentation update

## 🗂️ FILES TO MODIFY

### New Files to Create

- [ ] `src/stores/index.ts` → Export all stores
- [ ] `src/stores/cartStore.ts` → Replace useCart logic
- [ ] `src/stores/uiStore.ts` → Replace SidebarProvider logic
- [ ] `src/stores/notificationStore.ts` → Replace useNotifications logic

### Core Files (Must Change)

- [ ] `src/app/hooks/useCart.tsx` → Migrate to Zustand wrapper
- [ ] `src/app/providers/CartProvider.tsx` → Simplify to wrapper only
- [ ] `src/app/providers/SidebarProvider.tsx` → Migrate to Zustand wrapper
- [ ] `src/app/hooks/useNotifications.ts` → Migrate to Zustand wrapper
- [ ] `package.json` → Add Zustand dependency

### Pages with force-dynamic (Remove/Optimize)

- [ ] `src/app/(home)/page.tsx`
- [ ] `src/app/(home)/search/page.tsx`
- [ ] `src/app/(home)/news/page.tsx`
- [ ] `src/app/(home)/news/search/page.tsx`
- [ ] `src/app/(home)/login/page.tsx`
- [ ] `src/app/(home)/register/page.tsx`
- [ ] `src/app/(home)/cart/page.tsx`
- [ ] `src/app/(home)/cart/checkout/page.tsx`
- [ ] `src/app/(home)/cart/orderconfirmation/page.tsx`
- [ ] `src/app/(home)/account/orders/page.tsx`
- [ ] `src/app/(home)/product/[productId]/page.tsx`
- [ ] `src/app/(home)/stripecheckout/page.tsx`

### Admin Pages (force-dynamic)

- [ ] `src/app/(admin)/admin/page.tsx`
- [ ] `src/app/(admin)/admin/news-dashboard/page.tsx`
- [ ] `src/app/(admin)/admin/manage-promotions/page.tsx`

### Components Using Cart

- [ ] `src/app/components/nav/CartCount.tsx`
- [ ] `src/app/(home)/cart/CartBuyClient.tsx`
- [ ] `src/app/(home)/cart/checkout/CheckoutClient.tsx`
- [ ] `src/app/(home)/cart/ItemContent.tsx`
- [ ] `src/app/(home)/cart/DiscountCombobox.tsx`
- [ ] `src/app/(home)/cart/VoucherDisplay.tsx`

### Components Using Sidebar

- [ ] `src/app/components/nav/Navbar.tsx`
- [ ] Any component using `useSidebar()`

### Components Using Notifications

- [ ] Components displaying notifications
- [ ] Admin notification components

## ⚠️ CRITICAL CHECKPOINTS

### After Each Day

- [ ] **Git commit** with descriptive message
- [ ] **Test basic functionality** (cart, navigation, etc.)
- [ ] **Check for console errors**
- [ ] **Verify no UI changes**

### Before Moving to Next Phase

- [ ] **Full regression testing**
- [ ] **Performance comparison**
- [ ] **No breaking changes**
- [ ] **All features working**

## 🚨 ROLLBACK PLAN

If any phase fails:

1. **Git revert** to last working commit
2. **Identify specific issue**
3. **Fix issue in isolation**
4. **Re-test before continuing**

## 📊 SUCCESS METRICS

### Performance Targets

- [ ] Page load speed: 40-60% faster
- [ ] Database queries: 80-90% reduction
- [ ] Re-renders: 70% reduction
- [ ] Bundle size: 15-20% smaller

### Functionality Targets

- [ ] All existing features work
- [ ] No UI changes
- [ ] No logic changes
- [ ] Better error handling

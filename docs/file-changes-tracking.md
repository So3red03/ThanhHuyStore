# File Changes Tracking - ThanhHuy Store Optimization

## 📊 PHASE 1: Next.js Caching Changes

### ✅ Completed Files
- [ ] **Status**: ⏳ Pending | ✅ Done | ❌ Failed | 🔄 In Progress

### Pages - Remove force-dynamic, Add revalidate

#### Home & Main Pages
- [ ] `src/app/(home)/page.tsx`
  - **Change**: Remove `export const dynamic = 'force-dynamic';`
  - **Add**: `export const revalidate = 3600; // 1 hour`
  - **Status**: ⏳ Pending
  - **Notes**: Main homepage, cache for 1 hour

- [ ] `src/app/(home)/news/page.tsx`
  - **Change**: Remove `export const dynamic = 'force-dynamic';`
  - **Add**: `export const revalidate = 1800; // 30 minutes`
  - **Status**: ⏳ Pending
  - **Notes**: News listing, cache for 30 minutes

#### Search Pages
- [ ] `src/app/(home)/search/page.tsx`
  - **Change**: Remove `export const dynamic = 'force-dynamic';`
  - **Add**: `export const revalidate = 1800; // 30 minutes`
  - **Status**: ⏳ Pending
  - **Notes**: Search results, cache for 30 minutes

- [ ] `src/app/(home)/news/search/page.tsx`
  - **Change**: Remove `export const dynamic = 'force-dynamic';`
  - **Add**: `export const revalidate = 1800; // 30 minutes`
  - **Status**: ⏳ Pending
  - **Notes**: News search, cache for 30 minutes

#### Product Pages
- [ ] `src/app/(home)/product/[productId]/page.tsx`
  - **Change**: Remove `export const dynamic = 'force-dynamic';` (if exists)
  - **Add**: `export const revalidate = 3600; // 1 hour`
  - **Status**: ⏳ Pending
  - **Notes**: Product details, cache for 1 hour

#### Keep force-dynamic (User-specific pages)
- [ ] `src/app/(home)/login/page.tsx` - ✅ Keep as is
- [ ] `src/app/(home)/register/page.tsx` - ✅ Keep as is
- [ ] `src/app/(home)/cart/page.tsx` - ✅ Keep as is
- [ ] `src/app/(home)/cart/checkout/page.tsx` - ✅ Keep as is
- [ ] `src/app/(home)/cart/orderconfirmation/page.tsx` - ✅ Keep as is
- [ ] `src/app/(home)/account/orders/page.tsx` - ✅ Keep as is
- [ ] `src/app/(home)/stripecheckout/page.tsx` - ✅ Keep as is

#### Admin Pages (Keep force-dynamic)
- [ ] `src/app/(admin)/admin/page.tsx` - ✅ Keep as is
- [ ] `src/app/(admin)/admin/news-dashboard/page.tsx` - ✅ Keep as is
- [ ] `src/app/(admin)/admin/manage-promotions/page.tsx` - ✅ Keep as is

### API Routes - Add Cache Headers
- [ ] `src/app/api/voucher/active/route.ts`
  - **Add**: Cache headers for 30 minutes
  - **Status**: ⏳ Pending

- [ ] `src/app/api/articlePagination/[skip]/[take]/route.ts`
  - **Add**: Cache headers for 30 minutes
  - **Status**: ⏳ Pending

## 📊 PHASE 2: Zustand Migration Changes

### New Store Files (Create)
- [ ] `src/stores/index.ts`
  - **Action**: Create new file
  - **Content**: Export all stores
  - **Status**: ⏳ Pending

- [ ] `src/stores/cartStore.ts`
  - **Action**: Create new file
  - **Content**: Replace useCart logic with Zustand
  - **Status**: ⏳ Pending
  - **Lines**: ~200-250 lines

- [ ] `src/stores/uiStore.ts`
  - **Action**: Create new file
  - **Content**: Replace SidebarProvider logic
  - **Status**: ⏳ Pending
  - **Lines**: ~30-50 lines

- [ ] `src/stores/notificationStore.ts`
  - **Action**: Create new file
  - **Content**: Replace useNotifications logic
  - **Status**: ⏳ Pending
  - **Lines**: ~100-150 lines

### Hook Files (Update)
- [ ] `src/app/hooks/useCart.tsx`
  - **Action**: Replace Context logic with Zustand
  - **Original**: 322 lines
  - **New**: ~50-80 lines (wrapper)
  - **Status**: ⏳ Pending
  - **Notes**: Keep same interface for backward compatibility

- [ ] `src/app/hooks/useNotifications.ts`
  - **Action**: Replace with Zustand store calls
  - **Original**: 158 lines
  - **New**: ~30-50 lines (wrapper)
  - **Status**: ⏳ Pending

### Provider Files (Simplify)
- [ ] `src/app/providers/CartProvider.tsx`
  - **Action**: Remove Context logic, keep wrapper
  - **Original**: 14 lines
  - **New**: ~8-10 lines
  - **Status**: ⏳ Pending

- [ ] `src/app/providers/SidebarProvider.tsx`
  - **Action**: Remove Context logic, update useSidebar
  - **Original**: 20 lines
  - **New**: ~15-20 lines
  - **Status**: ⏳ Pending

### Components (No Changes - Backward Compatible)
- [ ] `src/app/components/nav/CartCount.tsx` - ✅ No changes needed
- [ ] `src/app/(home)/cart/CartBuyClient.tsx` - ✅ No changes needed
- [ ] `src/app/(home)/cart/checkout/CheckoutClient.tsx` - ✅ No changes needed
- [ ] `src/app/(home)/cart/ItemContent.tsx` - ✅ No changes needed
- [ ] `src/app/(home)/cart/DiscountCombobox.tsx` - ✅ No changes needed
- [ ] `src/app/(home)/cart/VoucherDisplay.tsx` - ✅ No changes needed

### Package.json
- [ ] `package.json`
  - **Add**: `"zustand": "^4.4.7"`
  - **Status**: ⏳ Pending

## 📋 DAILY PROGRESS TRACKING

### Day 1: Next.js Caching Audit
- [ ] **Morning**: Audit all force-dynamic files
- [ ] **Afternoon**: Plan revalidation strategy
- [ ] **Evening**: Create backup commit
- **Status**: ⏳ Not Started
- **Blockers**: None
- **Notes**: 

### Day 2: Implement Caching
- [ ] **Morning**: Update home and main pages
- [ ] **Afternoon**: Update search and product pages
- [ ] **Evening**: Add API cache headers
- **Status**: ⏳ Not Started
- **Blockers**: 
- **Notes**: 

### Day 3: Test Caching
- [ ] **Morning**: Performance testing
- [ ] **Afternoon**: Functionality testing
- [ ] **Evening**: Fix issues and optimize
- **Status**: ⏳ Not Started
- **Blockers**: 
- **Notes**: 

### Day 4: Setup Zustand
- [ ] **Morning**: Install Zustand, create store structure
- [ ] **Afternoon**: Create CartStore
- [ ] **Evening**: Create UIStore and NotificationStore
- **Status**: ⏳ Not Started
- **Blockers**: 
- **Notes**: 

### Day 5: Migrate Cart
- [ ] **Morning**: Update CartProvider and useCart
- [ ] **Afternoon**: Test cart functionality
- [ ] **Evening**: Fix cart-related issues
- **Status**: ⏳ Not Started
- **Blockers**: 
- **Notes**: 

### Day 6: Migrate UI & Notifications
- [ ] **Morning**: Update SidebarProvider and useSidebar
- [ ] **Afternoon**: Update notification system
- [ ] **Evening**: Test all UI interactions
- **Status**: ⏳ Not Started
- **Blockers**: 
- **Notes**: 

### Day 7: Final Testing
- [ ] **Morning**: Full application testing
- [ ] **Afternoon**: Performance benchmarking
- [ ] **Evening**: Documentation and cleanup
- **Status**: ⏳ Not Started
- **Blockers**: 
- **Notes**: 

## 🚨 ISSUES & RESOLUTIONS

### Issue Log
| Date | Issue | File | Resolution | Status |
|------|-------|------|------------|--------|
| | | | | |

### Performance Metrics
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Home page load | | | |
| Product page load | | | |
| Database queries | | | |
| Bundle size | | | |
| Re-renders (cart) | | | |

## 🔄 ROLLBACK CHECKPOINTS

### Commit History
- [ ] **Initial**: Before any changes
- [ ] **Phase 1 Complete**: After caching optimization
- [ ] **Phase 2 Day 4**: After Zustand setup
- [ ] **Phase 2 Day 5**: After cart migration
- [ ] **Phase 2 Day 6**: After UI migration
- [ ] **Final**: After all optimizations

### Rollback Commands
```bash
# Rollback to specific checkpoint
git revert <commit-hash>

# Rollback entire phase
git reset --hard <checkpoint-commit>
```

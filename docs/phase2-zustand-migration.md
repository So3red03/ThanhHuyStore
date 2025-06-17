# Phase 2: Zustand Migration

## 🎯 Mục tiêu
Migration từ React Context API sang Zustand để tối ưu performance và giảm re-renders.

## 📊 Vấn đề hiện tại với Context API

### useCart Hook Issues
```typescript
// src/app/hooks/useCart.tsx - 322 lines
- 6 useEffect không tối ưu
- Dependency arrays không chính xác
- Re-render toàn bộ component tree
- localStorage operations không debounced
```

### SidebarProvider Issues
```typescript
// src/app/providers/SidebarProvider.tsx - 20 lines
- Simple state nhưng dùng Context
- Unnecessary re-renders
```

## 🚀 Zustand Solution

### Advantages
- **Bundle size**: 2.9kb vs Context API overhead
- **Performance**: Không re-render toàn bộ tree
- **TypeScript**: Better type support
- **Persistence**: Built-in localStorage sync
- **DevTools**: Redux DevTools support

## 📋 Implementation Plan

### Ngày 4: Setup Zustand & Create Stores

#### 4.1 Install Zustand
```bash
npm install zustand
```

#### 4.2 Create Store Directory
```
src/stores/
├── index.ts
├── cartStore.ts
├── uiStore.ts
└── notificationStore.ts
```

#### 4.3 Create CartStore
```typescript
// src/stores/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartStore {
  // State
  cartProducts: CartProductType[] | null;
  cartTotalQty: number;
  cartTotalAmount: number;
  paymentIntent: string | null;
  step: number;
  cartInfo: any;
  shippingFee: number;
  selectedVoucher: Voucher | null;
  discountAmount: number;
  finalAmount: number;

  // Actions
  addProduct: (product: CartProductType) => void;
  removeProduct: (product: CartProductType) => void;
  increaseQty: (product: CartProductType) => void;
  decreaseQty: (product: CartProductType) => void;
  clearCart: () => void;
  setPaymentIntent: (intent: string | null) => void;
  nextStep: () => void;
  goToStep: (step: number) => void;
  setCartInfo: (info: any) => void;
  setShippingFee: (fee: number) => void;
  setSelectedVoucher: (voucher: Voucher | null) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Initial state
      cartProducts: null,
      cartTotalQty: 0,
      cartTotalAmount: 0,
      paymentIntent: null,
      step: 1,
      cartInfo: null,
      shippingFee: 0,
      selectedVoucher: null,
      discountAmount: 0,
      finalAmount: 0,

      // Actions implementation
      addProduct: (product) => {
        // Implementation logic
      },
      // ... other actions
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        cartProducts: state.cartProducts,
        cartInfo: state.cartInfo,
        step: state.step,
        shippingFee: state.shippingFee,
        selectedVoucher: state.selectedVoucher,
      }),
    }
  )
);
```

#### 4.4 Create UIStore
```typescript
// src/stores/uiStore.ts
import { create } from 'zustand';

interface UIStore {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),
  openSidebar: () => set({ isSidebarOpen: true }),
}));
```

#### 4.5 Create NotificationStore
```typescript
// src/stores/notificationStore.ts
import { create } from 'zustand';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // Implementation
}));
```

### Ngày 5: Migrate Cart System

#### 5.1 Update CartProvider
```typescript
// src/app/providers/CartProvider.tsx
'use client';

// Remove all Context logic
// Keep only the wrapper for backward compatibility
const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export default CartProvider;
```

#### 5.2 Create Cart Hook Wrapper
```typescript
// src/app/hooks/useCart.tsx
// Keep the same interface for backward compatibility
import { useCartStore } from '@/stores/cartStore';

export const useCart = () => {
  const store = useCartStore();
  
  return {
    cartTotalQty: store.cartTotalQty,
    cartProducts: store.cartProducts,
    cartTotalAmount: store.cartTotalAmount,
    handleAddProductToCart: store.addProduct,
    handleRemoveProductFromCart: store.removeProduct,
    handleCartQtyIncrease: store.increaseQty,
    handleCartQtyDecrease: store.decreaseQty,
    handleClearCart: store.clearCart,
    // ... map all other methods
  };
};
```

#### 5.3 Update Components Using Cart
```typescript
// No changes needed in components!
// They continue using useCart() hook
// But now it's powered by Zustand instead of Context
```

### Ngày 6: Migrate UI & Notifications

#### 6.1 Update SidebarProvider
```typescript
// src/app/providers/SidebarProvider.tsx
'use client';

// Remove Context logic, keep wrapper
export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Update useSidebar hook
export const useSidebar = () => {
  const { isSidebarOpen, toggleSidebar, closeSidebar, openSidebar } = useUIStore();
  
  return {
    isOpen: isSidebarOpen,
    toggleSidebar,
    closeSidebar,
    openSidebar,
  };
};
```

#### 6.2 Update Notification System
```typescript
// src/app/hooks/useNotifications.ts
import { useNotificationStore } from '@/stores/notificationStore';

export const useNotifications = (currentUser: SafeUser | null) => {
  const store = useNotificationStore();
  
  // Keep same interface, use Zustand store internally
  return {
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    isLoading: store.isLoading,
    fetchNotifications: store.fetchNotifications,
    markAsRead: store.markAsRead,
    markAllAsRead: store.markAllAsRead,
  };
};
```

### Ngày 7: Final Testing & Optimization

#### 7.1 Performance Testing
- Compare re-render counts
- Measure bundle size difference
- Test localStorage persistence
- Verify all functionality works

#### 7.2 Code Cleanup
- Remove unused Context code
- Optimize store selectors
- Add TypeScript improvements
- Update documentation

## 📋 Files to Modify

### Core Store Files (New)
```
src/stores/index.ts
src/stores/cartStore.ts
src/stores/uiStore.ts
src/stores/notificationStore.ts
```

### Hook Files (Update)
```
src/app/hooks/useCart.tsx → Update to use Zustand
src/app/hooks/useNotifications.ts → Update to use Zustand
```

### Provider Files (Simplify)
```
src/app/providers/CartProvider.tsx → Remove Context logic
src/app/providers/SidebarProvider.tsx → Remove Context logic
```

### Components Using Cart (No Changes Needed)
```
src/app/components/nav/CartCount.tsx
src/app/(home)/cart/CartBuyClient.tsx
src/app/(home)/cart/checkout/CheckoutClient.tsx
src/app/(home)/cart/ItemContent.tsx
src/app/(home)/cart/DiscountCombobox.tsx
src/app/(home)/cart/VoucherDisplay.tsx
```

### Components Using Sidebar (No Changes Needed)
```
src/app/components/nav/Navbar.tsx
Any component using useSidebar()
```

## 🧪 Testing Strategy

### Unit Testing
- [ ] Test each store action
- [ ] Test persistence
- [ ] Test state updates
- [ ] Test selectors

### Integration Testing
- [ ] Test cart flow end-to-end
- [ ] Test sidebar interactions
- [ ] Test notification system
- [ ] Test localStorage sync

### Performance Testing
- [ ] Measure re-render reduction
- [ ] Compare bundle sizes
- [ ] Test memory usage
- [ ] Benchmark state updates

## 📊 Expected Results

### Performance Improvements
- **Re-renders**: 70% reduction
- **Bundle size**: 15-20% smaller
- **State updates**: 3-5x faster
- **Memory usage**: 20-30% less

### Developer Experience
- **Type safety**: Better TypeScript support
- **Debugging**: Redux DevTools integration
- **Code maintainability**: Cleaner, more organized
- **Testing**: Easier to test stores in isolation

## ⚠️ Migration Risks & Mitigation

### Risk 1: Breaking Changes
**Mitigation**: Keep same hook interfaces, only change internal implementation

### Risk 2: localStorage Issues
**Mitigation**: Test persistence thoroughly, provide fallbacks

### Risk 3: Performance Regression
**Mitigation**: Benchmark before/after, optimize selectors

### Risk 4: TypeScript Errors
**Mitigation**: Maintain strict typing, gradual migration

## 🔄 Rollback Plan

If Zustand migration fails:
1. **Git revert** to pre-migration state
2. **Identify specific issues**
3. **Fix in isolation**
4. **Re-test incrementally**

The beauty of this migration is that components don't need to change - only the underlying state management implementation changes.

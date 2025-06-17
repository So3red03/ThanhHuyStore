# Troubleshooting Guide - ThanhHuy Store Optimization

## 🚨 PHASE 1: Next.js Caching Issues

### Issue 1: Stale Data After Caching
**Symptoms:**
- Product prices not updating
- New articles not showing
- Inventory counts incorrect

**Diagnosis:**
```bash
# Check if page is being cached
curl -I http://localhost:3000/
# Look for Cache-Control headers
```

**Solutions:**
1. **Reduce revalidation time**:
```typescript
// If data changes frequently
export const revalidate = 1800; // 30 minutes instead of 1 hour
```

2. **Force revalidation on data changes**:
```typescript
// In admin actions
import { revalidatePath } from 'next/cache';

export async function updateProduct() {
  // Update product logic
  revalidatePath('/product/[productId]', 'page');
  revalidatePath('/', 'page'); // Revalidate homepage
}
```

3. **Use tags for selective invalidation**:
```typescript
// In page
export const revalidate = 3600;
export const tags = ['products'];

// In admin action
import { revalidateTag } from 'next/cache';
revalidateTag('products');
```

### Issue 2: Pages Not Caching
**Symptoms:**
- Still hitting database on every request
- No performance improvement
- Cache headers missing

**Diagnosis:**
```typescript
// Check if force-dynamic is still present
export const dynamic = 'force-dynamic'; // Remove this!

// Check for dynamic functions
cookies(); // This forces dynamic rendering
headers(); // This forces dynamic rendering
```

**Solutions:**
1. **Remove force-dynamic**:
```typescript
// REMOVE
export const dynamic = 'force-dynamic';

// ADD
export const revalidate = 3600;
```

2. **Move dynamic functions to client components**:
```typescript
// BEFORE (Server Component)
export default function Page() {
  const cookieStore = cookies(); // Forces dynamic
  return <div>...</div>;
}

// AFTER (Client Component)
'use client';
export default function Page() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Get cookies on client side
  }, []);
  
  return <div>...</div>;
}
```

### Issue 3: API Routes Not Caching
**Symptoms:**
- API responses not cached
- Database queries still high
- Slow API responses

**Solutions:**
```typescript
// Add cache headers to API routes
export async function GET() {
  const data = await fetchData();
  
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  });
}
```

## 🚨 PHASE 2: Zustand Migration Issues

### Issue 1: TypeScript Errors
**Symptoms:**
- Type errors in store definitions
- Interface mismatches
- Import/export errors

**Solutions:**
1. **Fix store typing**:
```typescript
// Ensure proper typing
interface CartStore {
  cartProducts: CartProductType[] | null;
  addProduct: (product: CartProductType) => void;
}

export const useCartStore = create<CartStore>()((set, get) => ({
  // Implementation
}));
```

2. **Fix import paths**:
```typescript
// Use absolute imports
import { useCartStore } from '@/stores/cartStore';
// Not relative imports
import { useCartStore } from '../../../stores/cartStore';
```

### Issue 2: Persistence Not Working
**Symptoms:**
- Cart items lost on refresh
- Settings not persisting
- localStorage errors

**Solutions:**
1. **Check persistence config**:
```typescript
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Store implementation
    }),
    {
      name: 'cart-storage', // Unique name
      partialize: (state) => ({
        // Only persist necessary fields
        cartProducts: state.cartProducts,
        cartInfo: state.cartInfo,
      }),
    }
  )
);
```

2. **Handle SSR hydration**:
```typescript
// Add hydration check
const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Store implementation
    }),
    {
      name: 'cart-storage',
      skipHydration: true, // Skip hydration on server
    }
  )
);

// In component
useEffect(() => {
  useCartStore.persist.rehydrate();
}, []);
```

### Issue 3: Components Not Re-rendering
**Symptoms:**
- UI not updating when store changes
- Stale data in components
- Actions not triggering updates

**Solutions:**
1. **Check store selectors**:
```typescript
// WRONG - Will not trigger re-render
const store = useCartStore();
const { cartProducts } = store;

// CORRECT - Will trigger re-render
const cartProducts = useCartStore((state) => state.cartProducts);
```

2. **Use shallow comparison for objects**:
```typescript
import { shallow } from 'zustand/shallow';

const { cartProducts, cartTotalQty } = useCartStore(
  (state) => ({
    cartProducts: state.cartProducts,
    cartTotalQty: state.cartTotalQty,
  }),
  shallow
);
```

### Issue 4: Actions Not Working
**Symptoms:**
- Store actions don't update state
- No errors but state unchanged
- Actions not triggering

**Solutions:**
1. **Check action implementation**:
```typescript
// WRONG - Mutating state directly
addProduct: (product) => {
  get().cartProducts.push(product); // Don't mutate!
},

// CORRECT - Using set function
addProduct: (product) => {
  set((state) => ({
    cartProducts: state.cartProducts 
      ? [...state.cartProducts, product]
      : [product]
  }));
},
```

2. **Use immer for complex updates**:
```typescript
import { immer } from 'zustand/middleware/immer';

export const useCartStore = create<CartStore>()(
  immer((set, get) => ({
    addProduct: (product) => {
      set((state) => {
        if (state.cartProducts) {
          state.cartProducts.push(product); // Immer handles immutability
        } else {
          state.cartProducts = [product];
        }
      });
    },
  }))
);
```

## 🔧 GENERAL DEBUGGING

### Performance Debugging
```typescript
// Add performance logging
console.time('Page Load');
// ... page logic
console.timeEnd('Page Load');

// Monitor re-renders
import { useEffect, useRef } from 'react';

function useRenderCount() {
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current += 1;
    console.log(`Render count: ${renderCount.current}`);
  });
}
```

### Cache Debugging
```bash
# Check Next.js cache
ls -la .next/cache/

# Clear Next.js cache
rm -rf .next/cache/

# Check browser cache
# Open DevTools > Network > Disable cache
```

### Store Debugging
```typescript
// Add Zustand devtools
import { devtools } from 'zustand/middleware';

export const useCartStore = create<CartStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Store implementation
      }),
      { name: 'cart-storage' }
    ),
    { name: 'cart-store' } // DevTools name
  )
);
```

## 🔄 ROLLBACK PROCEDURES

### Emergency Rollback
```bash
# Quick rollback to last working state
git stash
git reset --hard HEAD~1

# Or rollback to specific commit
git reset --hard <commit-hash>
```

### Partial Rollback
```bash
# Rollback specific files
git checkout HEAD~1 -- src/app/hooks/useCart.tsx
git checkout HEAD~1 -- src/stores/cartStore.ts
```

### Rollback Checklist
- [ ] Backup current state: `git stash`
- [ ] Identify last working commit
- [ ] Test rollback in development
- [ ] Verify all functionality works
- [ ] Document what went wrong

## 📞 Getting Help

### Before Asking for Help
1. **Check console errors**
2. **Review recent changes**
3. **Test in clean environment**
4. **Check documentation**

### Information to Provide
- **Error messages** (full stack trace)
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Browser/environment details**
- **Recent changes made**

### Useful Commands
```bash
# Check Next.js build
npm run build

# Check TypeScript errors
npx tsc --noEmit

# Check bundle size
npm run build && npx @next/bundle-analyzer

# Clear all caches
rm -rf .next node_modules package-lock.json
npm install
```

## 📊 Health Checks

### Daily Health Check
- [ ] No console errors
- [ ] All pages load correctly
- [ ] Cart functionality works
- [ ] Admin panel accessible
- [ ] Performance within targets

### Performance Targets
- Home page load: < 1s
- Product page load: < 0.5s
- Cart operations: < 100ms
- Database queries: < 5 per page
- Bundle size: < 500KB

### Red Flags
- ❌ Console errors
- ❌ White screen of death
- ❌ Slow page loads (>3s)
- ❌ Cart not working
- ❌ Data not persisting

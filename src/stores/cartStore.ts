import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'react-hot-toast';
import { CartProductType } from '@/app/(home)/product/[productId]/ProductDetails';

// Voucher interface (copied from useCart)
interface Voucher {
  id: string;
  code: string;
  description: string;
  image?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderValue?: number;
  quantity: number;
  usedCount: number;
  maxUsagePerUser: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  voucherType: string;
}

export interface CartStore {
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

  // Shipping state
  shippingAddress: {
    province: string;
    district: string;
    ward: string;
  } | null;
  shippingType: 'standard' | 'fast' | null;
  isShippingCalculated: boolean;

  // Order note
  orderNote: string;

  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  // Helper functions
  isSameCartItem: (item1: CartProductType, item2: CartProductType) => boolean;

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
  clearVoucherAfterUse: () => void;

  // Shipping actions
  setShippingAddress: (address: { province: string; district: string; ward: string } | null) => void;
  setShippingType: (type: 'standard' | 'fast' | null) => void;
  markShippingCalculated: (calculated: boolean) => void;
  setOrderNote: (note: string) => void;
  resetShippingCalculation: () => void;

  // Computed values (getters)
  getTotalWithShipping: () => number;

  // Internal actions
  calculateTotals: () => void;
  calculateDiscounts: () => void;
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

      // Shipping state
      shippingAddress: null,
      shippingType: null,
      isShippingCalculated: false,

      // Order note
      orderNote: '',

      // Hydration state
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      // Helper function to compare cart items (handles both simple and variant products)
      isSameCartItem: (item1: CartProductType, item2: CartProductType): boolean => {
        // For variant products, compare both productId and variantId
        if (item1.variantId && item2.variantId) {
          return item1.id === item2.id && item1.variantId === item2.variantId;
        }
        // For simple products or mixed comparison, just compare productId
        return item1.id === item2.id && !item1.variantId && !item2.variantId;
      },

      // Actions
      addProduct: (product: CartProductType) => {
        set(state => {
          if (!state.cartProducts) {
            return { cartProducts: [product] };
          }

          // Check if product already exists in cart
          const existingIndex = state.cartProducts.findIndex(item => get().isSameCartItem(item, product));

          if (existingIndex > -1) {
            // Product exists, increase quantity
            const updatedCart = [...state.cartProducts];
            const existingItem = updatedCart[existingIndex];

            if (existingItem.quantity >= product.inStock) {
              toast.error(`${product.name} chỉ còn ${product.inStock} sản phẩm`);
              return state;
            }

            updatedCart[existingIndex] = {
              ...existingItem,
              quantity: existingItem.quantity + product.quantity
            };

            return { cartProducts: updatedCart };
          } else {
            // New product, add to cart
            return { cartProducts: [...state.cartProducts, product] };
          }
        });

        // Calculate totals after state update
        setTimeout(() => get().calculateTotals(), 0);
        toast.success('Thêm sản phẩm thành công');
      },

      removeProduct: (product: CartProductType) => {
        set(state => {
          if (!state.cartProducts) return state;

          const updatedCart = state.cartProducts.filter(item => !get().isSameCartItem(item, product));
          return { cartProducts: updatedCart };
        });

        setTimeout(() => get().calculateTotals(), 0);
        toast.success('Xóa sản phẩm thành công');
      },

      increaseQty: (product: CartProductType) => {
        set(state => {
          if (!state.cartProducts) return state;

          const updatedCart = [...state.cartProducts];
          const existsIndex = updatedCart.findIndex(item => get().isSameCartItem(item, product));

          if (existsIndex > -1) {
            if (updatedCart[existsIndex].quantity >= product.inStock) {
              toast.error(`${product.name} chỉ còn ${product.inStock} sản phẩm`);
              return state;
            }
            updatedCart[existsIndex].quantity += 1;
          }

          return { cartProducts: updatedCart };
        });

        setTimeout(() => get().calculateTotals(), 0);
      },

      decreaseQty: (product: CartProductType) => {
        set(state => {
          if (!state.cartProducts) return state;

          const updatedCart = [...state.cartProducts];
          const existsIndex = updatedCart.findIndex(item => get().isSameCartItem(item, product));

          if (existsIndex > -1) {
            if (updatedCart[existsIndex].quantity <= 1) {
              toast.error('Số lượng không thể dưới 1');
              return state;
            }
            updatedCart[existsIndex].quantity -= 1;
          }

          return { cartProducts: updatedCart };
        });

        setTimeout(() => get().calculateTotals(), 0);
      },

      clearCart: () => {
        set({
          cartProducts: null,
          cartTotalQty: 0,
          cartTotalAmount: 0,
          discountAmount: 0,
          finalAmount: 0,
          // Clear order note when clearing cart
          orderNote: '',
          // Reset shipping calculation
          shippingFee: 0,
          shippingAddress: null,
          shippingType: null,
          isShippingCalculated: false
        });
        toast.success('Xóa tất cả sản phẩm thành công');
      },

      setPaymentIntent: (intent: string | null) => {
        set({ paymentIntent: intent });
      },

      nextStep: () => {
        set(state => {
          if (state.step < 4) {
            return { step: state.step + 1 };
          }
          return state;
        });
      },

      goToStep: (targetStep: number) => {
        set(state => {
          if (state.step === 4 && targetStep === 4) {
            return state;
          }
          if (targetStep <= state.step) {
            return { step: targetStep };
          }
          return state;
        });
      },

      setCartInfo: (info: any) => {
        set({ cartInfo: info });
      },

      setShippingFee: (fee: number) => {
        set({ shippingFee: fee });
        setTimeout(() => get().calculateDiscounts(), 0);
      },

      setSelectedVoucher: (voucher: Voucher | null) => {
        set({ selectedVoucher: voucher });
        setTimeout(() => get().calculateDiscounts(), 0);
      },

      clearVoucherAfterUse: () => {
        set({ selectedVoucher: null, discountAmount: 0 });
        setTimeout(() => get().calculateDiscounts(), 0);
      },

      // Shipping actions
      setShippingAddress: (address: { province: string; district: string; ward: string } | null) => {
        set({
          shippingAddress: address,
          isShippingCalculated: false // Reset calculation when address changes
        });
      },

      setShippingType: (type: 'standard' | 'fast' | null) => {
        set({ shippingType: type });
      },

      markShippingCalculated: (calculated: boolean) => {
        set({ isShippingCalculated: calculated });
      },

      setOrderNote: (note: string) => {
        set({ orderNote: note });
      },

      resetShippingCalculation: () => {
        set({
          shippingFee: 0,
          shippingType: null,
          isShippingCalculated: false
        });
        setTimeout(() => get().calculateDiscounts(), 0);
      },

      // Computed values
      getTotalWithShipping: () => {
        const state = get();
        return state.cartTotalAmount + state.shippingFee;
      },

      // Internal calculations
      calculateTotals: () => {
        const state = get();
        if (state.cartProducts && state.cartProducts.length > 0) {
          const { total, qty } = state.cartProducts.reduce(
            (acc, item) => {
              const itemTotal = item.price * item.quantity;
              acc.total += itemTotal;
              acc.qty += item.quantity;
              return acc;
            },
            { total: 0, qty: 0 }
          );

          const previousTotal = state.cartTotalAmount;
          set({ cartTotalAmount: total, cartTotalQty: qty });

          // If cart total changed and shipping was calculated, mark for recalculation
          if (previousTotal !== total && state.isShippingCalculated) {
            set({ isShippingCalculated: false });
          }

          get().calculateDiscounts();
        } else {
          set({
            cartTotalAmount: 0,
            cartTotalQty: 0,
            discountAmount: 0,
            finalAmount: 0,
            shippingFee: 0,
            isShippingCalculated: false
          });
        }
      },

      calculateDiscounts: () => {
        const state = get();
        if (state.selectedVoucher && state.cartTotalAmount > 0) {
          let discount = 0;

          if (state.selectedVoucher.discountType === 'PERCENTAGE') {
            discount = (state.cartTotalAmount * state.selectedVoucher.discountValue) / 100;
          } else {
            discount = state.selectedVoucher.discountValue;
          }

          const final = state.cartTotalAmount + state.shippingFee - discount;
          set({ discountAmount: discount, finalAmount: final });
        } else {
          const final = state.cartTotalAmount + state.shippingFee;
          set({ discountAmount: 0, finalAmount: final });
        }
      }
    }),
    {
      name: 'cart-storage',
      partialize: state => ({
        cartProducts: state.cartProducts,
        cartInfo: state.cartInfo,
        step: state.step,
        shippingFee: state.shippingFee,
        selectedVoucher: state.selectedVoucher,
        paymentIntent: state.paymentIntent,
        shippingAddress: state.shippingAddress,
        shippingType: state.shippingType,
        orderNote: state.orderNote
        // Note: Don't persist isShippingCalculated - always recalculate on reload
      }),
      // Enable hydration for proper localStorage sync
      onRehydrateStorage: () => state => {
        if (state) {
          // Mark as hydrated
          state.setHasHydrated(true);
          // Recalculate totals after hydration
          setTimeout(() => state.calculateTotals(), 0);
        }
      }
    }
  )
);

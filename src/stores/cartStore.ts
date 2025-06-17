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

      // Actions
      addProduct: (product: CartProductType) => {
        set(state => {
          const updatedCart = state.cartProducts ? [...state.cartProducts, product] : [product];

          return { cartProducts: updatedCart };
        });

        // Calculate totals after state update
        setTimeout(() => get().calculateTotals(), 0);
        toast.success('Thêm sản phẩm thành công');
      },

      removeProduct: (product: CartProductType) => {
        set(state => {
          if (!state.cartProducts) return state;

          const updatedCart = state.cartProducts.filter(item => item.id !== product.id);
          return { cartProducts: updatedCart };
        });

        setTimeout(() => get().calculateTotals(), 0);
        toast.success('Xóa sản phẩm thành công');
      },

      increaseQty: (product: CartProductType) => {
        set(state => {
          if (!state.cartProducts) return state;

          const updatedCart = [...state.cartProducts];
          const existsIndex = updatedCart.findIndex(item => item.id === product.id);

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
          const existsIndex = updatedCart.findIndex(item => item.id === product.id);

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
          finalAmount: 0
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

          set({ cartTotalAmount: total, cartTotalQty: qty });
          get().calculateDiscounts();
        } else {
          set({ cartTotalAmount: 0, cartTotalQty: 0, discountAmount: 0, finalAmount: 0 });
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
        paymentIntent: state.paymentIntent
      }),
      // Handle SSR hydration
      skipHydration: true
    }
  )
);

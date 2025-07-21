'use client';
import { CartProductType } from '@/app/(home)/product/[productId]/ProductDetails';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';

// Keep the old Context for backward compatibility (but it won't be used)
import { createContext } from 'react';
export const CartContext = createContext<CartContextType | null>(null);

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

interface CartContextType {
  cartTotalQty: number;
  cartTotalAmount: number;
  cartProducts: CartProductType[] | null;
  setCartTotalAmount: (amount: number) => void;
  handleAddProductToCart: (product: CartProductType) => void;
  handleRemoveProductFromCart: (product: CartProductType) => void;
  handleCartQtyIncrease: (product: CartProductType) => void;
  handleCartQtyDecrease: (product: CartProductType) => void;
  handleClearCart: () => void;

  // Payment Intent
  paymentIntent: string | null;
  handleSetPaymentIntent: (val: string | null) => void;

  // Step Tracking
  step: number;
  setStep: (targetStep: number) => void;
  handleNextStep: () => void;
  handleGoToStep: (targetStep: number) => void;

  cartInfo: any;
  setCartInfo: (info: any) => void;
  handleInfoClient: (info: any) => void;
  setShippingFee: (shippingFee: number) => void;
  shippingFeeClient: (shippingFee: number) => void;
  shippingFee: number;

  // Voucher
  selectedVoucher: Voucher | null;
  setSelectedVoucher: (voucher: Voucher | null) => void;
  discountAmount: number;
  finalAmount: number;
}

interface Props {
  [propName: string]: any;
}

export const CartContextProvider = (props: Props) => {
  // Now just a wrapper component - all logic moved to Zustand store
  const router = useRouter();

  // Initialize store on mount (Zustand handles persistence automatically)
  useEffect(() => {
    // Zustand persist middleware handles localStorage automatically
    // No manual localStorage operations needed
  }, []);

  // All logic now handled by Zustand store
  // These are just wrapper functions for backward compatibility

  const store = useCartStore();

  const shippingFeeClient = useCallback(
    (params: number) => {
      store.setShippingFee(params);
    },
    [store]
  );

  const handleNextStep = useCallback(() => {
    store.nextStep();
  }, [store]);

  const handleGoToStep = useCallback(
    (targetStep: number) => {
      store.goToStep(targetStep);
      // Handle navigation
      switch (targetStep) {
        case 1:
          router.push('/cart');
          break;
        case 2:
          router.push('/cart/cartinfo');
          break;
        case 3:
          router.push('/cart/checkout');
          break;
        case 4:
          router.push('/cart/orderconfirmation');
          break;
      }
    },
    [store, router]
  );

  const handleInfoClient = useCallback(
    (info: any) => {
      store.setCartInfo(info);
    },
    [store]
  );

  const handleAddProductToCart = useCallback(
    (product: CartProductType) => {
      store.addProduct(product);
    },
    [store]
  );

  const handleRemoveProductFromCart = useCallback(
    (product: CartProductType) => {
      store.removeProduct(product);
    },
    [store]
  );

  const handleCartQtyIncrease = useCallback(
    (product: CartProductType) => {
      store.increaseQty(product);
    },
    [store]
  );

  const handleCartQtyDecrease = useCallback(
    (product: CartProductType) => {
      store.decreaseQty(product);
    },
    [store]
  );

  const handleClearCart = useCallback(() => {
    store.clearCart();
  }, [store]);

  // Handle hydration and initialize store
  useEffect(() => {
    // Rehydrate the store from localStorage
    useCartStore.persist.rehydrate();
    // Calculate totals after hydration
    setTimeout(() => store.calculateTotals(), 0);
  }, [store]);

  const handleSetPaymentIntent = useCallback(
    (val: string | null) => {
      store.setPaymentIntent(val);
    },
    [store]
  );

  const handleSetSelectedVoucher = useCallback(
    (voucher: Voucher | null) => {
      store.setSelectedVoucher(voucher);
    },
    [store]
  );

  const value = {
    cartTotalQty: store.cartTotalQty,
    cartProducts: store.cartProducts,
    handleAddProductToCart,
    handleRemoveProductFromCart,
    handleCartQtyIncrease,
    handleCartQtyDecrease,
    handleClearCart,
    cartTotalAmount: store.getTotalWithShipping(),
    setCartTotalAmount: () => {}, // Not needed with Zustand
    paymentIntent: store.paymentIntent,
    handleSetPaymentIntent,
    step: store.step,
    setStep: store.goToStep,
    handleNextStep,
    handleGoToStep,
    handleInfoClient,
    cartInfo: store.cartInfo,
    setCartInfo: store.setCartInfo,
    setShippingFee: store.setShippingFee,
    shippingFee: store.shippingFee,
    shippingFeeClient,
    selectedVoucher: store.selectedVoucher,
    setSelectedVoucher: handleSetSelectedVoucher,
    clearVoucherAfterUse: store.clearVoucherAfterUse,
    discountAmount: store.discountAmount,
    finalAmount: store.finalAmount
  };

  // Provider
  return <CartContext.Provider value={value} {...props} />;
};

// Updated useCart hook - now uses Zustand store directly
export const useCart = () => {
  const store = useCartStore();
  const router = useRouter();

  // Create wrapper functions for backward compatibility
  const handleGoToStep = useCallback(
    (targetStep: number) => {
      store.goToStep(targetStep);
      // Handle navigation
      switch (targetStep) {
        case 1:
          router.push('/cart');
          break;
        case 2:
          router.push('/cart/cartinfo');
          break;
        case 3:
          router.push('/cart/checkout');
          break;
        case 4:
          router.push('/cart/orderconfirmation');
          break;
      }
    },
    [store, router]
  );

  return {
    cartTotalQty: store.cartTotalQty,
    cartProducts: store.cartProducts,
    handleAddProductToCart: store.addProduct,
    handleRemoveProductFromCart: store.removeProduct,
    handleCartQtyIncrease: store.increaseQty,
    handleCartQtyDecrease: store.decreaseQty,
    handleClearCart: store.clearCart,
    cartTotalAmount: store.getTotalWithShipping(),
    setCartTotalAmount: () => {}, // Not needed with Zustand
    paymentIntent: store.paymentIntent,
    handleSetPaymentIntent: store.setPaymentIntent,
    step: store.step,
    setStep: store.goToStep,
    handleNextStep: store.nextStep,
    handleGoToStep,
    handleInfoClient: store.setCartInfo,
    cartInfo: store.cartInfo,
    setCartInfo: store.setCartInfo,
    setShippingFee: store.setShippingFee,
    shippingFee: store.shippingFee,
    shippingFeeClient: store.setShippingFee,
    selectedVoucher: store.selectedVoucher,
    setSelectedVoucher: store.setSelectedVoucher,
    clearVoucherAfterUse: store.clearVoucherAfterUse,
    discountAmount: store.discountAmount,
    finalAmount: store.finalAmount
  };
};

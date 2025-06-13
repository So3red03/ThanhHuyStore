'use client';
import { CartProductType } from '@/app/(home)/product/[productId]/ProductDetails';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

//Tạo đối tượng context quản lý giỏ hàng (React Context API)
export const CartContext = createContext<CartContextType | null>(null);

interface Voucher {
  id: string;
  code: string;
  description: string;
  image?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
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
  // State quản lý trạng thái giỏ hàng
  const [cartTotalQty, setCartTotalQty] = useState(0);
  const [cartTotalAmount, setCartTotalAmount] = useState(0);
  const [cartProducts, setCartProducts] = useState<CartProductType[] | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<string | null>(null);
  const router = useRouter();
  const [cartInfo, setCartInfo] = useState(null);
  const [step, setStep] = useState(1);
  const [shippingFee, setShippingFee] = useState(0);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  // Chạy useEffect để thiết lập giá trị từ localStorage
  useEffect(() => {
    const savedInfo = localStorage.getItem('CartInfo');
    const savedShippingFee = localStorage.getItem('shippingFee');
    const savedStep = localStorage.getItem('cartStep');
    const savedVoucher = localStorage.getItem('selectedVoucher');

    if (savedInfo) {
      setCartInfo(JSON.parse(savedInfo));
    }
    if (savedStep) {
      setStep(JSON.parse(savedStep));
    }
    if (savedShippingFee) {
      setShippingFee(JSON.parse(savedShippingFee));
    }
    if (savedVoucher) {
      setSelectedVoucher(JSON.parse(savedVoucher));
    }
  }, []);

  const shippingFeeClient = (params: number) => {
    setShippingFee(params);
    localStorage.setItem('shippingFee', JSON.stringify(params));
  };

  // Handling step
  const handleNextStep = useCallback(() => {
    if (step < 4) {
      setStep((prev: any) => {
        const updateStep = prev + 1;
        localStorage.setItem('cartStep', JSON.stringify(updateStep));
        return updateStep;
      });
    }
  }, []);

  const handleGoToStep = useCallback(
    (targetStep: number) => {
      if (step === 4) {
        if (targetStep === 4) {
          return;
        }
      } else if (targetStep <= step) {
        setStep(targetStep);
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
      }
    },
    [step, router]
  );

  const handleInfoClient = useCallback((info: any) => {
    setCartInfo(info);
    localStorage.setItem('CartInfo', JSON.stringify(info));
  }, []);

  const handleAddProductToCart = useCallback((product: CartProductType) => {
    // Vì setCartProducts không thay đổi nên không cần dependencies
    setCartProducts(prev => {
      const updateCart = prev ? [...prev, product] : [product];
      localStorage.setItem('CartItems', JSON.stringify(updateCart));
      return updateCart;
    });
    toast.success('Thêm sản phẩm thành công');
  }, []);

  const handleRemoveProductFromCart = useCallback(
    (product: CartProductType) => {
      if (cartProducts) {
        const updateCart = cartProducts.filter(item => item.id !== product.id);
        setCartProducts(updateCart);
        localStorage.setItem('CartItems', JSON.stringify(updateCart));
        toast.success('Xóa sản phẩm thành công');
      }
    },
    [cartProducts]
  );

  const handleCartQtyIncrease = useCallback(
    (product: CartProductType) => {
      let updateCart;
      if (cartProducts) {
        updateCart = [...cartProducts];
        const existsProduct = cartProducts.findIndex(cartProduct => cartProduct.id === product.id);
        if (existsProduct > -1) {
          if (updateCart[existsProduct].quantity >= product.inStock) {
            toast.error(`${product.name} chỉ còn ${product.inStock} sản phẩm`);
            return;
          }
          updateCart[existsProduct].quantity += 1;
          setCartProducts(updateCart);
          localStorage.setItem('CartItems', JSON.stringify(updateCart));
        }
      }
    },
    [cartProducts]
  );

  const handleCartQtyDecrease = useCallback(
    (product: CartProductType) => {
      let updateCart;
      if (cartProducts) {
        updateCart = [...cartProducts];
        const existsProduct = cartProducts.findIndex(cartProduct => cartProduct.id === product.id);
        if (existsProduct > -1) {
          if (updateCart[existsProduct].quantity <= 1) {
            toast.error('Số lượng không thể dưới 1');
            return;
          }
          updateCart[existsProduct].quantity -= 1;
          setCartProducts(updateCart);
          localStorage.setItem('CartItems', JSON.stringify(updateCart));
        }
      }
    },
    [cartProducts]
  );

  const handleClearCart = useCallback(() => {
    if (cartProducts) {
      setCartTotalQty(0);
      setCartProducts(null);
      localStorage.setItem('CartItems', JSON.stringify(null));
    }
    toast.success('Xóa tất cả sản phẩm thành công');
  }, [cartProducts]);

  // Invoking data from localStorage
  useEffect(() => {
    const cartItems: any = localStorage.getItem('CartItems');
    const eShopPaymentIntent: any = localStorage.getItem('eShopPaymentIntent');
    const paymentIntent: string | null = JSON.parse(eShopPaymentIntent);

    setCartProducts(JSON.parse(cartItems));
    setPaymentIntent(paymentIntent);
  }, []);

  // Handling total quantity and total price
  useEffect(() => {
    if (cartProducts) {
      const { total, qty } = cartProducts.reduce(
        (acc, item) => {
          const itemTotal = item.price * item.quantity;

          acc.total += itemTotal;
          acc.qty += item.quantity;

          return acc;
        },
        {
          total: 0,
          qty: 0
        }
      );
      setCartTotalAmount(total);
      setCartTotalQty(qty);
    }
  }, [cartProducts]);

  // Calculate discount amount and final amount
  useEffect(() => {
    if (selectedVoucher && cartTotalAmount > 0) {
      let discount = 0;

      if (selectedVoucher.discountType === 'PERCENTAGE') {
        discount = (cartTotalAmount * selectedVoucher.discountValue) / 100;
        if (selectedVoucher.maxDiscount && discount > selectedVoucher.maxDiscount) {
          discount = selectedVoucher.maxDiscount;
        }
      } else {
        discount = selectedVoucher.discountValue;
      }

      setDiscountAmount(discount);
      setFinalAmount(cartTotalAmount + shippingFee - discount);
    } else {
      setDiscountAmount(0);
      setFinalAmount(cartTotalAmount + shippingFee);
    }
  }, [selectedVoucher, cartTotalAmount, shippingFee]);

  const handleSetPaymentIntent = useCallback((val: string | null) => {
    setPaymentIntent(val);
    localStorage.setItem('eShopPaymentIntent', JSON.stringify(val));
  }, []);

  // Handle voucher selection
  const handleSetSelectedVoucher = useCallback((voucher: Voucher | null) => {
    setSelectedVoucher(voucher);
    localStorage.setItem('selectedVoucher', JSON.stringify(voucher));
  }, []);

  const value = {
    cartTotalQty,
    cartProducts,
    handleAddProductToCart,
    handleRemoveProductFromCart,
    handleCartQtyIncrease,
    handleCartQtyDecrease,
    handleClearCart,
    cartTotalAmount: cartTotalAmount + shippingFee,
    setCartTotalAmount,
    paymentIntent,
    handleSetPaymentIntent,
    step,
    setStep,
    handleNextStep,
    handleGoToStep,
    handleInfoClient,
    cartInfo,
    setCartInfo,
    setShippingFee,
    shippingFee,
    shippingFeeClient,
    selectedVoucher,
    setSelectedVoucher: handleSetSelectedVoucher,
    discountAmount,
    finalAmount
  };

  // Provider
  return <CartContext.Provider value={value} {...props} />;
};

// Sử dụng useContext(consumer) để lấy giá trị của context từ <CartContext.Provider> và check lỗi
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === null) throw new Error('useCart must be used within a CartContextProvider');

  return context;
};

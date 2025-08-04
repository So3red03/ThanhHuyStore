'use client';
import React, { useEffect, useRef, useState } from 'react';
import DiscountComboBox from '../DiscountCombobox';
import VoucherDisplay from '../VoucherDisplay';
import { formatPrice } from '../../../utils/formatPrice';
import Button from '@/app/components/Button';
import { useCart } from '@/app/hooks/useCart';
import { useHydration } from '@/app/hooks/useHydration';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import toast from 'react-hot-toast';
import axios from 'axios';
import { SafeUser } from '../../../../../types';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import { useSettings } from '@/app/hooks/useSettings';

interface CheckoutClientProps {
  currentUser: SafeUser | null | undefined;
}
const CheckoutClient: React.FC<CheckoutClientProps> = ({ currentUser }) => {
  const router = useRouter();
  const {
    cartTotalAmount,
    cartInfo,
    handleNextStep,
    paymentIntent,
    shippingFee,
    cartProducts,
    setCartInfo,
    handleSetPaymentIntent,
    discountAmount,
    finalAmount,
    selectedVoucher,
    orderNote
  } = useCart();
  const { isHydrated } = useHydration();
  const [isLoading, setIsLoading] = useState(false);
  const [isStripeCheck, setStripeCheck] = useState(false);
  const [isMomoCheck, setMomoCheck] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const address = cartInfo?.address + ', ' + cartInfo?.ward + ', ' + cartInfo?.district;

  // Settings hook
  const { getEnabledPaymentMethods, isPaymentMethodEnabled } = useSettings();

  // Sync paymentMethod với cartInfo.payment khi component mount
  useEffect(() => {
    if (cartInfo?.payment) {
      setPaymentMethod(cartInfo.payment);
    }
  }, [cartInfo?.payment]);

  let value: any;
  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    value = e.target.value;
    // Sử dụng cartInfo hiện tại thay vì đọc từ localStorage
    const updatedInfo = {
      ...cartInfo, // Giữ nguyên thông tin hiện tại
      payment: value // Chỉ cập nhật payment method
    };
    setPaymentMethod(value);
    setCartInfo(updatedInfo);
    // Không cần localStorage.setItem vì cartStore đã handle persistence
  };
  const handleNext = async () => {
    if (!currentUser) {
      setIsOpen(true);
      return;
    }

    if (!paymentMethod) {
      return toast.error('Vui lòng chọn hình thức thanh toán!');
    }

    // Kiểm tra phương thức thanh toán có được bật không
    if (!isPaymentMethodEnabled(paymentMethod)) {
      return toast.error('Phương thức thanh toán này hiện không khả dụng!');
    }

    // Kiểm tra có ít nhất 1 phương thức thanh toán được bật
    if (getEnabledPaymentMethods().length === 0) {
      return toast.error('Hiện tại không có phương thức thanh toán nào khả dụng. Vui lòng liên hệ quản trị viên!');
    }

    // SECURITY: Additional validation before payment
    if (!cartProducts || cartProducts.length === 0) {
      toast.error('Giỏ hàng trống!');
      return;
    }

    // Kiểm tra thông tin giao hàng đầy đủ
    if (!cartInfo || !cartInfo.phone || !cartInfo.address || !cartInfo.name || !cartInfo.city) {
      toast.error('Vui lòng điền đầy đủ thông tin giao hàng (Họ tên, SĐT, Địa chỉ, Thành phố)!');
      return;
    }

    // Kiểm tra phương thức thanh toán đã được set trong cartInfo
    if (!cartInfo.payment) {
      toast.error('Vui lòng chọn phương thức thanh toán!');
      return;
    }

    // Validate cart total
    if (cartTotalAmount > 99000000) {
      toast.error('Tổng giá trị đơn hàng không được vượt quá 99tr VND');
      return;
    }

    if (cartTotalAmount < 1000) {
      toast.error('Tổng giá trị đơn hàng tối thiểu 1,000 VND');
      return;
    }

    setIsLoading(true);
    if (paymentMethod === 'cod') {
      try {
        const response = await axios.post('/api/orders/create-payment-intent', {
          products: cartProducts,
          payment_intent_id: paymentIntent,
          phoneNumber: cartInfo.phone,
          address: {
            city: cartInfo.city,
            country: 'Việt Nam',
            line1: address,
            postal_code: '00000'
          },
          shippingFee: shippingFee,
          paymentMethod: cartInfo.payment,
          voucher: selectedVoucher,
          orderNote: orderNote
        });

        if (response.status === 401) {
          return router.push('/login');
        }

        if (response.data.paymentIntentId && response.data.orderId) {
          handleSetPaymentIntent(response.data.paymentIntentId);
          handleNextStep();
          toast.success('Đặt hàng thành công!');
          router.push('/cart/orderconfirmation');
        } else {
          throw new Error('Không nhận được thông tin đơn hàng');
        }
      } catch (error: any) {
        toast.error('Đặt đơn thất bại. Vui lòng thử lại!');
      } finally {
        setIsLoading(false);
      }
    } else if (paymentMethod === 'stripe') {
      setIsLoading(false);
      router.push('/stripecheckout');
    } else if (paymentMethod === 'momo') {
      try {
        const response = await axios.post('/api/orders/create-payment-intent', {
          products: cartProducts,
          payment_intent_id: paymentIntent,
          phoneNumber: cartInfo.phone,
          address: {
            city: cartInfo.city,
            country: 'Việt Nam',
            line1: address,
            postal_code: '00000'
          },
          shippingFee: shippingFee,
          paymentMethod: cartInfo.payment,
          voucher: selectedVoucher,
          orderNote: orderNote
        });

        if (response.status === 401) {
          return router.push('/login');
        }

        if (response.data.payUrl && response.data.createdOrder) {
          handleSetPaymentIntent(response.data.createdOrder.paymentIntentId);
          handleNextStep();
          toast.success('Đang chuyển hướng đến MoMo...');
          router.push(`${response.data.payUrl}`);
        } else {
          throw new Error('Không nhận được URL thanh toán MoMo');
        }
      } catch (error: any) {
        toast.error('Đặt đơn thất bại. Vui lòng thử lại!');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleConfirm = () => {
    router.push('/login');
    toggleOpen();
  };

  // Show loading while hydrating to prevent hydration mismatch
  if (!isHydrated) {
    return (
      <div className='flex justify-center items-center p-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
      </div>
    );
  }

  return (
    <>
      <div className='w-full bg-white p-2 mt-4'>
        <h2 className='text-base lg:text-xl font-bold mb-4'>Thông tin đặt hàng</h2>

        <div className='mt-4 flex justify-between'>
          <div className='w-[28%] font-semibold lg:text-base text-sm'>Khách hàng:</div>
          <div className='w-[70%] lg:text-base text-sm'>{cartInfo?.name}</div>
        </div>
        <div className='mt-4 flex justify-between'>
          <div className='w-[28%] font-semibold lg:text-base text-sm'>Số điện thoại:</div>
          <div className='w-[70%] lg:text-base text-sm'>{cartInfo?.phone}</div>
        </div>
        <div className='mt-4 flex justify-between'>
          <div className='w-[28%] font-semibold lg:text-base text-sm'>Địa chỉ nhận hàng</div>
          <div className='w-[70%] lg:text-base text-sm'>
            {cartInfo?.address}, {cartInfo?.ward}, {cartInfo?.district}, {cartInfo?.city}
          </div>
        </div>

        <div className='mb-4'>
          <div className='flex justify-between mt-4'>
            <div className='w-[28%] font-semibold lg:text-base text-sm'>Tạm tính:</div>
            <div className='w-[70%] lg:text-base text-sm text-indigo-600 font-semibold'>
              {formatPrice(cartTotalAmount - shippingFee)}
            </div>
          </div>
          <div className='flex justify-between mt-4'>
            <div className='w-[28%] font-semibold lg:text-base text-sm'>Phí vận chuyển:</div>
            <div className='w-[70%] text-indigo-600 font-semibold lg:text-base text-sm'>{formatPrice(shippingFee)}</div>
          </div>
          <div className='flex justify-between mt-4'>
            <div className='w-[28%] font-semibold lg:text-base text-sm'>Tổng tiền:</div>
            <div className='w-[70%] text-indigo-600 font-semibold lg:text-base text-sm'>
              {formatPrice(cartTotalAmount)}
            </div>
          </div>
        </div>

        <div className='py-6 border-t border-b'>
          <DiscountComboBox />
          <VoucherDisplay />
        </div>

        <div className='p-6 border-b'>
          <h2 className='font-bold mb-2 lg:text-xl text-sm'>Chọn hình thức thanh toán</h2>

          {/* COD Payment */}
          {isPaymentMethodEnabled('cod') && (
            <div
              className='flex items-center mt-2'
              onClick={() => {
                setStripeCheck(false);
                setMomoCheck(false);
              }}
            >
              <input type='radio' id='cod' name='payment' value='cod' className='mr-4' onChange={handlePaymentChange} />
              <label htmlFor='cod' className='flex items-center'>
                <Image
                  src='https://file.hstatic.net/200000636033/file/pay_2d752907ae604f08ad89868b2a5554da.png'
                  alt='cod'
                  className='mr-2'
                  width={24}
                  height={24}
                />
                <span className='lg:text-base text-sm'>Thanh toán khi giao hàng (COD)</span>
              </label>
            </div>
          )}

          {/* Stripe Payment */}
          {isPaymentMethodEnabled('stripe') && (
            <>
              <div
                className='flex items-center mt-2'
                onClick={() => {
                  setMomoCheck(false);
                  setStripeCheck(true);
                }}
              >
                <input
                  type='radio'
                  id='stripe'
                  name='payment'
                  value='stripe'
                  className='mr-4'
                  onChange={handlePaymentChange}
                />
                <label htmlFor='stripe' className='flex items-center'>
                  <Image src='/stripe-v2-svgrepo-com.svg' alt='stripe' className='mr-2' width={24} height={24} />
                  <div className='flex gap-1 items-center lg:text-base text-sm'>
                    Thanh toán bằng <span className='text-base lg:text-lg text-indigo-600'> Stripe</span>
                  </div>
                </label>
              </div>
              <div
                className={`mt-2 ${isStripeCheck ? 'transform translate-y-0' : 'transform translate-y-full hidden'}`}
              >
                <p>
                  Chuyển khoản vào tài khoản<span className='text-indigo-600 font-semibold'> Ví Stripe</span> của chúng
                  tôi. Đơn hàng sẽ được xác nhận ngay sau khi chuyển khoản thành công
                </p>
              </div>
            </>
          )}

          {/* MoMo Payment */}
          {isPaymentMethodEnabled('momo') && (
            <>
              <div
                className='flex items-center mt-2'
                onClick={() => {
                  setStripeCheck(false);
                  setMomoCheck(true);
                }}
              >
                <input
                  type='radio'
                  id='momo'
                  name='payment'
                  value='momo'
                  className='mr-4'
                  onChange={handlePaymentChange}
                />
                <label htmlFor='momo' className='flex items-center'>
                  <Image src='/momo.png' alt='momo' className='mr-2' width={24} height={24} />
                  <div className='flex gap-1 items-center lg:text-base text-sm'>
                    Thanh toán bằng <span className='text-base lg:text-lg text-indigo-600'> Momo</span>
                  </div>
                </label>
              </div>
              <div className={`mt-2 ${isMomoCheck ? 'transform translate-y-0' : 'transform translate-y-full hidden'}`}>
                <p>
                  Chuyển khoản vào tài khoản<span className='text-indigo-600 font-semibold'> Ví Momo</span> của chúng
                  tôi. Đơn hàng sẽ được xác nhận ngay sau khi chuyển khoản thành công
                </p>
              </div>
            </>
          )}

          {/* No payment methods enabled warning */}
          {getEnabledPaymentMethods().length === 0 && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4 mt-2'>
              <p className='text-red-800 text-sm'>
                ⚠️ Hiện tại không có phương thức thanh toán nào được kích hoạt. Vui lòng liên hệ quản trị viên để được
                hỗ trợ.
              </p>
            </div>
          )}
        </div>

        <div className='flex flex-col mt-5 gap-4'>
          <div className='flex justify-between '>
            <span className='font-bold'>Phí vận chuyển:</span>
            <span className='font-semibold'>
              {shippingFee === 0 ? <span className='text-green-600'>Miễn phí</span> : formatPrice(shippingFee)}
            </span>
          </div>
          {discountAmount > 0 && (
            <div className='flex justify-between text-green-600'>
              <span className='font-bold'>Giảm giá:</span>
              <span className='font-semibold'>-{formatPrice(discountAmount)}</span>
            </div>
          )}
          <div className='flex justify-between'>
            <span className='font-bold'>Tổng tiền:</span>
            <span className='text-indigo-600 font-semibold text-xl'>
              {formatPrice(discountAmount > 0 ? finalAmount : cartTotalAmount)}
            </span>
          </div>
          <div className='mt-5 pb-3'>
            <Button label='THANH TOÁN NGAY' isLoading={isLoading} onClick={handleNext} />
          </div>
        </div>
      </div>
      {isOpen && (
        <ConfirmDialog isOpen={isOpen} handleClose={toggleOpen} alert={true} onConfirm={handleConfirm}>
          Vui lòng đăng nhập để thanh toán
        </ConfirmDialog>
      )}
    </>
  );
};

export default CheckoutClient;

'use client';
import { useCart } from '@/app/hooks/useCart';
import React, { useEffect, useState } from 'react';
import { formatPrice } from '../../../../../utils/formatPrice';
import Button from '@/app/components/Button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SafeUser } from '../../../../../types';
import { getOrderByPaymentId } from '@/app/actions/getOrderByPaymentId';
import axios from 'axios';
import toast from 'react-hot-toast';
import { OrderStatus } from '@prisma/client';

interface CartBuyClientProps {
  currentUser: SafeUser | null | undefined;
}

const OrderConfirmationClient: React.FC<CartBuyClientProps> = ({ currentUser }) => {
  const router = useRouter();
  const { paymentIntent, handleSetPaymentIntent, handleClearCart, cartProducts, clearVoucherAfterUse } = useCart();
  const [hasToastBeenShown, setHasToastBeenShown] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [orderStatus, setOrderStatus] = useState<'processing' | 'success' | 'failed'>('processing');

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    try {
      if (cartProducts && paymentIntent && !hasToastBeenShown) {
        setIsProcessing(true);
        setOrderStatus('processing');

        // Simulate processing time for better UX
        setTimeout(() => {
          axios
            .get(`/api/orders?paymentIntentId=${paymentIntent}`)
            .then(res => {
              if (res.data) {
                setOrder(res.data);
                setOrderStatus('success');
                setIsProcessing(false);

                if (!hasToastBeenShown) {
                  toast.success('Đặt hàng thành công');
                  setHasToastBeenShown(true);
                }

                handleSetPaymentIntent(null);
                clearVoucherAfterUse(); // Clear voucher from localStorage
                handleClearCart();
              } else {
                setOrderStatus('failed');
                setIsProcessing(false);
                toast.error('Không tìm thấy đơn hàng');
              }
            })
            .catch(error => {
              console.error('Error fetching order:', error);
              setOrderStatus('failed');
              setIsProcessing(false);
              toast.error('Lỗi khi lấy thông tin đơn hàng');
            });
        }, 1500); // 1.5 second processing simulation
      }
    } catch (error) {
      console.error('Error in useEffect:', error);
      setOrderStatus('failed');
      setIsProcessing(false);
      toast.error('Đặt hàng thất bại');
    }
    // Reset lại trạng thái toast khi trang được tải lại hoặc khi bạn muốn reset trạng thái
    return () => {
      setHasToastBeenShown(false); // Reset trạng thái toast khi component unmount hoặc trang reload
    };
  }, [paymentIntent]);

  return (
    <div className='w-full bg-white lg:p-14 p-2 lg:py-6'>
      {/* Loading State */}
      {isProcessing && orderStatus === 'processing' && (
        <div className='bg-blue-50 border border-blue-300 text-blue-700 px-4 py-3 rounded mb-4 flex justify-center items-center gap-3'>
          <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700'></div>
          <p className='font-semibold'>Đang xử lý đơn hàng...</p>
        </div>
      )}

      {/* Success State */}
      {!isProcessing && orderStatus === 'success' && order && (
        <div className='bg-green-100 border border-green-300 text-[#1E9800] px-4 py-3 rounded mb-4 flex justify-center items-start gap-1'>
          <svg width='25' height='24' viewBox='0 0 25 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path
              d='M18.125 5.8H16.25C16.25 3.7005 14.5719 2 12.5 2C10.4281 2 8.75 3.7005 8.75 5.8H6.875C5.84375 5.8 5 6.655 5 7.7V19.1C5 20.145 5.84375 21 6.875 21H18.125C19.1562 21 20 20.145 20 19.1V7.7C20 6.655 19.1562 5.8 18.125 5.8ZM10.625 9.6C10.625 10.1225 10.2031 10.55 9.6875 10.55C9.17188 10.55 8.75 10.1225 8.75 9.6V7.7H10.625V9.6ZM12.5 3.9C13.5312 3.9 14.375 4.755 14.375 5.8H10.625C10.625 4.755 11.4688 3.9 12.5 3.9ZM16.25 9.6C16.25 10.1225 15.8281 10.55 15.3125 10.55C14.7969 10.55 14.375 10.1225 14.375 9.6V7.7H16.25V9.6Z'
              fill='#1E9800'
            ></path>
            <path
              d='M10.954 19L8.70926 16.8743C8.32395 16.5095 8.32395 15.8959 8.70926 15.5311V15.5311C9.06636 15.1929 9.62564 15.1933 9.98224 15.532L10.954 16.455L15.0175 12.6032C15.3743 12.2649 15.9334 12.2648 16.2904 12.6028V12.6028C16.6759 12.9679 16.6759 13.5817 16.2904 13.9467L10.954 19Z'
              fill='white'
            ></path>
          </svg>
          <p className='font-semibold'>Đặt hàng thành công</p>
        </div>
      )}

      {/* Failed State */}
      {!isProcessing && orderStatus === 'failed' && (
        <div className='bg-[#FFF6ED] border border-[#FF7A00] text-[#FF7A2E] px-4 py-3 rounded mb-4 flex justify-center items-start gap-1'>
          <svg width='25' height='24' viewBox='0 0 25 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path
              d='M18.125 5.8H16.25C16.25 3.7005 14.5719 2 12.5 2C10.4281 2 8.75 3.7005 8.75 5.8H6.875C5.84375 5.8 5 6.655 5 7.7V19.1C5 20.145 5.84375 21 6.875 21H18.125C19.1562 21 20 20.145 20 19.1V7.7C20 6.655 19.1562 5.8 18.125 5.8ZM10.625 9.6C10.625 10.1225 10.2031 10.55 9.6875 10.55C9.17188 10.55 8.75 10.1225 8.75 9.6V7.7H10.625V9.6ZM12.5 3.9C13.5312 3.9 14.375 4.755 14.375 5.8H10.625C10.625 4.755 11.4688 3.9 12.5 3.9ZM16.25 9.6C16.25 10.1225 15.8281 10.55 15.3125 10.55C14.7969 10.55 14.375 10.1225 14.375 9.6V7.7H16.25V9.6Z'
              fill='#FF7A2E'
            ></path>
            <path
              d='M10.954 19L8.70926 16.8743C8.32395 16.5095 8.32395 15.8959 8.70926 15.5311V15.5311C9.06636 15.1929 9.62564 15.1933 9.98224 15.532L10.954 16.455L15.0175 12.6032C15.3743 12.2649 15.9334 12.2648 16.2904 12.6028V12.6028C16.6759 12.9679 16.6759 13.5817 16.2904 13.9467L10.954 19Z'
              fill='white'
            ></path>
          </svg>
          <p className='font-semibold'>Đặt hàng thất bại</p>
        </div>
      )}

      {/* Only show message and order details when not processing */}
      {!isProcessing && (
        <>
          <p className='text-gray-700 lg:m-6 m-3 lg:text-base text-sm'>
            Cảm ơn quý khách đã cho <span className='font-semibold text-slate-700'>ThanhHuyStore</span> cơ hội được phục
            vụ. Nhân viên <span className='font-semibold text-slate-700'>ThanhHuyStore</span> sẽ liên hệ với quý khách
            trong thời gian sớm nhất.
          </p>

          {/* Order details - only show when order exists */}
          {order && orderStatus === 'success' && (
            <div className='bg-gray-100 p-4 rounded shadow-md mb-4'>
              <div className='flex items-center justify-between border-b border-gray-300'>
                <h2 className='lg:text-lg text-base font-semibold mb-4'>ĐƠN HÀNG #{order?.paymentIntentId}</h2>
                <Link
                  href='/account/orders'
                  className='text-[#1982F9] text-sm lg:text-base font-semibold mb-4 hover:underline'
                >
                  Quản lý đơn hàng
                </Link>
              </div>

              <div className='mb-4'>
                <div className='mt-4 flex justify-between'>
                  <div className='w-[40%] lg:text-base text-sm font-semibold'>Khách hàng:</div>
                  <div className='w-[60%] lg:text-base text-sm'>{order?.user.name}</div>
                </div>
                <div className='mt-4 flex justify-between'>
                  <div className='w-[40%] lg:text-base text-sm font-semibold'>Số điện thoại:</div>
                  <div className='w-[60%] lg:text-base text-sm'>{order?.phoneNumber}</div>
                </div>
                <div className='mt-4 flex justify-between'>
                  <div className='w-[40%] lg:text-base text-sm font-semibold'>Email:</div>
                  <div className='w-[60%] lg:text-base text-sm'>{currentUser?.email}</div>
                </div>
                <div className='mt-4 flex justify-between'>
                  <div className='w-[40%] lg:text-base text-sm font-semibold'>Giao đến:</div>
                  <div className='w-[60%] lg:text-base text-sm'>{order?.address.line1}</div>
                </div>
                <div className='flex justify-between mt-4'>
                  <div className='w-[40%] lg:text-base text-sm font-semibold'>Tổng tiền:</div>
                  <div className='w-[60%] lg:text-base text-sm text-indigo-600 font-semibold'>
                    {formatPrice(order?.amount + order?.shippingFee)}
                  </div>
                </div>
                <div className='flex justify-between mt-4'>
                  <div className='w-[40%] lg:text-base text-sm font-semibold'>Hình thức thanh toán:</div>
                  <div className='w-[60%] lg:text-base text-sm text-indigo-600 font-semibold'>
                    {order?.paymentMethod}
                  </div>
                </div>
              </div>
              {order?.status === OrderStatus.completed || order == null ? (
                <div className='mt-4 bg-[#e3fae3] lg:text-base text-sm border-2 font-semibold border-green-300 text-[#1E9800] lg:p-4 p-3 rounded-md text-center border-dashed'>
                  Đơn hàng đã được thanh toán
                </div>
              ) : (
                <div className='bg-[#FFF6ED] lg:text-base text-sm border-2 font-semibold border-[#FF7A00] text-[#FF7A2E] lg:p-4 p-3 rounded-md text-center border-dashed'>
                  Đơn hàng chưa được thanh toán
                </div>
              )}
            </div>
          )}

          <div className='flex flex-col space-y-4 mt-4'>
            <Button
              label='Chat với ThanhHuyStore'
              outline
              custom='!border-[#1982F9] !text-[#1982F9] !lg:py-3 !lg:px-4 !py-2 !px-3'
              onClick={() => {
                router.push('/');
              }}
            />
            <Button
              label='Tiếp tục mua hàng'
              outline
              custom='!border-[#1982F9] !text-[#1982F9] !lg:py-3 !lg:px-4 !py-2 !px-3'
              onClick={() => {
                router.push('/');
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default OrderConfirmationClient;

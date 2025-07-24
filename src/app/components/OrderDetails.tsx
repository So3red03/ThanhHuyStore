'use client';

import { CartProductType, DeliveryStatus, Order, OrderStatus } from '@prisma/client';
import { SafeUser } from '../../../types';
import { formatPrice } from '../../../utils/formatPrice';
import Image from 'next/image';
import { useState } from 'react';
import CancelOrderDialog from './CancelOrderDialog';
import { formatDate } from '../(home)/account/orders/OrdersClient';
import ReturnRequestButton from './returns/ReturnRequestButton';
import ReturnRequestStatus from './returns/ReturnRequestStatus';

interface OrderDetailsProps {
  order: Order & {
    user: SafeUser;
    products: CartProductType[];
  };
  currentUser: SafeUser;
  showCancelButton?: boolean;
  onOrderCancelled?: () => void;
  showReturnButton?: boolean;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({
  order,
  currentUser,
  showCancelButton = false,
  onOrderCancelled,
  showReturnButton = true
}) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const getOrderStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'Đơn hàng chưa được thanh toán';
      case 'confirmed':
        return 'Đơn hàng đã được xác nhận';
      case 'canceled':
        return 'Đơn hàng đã bị hủy';
      case 'completed':
        return 'Đơn hàng hoàn thành';
      default:
        return 'Trạng thái không xác định';
    }
  };

  const getDeliveryStatusText = (status: DeliveryStatus | null) => {
    switch (status) {
      case 'not_shipped':
        return 'Đang chờ';
      case 'in_transit':
        return 'Đang vận chuyển';
      case 'delivered':
        return 'Đã giao';
      case 'returning':
        return 'Đang hoàn trả';
      case 'returned':
        return 'Đã hoàn trả';
      default:
        return 'Chưa xác định';
    }
  };

  const getPaymentStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'Chưa thanh toán';
      case 'confirmed':
        return 'Đã thanh toán';
      case 'canceled':
        return 'Đã hủy';
      case 'completed':
        return 'Đã thanh toán';
      default:
        return 'Chưa xác định';
    }
  };

  const canCancelOrder = () => {
    return order.status === 'pending' || (order.status === 'confirmed' && order.deliveryStatus === 'not_shipped');
  };

  const canReturnOrder = () => {
    // Chỉ cho phép đổi/trả đơn hàng đã hoàn thành và trong vòng 7 ngày
    if (order.status !== 'completed') return false;

    const daysSinceOrder = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24));

    return daysSinceOrder <= 7;
  };

  const handleCancelSuccess = () => {
    setShowCancelDialog(false);
    if (onOrderCancelled) {
      onOrderCancelled();
    }
  };

  const handleReturnRequested = () => {
    setRefreshKey(prev => prev + 1);
  };
  return (
    <>
      <div className='max-w-4xl mx-auto p-3'>
        {/* Header */}
        <h1 className='text-2xl font-semibold mb-4'>Chi tiết đơn hàng</h1>
        <p className='text-gray-700 mb-6'>Xin chào, {currentUser?.name}</p>
        <p className='text-gray-700 mb-8'>{getOrderStatusText(order.status)}</p>

        {/* Cancel Reason Display */}
        {order.status === 'canceled' && (order as any).cancelReason && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <h3 className='font-semibold text-red-800 mb-2'>Lý do hủy đơn hàng:</h3>
            <p className='text-red-700'>{(order as any).cancelReason}</p>
            {(order as any).cancelDate && (
              <p className='text-red-600 text-sm mt-2'>Thời gian hủy: {formatDate((order as any).cancelDate)}</p>
            )}
          </div>
        )}

        {/* Order Note Display */}
        {(order as any).note && (
          <div className='mb-6 p-4 bg-green-50 border border-green-200 rounded-lg'>
            <h3 className='font-semibold text-green-800 mb-2'>Ghi chú đơn hàng:</h3>
            <p className='text-green-700'>{(order as any).note}</p>
          </div>
        )}

        {/* Action Buttons */}
        {/* <div className='flex gap-4 mb-6'>
          {showCancelButton && canCancelOrder() && (
            <>
              <Button label='Thông tin đơn hàng' onClick={() => {}} outline />
              <Button
                label='Hủy đơn hàng'
                onClick={() => setShowCancelDialog(true)}
                outline
                custom='border-red-500 text-red-500 hover:bg-red-50'
              />
            </>
          )}

          {canReturnOrder() && (
            <Button
              label='Đổi/Trả hàng'
              onClick={() => setShowReturnForm(true)}
              outline
              custom='border-orange-500 text-orange-500 hover:bg-orange-50'
            />
          )}
        </div> */}

        {/* Order Info */}
        <div className='grid grid-cols-4 gap-4 border-b pb-4 mb-8'>
          <div className='border-r border-gray-300'>
            <h2 className='font-semibold'>Đơn hàng đã đặt</h2>
            <p>{formatDate(order.createdAt)}</p>
          </div>
          <div className='border-r border-gray-300'>
            <h2 className='font-semibold'>Tình trạng đặt hàng</h2>
            <p>{getDeliveryStatusText(order.deliveryStatus)}</p>
          </div>
          <div className='border-r border-gray-300'>
            <h2 className='font-semibold'>Trạng thái thanh toán</h2>
            <p>{getPaymentStatusText(order.status)}</p>
          </div>
          <div>
            <h2 className='font-semibold'>Phương thức thanh toán</h2>
            <p>
              {order.paymentMethod === 'momo' ? (
                <Image src='/momo.png' alt='momo' width={24} height={24} />
              ) : order.paymentMethod === 'stripe' ? (
                <Image src='/stripe-v2-svgrepo-com.svg' alt='stripe' width={24} height={24} />
              ) : (
                <div className='flex items-center gap-2'>
                  <Image
                    src='https://file.hstatic.net/200000636033/file/pay_2d752907ae604f08ad89868b2a5554da.png'
                    alt='cod'
                    width={24}
                    height={24}
                  />
                  <span className='text-[16px]'>(COD)</span>
                </div>
              )}
            </p>
          </div>
        </div>

        {/* Products List */}
        {order.products.map((item: any) => {
          // Get image URL from new structure or fallback to old structure
          const getImageUrl = () => {
            if (typeof item.selectedImg === 'string') {
              return item.selectedImg;
            } else if (item.selectedImg && item.selectedImg.images && item.selectedImg.images.length > 0) {
              return item.selectedImg.images[0];
            }
            return '/noavatar.png';
          };

          // Get variant display info
          const getVariantInfo = () => {
            if (item.attributes) {
              const attributeValues = Object.values(item.attributes).filter(Boolean);
              return attributeValues.length > 0 ? attributeValues.join(' - ') : '';
            } else if (item.selectedImg && item.selectedImg.color) {
              return item.selectedImg.color;
            }
            return '';
          };

          return (
            <div className='flex items-center justify-between mb-5' key={item.id}>
              <div className='flex items-center space-x-4'>
                <Image src={getImageUrl()} width={80} height={80} alt={item.name} />
                <div>
                  <h3 className='font-semibold'>{item.name}</h3>
                  {getVariantInfo() && <p className='text-gray-500'>{getVariantInfo()}</p>}
                </div>
              </div>
              <p className='font-semibold'>{formatPrice(item.price * item.quantity)}</p>
            </div>
          );
        })}

        {/* Order Summary */}
        <div className='border-t pt-4 mt-8'>
          <div className='flex justify-between'>
            <p>Tạm tính ({order.products.length} sản phẩm)</p>
            <p>{formatPrice(order.originalAmount || order.amount)}</p>
          </div>
          <div className='flex justify-between'>
            <p>Phí ship</p>
            <p>{formatPrice(order.shippingFee || 0)}</p>
          </div>
          <div className='flex justify-between'>
            <p>Thuế</p>
            <p>{formatPrice(0)}</p>
          </div>
          <div className='flex justify-between'>
            <p>Giảm giá</p>
            <p>-{formatPrice(order.discountAmount || 0)}</p>
          </div>
          <div className='flex justify-between font-semibold text-lg mt-4'>
            <p>Tổng</p>
            <p>{formatPrice(order.amount)}</p>
          </div>
        </div>

        {/* Shipping Address */}
        <div className='border-t py-4 mt-8'>
          <h2 className='font-semibold mb-2'>Địa chỉ giao hàng</h2>
          <p className='text-gray-700'>Số điện thoại: {order.phoneNumber}</p>
          <p className='text-gray-700'>Địa chỉ: {`${order.address?.line1 || ''} ${order.address?.city || ''}`}</p>
        </div>

        {/* Return/Exchange Section */}
        {showReturnButton && currentUser.id === order.userId && (
          <>
            <ReturnRequestButton order={order} currentUser={currentUser} onReturnRequested={handleReturnRequested} />

            <ReturnRequestStatus key={refreshKey} order={order} currentUser={currentUser} />
          </>
        )}

        {/* Shipping functionality removed */}
      </div>

      {/* Cancel Order Dialog */}
      {showCancelDialog && (
        <CancelOrderDialog
          isOpen={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          order={order}
          currentUser={currentUser}
          onSuccess={handleCancelSuccess}
        />
      )}
    </>
  );
};

export default OrderDetails;

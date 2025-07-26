'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice } from '../../../../utils/formatPrice';
import { formatDate } from '../../(home)/account/orders/OrdersClient';
import { MdShoppingBag, MdCheckCircle, MdPending, MdCancel, MdVisibility } from 'react-icons/md';

interface ExchangeOrder {
  id: string;
  amount: number;
  status: string;
  deliveryStatus?: string;
  createdAt: string;
  products: any[];
  exchangeInfo?: {
    originalOrderId: string;
    returnRequestId: string;
    priceDifference: number;
    exchangeType: string;
  };
}

interface ExchangeOrderInfoProps {
  exchangeOrderId: string;
  returnRequestId: string;
  showFullDetails?: boolean;
}

const ExchangeOrderInfo: React.FC<ExchangeOrderInfoProps> = ({
  exchangeOrderId,
  returnRequestId,
  showFullDetails = false
}) => {
  const [exchangeOrder, setExchangeOrder] = useState<ExchangeOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExchangeOrder = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/orders/${exchangeOrderId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch exchange order');
        }
        const data = await response.json();
        setExchangeOrder(data.order);
      } catch (err) {
        console.error('Error fetching exchange order:', err);
        setError('Không thể tải thông tin đơn hàng đổi');
      } finally {
        setIsLoading(false);
      }
    };

    if (exchangeOrderId) {
      fetchExchangeOrder();
    }
  }, [exchangeOrderId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <MdCheckCircle className='text-green-500' size={20} />;
      case 'pending':
        return <MdPending className='text-yellow-500' size={20} />;
      case 'canceled':
        return <MdCancel className='text-red-500' size={20} />;
      default:
        return <MdShoppingBag className='text-blue-500' size={20} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xử lý';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'canceled':
        return 'Đã hủy';
      case 'completed':
        return 'Hoàn thành';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'canceled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className='p-4 bg-blue-50 border border-blue-200 rounded-xl'>
        <div className='flex items-center gap-2 mb-3'>
          <MdShoppingBag className='text-blue-600 animate-pulse' size={20} />
          <span className='text-sm font-medium text-blue-800'>Đang tải thông tin đơn hàng đổi...</span>
        </div>
        <div className='animate-pulse'>
          <div className='h-4 bg-blue-200 rounded w-3/4 mb-2'></div>
          <div className='h-3 bg-blue-200 rounded w-1/2'></div>
        </div>
      </div>
    );
  }

  if (error || !exchangeOrder) {
    return (
      <div className='p-4 bg-red-50 border border-red-200 rounded-xl'>
        <div className='flex items-center gap-2 mb-2'>
          <span className='text-red-500'>❌</span>
          <span className='text-sm font-medium text-red-800'>Lỗi tải đơn hàng đổi</span>
        </div>
        <p className='text-xs text-red-600'>{error}</p>
        <p className='text-xs text-red-500 mt-1'>ID: {exchangeOrderId.substring(0, 8)}...</p>
      </div>
    );
  }

  if (!showFullDetails) {
    // Compact view
    return (
      <div className='p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            {getStatusIcon(exchangeOrder.status)}
            <div>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-semibold text-gray-900'>Đơn hàng đổi mới</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(exchangeOrder.status)}`}
                >
                  {getStatusText(exchangeOrder.status)}
                </span>
              </div>
              <div className='flex items-center gap-4 mt-1 text-sm text-gray-600'>
                <span className='font-mono'>#{exchangeOrder.id.slice(-8)}</span>
                <span>{formatPrice(exchangeOrder.amount)}</span>
                <span>{formatDate(exchangeOrder.createdAt)}</span>
              </div>
            </div>
          </div>
          <Link
            href={`/account/orders/${exchangeOrder.id}`}
            className='flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors'
          >
            <MdVisibility size={14} />
            Xem
          </Link>
        </div>
      </div>
    );
  }

  // Full details view
  return (
    <div className='bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6'>
      <div className='flex items-center gap-2 mb-4'>
        <MdShoppingBag className='text-green-600' size={24} />
        <h3 className='text-lg font-semibold text-green-800'>Đơn hàng đổi mới</h3>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Order Info */}
        <div className='space-y-3'>
          <h4 className='font-semibold text-gray-700'>Thông tin đơn hàng</h4>
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Mã đơn:</span>
              <span className='font-mono'>#{exchangeOrder.id.slice(-8)}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Trạng thái:</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(exchangeOrder.status)}`}
              >
                {getStatusText(exchangeOrder.status)}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Ngày tạo:</span>
              <span>{formatDate(exchangeOrder.createdAt)}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Tổng tiền:</span>
              <span className='font-bold text-green-600'>{formatPrice(exchangeOrder.amount)}</span>
            </div>
          </div>
        </div>

        {/* Exchange Info */}
        {exchangeOrder.exchangeInfo && (
          <div className='space-y-3'>
            <h4 className='font-semibold text-gray-700'>Thông tin đổi hàng</h4>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Đơn gốc:</span>
                <span className='font-mono'>#{exchangeOrder.exchangeInfo.originalOrderId.slice(-8)}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Yêu cầu:</span>
                <span className='font-mono'>#{returnRequestId.slice(-8)}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Chênh lệch:</span>
                <span
                  className={`font-bold ${
                    exchangeOrder.exchangeInfo.priceDifference > 0
                      ? 'text-red-600'
                      : exchangeOrder.exchangeInfo.priceDifference < 0
                      ? 'text-green-600'
                      : 'text-gray-600'
                  }`}
                >
                  {exchangeOrder.exchangeInfo.priceDifference === 0
                    ? 'Không có'
                    : `${exchangeOrder.exchangeInfo.priceDifference > 0 ? '+' : ''}${formatPrice(
                        exchangeOrder.exchangeInfo.priceDifference
                      )}`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Products */}
      {exchangeOrder.products && exchangeOrder.products.length > 0 && (
        <div className='mt-6'>
          <h4 className='font-semibold text-gray-700 mb-3'>Sản phẩm ({exchangeOrder.products.length})</h4>
          <div className='space-y-2'>
            {exchangeOrder.products.map((product: any, index: number) => (
              <div key={index} className='flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200'>
                <div className='flex-1'>
                  <h5 className='text-sm font-medium text-gray-900'>{product.name}</h5>
                  <div className='flex items-center gap-2 mt-1 text-sm text-gray-600'>
                    <span>SL: {product.quantity}</span>
                    <span>×</span>
                    <span className='font-medium text-green-600'>{formatPrice(product.price)}</span>
                  </div>
                </div>
                <div className='text-sm font-semibold text-gray-900'>
                  {formatPrice(product.quantity * product.price)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className='mt-6 flex justify-center'>
        <Link
          href={`/account/orders/${exchangeOrder.id}`}
          className='flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
        >
          <MdVisibility size={20} />
          Xem chi tiết đơn hàng
        </Link>
      </div>
    </div>
  );
};

export default ExchangeOrderInfo;

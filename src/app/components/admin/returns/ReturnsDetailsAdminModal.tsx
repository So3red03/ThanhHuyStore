'use client';

import React from 'react';
import { formatPrice } from '../../../utils/formatPrice';
import { formatDate } from '../../../(home)/account/orders/OrdersClient';
import AdminModal from '../AdminModal';
import ReturnRequestProductItem from '../../returns/ReturnRequestProductItem';
import ExchangeProductDisplay from '../../returns/ExchangeProductDisplay';
import { MdAccountCircle } from 'react-icons/md';

interface ReturnRequest {
  id: string;
  type: 'RETURN' | 'EXCHANGE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  reason: string;
  description?: string;
  images?: string[];
  refundAmount?: number;
  additionalCost?: number;
  adminNotes?: string;
  exchangeOrderId?: string;
  exchangeToProductId?: string;
  exchangeToVariantId?: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  order: {
    id: string;
    amount: number;
  };
  items: any[];
  shippingBreakdown?: any;
}

interface ReturnsDetailsAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ReturnRequest | null;
  exchangeOrders?: { [key: string]: any };
}

const ReturnsDetailsAdminModal: React.FC<ReturnsDetailsAdminModalProps> = ({
  isOpen,
  onClose,
  request,
  exchangeOrders = {}
}) => {
  if (!request) return null;

  const getTypeText = (type: string) => {
    return type === 'RETURN' ? 'Trả hàng' : 'Đổi hàng';
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Chờ duyệt';
      case 'APPROVED':
        return 'Đã duyệt';
      case 'REJECTED':
        return 'Từ chối';
      case 'COMPLETED':
        return 'Hoàn tất';
      default:
        return status;
    }
  };

  const getReasonText = (reason: string) => {
    switch (reason) {
      case 'DEFECTIVE':
        return 'Sản phẩm bị lỗi';
      case 'WRONG_ITEM':
        return 'Giao sai sản phẩm';
      case 'CHANGE_MIND':
        return 'Đổi ý không muốn mua';
      default:
        return reason;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      handleClose={onClose}
      title={`Chi tiết yêu cầu #${request.id.substring(0, 8)}`}
      maxWidth='lg'
    >
      <div className='space-y-6'>
        {/* Customer Information - Admin specific */}
        <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6'>
          <h3 className='text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2'>
            <MdAccountCircle className='text-blue-600' size={24} />
            Thông tin khách hàng
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <p className='text-sm text-blue-600 font-medium'>Tên khách hàng</p>
              <p className='text-blue-900 font-semibold'>{request.user.name}</p>
            </div>
            <div>
              <p className='text-sm text-blue-600 font-medium'>Email</p>
              <p className='text-blue-900 font-semibold'>{request.user.email}</p>
            </div>
          </div>
        </div>

        {/* Basic Information - Match client layout */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <h3 className='font-semibold text-gray-700 mb-3'>Thông tin cơ bản</h3>
            <div className='space-y-3 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Loại:</span>
                <span className='font-medium'>{getTypeText(request.type)}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Trạng thái:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                  {getStatusText(request.status)}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Ngày tạo:</span>
                <span>{formatDate(request.createdAt)}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Đơn hàng:</span>
                <span>#{request.order.id.substring(0, 8)}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Giá trị đơn hàng:</span>
                <span className='font-semibold'>{formatPrice(request.order.amount)}</span>
              </div>
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='font-semibold text-gray-700 mb-3'>Lý do</h3>
            <p className='text-sm text-gray-600 mb-2'>{getReasonText(request.reason)}</p>
            {request.description && (
              <div>
                <h4 className='font-medium text-gray-700 text-sm mb-1'>Mô tả chi tiết:</h4>
                <p className='text-sm text-gray-600'>{request.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Products */}
        <div>
          <h3 className='font-semibold text-gray-700 mb-3'>Sản phẩm ({request.items.length})</h3>
          <div className='space-y-3'>
            {request.items.map((item: any, index: number) => (
              <ReturnRequestProductItem key={index} item={item} showReason={true} />
            ))}
          </div>
        </div>

        {/* Exchange Information */}
        {request.type === 'EXCHANGE' && request.exchangeToProductId && (
          <div>
            <h3 className='font-semibold text-gray-700 mb-3'>Thông tin đổi hàng</h3>
            <ExchangeProductDisplay
              originalItem={request.items[0]}
              exchangeToProductId={request.exchangeToProductId}
              exchangeToVariantId={request.exchangeToVariantId}
              additionalCost={request.additionalCost}
              mode='detailed'
              showPriceDifference={true}
            />
          </div>
        )}

        {/* Cost Information */}
        {(request.refundAmount || request.additionalCost) && (
          <div>
            <h3 className='font-semibold text-gray-700 mb-3'>Chi tiết chi phí</h3>
            <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6'>
              <div className='space-y-3'>
                {request.refundAmount && (
                  <div className='flex justify-between items-center py-2 border-b border-blue-100'>
                    <span className='text-gray-600 font-medium'>Số tiền hoàn:</span>
                    <span className='font-bold text-green-600 text-lg'>+{formatPrice(request.refundAmount)}</span>
                  </div>
                )}
                {request.additionalCost && request.additionalCost !== 0 && (
                  <div className='flex justify-between items-center py-2 border-b border-blue-100'>
                    <span className='text-gray-600 font-medium'>Chênh lệch giá:</span>
                    <span
                      className={`font-bold text-lg ${request.additionalCost > 0 ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {request.additionalCost > 0 ? '+' : ''}
                      {formatPrice(request.additionalCost)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Admin Notes */}
        {request.adminNotes && (
          <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
            <h3 className='font-semibold text-blue-800 mb-2'>Ghi chú từ admin</h3>
            <p className='text-blue-700'>{request.adminNotes}</p>
          </div>
        )}
      </div>
    </AdminModal>
  );
};

export default ReturnsDetailsAdminModal;

'use client';

import React from 'react';
import { formatPrice } from '../../../../../utils/formatPrice';
import { formatDate } from '../../../(home)/account/orders/OrdersClient';
import AdminModal from '../AdminModal';
import ReturnRequestProductItem from '../../returns/ReturnRequestProductItem';
import ReturnShippingDisplay from './ReturnShippingDisplay';
import ReturnRequestImages from './ReturnRequestImages';
import {
  MdInfo,
  MdCheckCircle,
  MdWarning,
  MdAccountCircle,
  MdEmail,
  MdCalendarToday,
  MdDescription,
  MdImage,
  MdAssignment,
  MdSwapHoriz,
  MdAttachMoney
} from 'react-icons/md';

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

interface ReturnsDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ReturnRequest | null;
  exchangeOrders?: { [key: string]: any };
}

const ReturnsDetailsModal: React.FC<ReturnsDetailsModalProps> = ({ isOpen, onClose, request, exchangeOrders = {} }) => {
  if (!request) return null;

  const getTypeText = (type: string) => {
    switch (type) {
      case 'RETURN':
        return 'Trả hàng';
      case 'EXCHANGE':
        return 'Đổi hàng';
      default:
        return type;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Chờ xử lý';
      case 'APPROVED':
        return 'Đã duyệt';
      case 'REJECTED':
        return 'Đã từ chối';
      case 'COMPLETED':
        return 'Hoàn tất';
      default:
        return status;
    }
  };

  const getReasonText = (reason: string) => {
    switch (reason) {
      case 'DEFECTIVE':
        return 'Hàng lỗi';
      case 'WRONG_ITEM':
        return 'Giao sai hàng';
      case 'CHANGE_MIND':
        return 'Đổi ý';
      case 'SIZE_ISSUE':
        return 'Không vừa size';
      case 'NOT_AS_DESCRIBED':
        return 'Không đúng mô tả';
      default:
        return reason;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium';
    switch (status) {
      case 'PENDING':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'APPROVED':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'REJECTED':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'COMPLETED':
        return `${baseClasses} bg-green-100 text-green-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getTypeBadge = (type: string) => {
    const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium';
    switch (type) {
      case 'RETURN':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'EXCHANGE':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <AdminModal isOpen={isOpen} handleClose={onClose}>
      <div className='max-w-4xl mx-auto p-6'>
        {/* Header */}
        <div className='flex items-center justify-between mb-6 pb-4 border-b border-gray-200'>
          <div>
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>Chi tiết yêu cầu #{request.id.substring(0, 8)}</h2>
            <div className='flex items-center gap-3'>
              <span className={getTypeBadge(request.type)}>{getTypeText(request.type)}</span>
              <span className={getStatusBadge(request.status)}>{getStatusText(request.status)}</span>
            </div>
          </div>
        </div>

        <div className='space-y-6'>
          {/* Customer Information Card */}
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
                <div>
                  <p className='text-sm text-blue-600 font-medium'>Email</p>
                  <p className='text-blue-900 font-semibold'>{request.user.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Request Information Card */}
          <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
              <MdInfo className='text-gray-600' size={24} />
              Thông tin yêu cầu
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <div>
                  <p className='text-sm text-gray-600 font-medium'>Ngày tạo</p>
                  <p className='text-gray-900 font-semibold'>{formatDate(request.createdAt)}</p>
                </div>
              </div>
              <div>
                <div>
                  <p className='text-sm text-gray-600 font-medium'>Lý do</p>
                  <p className='text-gray-900 font-semibold'>{getReasonText(request.reason)}</p>
                </div>
              </div>
            </div>

            {request.description && (
              <div className='mt-4 pt-4 border-t border-gray-100'>
                <div className='flex-1'>
                  <p className='text-sm text-gray-600 font-medium mb-2'>Mô tả chi tiết</p>
                  <p className='text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg'>{request.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* Images Display */}
          {request.images && request.images.length > 0 && (
            <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <MdImage className='text-gray-600' size={24} />
                Hình ảnh đính kèm
              </h3>
              <ReturnRequestImages images={request.images} type={request.type} />
            </div>
          )}

          {/* Products Display */}
          <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
              <MdAssignment className='text-gray-600' size={24} />
              Sản phẩm ({request.items.length})
            </h3>
            <div className='space-y-3'>
              {request.items.map((item: any, index: number) => (
                <div key={index} className='bg-gray-50 rounded-lg p-4'>
                  <ReturnRequestProductItem item={item} showReason={true} />
                </div>
              ))}
            </div>
          </div>

          {/* Exchange Order Display */}
          {request.type === 'EXCHANGE' && request.exchangeOrderId && (
            <div className='bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 shadow-sm'>
              <h3 className='text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2'>
                <MdSwapHoriz className='text-purple-600' size={24} />
                Thông tin đổi hàng
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Original Order */}
                <div className='bg-white border border-red-200 rounded-xl p-4 shadow-sm'>
                  <div className='flex items-center gap-2 mb-3'>
                    <div className='w-3 h-3 bg-red-500 rounded-full'></div>
                    <h4 className='font-semibold text-red-800'>Đơn hàng gốc</h4>
                  </div>
                  <div className='space-y-2'>
                    <p className='text-sm text-gray-600'>Mã đơn hàng</p>
                    <p className='font-mono text-red-700 font-semibold'>#{request.order.id.slice(-8)}</p>
                    <p className='text-sm text-gray-600'>Giá trị</p>
                    <p className='text-red-700 font-bold text-lg'>{formatPrice(request.order.amount)}</p>
                  </div>
                </div>

                {/* Exchange Order */}
                {exchangeOrders[request.exchangeOrderId] && (
                  <div className='bg-white border border-green-200 rounded-xl p-4 shadow-sm'>
                    <div className='flex items-center gap-2 mb-3'>
                      <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                      <h4 className='font-semibold text-green-800'>Đơn hàng mới</h4>
                    </div>
                    <div className='space-y-2'>
                      <p className='text-sm text-gray-600'>Mã đơn hàng</p>
                      <p className='font-mono text-green-700 font-semibold'>#{request.exchangeOrderId.slice(-8)}</p>
                      <p className='text-sm text-gray-600'>Giá trị</p>
                      <p className='text-green-700 font-bold text-lg'>
                        {formatPrice(exchangeOrders[request.exchangeOrderId].amount)}
                      </p>
                      <p className='text-sm text-gray-600'>Trạng thái</p>
                      <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                        {exchangeOrders[request.exchangeOrderId].status}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Price Difference */}
              {request.additionalCost !== undefined && request.additionalCost !== 0 && (
                <div className='mt-6 bg-white border border-amber-200 rounded-xl p-4 shadow-sm'>
                  <div className='flex items-center gap-2 mb-3'>
                    <MdAttachMoney className='text-amber-600' size={20} />
                    <h4 className='font-semibold text-amber-800'>Chênh lệch giá</h4>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-600'>
                      {request.additionalCost > 0 ? 'Khách cần bù thêm:' : 'Hoàn lại cho khách:'}
                    </span>
                    <span
                      className={`font-bold text-lg ${request.additionalCost > 0 ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {request.additionalCost > 0 ? '+' : ''}
                      {formatPrice(Math.abs(request.additionalCost))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Return Shipping Display */}
          {request.type === 'RETURN' && request.shippingBreakdown && (
            <ReturnShippingDisplay
              shippingBreakdown={request.shippingBreakdown}
              refundAmount={request.refundAmount || 0}
              reason={request.reason}
            />
          )}

          {/* Simple refund display for cases without shipping breakdown */}
          {request.refundAmount && !request.shippingBreakdown && request.type === 'RETURN' && (
            <div className='bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm'>
              <div className='flex items-center gap-2 mb-3'>
                <MdCheckCircle className='text-green-600' size={24} />
                <h3 className='text-lg font-semibold text-green-900'>Thông tin hoàn tiền</h3>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-green-700 font-medium'>Số tiền hoàn:</span>
                <span className='text-green-800 font-bold text-xl'>{formatPrice(request.refundAmount)}</span>
              </div>
            </div>
          )}

          {/* Admin Notes */}
          {request.adminNotes && (
            <div className='bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-6 shadow-sm'>
              <div className='flex items-start gap-3'>
                <MdInfo className='text-blue-600 mt-1' size={24} />
                <div className='flex-1'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>Ghi chú admin</h3>
                  <p className='text-gray-700 leading-relaxed bg-white p-4 rounded-lg border'>{request.adminNotes}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminModal>
  );
};

export default ReturnsDetailsModal;

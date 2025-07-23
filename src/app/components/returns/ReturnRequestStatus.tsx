'use client';

import { useState, useEffect } from 'react';
import { Order } from '@prisma/client';
import { SafeUser } from '../../../../types';
import { formatPrice } from '../../../../utils/formatPrice';
import { formatDate } from '../../(home)/account/orders/OrdersClient';
import Status from '../Status';
import { MdVisibility, MdRefresh } from 'react-icons/md';
import axios from 'axios';
import toast from 'react-hot-toast';

interface ReturnRequest {
  id: string;
  type: 'RETURN' | 'EXCHANGE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  reason: string;
  description?: string;
  refundAmount?: number;
  additionalCost?: number;
  adminNotes?: string;
  createdAt: string;
  items: any[];
}

interface ReturnRequestStatusProps {
  order: Order & {
    user: SafeUser;
    products: any[];
  };
  currentUser: SafeUser;
}

const ReturnRequestStatus: React.FC<ReturnRequestStatusProps> = ({ order, currentUser }) => {
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReturnRequests = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/orders/return-request?orderId=${order.id}`);
      setReturnRequests(response.data.returnRequests || []);
    } catch (error) {
      console.error('Error fetching return requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReturnRequests();
  }, [order.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  const getTypeText = (type: string) => {
    return type === 'RETURN' ? 'Trả hàng' : 'Đổi hàng';
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

  if (returnRequests.length === 0) {
    return null;
  }

  return (
    <div className='mt-6 border-t pt-6'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold text-gray-900'>Yêu cầu đổi/trả hàng ({returnRequests.length})</h3>
        <button
          onClick={fetchReturnRequests}
          disabled={isLoading}
          className='flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50'
        >
          <MdRefresh className={isLoading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      <div className='space-y-4'>
        {returnRequests.map(request => (
          <div key={request.id} className='border border-gray-200 rounded-lg p-4 bg-white'>
            {/* Header */}
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center gap-3'>
                <span className='text-sm font-medium text-gray-600'>#{request.id.substring(0, 8)}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                  {getStatusText(request.status)}
                </span>
                <span className='px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium'>
                  {getTypeText(request.type)}
                </span>
              </div>
              <span className='text-sm text-gray-500'>{formatDate(request.createdAt)}</span>
            </div>

            {/* Content */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Left Column */}
              <div>
                <div className='mb-3'>
                  <h4 className='text-sm font-medium text-gray-700 mb-1'>Lý do:</h4>
                  <p className='text-sm text-gray-600'>{getReasonText(request.reason)}</p>
                </div>

                {request.description && (
                  <div className='mb-3'>
                    <h4 className='text-sm font-medium text-gray-700 mb-1'>Mô tả:</h4>
                    <p className='text-sm text-gray-600'>{request.description}</p>
                  </div>
                )}

                <div className='mb-3'>
                  <h4 className='text-sm font-medium text-gray-700 mb-1'>Sản phẩm ({request.items.length}):</h4>
                  <div className='space-y-1'>
                    {request.items.map((item: any, index: number) => (
                      <div key={index} className='text-sm text-gray-600 flex justify-between'>
                        <span>
                          • {item.productId.substring(0, 8)}... x{item.quantity}
                        </span>
                        <span>{formatPrice(item.unitPrice * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div>
                {/* Financial Info */}
                {request.type === 'RETURN' && request.refundAmount && (
                  <div className='mb-3 p-3 bg-green-50 border border-green-200 rounded-lg'>
                    <h4 className='text-sm font-medium text-green-800 mb-1'>Số tiền hoàn:</h4>
                    <p className='text-lg font-semibold text-green-600'>{formatPrice(request.refundAmount)}</p>
                  </div>
                )}

                {request.type === 'EXCHANGE' && request.additionalCost !== undefined && (
                  <div
                    className={`mb-3 p-3 border rounded-lg ${
                      request.additionalCost > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <h4
                      className={`text-sm font-medium mb-1 ${
                        request.additionalCost > 0 ? 'text-orange-800' : 'text-green-800'
                      }`}
                    >
                      {request.additionalCost > 0 ? 'Cần bù thêm:' : 'Được hoàn lại:'}
                    </h4>
                    <p
                      className={`text-lg font-semibold ${
                        request.additionalCost > 0 ? 'text-orange-600' : 'text-green-600'
                      }`}
                    >
                      {formatPrice(Math.abs(request.additionalCost))}
                    </p>
                  </div>
                )}

                {/* Admin Notes */}
                {request.adminNotes && (
                  <div className='mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                    <h4 className='text-sm font-medium text-blue-800 mb-1'>Ghi chú từ admin:</h4>
                    <p className='text-sm text-blue-700'>{request.adminNotes}</p>
                  </div>
                )}

                {/* Status-specific Messages */}
                {request.status === 'PENDING' && (
                  <div className='p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                    <p className='text-sm text-yellow-800'>
                      ⏳ Yêu cầu đang được xem xét. Chúng tôi sẽ phản hồi trong vòng 24-48 giờ.
                    </p>
                  </div>
                )}

                {request.status === 'APPROVED' && (
                  <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                    <p className='text-sm text-blue-800'>
                      ✅ Yêu cầu đã được duyệt. Vui lòng gửi sản phẩm về địa chỉ được cung cấp.
                    </p>
                  </div>
                )}

                {request.status === 'REJECTED' && (
                  <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
                    <p className='text-sm text-red-800'>
                      ❌ Yêu cầu bị từ chối. Vui lòng xem ghi chú từ admin để biết thêm chi tiết.
                    </p>
                  </div>
                )}

                {request.status === 'COMPLETED' && (
                  <div className='p-3 bg-green-50 border border-green-200 rounded-lg'>
                    <p className='text-sm text-green-800'>
                      🎉 Yêu cầu đã hoàn tất.
                      {request.type === 'RETURN'
                        ? ' Tiền hoàn sẽ được chuyển về tài khoản trong 3-5 ngày làm việc.'
                        : ' Sản phẩm mới đã được gửi đi.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Timeline */}
            <div className='mt-4 pt-4 border-t border-gray-100'>
              <div className='flex items-center justify-between text-xs text-gray-500'>
                <div
                  className={`flex items-center gap-2 ${
                    ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'].includes(request.status)
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}
                >
                  <div className='w-2 h-2 rounded-full bg-current'></div>
                  <span>Đã tạo</span>
                </div>

                <div
                  className={`flex items-center gap-2 ${
                    ['APPROVED', 'COMPLETED'].includes(request.status) ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  <div className='w-2 h-2 rounded-full bg-current'></div>
                  <span>Đã duyệt</span>
                </div>

                <div
                  className={`flex items-center gap-2 ${
                    request.status === 'COMPLETED' ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  <div className='w-2 h-2 rounded-full bg-current'></div>
                  <span>Hoàn tất</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReturnRequestStatus;

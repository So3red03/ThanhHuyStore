'use client';

import { useState } from 'react';
import { SafeUser } from '../../../../../types';
import { formatPrice } from '../../../utils/formatPrice';
import { formatDate } from '../orders/OrdersClient';
import { MdRefresh, MdShoppingBag } from 'react-icons/md';
import Link from 'next/link';
import { useReturnRequests } from '../../../providers/ReturnRequestContext';
import ReturnRequestProductItem from '../../../components/returns/ReturnRequestProductItem';
import ReturnDetailsClientModal from '../../../components/returns/ReturnDetailsClientModal';

interface ReturnRequest {
  id: string;
  type: 'RETURN' | 'EXCHANGE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  reason: string;
  description?: string;
  refundAmount?: number;
  additionalCost?: number;
  adminNotes?: string;
  exchangeOrderId?: string;
  createdAt: string;
  items: any[];
  order: {
    id: string;
    amount: number;
    createdAt: string;
  };
}

interface ReturnsClientProps {
  currentUser: SafeUser;
}

const ReturnsClient: React.FC<ReturnsClientProps> = ({ currentUser }) => {
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Use context to get return requests
  const { returnRequests, isLoading, refreshReturnRequests } = useReturnRequests();

  const handleViewDetails = (request: ReturnRequest) => {
    setSelectedRequest(request);
    setIsDetailModalOpen(true);
  };

  // Helper functions for styling
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'APPROVED':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'REJECTED':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'COMPLETED':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getTypeBadgeStyle = (type: string) => {
    return type === 'RETURN'
      ? 'text-purple-700 bg-purple-50 border-purple-200'
      : 'text-orange-700 bg-orange-50 border-orange-200';
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

  return (
    <div className='max-w-4xl p-6 py-0'>
      {returnRequests.length > 0 ? (
        <>
          {/* Header */}
          <div className='flex justify-between items-center mb-4'>
            <h1 className='text-2xl font-bold'>YÊU CẦU ĐỔI/TRẢ HÀNG</h1>
            <span className='text-sm text-gray-600'>({returnRequests.length} yêu cầu)</span>
          </div>

          {/* Refresh Button */}
          <div className='mb-4 flex justify-end'>
            <button
              onClick={refreshReturnRequests}
              disabled={isLoading}
              className='flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all duration-200'
            >
              <MdRefresh className={isLoading ? 'animate-spin' : ''} size={16} />
              Làm mới
            </button>
          </div>

          {/* Return Requests List */}
          {returnRequests.map((returnRequest: ReturnRequest) => (
            <div key={returnRequest.id} className='my-4 border border-gray-300 rounded-lg'>
              <div className='p-4 bg-gray-50'>
                <div className='flex justify-between items-center mb-2'>
                  <div className='flex items-center gap-2'>
                    <span className='text-lg font-semibold text-gray-700'>{returnRequest.id}</span>
                    <span
                      className={`text-sm font-medium px-2 py-1 rounded-md border ${getStatusBadgeStyle(
                        returnRequest.status
                      )}`}
                    >
                      {getStatusText(returnRequest.status)}
                    </span>
                    <span
                      className={`text-sm font-medium px-2 py-1 rounded-md border ${getTypeBadgeStyle(
                        returnRequest.type
                      )}`}
                    >
                      {returnRequest.type === 'RETURN' ? 'Trả hàng' : 'Đổi hàng'}
                    </span>
                  </div>
                </div>
                <p className='text-sm text-gray-500'>{formatDate(returnRequest.createdAt)}</p>
                <div className='text-sm text-gray-600 flex items-center gap-2'>
                  Lý do: <span className='font-medium'>{returnRequest.reason}</span>
                </div>
              </div>

              {/* Products */}
              <div className='p-4 border-t border-gray-200'>
                <div className='space-y-3'>
                  {returnRequest.items.map((item, index) => (
                    <ReturnRequestProductItem key={index} item={item} />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className='p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center'>
                <div className='text-sm text-gray-600'>
                  Tổng tiền:{' '}
                  <span className='font-semibold text-gray-900'>{formatPrice(returnRequest.refundAmount || 0)}</span>
                </div>
                <button
                  onClick={() => handleViewDetails(returnRequest)}
                  className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className='text-center py-20'>
          <div className='text-6xl mb-6'>📦</div>
          <h3 className='text-xl font-semibold text-gray-900 mb-3'>Chưa có yêu cầu đổi/trả</h3>
          <p className='text-gray-600 mb-8 max-w-md mx-auto'>
            Bạn chưa có yêu cầu đổi/trả hàng nào. Hãy xem đơn hàng để tạo yêu cầu mới.
          </p>
          <Link
            href='/account/orders'
            className='inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200'
          >
            <MdShoppingBag size={20} />
            Xem đơn hàng của bạn
          </Link>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedRequest && (
        <ReturnDetailsClientModal
          returnRequest={selectedRequest}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ReturnsClient;

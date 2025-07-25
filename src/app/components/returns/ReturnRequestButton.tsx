'use client';

import { useState } from 'react';
import { Order, OrderStatus } from '@prisma/client';
import { SafeUser } from '../../../../types';
import { MdUndo, MdSwapHoriz, MdAccessTime, MdCheckCircle, MdCancel } from 'react-icons/md';
import ReturnRequestModal from './ReturnRequestModal';
import { useReturnRequests } from '../../providers/ReturnRequestContext';

interface ReturnRequest {
  id: string;
  type: 'RETURN' | 'EXCHANGE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  reason: string;
  description?: string;
  createdAt: string;
  items?: any[];
}

interface ReturnRequestButtonProps {
  order: Order & {
    user: SafeUser;
    products: any[];
  };
  currentUser: SafeUser;
  onReturnRequested?: () => void;
}

const ReturnRequestButton: React.FC<ReturnRequestButtonProps> = ({ order, currentUser, onReturnRequested }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestType, setRequestType] = useState<'RETURN' | 'EXCHANGE'>('RETURN');

  // Use context to get return requests
  const { getReturnRequestsForOrder, isLoading, refreshReturnRequests } = useReturnRequests();
  const returnRequests = getReturnRequestsForOrder(order.id);

  // Check if order is eligible for return/exchange
  const isEligible = () => {
    // Must be completed AND delivered
    if (order.status !== OrderStatus.completed) {
      return false;
    }

    if ((order as any).deliveryStatus !== 'delivered') {
      return false;
    }

    // Must be within 7 days from delivery date
    const deliveryDate = new Date((order as any).deliveredAt || order.createdAt);
    const currentDate = new Date();
    const daysDifference = Math.floor((currentDate.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));

    return daysDifference <= 7;
  };

  // Get eligibility message
  const getEligibilityMessage = () => {
    if (order.status !== OrderStatus.completed) {
      return '⚠️ Đơn hàng chưa hoàn thành';
    }
    if ((order as any).deliveryStatus !== 'delivered') {
      return '⚠️ Đơn hàng chưa được giao thành công';
    }

    const deliveryDate = new Date((order as any).deliveredAt || order.createdAt);
    const currentDate = new Date();
    const daysDifference = Math.floor((currentDate.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDifference > 7) {
      return '⚠️ Đã quá thời hạn đổi/trả (7 ngày)';
    }

    return `💡 Bạn có thể đổi/trả trong vòng ${7 - daysDifference} ngày nữa`;
  };

  const handleOpenModal = (type: 'RETURN' | 'EXCHANGE') => {
    setRequestType(type);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleReturnRequested = () => {
    setIsModalOpen(false);
    refreshReturnRequests(); // Refresh return requests from context
    onReturnRequested?.();
  };

  // Check if there are any active return requests (including completed ones)
  const getActiveReturnRequest = () => {
    return returnRequests.find(
      request => request.status === 'PENDING' || request.status === 'APPROVED' || request.status === 'COMPLETED'
    );
  };

  // Get status message for active return request
  const getReturnRequestStatusMessage = (request: ReturnRequest) => {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const typeText = request.type === 'RETURN' ? 'trả hàng' : 'đổi hàng';

    switch (request.status) {
      case 'PENDING':
        return {
          icon: <MdAccessTime className='text-orange-500' size={20} />,
          message: `Đang xử lý yêu cầu ${typeText} – gửi lúc ${formatDate(request.createdAt)}`,
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-700',
          borderColor: 'border-orange-200'
        };
      case 'APPROVED':
        return {
          icon: <MdCheckCircle className='text-blue-500' size={20} />,
          message: `Yêu cầu ${typeText} đã được duyệt – chờ xử lý`,
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200'
        };
      case 'COMPLETED':
        return {
          icon: <MdCheckCircle className='text-green-500' size={20} />,
          message: `Yêu cầu ${typeText} đã hoàn tất`,
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200'
        };
      default:
        return null;
    }
  };

  if (!isEligible()) {
    return <div className='text-xs text-gray-500 italic'>{getEligibilityMessage()}</div>;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className='flex items-center gap-2 text-sm text-gray-500'>
        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400'></div>
        <span>Đang kiểm tra...</span>
      </div>
    );
  }

  // Check for active return request
  const activeRequest = getActiveReturnRequest();
  if (activeRequest) {
    const statusInfo = getReturnRequestStatusMessage(activeRequest);
    if (statusInfo) {
      return (
        <div
          className={`flex items-center gap-3 p-2 rounded-lg border ${statusInfo.bgColor} ${statusInfo.borderColor}`}
        >
          {statusInfo.icon}
          <span className={`text-sm font-medium ${statusInfo.textColor}`}>{statusInfo.message}</span>
        </div>
      );
    }
  }

  return (
    <>
      {/* Redesigned Return/Exchange Buttons to match OrdersClient style */}
      <div className='flex gap-2'>
        {/* Return Button - matching OrdersClient button style */}
        <button
          onClick={() => handleOpenModal('RETURN')}
          className='group relative px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-400 transition-all duration-200 text-sm font-medium'
        >
          <div className='flex items-center gap-1'>
            <MdUndo size={16} />
            <span>Trả hàng</span>
          </div>

          {/* Tooltip */}
          <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10'>
            {getEligibilityMessage()}
          </div>
        </button>

        {/* Exchange Button - matching OrdersClient button style */}
        <button
          onClick={() => handleOpenModal('EXCHANGE')}
          className='group relative px-4 py-2 bg-white border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 text-sm font-medium'
        >
          <div className='flex items-center gap-1'>
            <MdSwapHoriz size={16} />
            <span>Đổi hàng</span>
          </div>

          {/* Tooltip */}
          <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10'>
            {getEligibilityMessage()}
          </div>
        </button>
      </div>

      {/* Return Request Modal */}
      {isModalOpen && (
        <ReturnRequestModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          order={order}
          currentUser={currentUser}
          type={requestType}
          onReturnRequested={handleReturnRequested}
        />
      )}
    </>
  );
};

export default ReturnRequestButton;

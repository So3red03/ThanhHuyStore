'use client';

import { formatDate } from '../../(home)/account/orders/OrdersClient';
import AdminModal from '../admin/AdminModal';
import ReturnRequestProductItem from './ReturnRequestProductItem';
import ExchangeProductDisplay from './ExchangeProductDisplay';

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
  shippingBreakdown?: any;
  order: {
    id: string;
    amount: number;
    createdAt: string;
  };
}

interface ReturnDetailsClientModalProps {
  returnRequest: ReturnRequest;
  isOpen: boolean;
  onClose: () => void;
}

const ReturnDetailsClientModal: React.FC<ReturnDetailsClientModalProps> = ({ returnRequest, isOpen, onClose }) => {
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

  return (
    <AdminModal isOpen={isOpen} handleClose={onClose} title={`Chi tiết yêu cầu #${returnRequest.id.substring(0, 8)}`}>
      <div className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <h3 className='font-semibold text-gray-700 mb-3'>Thông tin cơ bản</h3>
            <div className='space-y-3 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Loại:</span>
                <span className='font-medium'>{getTypeText(returnRequest.type)}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Trạng thái:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                    returnRequest.status
                  )}`}
                >
                  {getStatusText(returnRequest.status)}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Ngày tạo:</span>
                <span>{formatDate(returnRequest.createdAt)}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Đơn hàng:</span>
                <span>#{returnRequest.order.id.substring(0, 8)}</span>
              </div>
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='font-semibold text-gray-700 mb-3'>Lý do</h3>
            <p className='text-sm text-gray-600 mb-2'>{getReasonText(returnRequest.reason)}</p>
            {returnRequest.description && (
              <div>
                <h4 className='font-medium text-gray-700 text-sm mb-1'>Mô tả chi tiết:</h4>
                <p className='text-sm text-gray-600'>{returnRequest.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Products */}
        <div>
          <h3 className='font-semibold text-gray-700 mb-3'>Sản phẩm ({returnRequest.items.length})</h3>
          <div className='space-y-3'>
            {returnRequest.items.map((item: any, index: number) => (
              <ReturnRequestProductItem key={index} item={item} showReason={true} />
            ))}
          </div>
        </div>

        {/* Exchange Information */}
        {returnRequest.type === 'EXCHANGE' && (returnRequest as any).exchangeToProductId && (
          <div>
            <h3 className='font-semibold text-gray-700 mb-3'>Thông tin đổi hàng</h3>
            <ExchangeProductDisplay
              originalItem={returnRequest.items[0]}
              exchangeToProductId={(returnRequest as any).exchangeToProductId}
              exchangeToVariantId={(returnRequest as any).exchangeToVariantId}
              additionalCost={returnRequest.additionalCost}
              mode='detailed'
              showPriceDifference={true}
            />
          </div>
        )}

        {/* Admin Notes */}
        {returnRequest.adminNotes && (
          <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
            <h3 className='font-semibold text-blue-800 mb-2'>Ghi chú từ admin</h3>
            <p className='text-blue-700'>{returnRequest.adminNotes}</p>
          </div>
        )}
      </div>
    </AdminModal>
  );
};

export default ReturnDetailsClientModal;

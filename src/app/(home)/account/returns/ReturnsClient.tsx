'use client';

import { useState } from 'react';
import { SafeUser } from '../../../../../types';
import { formatPrice } from '../../../../../utils/formatPrice';
import { formatDate } from '../orders/OrdersClient';
import { MdRefresh, MdVisibility, MdShoppingBag, MdSwapHoriz, MdUndo } from 'react-icons/md';
import Link from 'next/link';
import AdminModal from '../../../components/admin/AdminModal';
import { useReturnRequests } from '../../../providers/ReturnRequestContext';
import ReturnRequestProductItem from '../../../components/returns/ReturnRequestProductItem';
import ReturnShippingBreakdown from '../../../components/returns/ReturnShippingBreakdown';
import ExchangeProductDisplay from '../../../components/returns/ExchangeProductDisplay';
import ExchangeOrderInfo from '../../../components/returns/ExchangeOrderInfo';

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
  // Exchange specific fields
  exchangeToProductId?: string;
  exchangeToVariantId?: string;
  createdAt: string;
  items: any[];
  shippingBreakdown?: any;
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
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Use context to get return requests
  const { returnRequests, isLoading, refreshReturnRequests } = useReturnRequests();

  const handleViewDetails = (request: ReturnRequest) => {
    setSelectedRequest(request);
    setIsDetailModalOpen(true);
  };

  const filteredRequests = returnRequests.filter(request => {
    if (statusFilter && request.status !== statusFilter) return false;
    if (typeFilter && request.type !== typeFilter) return false;
    return true;
  });

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

  const getStatusMessage = (request: ReturnRequest) => {
    switch (request.status) {
      case 'PENDING':
        return '⏳ Yêu cầu đang được xem xét. Chúng tôi sẽ phản hồi trong vòng 24-48 giờ.';
      case 'APPROVED':
        return '✅ Yêu cầu đã được duyệt. Vui lòng gửi sản phẩm về địa chỉ được cung cấp qua email.';
      case 'REJECTED':
        return '❌ Yêu cầu bị từ chối. Vui lòng xem ghi chú từ admin để biết thêm chi tiết.';
      case 'COMPLETED':
        return request.type === 'RETURN'
          ? '🎉 Yêu cầu đã hoàn tất. Tiền hoàn sẽ được chuyển về tài khoản trong 3-5 ngày làm việc.'
          : '🎉 Yêu cầu đã hoàn tất. Sản phẩm mới đã được gửi đi.';
      default:
        return '';
    }
  };

  return (
    <div className='max-w-6xl mx-auto p-6'>
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-3'>
            <MdShoppingBag className='text-blue-600' size={32} />
            Yêu cầu đổi/trả hàng
          </h1>
          <p className='text-gray-600 mt-2'>Theo dõi và quản lý các yêu cầu đổi/trả hàng của bạn</p>
        </div>
        <div className='flex gap-3'>
          <button
            onClick={refreshReturnRequests}
            disabled={isLoading}
            className='flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all duration-200'
          >
            <MdRefresh className={isLoading ? 'animate-spin' : ''} size={16} />
            Làm mới
          </button>
          <Link
            href='/account/orders'
            className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200'
          >
            <MdShoppingBag size={16} />
            Xem đơn hàng
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className='bg-white rounded-lg border p-6 mb-6'>
        <div className='flex flex-wrap gap-4'>
          <div className='flex-1 min-w-[200px]'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Trạng thái</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value=''>Tất cả trạng thái</option>
              <option value='PENDING'>Chờ duyệt</option>
              <option value='APPROVED'>Đã duyệt</option>
              <option value='REJECTED'>Từ chối</option>
              <option value='COMPLETED'>Hoàn tất</option>
            </select>
          </div>

          <div className='flex-1 min-w-[200px]'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Loại yêu cầu</label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value=''>Tất cả loại</option>
              <option value='RETURN'>Trả hàng</option>
              <option value='EXCHANGE'>Đổi hàng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className='flex items-center justify-center py-20'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
            <p className='text-gray-600'>Đang tải danh sách yêu cầu...</p>
          </div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className='text-center py-20'>
          <div className='text-6xl mb-6'>📦</div>
          <h3 className='text-xl font-semibold text-gray-900 mb-3'>
            {returnRequests.length === 0 ? 'Chưa có yêu cầu đổi/trả' : 'Không tìm thấy yêu cầu nào'}
          </h3>
          <p className='text-gray-600 mb-8 max-w-md mx-auto'>
            {returnRequests.length === 0
              ? 'Bạn chưa có yêu cầu đổi/trả hàng nào. Hãy xem đơn hàng để tạo yêu cầu mới.'
              : 'Thử thay đổi bộ lọc để xem các yêu cầu khác.'}
          </p>
          <Link
            href='/account/orders'
            className='inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200'
          >
            <MdShoppingBag size={20} />
            Xem đơn hàng của bạn
          </Link>
        </div>
      ) : (
        <div className='grid gap-6'>
          {filteredRequests.map(request => (
            <div
              key={request.id}
              className='bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200'
            >
              {/* Header */}
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-3'>
                  <div className='flex items-center gap-2'>
                    {request.type === 'RETURN' ? (
                      <MdUndo className='text-red-500' size={20} />
                    ) : (
                      <MdSwapHoriz className='text-blue-500' size={20} />
                    )}
                    <span className='font-mono text-sm text-gray-600'>#{request.id.substring(0, 8)}</span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}
                  >
                    {getStatusText(request.status)}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      request.type === 'RETURN'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    {getTypeText(request.type)}
                  </span>
                </div>
                <div className='flex items-center gap-3'>
                  <span className='text-sm text-gray-500'>{formatDate(request.createdAt)}</span>
                  <button
                    onClick={() => handleViewDetails(request)}
                    className='flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200'
                  >
                    <MdVisibility size={16} />
                    Chi tiết
                  </button>
                </div>
              </div>

              {/* Content Grid */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                {/* Order Info */}
                <div className='space-y-3'>
                  <h4 className='font-semibold text-gray-700 flex items-center gap-2'>
                    <MdShoppingBag size={16} />
                    Đơn hàng
                  </h4>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Mã đơn:</span>
                      <span className='font-mono'>#{request.order.id.substring(0, 8)}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Ngày đặt:</span>
                      <span>{formatDate(request.order.createdAt)}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Sản phẩm:</span>
                      <span>{request.items.length} món</span>
                    </div>
                  </div>
                </div>

                {/* Reason / Exchange Info */}
                <div className='space-y-3'>
                  <h4 className='font-semibold text-gray-700'>
                    {request.type === 'EXCHANGE' ? 'Thông tin đổi hàng' : 'Lý do'}
                  </h4>
                  <div className='space-y-2 text-sm'>
                    <p className='text-gray-600'>{getReasonText(request.reason)}</p>
                    {request.description && (
                      <div className='p-3 bg-gray-50 rounded-lg'>
                        <p className='text-gray-700'>{request.description}</p>
                      </div>
                    )}
                    {/* Exchange Summary */}
                    {request.type === 'EXCHANGE' && (request as any).exchangeToProductId && (
                      <ExchangeProductDisplay
                        originalItem={request.items[0]}
                        exchangeToProductId={(request as any).exchangeToProductId}
                        exchangeToVariantId={(request as any).exchangeToVariantId}
                        additionalCost={request.additionalCost}
                        mode='compact'
                        showPriceDifference={true}
                      />
                    )}
                  </div>
                </div>

                {/* Financial */}
                <div className='space-y-3'>
                  <h4 className='font-semibold text-gray-700'>
                    {request.type === 'RETURN' ? 'Hoàn tiền' : 'Chênh lệch'}
                  </h4>
                  <div className='space-y-2'>
                    {request.refundAmount && (
                      <div className='p-3 bg-green-50 border border-green-200 rounded-lg'>
                        <div className='flex justify-between items-center'>
                          <span className='text-green-700 text-sm'>Số tiền hoàn:</span>
                          <span className='font-bold text-green-600'>{formatPrice(request.refundAmount)}</span>
                        </div>
                      </div>
                    )}
                    {request.additionalCost !== undefined && (
                      <div
                        className={`p-3 border rounded-lg ${
                          request.additionalCost > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'
                        }`}
                      >
                        <div className='flex justify-between items-center'>
                          <span
                            className={`text-sm ${request.additionalCost > 0 ? 'text-orange-700' : 'text-green-700'}`}
                          >
                            {request.additionalCost > 0 ? 'Cần bù thêm:' : 'Được hoàn:'}
                          </span>
                          <span
                            className={`font-bold ${request.additionalCost > 0 ? 'text-orange-600' : 'text-green-600'}`}
                          >
                            {formatPrice(Math.abs(request.additionalCost))}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Exchange Order Info */}
                    {request.type === 'EXCHANGE' && request.exchangeOrderId && request.status === 'APPROVED' && (
                      <ExchangeOrderInfo
                        exchangeOrderId={request.exchangeOrderId}
                        returnRequestId={request.id}
                        showFullDetails={false}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Status Message */}
              <div className='mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg'>
                <p className='text-sm text-gray-700'>{getStatusMessage(request)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedRequest && (
        <AdminModal
          isOpen={isDetailModalOpen}
          handleClose={() => setIsDetailModalOpen(false)}
          title={`Chi tiết yêu cầu #${selectedRequest.id.substring(0, 8)}`}
          maxWidth='lg'
        >
          <div className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-4'>
                <h3 className='font-semibold text-gray-700 mb-3'>Thông tin cơ bản</h3>
                <div className='space-y-3 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Loại:</span>
                    <span className='font-medium'>{getTypeText(selectedRequest.type)}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Trạng thái:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        selectedRequest.status
                      )}`}
                    >
                      {getStatusText(selectedRequest.status)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Ngày tạo:</span>
                    <span>{formatDate(selectedRequest.createdAt)}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Đơn hàng:</span>
                    <span>#{selectedRequest.order.id.substring(0, 8)}</span>
                  </div>
                </div>
              </div>

              <div className='space-y-4'>
                <h3 className='font-semibold text-gray-700 mb-3'>Lý do</h3>
                <p className='text-sm text-gray-600 mb-2'>{getReasonText(selectedRequest.reason)}</p>
                {selectedRequest.description && (
                  <div>
                    <h4 className='font-medium text-gray-700 text-sm mb-1'>Mô tả chi tiết:</h4>
                    <p className='text-sm text-gray-600'>{selectedRequest.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Products */}
            <div>
              <h3 className='font-semibold text-gray-700 mb-3'>Sản phẩm ({selectedRequest.items.length})</h3>
              <div className='space-y-3'>
                {selectedRequest.items.map((item: any, index: number) => (
                  <ReturnRequestProductItem key={index} item={item} showReason={true} />
                ))}
              </div>
            </div>

            {/* Exchange Information */}
            {selectedRequest.type === 'EXCHANGE' && (selectedRequest as any).exchangeToProductId && (
              <div>
                <h3 className='font-semibold text-gray-700 mb-3'>Thông tin đổi hàng</h3>
                <ExchangeProductDisplay
                  originalItem={selectedRequest.items[0]} // Assuming single item exchange
                  exchangeToProductId={(selectedRequest as any).exchangeToProductId}
                  exchangeToVariantId={(selectedRequest as any).exchangeToVariantId}
                  additionalCost={selectedRequest.additionalCost}
                  mode='detailed'
                  showPriceDifference={true}
                />
              </div>
            )}

            {/* Cost Breakdown for Return Requests */}
            {selectedRequest.type === 'RETURN' && selectedRequest.status !== 'PENDING' && (
              <div>
                <h3 className='font-semibold text-gray-700 mb-3'>Chi tiết chi phí</h3>
                {selectedRequest.shippingBreakdown ? (
                  <ReturnShippingBreakdown
                    orderId={selectedRequest.order.id}
                    reason={selectedRequest.reason}
                    items={selectedRequest.items}
                    onCalculationComplete={() => {}}
                  />
                ) : (
                  <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6'>
                    <div className='space-y-3'>
                      <div className='flex justify-between items-center py-2 border-b border-blue-100'>
                        <span className='text-gray-600 font-medium'>Lý do trả hàng:</span>
                        <span className='font-semibold text-gray-800'>{getReasonText(selectedRequest.reason)}</span>
                      </div>

                      {selectedRequest.refundAmount && (
                        <div className='flex justify-between items-center py-2 border-b border-blue-100'>
                          <span className='text-gray-600 font-medium'>Số tiền hoàn:</span>
                          <span className='font-bold text-green-600 text-lg'>
                            +{formatPrice(selectedRequest.refundAmount)}
                          </span>
                        </div>
                      )}

                      <div className='flex justify-between items-center py-2 border-b border-blue-100'>
                        <span className='text-gray-600 font-medium'>Phí vận chuyển:</span>
                        <span
                          className={`font-bold text-base ${
                            ['DEFECTIVE', 'WRONG_ITEM'].includes(selectedRequest.reason)
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {['DEFECTIVE', 'WRONG_ITEM'].includes(selectedRequest.reason)
                            ? 'Shop chịu trách nhiệm'
                            : 'Khách hàng thanh toán'}
                        </span>
                      </div>

                      <div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mt-4'>
                        <div className='flex justify-between items-center'>
                          <span className='font-semibold text-blue-800'>Trách nhiệm chi phí:</span>
                          <span
                            className={`font-bold text-lg ${
                              ['DEFECTIVE', 'WRONG_ITEM'].includes(selectedRequest.reason)
                                ? 'text-red-600'
                                : 'text-orange-600'
                            }`}
                          >
                            {['DEFECTIVE', 'WRONG_ITEM'].includes(selectedRequest.reason)
                              ? 'Shop chịu toàn bộ'
                              : 'Khách hàng một phần'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Exchange Cost Information */}
            {selectedRequest.type === 'EXCHANGE' && selectedRequest.status !== 'PENDING' && (
              <div>
                <h3 className='font-semibold text-gray-700 mb-3'>Chi tiết chi phí đổi hàng</h3>
                <div className='bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6'>
                  <div className='space-y-3'>
                    <div className='flex justify-between items-center py-2 border-b border-purple-100'>
                      <span className='text-gray-600 font-medium'>Lý do đổi hàng:</span>
                      <span className='font-semibold text-gray-800'>{getReasonText(selectedRequest.reason)}</span>
                    </div>

                    {selectedRequest.additionalCost !== undefined && selectedRequest.additionalCost !== 0 && (
                      <div className='flex justify-between items-center py-2 border-b border-purple-100'>
                        <span className='text-gray-600 font-medium'>Chênh lệch giá:</span>
                        <span
                          className={`font-bold text-lg ${
                            selectedRequest.additionalCost > 0 ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {selectedRequest.additionalCost > 0 ? '+' : ''}
                          {formatPrice(selectedRequest.additionalCost)}
                        </span>
                      </div>
                    )}

                    <div className='flex justify-between items-center py-2 border-b border-purple-100'>
                      <span className='text-gray-600 font-medium'>Phí vận chuyển:</span>
                      <span
                        className={`font-bold text-base ${
                          ['DEFECTIVE', 'WRONG_ITEM'].includes(selectedRequest.reason)
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {['DEFECTIVE', 'WRONG_ITEM'].includes(selectedRequest.reason)
                          ? 'Shop chịu trách nhiệm'
                          : 'Khách hàng thanh toán'}
                      </span>
                    </div>

                    <div className='bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mt-4'>
                      <div className='flex justify-between items-center'>
                        <span className='font-semibold text-purple-800'>Trách nhiệm chi phí:</span>
                        <span
                          className={`font-bold text-lg ${
                            ['DEFECTIVE', 'WRONG_ITEM'].includes(selectedRequest.reason)
                              ? 'text-red-600'
                              : 'text-orange-600'
                          }`}
                        >
                          {['DEFECTIVE', 'WRONG_ITEM'].includes(selectedRequest.reason)
                            ? 'Shop chịu toàn bộ'
                            : 'Khách hàng một phần'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Exchange Order Details */}
            {selectedRequest.type === 'EXCHANGE' && selectedRequest.exchangeOrderId && (
              <div>
                <h3 className='font-semibold text-gray-700 mb-3'>Đơn hàng đổi mới</h3>
                <ExchangeOrderInfo
                  exchangeOrderId={selectedRequest.exchangeOrderId}
                  returnRequestId={selectedRequest.id}
                  showFullDetails={true}
                />
              </div>
            )}

            {/* Admin Notes */}
            {selectedRequest.adminNotes && (
              <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                <h3 className='font-semibold text-blue-800 mb-2'>Ghi chú từ admin</h3>
                <p className='text-blue-700'>{selectedRequest.adminNotes}</p>
              </div>
            )}
          </div>
        </AdminModal>
      )}
    </div>
  );
};

export default ReturnsClient;

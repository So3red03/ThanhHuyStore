'use client';

import { useState, useMemo } from 'react';
import { SafeUser } from '../../../../../types';
import { formatPrice } from '../../../utils/formatPrice';
import { formatDate } from '../orders/OrdersClient';
import { MdRefresh, MdShoppingBag, MdFilterList, MdClear, MdSearch } from 'react-icons/md';
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

  // Filter states
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [reasonFilter, setReasonFilter] = useState<string>('ALL');
  const [amountFilter, setAmountFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Use context to get return requests
  const { returnRequests, isLoading, refreshReturnRequests } = useReturnRequests();

  // Helper function to get reason text
  const getReasonText = (reason: string) => {
    switch (reason) {
      case 'DEFECTIVE':
        return 'Sản phẩm bị lỗi';
      case 'WRONG_ITEM':
        return 'Giao sai sản phẩm';
      case 'CHANGE_MIND':
        return 'Đổi ý không muốn mua';
      case 'SIZE_COLOR':
        return 'Muốn đổi size/màu khác';
      case 'DIFFERENT_MODEL':
        return 'Muốn model/sản phẩm khác';
      default:
        return reason;
    }
  };

  // Filtered return requests
  const filteredReturnRequests = useMemo(() => {
    return returnRequests.filter(request => {
      // Type filter
      const typeMatch = typeFilter === 'ALL' || request.type === typeFilter;

      // Status filter
      const statusMatch = statusFilter === 'ALL' || request.status === statusFilter;

      // Date filter
      let dateMatch = true;
      if (dateFilter !== 'ALL') {
        const requestDate = new Date(request.createdAt);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));

        switch (dateFilter) {
          case 'TODAY':
            dateMatch = daysDiff === 0;
            break;
          case 'WEEK':
            dateMatch = daysDiff <= 7;
            break;
          case 'MONTH':
            dateMatch = daysDiff <= 30;
            break;
          case 'QUARTER':
            dateMatch = daysDiff <= 90;
            break;
        }
      }

      // Reason filter
      const reasonMatch = reasonFilter === 'ALL' || request.reason === reasonFilter;

      // Amount filter
      let amountMatch = true;
      if (amountFilter !== 'ALL') {
        const amount = request.refundAmount || 0;
        switch (amountFilter) {
          case 'UNDER_1M':
            amountMatch = amount < 1000000;
            break;
          case '1M_5M':
            amountMatch = amount >= 1000000 && amount < 5000000;
            break;
          case '5M_10M':
            amountMatch = amount >= 5000000 && amount < 10000000;
            break;
          case 'OVER_10M':
            amountMatch = amount >= 10000000;
            break;
        }
      }

      // Search term filter
      let searchMatch = true;
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        searchMatch =
          request.id.toLowerCase().includes(searchLower) ||
          request.order.id.toLowerCase().includes(searchLower) ||
          getReasonText(request.reason).toLowerCase().includes(searchLower) ||
          (request.description ? request.description.toLowerCase().includes(searchLower) : false);
      }

      return typeMatch && statusMatch && dateMatch && reasonMatch && amountMatch && searchMatch;
    });
  }, [returnRequests, typeFilter, statusFilter, dateFilter, reasonFilter, amountFilter, searchTerm]);

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

  const clearFilters = () => {
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setDateFilter('ALL');
    setReasonFilter('ALL');
    setAmountFilter('ALL');
    setSearchTerm('');
  };

  return (
    <div className='max-w-4xl p-6 py-0'>
      {returnRequests.length > 0 ? (
        <>
          {/* Header */}
          <div className='flex justify-between items-center mb-4'>
            <h1 className='text-2xl font-bold'>YÊU CẦU ĐỔI/TRẢ HÀNG</h1>
            <span className='text-sm text-gray-600'>
              ({filteredReturnRequests.length}/{returnRequests.length} yêu cầu)
            </span>
          </div>

          {/* Filters */}
          <div className='bg-white rounded-lg border border-gray-200 p-4 mb-6'>
            {/* Search Bar */}
            <div className='mb-4'>
              <div className='relative'>
                <MdSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' size={20} />
                <input
                  type='text'
                  placeholder='Tìm kiếm theo mã yêu cầu, mã đơn hàng, lý do...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>
            </div>

            {/* <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4'> */}
            <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4'>
              {/* Type Filter */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Loại yêu cầu</label>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                >
                  <option value='ALL'>Tất cả</option>
                  <option value='RETURN'>Trả hàng</option>
                  <option value='EXCHANGE'>Đổi hàng</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Trạng thái</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                >
                  <option value='ALL'>Tất cả</option>
                  <option value='PENDING'>Chờ duyệt</option>
                  <option value='APPROVED'>Đã duyệt</option>
                  <option value='REJECTED'>Từ chối</option>
                  <option value='COMPLETED'>Hoàn tất</option>
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Thời gian</label>
                <select
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                >
                  <option value='ALL'>Tất cả</option>
                  <option value='TODAY'>Hôm nay</option>
                  <option value='WEEK'>7 ngày qua</option>
                  <option value='MONTH'>30 ngày qua</option>
                  <option value='QUARTER'>3 tháng qua</option>
                </select>
              </div>

              {/* Reason Filter */}
              {/* <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Lý do</label>
                <select
                  value={reasonFilter}
                  onChange={e => setReasonFilter(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                >
                  <option value='ALL'>Tất cả</option>
                  <option value='DEFECTIVE'>Sản phẩm bị lỗi</option>
                  <option value='WRONG_ITEM'>Giao sai sản phẩm</option>
                  <option value='CHANGE_MIND'>Đổi ý không muốn mua</option>
                  <option value='SIZE_COLOR'>Muốn đổi size/màu khác</option>
                  <option value='DIFFERENT_MODEL'>Muốn model/sản phẩm khác</option>
                </select>
              </div> */}

              {/* Amount Filter */}
              {/* <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Giá trị</label>
                <select
                  value={amountFilter}
                  onChange={e => setAmountFilter(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                >
                  <option value='ALL'>Tất cả</option>
                  <option value='UNDER_1M'>Dưới 1 triệu</option>
                  <option value='1M_5M'>1 - 5 triệu</option>
                  <option value='5M_10M'>5 - 10 triệu</option>
                  <option value='OVER_10M'>Trên 10 triệu</option>
                </select>
              </div> */}

              {/* Actions */}
              <div className='flex flex-col'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Thao tác</label>
                <div className='flex gap-2'>
                  <button
                    onClick={clearFilters}
                    className='flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 text-sm'
                  >
                    <MdClear size={16} />
                    Xóa
                  </button>
                  <button
                    onClick={refreshReturnRequests}
                    disabled={isLoading}
                    className='flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 text-sm'
                  >
                    <MdRefresh className={isLoading ? 'animate-spin' : ''} size={16} />
                    Làm mới
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Return Requests List */}
          {filteredReturnRequests.length > 0 ? (
            filteredReturnRequests.map((returnRequest: ReturnRequest) => (
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
                    Lý do: <span className='font-medium'>{getReasonText(returnRequest.reason)}</span>
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
                  <div className='text-sm text-gray-600'></div>
                  <button
                    onClick={() => handleViewDetails(returnRequest)}
                    className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className='text-center py-12'>
              <div className='text-4xl mb-4'>🔍</div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>Không tìm thấy yêu cầu nào</h3>
              <p className='text-gray-600 mb-4'>Không có yêu cầu đổi/trả hàng nào phù hợp với bộ lọc hiện tại.</p>
              <button
                onClick={clearFilters}
                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
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

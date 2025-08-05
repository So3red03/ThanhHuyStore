'use client';

import { CartProductType, DeliveryStatus, Order, OrderStatus } from '@prisma/client';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useState, useMemo } from 'react';
import { SafeUser } from '../../../../../types';
import { formatPrice } from '../../../utils/formatPrice';
import { useRouter } from 'next/navigation';
import { MdShoppingBag, MdRefresh, MdFilterList, MdClear, MdSearch } from 'react-icons/md';
import ReturnRequestButton from '@/app/components/returns/ReturnRequestButton';
import Image from 'next/image';
import AdminModal from '@/app/components/admin/AdminModal';
import OrderDetails from '@/app/components/OrderDetails';

export const formatDate = (date: any) => {
  if (!date) return 'N/A';
  try {
    return format(new Date(date), "dd 'tháng' M yyyy '|' HH:mm:ss", { locale: vi });
  } catch (error) {
    console.error('Invalid date format:', date);
    return 'Invalid date';
  }
};

export const formatDateNoTime = (date: any) => {
  if (!date) return 'N/A';
  try {
    return format(new Date(date), "dd 'tháng' M yyyy", { locale: vi });
  } catch (error) {
    console.error('Invalid date format:', date);
    return 'Invalid date';
  }
};

interface OrdersClientProps {
  orders: (Order & { products: CartProductType[] })[];
  currentUser: SafeUser | null | undefined;
}

const OrdersClient: React.FC<OrdersClientProps> = ({ orders, currentUser }) => {
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<(Order & { products: CartProductType[] }) | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filter states
  const [combinedStatusFilter, setCombinedStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [amountFilter, setAmountFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Handle view details
  const handleViewDetails = (order: Order & { products: CartProductType[] }) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  // Helper function to get status text
  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.pending:
        return 'Chờ xác nhận';
      case OrderStatus.confirmed:
        return 'Đã xác nhận';
      case OrderStatus.completed:
        return 'Hoàn thành';
      case OrderStatus.canceled:
        return 'Đã hủy';
      default:
        return status;
    }
  };

  // Filtered orders using useMemo
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Simple status filter
      let statusMatch = true;
      if (combinedStatusFilter !== 'ALL') {
        switch (combinedStatusFilter) {
          case 'pending':
            // Chờ xác nhận: đơn hàng pending
            statusMatch = order.status === OrderStatus.pending;
            break;
          case 'confirmed':
            // Đã xác nhận: đơn hàng confirmed nhưng chưa giao
            statusMatch = order.status === OrderStatus.confirmed && order.deliveryStatus === DeliveryStatus.not_shipped;
            break;
          case 'shipping':
            // Đang vận chuyển: đang giao hàng
            statusMatch = order.deliveryStatus === DeliveryStatus.in_transit;
            break;
          case 'completed':
            // Hoàn thành: đã giao và completed
            statusMatch = order.deliveryStatus === DeliveryStatus.delivered && order.status === OrderStatus.completed;
            break;
          case 'canceled':
            // Đã hủy: đơn hàng canceled
            statusMatch = order.status === OrderStatus.canceled;
            break;
        }
      }

      // Date filter
      let dateMatch = true;
      if (dateFilter !== 'ALL') {
        const orderDate = new Date(order.createdAt);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));

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

      // Amount filter
      let amountMatch = true;
      if (amountFilter !== 'ALL') {
        const amount = order.amount || 0;
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
          order.id.toLowerCase().includes(searchLower) ||
          getStatusText(order.status).toLowerCase().includes(searchLower) ||
          getDeliveryStatusText(order.deliveryStatus).toLowerCase().includes(searchLower);
      }

      return statusMatch && dateMatch && amountMatch && searchMatch;
    });
  }, [orders, combinedStatusFilter, dateFilter, amountFilter, searchTerm]);

  // Clear all filters
  const clearFilters = () => {
    setCombinedStatusFilter('ALL');
    setDateFilter('ALL');
    setAmountFilter('ALL');
    setSearchTerm('');
  };

  // Refresh orders (reload page)
  const refreshOrders = () => {
    router.refresh();
  };

  // Helper functions for styling
  const getDeliveryStatusBadgeStyle = (status: string | null) => {
    switch (status) {
      case 'not_shipped':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'in_transit':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'delivered':
        return 'text-green-700 bg-green-50 border-green-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getDeliveryStatusText = (status: string | null) => {
    switch (status) {
      case 'not_shipped':
        return 'Chờ giao';
      case 'in_transit':
        return 'Đang giao';
      case 'delivered':
        return 'Đã giao';
      default:
        return status || 'Không xác định';
    }
  };

  // Enhanced OrderItem component with proper image display
  const OrderItem = ({ item }: { item: any }) => {
    // Get the appropriate image - prioritize selectedImg, then thumbnail, then first image
    const getItemImage = () => {
      if (item.selectedImg) return item.selectedImg;
      if (item.thumbnail) return item.thumbnail;
      if (item.image) return item.image;
      if (item.images && item.images.length > 0) return item.images[0];
      return '/placeholder-image.jpg'; // fallback
    };

    return (
      <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200'>
        {/* Product Image */}
        <div className='relative w-16 h-16 flex-shrink-0'>
          <Image
            src={getItemImage()}
            alt={item.name || 'Product'}
            fill
            className='object-cover rounded-lg'
            sizes='64px'
            onError={e => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-image.jpg';
            }}
          />
        </div>

        {/* Product Info */}
        <div className='flex-1'>
          <h4 className='font-medium text-gray-900 text-sm'>{item.name}</h4>
          {item.selectedColor && <p className='text-xs text-gray-500'>Màu: {item.selectedColor}</p>}
          {item.selectedSize && <p className='text-xs text-gray-500'>Size: {item.selectedSize}</p>}
          <div className='flex justify-between items-center mt-1'>
            <p className='text-sm text-gray-600'>SL: {item.quantity}</p>
            <p className='text-sm font-semibold text-blue-600'>{formatPrice(item.price)}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='max-w-4xl p-6 py-0'>
      {orders.length > 0 ? (
        <>
          {/* Header */}
          <div className='flex justify-between items-center mb-4'>
            <h1 className='text-2xl font-bold'>ĐƠN HÀNG CỦA TÔI</h1>
            <span className='text-sm text-gray-600'>
              ({filteredOrders.length}/{orders.length} đơn hàng)
            </span>
          </div>

          {/* Filters */}
          <div className='bg-white rounded-lg border border-gray-200 p-4 mb-6'>
            {/* Search Bar */}
            {/* <div className='mb-4'>
              <div className='relative'>
                <MdSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' size={20} />
                <input
                  type='text'
                  placeholder='Tìm kiếm theo mã đơn hàng, trạng thái...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>
            </div> */}

            {/* <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4'> */}
            <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4'>
              {/* Status Filter */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Trạng thái</label>
                <select
                  value={combinedStatusFilter}
                  onChange={e => setCombinedStatusFilter(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                >
                  <option value='ALL'>Tất cả</option>
                  <option value='pending'>Chờ xác nhận</option>
                  <option value='confirmed'>Đã xác nhận</option>
                  <option value='shipping'>Đang vận chuyển</option>
                  <option value='completed'>Hoàn thành</option>
                  <option value='canceled'>Đã hủy</option>
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

              {/* Amount Filter */}
              {/* <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Giá trị đơn hàng</label>
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
                    onClick={refreshOrders}
                    className='flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm'
                  >
                    <MdRefresh size={16} />
                    Làm mới
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length > 0 ? (
            filteredOrders.map(order => (
              <div key={order.id} className='my-4 border border-gray-300 rounded-lg'>
                <div className='p-4 bg-gray-50'>
                  <div className='flex justify-between items-center mb-2'>
                    <div className='flex items-center gap-2'>
                      <span className='text-lg font-semibold text-gray-700'>{order.id}</span>
                      {order.status === OrderStatus.canceled && (
                        <span className='text-sm font-medium px-2 py-1 rounded-md border text-red-700 bg-red-50 border-red-200'>
                          Đã hủy
                        </span>
                      )}
                      <span
                        className={`text-sm font-medium px-2 py-1 rounded-md border ${getDeliveryStatusBadgeStyle(
                          order.deliveryStatus
                        )}`}
                      >
                        {getDeliveryStatusText(order.deliveryStatus)}
                      </span>
                    </div>
                  </div>
                  <p className='text-sm text-gray-500'>{formatDate(order.createdAt)}</p>
                  <div className='text-sm text-gray-600 flex items-center gap-2'>
                    Trạng thái: <span className='font-medium'>{getStatusText(order.status)}</span>
                  </div>
                  <div className='text-sm text-gray-600 flex items-center gap-2'>
                    Giao hàng: <span className='font-medium'>{getDeliveryStatusText(order.deliveryStatus)}</span>
                  </div>
                </div>

                {/* Products */}
                <div className='p-4 border-t border-gray-200'>
                  <div className='space-y-3'>
                    {order.products.map((item: any, index: number) => (
                      <OrderItem key={index} item={item} />
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className='p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center'>
                  <div className='text-sm text-gray-600'>
                    Tổng tiền: <span className='font-semibold text-gray-900'>{formatPrice(order.amount)}</span>
                  </div>
                  <div className='flex gap-2 items-center'>
                    {/* Return/Exchange Buttons */}
                    {order.status === OrderStatus.completed && order.deliveryStatus === 'delivered' && (
                      <ReturnRequestButton order={order as any} currentUser={currentUser!} />
                    )}

                    {/* View Details Button */}
                    <button
                      onClick={() => handleViewDetails(order)}
                      className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className='text-center py-12'>
              <div className='text-4xl mb-4'>🔍</div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>Không tìm thấy đơn hàng nào</h3>
              <p className='text-gray-600 mb-4'>Không có đơn hàng nào phù hợp với bộ lọc hiện tại.</p>
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
          <h3 className='text-xl font-semibold text-gray-900 mb-3'>Chưa có đơn hàng nào</h3>
          <p className='text-gray-600 mb-8 max-w-md mx-auto'>
            Bạn chưa có đơn hàng nào. Hãy khám phá sản phẩm và đặt hàng ngay!
          </p>
          <button
            onClick={() => router.push('/')}
            className='inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200'
          >
            <MdShoppingBag size={20} />
            Mua sắm ngay
          </button>
        </div>
      )}

      {/* Order Details Modal */}
      {isDetailModalOpen && selectedOrder && currentUser && (
        <AdminModal isOpen={isDetailModalOpen} handleClose={() => setIsDetailModalOpen(false)} maxWidth='md'>
          <OrderDetails
            order={{
              ...selectedOrder,
              user: currentUser
            }}
            currentUser={currentUser}
            showCancelButton={false}
            onOrderCancelled={() => {
              setIsDetailModalOpen(false);
            }}
          />
        </AdminModal>
      )}
    </div>
  );
};

export default OrdersClient;

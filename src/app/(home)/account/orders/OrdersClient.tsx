'use client';

import { CartProductType, DeliveryStatus, Order, OrderStatus } from '@prisma/client';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useState } from 'react';
import { SafeUser } from '../../../../../types';
import { formatPrice } from '../../../../../utils/formatPrice';
import { Box, styled, Tab, Tabs } from '@mui/material';
import { useRouter } from 'next/navigation';
import { MdShoppingBag } from 'react-icons/md';
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
  const [filteredOrders, setFilteredOrders] = useState(orders);
  const [value, setValue] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<(Order & { products: CartProductType[] }) | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Handle view details
  const handleViewDetails = (order: Order & { products: CartProductType[] }) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
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

  const AntTabs = styled(Tabs)({
    '& .MuiTabs-indicator': {
      display: 'none'
    }
  });

  const tabStyles = {
    borderBottom: '1px solid',
    borderRadius: '8px',
    paddingTop: '0px',
    paddingBottom: '0px',
    textTransform: 'none',
    minWidth: '150px',
    minHeight: '40px',
    mx: 1,
    position: 'relative',
    '&.Mui-selected': {
      color: 'primary.main',
      borderColor: 'primary.main'
    },
    color: 'text.primary',
    borderColor: '#D2D2D7'
  };

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    filterOrders(newValue);
  };

  // Hàm lọc đơn hàng
  const filterOrders = (tabIndex: number) => {
    switch (tabIndex) {
      case 0: // Tất cả
        setFilteredOrders(orders);
        break;
      case 1: // Chờ xác nhận
        setFilteredOrders(
          orders.filter(
            order =>
              order.status !== OrderStatus.canceled &&
              (order.status === OrderStatus.pending ||
                (order.status === OrderStatus.confirmed && order.deliveryStatus === DeliveryStatus.not_shipped))
          )
        );
        break;
      case 2: // Đang vận chuyển
        setFilteredOrders(orders.filter(order => order.deliveryStatus === DeliveryStatus.in_transit));
        break;
      case 3: // Hoàn thành
        setFilteredOrders(
          orders.filter(
            order => order.deliveryStatus === DeliveryStatus.delivered && order.status === OrderStatus.completed
          )
        );
        break;
      case 4: // Đã hủy
        setFilteredOrders(orders.filter(order => order.status === OrderStatus.canceled));
        break;
      default:
        setFilteredOrders(orders);
    }
  };

  return (
    <div className='max-w-4xl p-6 py-0'>
      {orders.length > 0 ? (
        <>
          {/* Header */}
          <div className='flex justify-between items-center mb-4'>
            <h1 className='text-2xl font-bold'>ĐƠN HÀNG CỦA TÔI</h1>
            <span className='text-sm text-gray-600'>({filteredOrders.length} đơn hàng)</span>
          </div>

          {/* Tabs */}
          <div className='w-100 overflow-auto mb-4'>
            <Box sx={{ overflowX: 'auto' }}>
              <AntTabs value={value} onChange={handleChange} centered>
                <Tab label='Tất cả' sx={tabStyles} />
                <Tab label='Chờ xác nhận' sx={tabStyles} />
                <Tab label='Đang vận chuyển' sx={tabStyles} />
                <Tab label='Hoàn thành' sx={tabStyles} />
                <Tab label='Đã hủy' sx={tabStyles} />
              </AntTabs>
            </Box>
          </div>

          {/* Orders List */}
          {filteredOrders.map(order => (
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
                  Tình trạng: <span className='font-medium'>{getDeliveryStatusText(order.deliveryStatus)}</span>
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
          ))}
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

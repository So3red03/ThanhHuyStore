'use client';

import { CartProductType, DeliveryStatus, Order, OrderStatus } from '@prisma/client';
import Status from '@/app/components/Status';
import { MdAccessTimeFilled, MdDeliveryDining, MdDone } from 'react-icons/md';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useState } from 'react';
import AdminModal from '@/app/components/admin/AdminModal';
import { SafeUser } from '../../../../../types';
import { formatPrice } from '../../../../../utils/formatPrice';
import Button from '@/app/components/Button';
import NotFound from '@/app/components/NotFound';
import { Box, Rating, styled, Tab, Tabs } from '@mui/material';
import 'moment/locale/vi';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import OrderDetails from '@/app/components/OrderDetails';
import CancelOrderDialog from '@/app/components/CancelOrderDialog';

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
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<(Order & { products: CartProductType[] }) | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const router = useRouter();
  const toggleOpen = () => {
    setIsOpen(!isOpen);
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
  // Giá trị hiển thị để chuyển đổi các tab
  const [filteredOrders, setFilteredOrders] = useState(orders);
  const [value, setValue] = useState(0);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    filterOrders(newValue);
  };
  // Kiểm tra xem đơn hàng có thể hủy không
  const canCancelOrder = (order: Order) => {
    return (
      order.status === OrderStatus.pending ||
      (order.status === OrderStatus.confirmed && order.deliveryStatus === DeliveryStatus.not_shipped)
    );
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
              order.status !== OrderStatus.canceled && // Loại trừ đơn hàng đã hủy
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
    <>
      <div className='max-w-4xl p-6 py-0'>
        {orders.length > 0 ? (
          <>
            <div className={`flex justify-between items-center mb-4`}>
              <h1 className='text-2xl font-bold'>ĐƠN HÀNG CỦA TÔI</h1>
              <span className='text-sm text-gray-600'>({filteredOrders.length} đơn hàng)</span>
            </div>
            <div className='w-100 overflow-auto'>
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
            {filteredOrders.map(order => (
              <div key={order.id} className='my-4 border border-gray-300 rounded-lg'>
                <div className='p-4 bg-gray-50'>
                  <div className='flex justify-between items-center mb-2'>
                    <div className='flex items-center gap-2'>
                      <span className='text-lg font-semibold text-gray-700'>{order.id}</span>
                      {order.status === OrderStatus.canceled && (
                        <span className='text-sm font-medium text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-200'>
                          Đã hủy
                        </span>
                      )}
                    </div>
                  </div>

                  <p className='text-sm text-gray-500'>{formatDate(order.createdAt)}</p>
                  <div className='text-sm text-gray-600 flex items-center gap-2'>
                    Tình trạng đặt hàng:{' '}
                    <span className='font-medium'>
                      {order.deliveryStatus === 'not_shipped' ? (
                        <Status
                          text='Đang chờ'
                          icon={MdAccessTimeFilled}
                          bg='bg-slate-200'
                          color='text-slate-700 !py-0 !px-1'
                        />
                      ) : order.deliveryStatus === 'in_transit' ? (
                        <Status
                          text='Đang giao hàng'
                          icon={MdDeliveryDining}
                          bg='bg-purple-200'
                          color='text-purple-700 !py-0 !px-1'
                        />
                      ) : order.deliveryStatus === 'delivered' ? (
                        <Status
                          text='Giao thành công'
                          icon={MdDone}
                          bg='bg-green-200'
                          color='text-green-700 !py-0 !px-1'
                        />
                      ) : (
                        <></>
                      )}
                    </span>
                  </div>
                  <div className='text-sm text-gray-600 flex items-center gap-2'>
                    Trạng thái thanh toán:{' '}
                    <span className='font-medium'>
                      {order.status === 'pending' ? (
                        <Status
                          text='Đang chờ'
                          icon={MdAccessTimeFilled}
                          bg='bg-slate-200'
                          color='text-slate-700 !py-0 !px-1'
                        />
                      ) : (
                        <Status text='Thành công' icon={MdDone} bg='bg-green-200' color='text-green-700 !py-0 !px-1' />
                      )}
                    </span>
                  </div>
                </div>

                <div className='border-t p-4 border-gray-300 flex justify-between items-center'>
                  <div className='flex gap-3'>
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        toggleOpen();
                      }}
                      className='px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-slate-600 hover:text-white hover:boder-slate-600'
                    >
                      Thông tin đơn hàng
                    </button>
                    {canCancelOrder(order) && (
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowCancelDialog(true);
                        }}
                        className='px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-400'
                      >
                        Hủy đơn hàng
                      </button>
                    )}
                  </div>
                  <span className='text-md font-semibold'>{formatPrice(order.amount)}</span>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className='mt-8'>
            <NotFound />
            <p className='text-center font-semibold text-lg my-5'>Quý khách chưa có đơn hàng nào</p>
            <Button
              label='Tiếp tục mua hàng'
              onClick={() => {
                router.push('/');
              }}
              custom='!max-w-[200px] !mx-auto'
            />
          </div>
        )}
      </div>
      {isOpen && selectedOrder && currentUser && (
        <AdminModal isOpen={isOpen} handleClose={toggleOpen}>
          <OrderDetails
            order={{
              ...selectedOrder,
              user: currentUser
            }}
            currentUser={currentUser}
            showCancelButton={true}
            onOrderCancelled={() => {
              // Refresh orders list or update state
              toggleOpen();
              window.location.reload(); // Simple refresh for now
            }}
          />
        </AdminModal>
      )}

      {/* Cancel Order Dialog */}
      {showCancelDialog && selectedOrder && currentUser && (
        <CancelOrderDialog
          isOpen={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          order={{
            ...selectedOrder,
            user: currentUser
          }}
          currentUser={currentUser}
          onSuccess={() => {
            setShowCancelDialog(false);
            window.location.reload(); // Simple refresh for now
          }}
        />
      )}
    </>
  );
};

export default OrdersClient;

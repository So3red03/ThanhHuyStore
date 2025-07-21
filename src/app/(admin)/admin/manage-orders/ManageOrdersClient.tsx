'use client';

import Status from '@/app/components/Status';
import ActionBtn from '@/app/components/ActionBtn';
import axios from 'axios';
import toast from 'react-hot-toast';
import AdminModal from '@/app/components/admin/AdminModal';
import AdminCancelOrderDialog from '@/app/components/admin/AdminCancelOrderDialog';
import {
  MdAccessTimeFilled,
  MdDeliveryDining,
  MdDone,
  MdRefresh,
  MdRemoveRedEye,
  MdAdd,
  MdClose
} from 'react-icons/md';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DeliveryStatus, Order, OrderStatus } from '@prisma/client';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import 'moment/locale/vi';
import { SafeUser } from '../../../../../types';
import OrderDetails from '@/app/components/OrderDetails';
import NullData from '@/app/components/NullData';
import { MdViewKanban } from 'react-icons/md';
import { Button } from '@mui/material';
import Link from 'next/link';
import { formatDate } from '@/app/(home)/account/orders/OrdersClient';
import AddOrderModal from './AddOrderModal';
import {
  canTransitionOrderStatus,
  getValidOrderStatusTransitions,
  canTransitionDeliveryStatus
} from '@/app/utils/orderStatusValidation';

interface ManageOrdersClientProps {
  orders: Order[];
  currentUser: SafeUser | null | undefined;
  users?: any[];
  products?: any[];
}

// Custom tabs - no longer using MUI styled components

const ManageOrdersClient: React.FC<ManageOrdersClientProps> = ({
  orders: initialOrders,
  currentUser,
  users = [],
  products = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState(initialOrders);
  const [filteredOrders, setFilteredOrders] = useState(initialOrders);
  const [tabValue, setTabValue] = useState(0);
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<any>(null);

  const router = useRouter();

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  // Custom tabs styling handled via Tailwind classes

  // Filter orders based on tab selection
  const filterOrdersByTab = (tabIndex: number) => {
    switch (tabIndex) {
      case 0: // Tất cả
        return orders;
      case 1: // Chờ xác nhận (pending)
        return orders.filter(order => order.status === OrderStatus.pending);
      case 2: // Đang chuẩn bị (confirmed + not_shipped)
        return orders.filter(
          order =>
            order.status === OrderStatus.confirmed &&
            (!order.deliveryStatus || order.deliveryStatus === DeliveryStatus.not_shipped)
        );
      case 3: // Đang giao hàng (in_transit)
        return orders.filter(order => order.deliveryStatus === DeliveryStatus.in_transit);
      case 4: // Hoàn thành (completed)
        return orders.filter(order => order.status === OrderStatus.completed);
      case 5: // Đã hủy (canceled)
        return orders.filter(order => order.status === OrderStatus.canceled);
      default:
        return orders;
    }
  };

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    const filtered = filterOrdersByTab(newValue);
    setFilteredOrders(filtered);
  };

  // Update filtered orders when orders change
  useEffect(() => {
    const filtered = filterOrdersByTab(tabValue);
    setFilteredOrders(filtered);
  }, [orders, tabValue]);

  let rows: any = [];
  if (filteredOrders) {
    rows = filteredOrders.map((order: any) => {
      return {
        id: order.id,
        name: order.user.name,
        email: order.user.email,
        status: order.status,
        amount: order.amount,
        orderStatus: order.status,
        paymentMethod: order.paymentMethod,
        deliveryStatus: order.deliveryStatus,
        products: order.products,
        createdAt: order.createdAt,
        address: order.address,
        phoneNumber: order.phoneNumber,
        // Include cancel fields for OrderDetails
        cancelReason: order.cancelReason,
        cancelDate: order.cancelDate,
        // Include shipping fields
        shippingCode: order.shippingCode,
        shippingFee: order.shippingFee,
        originalAmount: order.originalAmount,
        discountAmount: order.discountAmount,
        paymentIntentId: order.paymentIntentId
      };
    });
  }

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Tên khách hàng', width: 150 },
    { field: 'email', headerName: 'Email', width: 220 },
    {
      field: 'amount',
      headerName: 'Giá đơn',
      width: 110,
      renderCell: params => {
        return <div className='font-bold text-slate-800'>{params.row.amount}</div>;
      }
    },
    {
      field: 'orderStatus',
      headerName: 'Trạng thái',
      width: 150,
      renderCell: params => {
        const getStatusColor = (status: string) => {
          switch (status) {
            case OrderStatus.pending:
              return 'text-xs bg-purple-200 text-purple-700 border-purple-300';
            case OrderStatus.confirmed:
              return 'text-xs bg-blue-200 text-blue-700 border-blue-300';
            case OrderStatus.completed:
              return 'text-xs bg-green-200 text-green-700 border-green-300';
            case OrderStatus.canceled:
              return 'text-xs bg-red-200 text-red-700 border-red-300';
            default:
              return 'text-xs bg-gray-200 text-gray-700 border-gray-300';
          }
        };

        const getStatusLabel = (status: OrderStatus) => {
          switch (status) {
            case OrderStatus.pending:
              return 'Chờ xác nhận';
            case OrderStatus.confirmed:
              return 'Đang chuẩn bị';
            case OrderStatus.completed:
              return 'Hoàn thành';
            case OrderStatus.canceled:
              return 'Đã hủy';
            default:
              return 'Không xác định';
          }
        };

        // Lấy danh sách trạng thái hợp lệ có thể chuyển đến
        const validTransitions = getValidOrderStatusTransitions(params.row.orderStatus, params.row.deliveryStatus);

        // Nếu không có trạng thái nào có thể chuyển, chỉ hiển thị text
        if (validTransitions.length === 0) {
          return (
            <div className='flex justify-center items-center h-full'>
              <span
                className={`border rounded-md px-2 py-1 text-sm shadow-sm ${getStatusColor(params.row.orderStatus)}`}
              >
                {getStatusLabel(params.row.orderStatus)}
              </span>
            </div>
          );
        }

        return (
          <div className='flex justify-center items-center h-full'>
            <select
              value={params.row.orderStatus}
              onChange={event => handleUpdateOrderStatus(params.row.id, event.target.value)}
              className={`border rounded-md px-2 py-1 text-sm shadow-sm ${getStatusColor(params.row.orderStatus)}`}
            >
              {/* Trạng thái hiện tại */}
              <option value={params.row.orderStatus}>{getStatusLabel(params.row.orderStatus)}</option>

              {/* Các trạng thái có thể chuyển đến */}
              {validTransitions.map(status => (
                <option key={status} value={status}>
                  → {getStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>
        );
      }
    },
    {
      field: 'deliveryStatus',
      headerName: 'Giao hàng',
      width: 118,
      renderCell: params => {
        return (
          <div className='flex justify-center items-center h-full'>
            {params.row.deliveryStatus === DeliveryStatus.not_shipped ? (
              <Status text='Đang chờ' icon={MdAccessTimeFilled} bg='bg-slate-200' color='text-slate-700' />
            ) : params.row.deliveryStatus === DeliveryStatus.in_transit ? (
              <Status text='Đang giao hàng' icon={MdDeliveryDining} bg='bg-purple-200' color='text-purple-700' />
            ) : params.row.deliveryStatus === DeliveryStatus.delivered ? (
              <Status text='Giao thành công' icon={MdDone} bg='bg-green-200' color='text-green-700' />
            ) : (
              <></>
            )}
          </div>
        );
      }
    },
    {
      field: 'createdAt',
      headerName: 'Thời gian',
      width: 200,
      renderCell: params => {
        return <div>{formatDate(params.row.createdAt)}</div>;
      }
    },
    {
      field: 'action',
      headerName: '',
      width: 180,
      renderCell: params => {
        const canConfirm = canTransitionOrderStatus(
          params.row.status,
          OrderStatus.confirmed,
          params.row.deliveryStatus
        );

        const canCancel = canTransitionOrderStatus(params.row.status, OrderStatus.canceled, params.row.deliveryStatus);

        // Không hiển thị button nếu đơn hàng đã hoàn thành và đã giao
        const isCompleted =
          params.row.status === OrderStatus.completed && params.row.deliveryStatus === DeliveryStatus.delivered;

        return (
          <div className='flex items-center justify-center gap-4 h-full'>
            {/* Nút xác nhận - chỉ hiện khi có thể chuyển sang confirmed */}
            {canConfirm && !isCompleted && (
              <ActionBtn
                icon={MdDone}
                onClick={() => {
                  handleConfirmOrder(params.row.id);
                }}
              />
            )}

            {/* Nút hủy - chỉ hiện khi có thể hủy và chưa hoàn thành */}
            {canCancel && !isCompleted && (
              <ActionBtn
                icon={MdClose}
                onClick={() => {
                  setOrderToCancel(params.row);
                  setShowCancelDialog(true);
                }}
              />
            )}

            {/* Nút xem chi tiết - luôn hiển thị */}
            <ActionBtn
              icon={MdRemoveRedEye}
              onClick={() => {
                setSelectedOrder(params.row);
                params.row;
                toggleOpen();
              }}
            />
          </div>
        );
      }
    }
  ];

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const freshOrders = await response.json();
        setOrders(freshOrders);
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error('Error refreshing orders:', error);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrderStatus = (id: string, newStatus: any) => {
    // Tìm order hiện tại để validate
    const currentOrder = orders.find(order => order.id === id);
    if (!currentOrder) {
      toast.error('Không tìm thấy đơn hàng');
      return;
    }

    // Nếu chọn hủy đơn hàng, hiển thị dialog
    if (newStatus === OrderStatus.canceled) {
      setOrderToCancel(currentOrder);
      setShowCancelDialog(true);
      return;
    }

    // Kiểm tra xem có thể chuyển trạng thái không
    if (!canTransitionOrderStatus(currentOrder.status, newStatus, currentOrder.deliveryStatus)) {
      toast.error('Không thể chuyển sang trạng thái này');
      return;
    }

    axios
      .put(`/api/orders/${id}`, { status: newStatus })
      .then(() => {
        toast.success('Cập nhật đơn hàng thành công');
        handleRefresh(); // Sử dụng handleRefresh thay vì router.refresh
      })
      .catch(error => {
        toast.error('Có lỗi xảy ra khi cập nhật đơn hàng');
        console.error(error);
      });
  };

  const handleConfirmOrder = (id: string) => {
    // Tìm order hiện tại để validate
    const currentOrder = orders.find(order => order.id === id);
    if (!currentOrder) {
      toast.error('Không tìm thấy đơn hàng');
      return;
    }

    // Kiểm tra xem có thể xác nhận không
    if (!canTransitionOrderStatus(currentOrder.status, OrderStatus.confirmed, currentOrder.deliveryStatus)) {
      toast.error('Không thể xác nhận đơn hàng này');
      return;
    }

    axios
      .put(`/api/orders/${id}`, {
        status: OrderStatus.confirmed
      })
      .then(() => {
        toast.success('Đơn hàng đã được xác nhận');
        handleRefresh();
      })
      .catch(error => {
        toast.error('Có lỗi xảy ra khi xác nhận đơn hàng');
        console.error(error);
      });
  };

  const handleCancelOrder = async (id: string) => {
    // Tìm order hiện tại để validate
    const currentOrder = orders.find(order => order.id === id);
    if (!currentOrder) {
      toast.error('Không tìm thấy đơn hàng');
      return;
    }

    // Kiểm tra xem có thể hủy không
    if (!canTransitionOrderStatus(currentOrder.status, OrderStatus.canceled, currentOrder.deliveryStatus)) {
      toast.error('Không thể hủy đơn hàng này');
      return;
    }

    // TODO: Thêm modal để nhập lý do hủy (tham khảo KanbanBoard)
    const reason = prompt('Nhập lý do hủy đơn hàng:');
    if (!reason) {
      toast.error('Vui lòng nhập lý do hủy đơn hàng');
      return;
    }

    try {
      await axios.put(`/api/orders/${id}`, {
        status: OrderStatus.canceled,
        cancelReason: reason
      });

      toast.success('Đơn hàng đã được hủy');
      handleRefresh();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi hủy đơn hàng');
      console.error(error);
    }
  };

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      router.push('/login');
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return <NullData title='Từ chối đăng nhập' />;
  }
  return (
    <>
      <div className='w-full m-auto text-xl mt-6'>
        <div className='mb-4 mt-10 flex justify-between items-center'>
          <div></div>
          <div className='flex items-center gap-3'>
            <Link href='/admin/manage-orders/kanban'>
              <Button
                variant='outlined'
                startIcon={<MdViewKanban />}
                className='text-blue-600 border-blue-600 hover:bg-blue-50'
              >
                Xem Kanban
              </Button>
            </Link>
            {/* Add Order Button */}
            <Button
              variant='contained'
              startIcon={<MdAdd />}
              onClick={() => setIsAddOrderModalOpen(true)}
              size='medium'
              sx={{
                backgroundColor: '#10b981',
                '&:hover': { backgroundColor: '#059669' },
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
              }}
            >
              Thêm đơn hàng
            </Button>
            {/* Manual Refresh */}
            <Button
              variant='contained'
              startIcon={<MdRefresh />}
              onClick={handleRefresh}
              size='medium'
              sx={{
                backgroundColor: '#3b82f6',
                '&:hover': { backgroundColor: '#2563eb' },
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
              }}
            >
              {isLoading ? 'Đang tải...' : 'Làm mới'}
            </Button>
          </div>
        </div>
        {/* Custom Tabs Filter */}
        <div className='mb-6'>
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-3'>
            <div className='flex flex-wrap gap-3 justify-center'>
              {/* Tab Tất cả */}
              <button
                onClick={() => handleTabChange(null as any, 0)}
                className={`w-40 py-2 px-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-between transform hover:scale-105 ${
                  tabValue === 0
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : 'bg-gray-50 text-gray-600 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 hover:text-gray-800 hover:shadow-md'
                }`}
              >
                <span className='hidden sm:inline'>Tất cả</span>
                <span className='sm:hidden'>All</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold min-w-[24px] text-center ${
                    tabValue === 0 ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  {orders.length}
                </span>
              </button>

              {/* Tab Chờ xác nhận */}
              <button
                onClick={() => handleTabChange(null as any, 1)}
                className={`w-40 py-2 px-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-between transform hover:scale-105 ${
                  tabValue === 1
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 scale-105'
                    : 'bg-gray-50 text-gray-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:text-purple-600 hover:shadow-md'
                }`}
              >
                <span className='hidden sm:inline'>Chờ xác nhận</span>
                <span className='sm:hidden'>Pending</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold min-w-[24px] text-center ${
                    tabValue === 1 ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-600'
                  }`}
                >
                  {orders.filter(order => order.status === OrderStatus.pending).length}
                </span>
              </button>

              {/* Tab Đang chuẩn bị */}
              <button
                onClick={() => handleTabChange(null as any, 2)}
                className={`w-40 py-2 px-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-between transform hover:scale-105 ${
                  tabValue === 2
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : 'bg-gray-50 text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-600 hover:shadow-md'
                }`}
              >
                <span className='hidden sm:inline'>Đang chuẩn bị</span>
                <span className='sm:hidden'>Preparing</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold min-w-[24px] text-center ${
                    tabValue === 2 ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  {
                    orders.filter(
                      order =>
                        order.status === OrderStatus.confirmed &&
                        (!order.deliveryStatus || order.deliveryStatus === DeliveryStatus.not_shipped)
                    ).length
                  }
                </span>
              </button>

              {/* Tab Đang giao hàng */}
              <button
                onClick={() => handleTabChange(null as any, 3)}
                className={`w-40 py-2 px-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-between transform hover:scale-105 ${
                  tabValue === 3
                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/30 scale-105'
                    : 'bg-gray-50 text-gray-600 hover:bg-gradient-to-r hover:from-pink-50 hover:to-pink-100 hover:text-pink-600 hover:shadow-md'
                }`}
              >
                <span className='hidden sm:inline'>Đang giao hàng</span>
                <span className='sm:hidden'>Shipping</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold min-w-[24px] text-center ${
                    tabValue === 3 ? 'bg-white/20 text-white' : 'bg-pink-100 text-pink-600'
                  }`}
                >
                  {orders.filter(order => order.deliveryStatus === DeliveryStatus.in_transit).length}
                </span>
              </button>

              {/* Tab Hoàn thành */}
              <button
                onClick={() => handleTabChange(null as any, 4)}
                className={`w-40 py-2 px-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-between transform hover:scale-105 ${
                  tabValue === 4
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30 scale-105'
                    : 'bg-gray-50 text-gray-600 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:text-green-600 hover:shadow-md'
                }`}
              >
                <span className='hidden sm:inline'>Hoàn thành</span>
                <span className='sm:hidden'>Done</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold min-w-[24px] text-center ${
                    tabValue === 4 ? 'bg-white/20 text-white' : 'bg-green-100 text-green-600'
                  }`}
                >
                  {orders.filter(order => order.status === OrderStatus.completed).length}
                </span>
              </button>

              {/* Tab Hủy bỏ */}
              <button
                onClick={() => handleTabChange(null as any, 5)}
                className={`w-40 py-2 px-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-between transform hover:scale-105 ${
                  tabValue === 5
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 scale-105'
                    : 'bg-gray-50 text-gray-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:text-red-600 hover:shadow-md'
                }`}
              >
                <span className='hidden sm:inline'>Hủy bỏ</span>
                <span className='sm:hidden'>Cancelled</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold min-w-[24px] text-center ${
                    tabValue === 5 ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
                  }`}
                >
                  {orders.filter(order => order.status === OrderStatus.canceled).length}
                </span>
              </button>
            </div>
          </div>
        </div>
        <div className='h-[600px] w-full'>
          <DataGrid
            rows={rows}
            columns={columns}
            className='py-5'
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 }
              }
            }}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 }
              }
            }}
            pageSizeOptions={[10, 20, 30]}
            checkboxSelection
            disableRowSelectionOnClick
            disableColumnFilter
            disableDensitySelector
            disableColumnSelector
            sx={{
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #e5e7eb'
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f8fafc', // slate-50
                borderBottom: '1px solid #e2e8f0'
              },
              '& .MuiDataGrid-toolbarContainer': {
                flexDirection: 'row-reverse',
                padding: '15px'
              },
              '& .MuiDataGrid-columnHeaderRow': {
                backgroundColor: '#f6f7fb'
              }
            }}
          />
        </div>
      </div>
      {isOpen && selectedOrder && currentUser && (
        <AdminModal isOpen={isOpen} handleClose={toggleOpen}>
          <OrderDetails
            order={{
              ...selectedOrder,
              user: currentUser
            }}
            currentUser={currentUser}
            showCancelButton={false}
            onOrderCancelled={() => {
              toggleOpen();
            }}
          />
        </AdminModal>
      )}

      {/* Add Order Modal */}
      <AddOrderModal
        isOpen={isAddOrderModalOpen}
        toggleOpen={() => setIsAddOrderModalOpen(false)}
        users={users}
        products={products}
      />

      {/* Admin Cancel Order Dialog */}
      {showCancelDialog && orderToCancel && (
        <AdminCancelOrderDialog
          isOpen={showCancelDialog}
          onClose={() => {
            setShowCancelDialog(false);
            setOrderToCancel(null);
          }}
          orderId={orderToCancel.id}
          customerName={orderToCancel.name || 'N/A'}
          onSuccess={() => {
            setShowCancelDialog(false);
            setOrderToCancel(null);
            handleRefresh();
          }}
        />
      )}
    </>
  );
};

export default ManageOrdersClient;

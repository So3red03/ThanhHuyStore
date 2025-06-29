'use client';

import Status from '@/app/components/Status';
import ActionBtn from '@/app/components/ActionBtn';
import axios from 'axios';
import toast from 'react-hot-toast';
import AdminModal from '@/app/components/admin/AdminModal';
import { MdAccessTimeFilled, MdDeliveryDining, MdDone, MdRefresh, MdRemoveRedEye } from 'react-icons/md';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DeliveryStatus, Order, OrderStatus } from '@prisma/client';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { formatPrice } from '../../../../../utils/formatPrice';
import 'moment/locale/vi';
import { SafeUser } from '../../../../../types';
import OrderDetails from '@/app/components/OrderDetails';
import NullData from '@/app/components/NullData';
import { FaRegFaceFrown } from 'react-icons/fa6';
import { FaCheckDouble, FaRegCalendarAlt } from 'react-icons/fa';
import { MdViewKanban } from 'react-icons/md';
import { Button } from '@mui/material';
import Link from 'next/link';
import { formatDate } from '@/app/(home)/account/orders/OrdersClient';

interface ManageOrdersClientProps {
  orders: Order[];
  currentUser: SafeUser | null | undefined;
}

// Custom tabs - no longer using MUI styled components

const ManageOrdersClient: React.FC<ManageOrdersClientProps> = ({ orders: initialOrders, currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState(initialOrders);
  const [filteredOrders, setFilteredOrders] = useState(initialOrders);
  const [tabValue, setTabValue] = useState(0);

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
        paymentStatus: order.status,
        paymentMethod: order.paymentMethod,
        deliveryStatus: order.deliveryStatus,
        products: order.products,
        date: order.createDate,
        address: order.address,
        phoneNumber: order.phoneNumber,
        createDate: order.createDate,
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
      field: 'paymentStatus',
      headerName: 'Thanh toán',
      width: 150,
      renderCell: params => {
        const getStatusColor = (status: string) => {
          switch (status) {
            case OrderStatus.pending:
              return 'text-xs bg-purple-200 text-purple-700 border-purple-300';
            case OrderStatus.confirmed:
              return 'text-xs bg-orange-200 text-orange-700 border-orange-300';
            case OrderStatus.completed:
              return 'text-xs bg-green-200 text-green-700 border-green-300';
            case OrderStatus.canceled:
              return 'text-xs bg-red-200 text-red-700 border-red-300';
            default:
              return 'text-xs bg-gray-200 text-gray-700 border-gray-300';
          }
        };

        return (
          <div className='flex justify-center items-center h-full'>
            <select
              value={params.row.paymentStatus}
              onChange={event => handleUpdateOrderStatus(params.row.id, event.target.value)}
              className={`border rounded-md px-2 py-1 text-sm shadow-sm ${getStatusColor(params.row.paymentStatus)}`}
            >
              <option value={OrderStatus.pending}>Chờ thanh toán</option>
              <option value={OrderStatus.confirmed}>Đã thanh toán</option>
              <option value={OrderStatus.completed}>Hoàn thành</option>
              <option value={OrderStatus.canceled}>Đã hủy</option>
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
    { field: 'date', headerName: 'Thời gian', width: 200 },
    {
      field: 'action',
      headerName: '',
      width: 180,
      renderCell: params => {
        return (
          <div className='flex items-center justify-center gap-4 h-full'>
            <ActionBtn
              icon={MdDeliveryDining}
              onClick={() => {
                handleDispatch(params.row.id);
              }}
            />
            <ActionBtn
              icon={MdDone}
              onClick={() => {
                handleDeliver(params.row.id);
              }}
            />
            <ActionBtn
              icon={MdRemoveRedEye}
              onClick={() => {
                setSelectedOrder(params.row);
                console.log(params.row);
                toggleOpen();
              }}
            />
          </div>
        );
      }
    }
  ];

  const handleRefresh = async () => {
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
    }
  };

  const handleUpdateOrderStatus = (id: string, newStatus: any) => {
    axios
      .put(`/api/order/${id}`, { status: newStatus })
      .then(() => {
        toast.success('Cập nhật đơn hàng thành công');
        router.refresh(); // Làm mới dữ liệu trong bảng
      })
      .catch(error => {
        toast.error('Có lỗi xảy ra khi cập nhật đơn hàng');
        console.error(error);
      });
  };

  const handleDispatch = (id: string) => {
    axios
      .put('/api/order', {
        id,
        deliveryStatus: DeliveryStatus.in_transit
      })
      .then(() => {
        toast.success('Đơn hàng đã được gửi đi');
        router.refresh();
      })
      .catch(error => {
        toast.error('Có lỗi xảy ra khi gửi đơn hàng');
        console.error(error);
      });
  };

  const handleDeliver = async (id: string) => {
    try {
      await Promise.all([
        axios.put(`/api/order/${id}`, { status: OrderStatus.completed }),
        axios.put('/api/order', { id, deliveryStatus: DeliveryStatus.delivered })
      ]);

      toast.success('Cập nhật và giao hàng thành công');
      router.refresh(); // Làm mới dữ liệu trong bảng
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật đơn hàng hoặc giao hàng');
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
      <div className='w-[78.5vw] m-auto text-xl mt-6'>
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
              Làm mới
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
    </>
  );
};

export default ManageOrdersClient;

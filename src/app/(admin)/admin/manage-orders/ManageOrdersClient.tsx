'use client';

import Status from '@/app/components/Status';
import ActionBtn from '@/app/components/ActionBtn';
import axios from 'axios';
import toast from 'react-hot-toast';
import AdminModal from '@/app/components/admin/AdminModal';
import { MdAccessTimeFilled, MdDeliveryDining, MdDone, MdRemoveRedEye } from 'react-icons/md';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DeliveryStatus, Order, OrderStatus } from '@prisma/client';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { formatPrice } from '../../../../../utils/formatPrice';
import 'moment/locale/vi';
import { SafeUser } from '../../../../../types';
import Image from 'next/image';
import NullData from '@/app/components/NullData';
import { formatDate } from '@/app/(home)/account/orders/OrdersClient';
import { FaRegFaceFrown } from 'react-icons/fa6';
import { FaCheckDouble, FaRegCalendarAlt } from 'react-icons/fa';
import { MdViewKanban } from 'react-icons/md';
import { Button } from '@mui/material';
import Link from 'next/link';

interface ManageOrdersClientProps {
  orders: Order[];
  currentUser: SafeUser | null | undefined;
}

const ManageOrdersClient: React.FC<ManageOrdersClientProps> = ({ orders, currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const router = useRouter();

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  let rows: any = [];
  if (orders) {
    rows = orders.map((order: any) => {
      return {
        id: order.id,
        name: order.user.name,
        email: order.user.email,
        status: order.status,
        amount: formatPrice(order.amount),
        paymentStatus: order.status,
        paymentMethod: order.paymentMethod,
        deliveryStatus: order.deliveryStatus,
        products: order.products,
        date: formatDate(order.createDate),
        address: order.address,
        phoneNumber: order.phoneNumber,
        createDate: formatDate(order.createDate)
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
                toggleOpen();
              }}
            />
          </div>
        );
      }
    }
  ];

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

  const successOrders = orders?.filter(
    order => order.deliveryStatus === DeliveryStatus.delivered && order.status === OrderStatus.completed
  ).length;
  const pendingOrders = orders?.filter(order => order.status === OrderStatus.pending).length;
  const canceledOrders = orders?.filter(order => order.status === OrderStatus.canceled).length;
  const confirmedOrders = orders?.filter(order => order.status === OrderStatus.confirmed).length;
  const stats = [
    {
      count: `${pendingOrders}`,
      description: 'Thanh toán đang chờ',
      icon: <FaRegCalendarAlt className='text-2xl text-gray-600' />
    },
    {
      count: `${confirmedOrders}`,
      description: 'Đã xác nhận',
      icon: <FaCheckDouble className='text-2xl text-gray-600' />
    },
    {
      count: `${successOrders}`,
      description: 'Hoàn thành',
      icon: <FaCheckDouble className='text-2xl text-gray-600' />
    },
    {
      count: `${canceledOrders}`,
      description: 'Thất bại',
      icon: <FaRegFaceFrown className='text-2xl text-gray-600' />
    }
  ];

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
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-3 pr-0 border border-r-0 border-gray-200 rounded-lg'>
          {stats.map((stat, index) => (
            <div
              key={index}
              className='bg-white p-4 border-r border-r-gray-200 border-b border-b-gray-200 md:border-b-0'
            >
              <div className='flex justify-between'>
                <div className='flex flex-col gap-y-2'>
                  <div className='text-2xl'>{stat.count}</div>
                  <p className='text-gray-500 text-[15px]'>{stat.description}</p>
                </div>
                <div className='flex items-center justify-center h-12 w-12 rounded-md bg-gray-100 text-slate-700'>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className='mb-4 mt-5 flex justify-between items-center'>
          <h2 className='text-xl font-semibold'>Danh sách đơn hàng</h2>
          <Link href='/admin/manage-orders/kanban'>
            <Button
              variant='outlined'
              startIcon={<MdViewKanban />}
              className='text-blue-600 border-blue-600 hover:bg-blue-50'
            >
              Xem Kanban
            </Button>
          </Link>
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
              '& .MuiDataGrid-toolbarContainer': {
                flexDirection: 'row-reverse',
                padding: '15px'
              },
              '& .css-yrdy0g-MuiDataGrid-columnHeaderRow': {
                backgroundColor: '#F6F7FB !important'
              }
            }}
          />
        </div>
      </div>
      {isOpen && (
        <AdminModal isOpen={isOpen} handleClose={toggleOpen}>
          <div className='max-w-4xl mx-auto p-3'>
            {/* Header */}
            <h1 className='text-2xl font-semibold mb-4'>Chi tiết đơn hàng</h1>
            <p className='text-gray-700 mb-6'>Xin chào, {currentUser?.name}</p>
            <p className='text-gray-700 mb-8'>
              {selectedOrder?.status === 'pending'
                ? 'Đơn hàng chưa được thanh toán'
                : selectedOrder?.status === 'confirmed'
                ? 'Đơn hàng đã được xác nhận'
                : selectedOrder?.status === 'canceled'
                ? 'Đơn hàng đã bị hủy'
                : 'Đơn hàng hoàn thành'}
            </p>

            {/* Order Info */}
            <div className='grid grid-cols-4 gap-4 border-b pb-4 mb-8'>
              <div className='border-r border-gray-300'>
                <h2 className='font-semibold'>Đơn hàng đã đặt</h2>
                <p>{selectedOrder?.createDate}</p>
              </div>
              <div className='border-r border-gray-300'>
                <h2 className='font-semibold'>Tình trạng đặt hàng</h2>
                <p>
                  {selectedOrder?.deliveryStatus === 'not_shipped'
                    ? 'Đang chờ'
                    : selectedOrder?.deliveryStatus === 'in_transit'
                    ? 'Đang vận chuyển'
                    : selectedOrder?.deliveryStatus === 'delivered'
                    ? 'Đã giao'
                    : 'Đã hoàn trả'}
                </p>
              </div>
              <div className='border-r border-gray-300'>
                <h2 className='font-semibold'>Trạng thái thanh toán</h2>
                <p>
                  {selectedOrder?.status === 'pending'
                    ? 'Chưa thanh toán'
                    : selectedOrder?.status === 'confirmed'
                    ? 'Đã thanh toán'
                    : selectedOrder?.status === 'canceled'
                    ? 'Đã hủy'
                    : 'Đã thanh toán'}
                </p>
              </div>
              <div>
                <h2 className='font-semibold'>Phương thức thanh toán</h2>
                <p>
                  {selectedOrder?.paymentMethod === 'momo' ? (
                    <Image src='/momo.png' alt='momo' width={24} height={24} />
                  ) : selectedOrder?.paymentMethod === 'stripe' ? (
                    <Image src='/stripe-v2-svgrepo-com.svg' alt='stripe' width={24} height={24} />
                  ) : (
                    <div className='flex items-center gap-2'>
                      <Image
                        src='https://file.hstatic.net/200000636033/file/pay_2d752907ae604f08ad89868b2a5554da.png'
                        alt='cod'
                        width={24}
                        height={24}
                      />
                      <span className='text-[16px]'>(COD)</span>
                    </div>
                  )}
                </p>
              </div>
            </div>

            {/* Products List */}
            {selectedOrder?.products.map((item: any) => {
              return (
                <div className='flex items-center justify-between mb-5' key={item.id}>
                  <div className='flex items-center space-x-4'>
                    <Image src={item.selectedImg.images[0]} width={80} height={80} alt={item.name} />
                    <div>
                      <h3 className='font-semibold'>{item.name}</h3>
                      <p className='text-gray-500'>{item.selectedImg.color}</p>
                    </div>
                  </div>
                  <p className='font-semibold'>{formatPrice(item.price * item.quantity)}</p>
                </div>
              );
            })}

            {/* Order Summary */}
            <div className='border-t pt-4 mt-8'>
              <div className='flex justify-between'>
                <p>Tạm tính ({selectedOrder?.products.length} sản phẩm)</p>
                <p>{selectedOrder?.amount}</p>
              </div>
              <div className='flex justify-between'>
                <p>Phí ship</p>
                <p>{formatPrice(0)}</p>
              </div>
              <div className='flex justify-between'>
                <p>Thuế</p>
                <p>{formatPrice(0)}</p>
              </div>
              <div className='flex justify-between'>
                <p>Giảm giá</p>
                <p>{formatPrice(0)}</p>
              </div>
              <div className='flex justify-between font-semibold text-lg mt-4'>
                <p>Tổng</p>
                <p>{selectedOrder?.amount}</p>
              </div>
            </div>

            {/* Shipping Address */}
            <div className='border-t py-4 mt-8'>
              <h2 className='font-semibold mb-2'>Địa chỉ giao hàng</h2>
              <p className='text-gray-700'>Số điện thoại: {selectedOrder?.phoneNumber}</p>
              <p className='text-gray-700'>
                Địa chỉ: {`${selectedOrder?.address?.line1 || ''} ${selectedOrder?.address?.city || ''}`}
              </p>
            </div>
          </div>
        </AdminModal>
      )}
    </>
  );
};

export default ManageOrdersClient;

'use client';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { CartProductType, DeliveryStatus, OrderStatus, Role } from '@prisma/client';
import { formatPrice } from '../../../../../../../utils/formatPrice';
import Status from '@/app/components/Status';
import {
  MdAccessTimeFilled,
  MdDelete,
  MdDeliveryDining,
  MdDone,
  MdRemoveRedEye,
  MdBlock,
  MdLockOpen
} from 'react-icons/md';
import ActionBtn from '@/app/components/ActionBtn';
import { FaDollarSign } from 'react-icons/fa';
import { FaBagShopping, FaCartShopping } from 'react-icons/fa6';
import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import AdminModal from '@/app/components/admin/AdminModal';
import BlockUserModal from '@/app/components/admin/BlockUserModal';
import FormWarp from '@/app/components/FormWrap';
import Input from '@/app/components/inputs/Input';
import Button from '@/app/components/Button';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import Heading from '@/app/components/Heading';
import Image from 'next/image';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import ActivityTimeline from '@/app/components/admin/ActivityTimeline';
import { useUserActivities } from '@/app/components/admin/useUserActivities';
import OrderDetails from '@/app/components/OrderDetails';
import { SafeUser } from '../../../../../../../types';

const formatDate = (date: any) => {
  if (!date) return 'N/A';
  try {
    return format(new Date(date), "dd 'tháng' M yyyy '|' HH:mm:ss", { locale: vi });
  } catch (error) {
    return 'Invalid date';
  }
};

interface UserDetailsClientProps {
  user: any; // Simplified to avoid type conflicts with serialized data
}

const UserDetailsClient: React.FC<UserDetailsClientProps> = ({ user }) => {
  // All hooks must be called before any early returns
  const { activities, loading } = useUserActivities({ user });
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<FieldValues>();
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdatedModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);

  // Early return nếu không có user
  if (!user) {
    return (
      <div className='flex items-center justify-center h-full p-8'>
        <p className='text-gray-500'>Không tìm thấy thông tin user</p>
      </div>
    );
  }

  const total = user.orders
    .filter((order: any) => order.status === OrderStatus.completed && order.deliveryStatus === DeliveryStatus.delivered)
    .reduce((accumulator: number, currentValue: any) => accumulator + currentValue.amount, 0);
  let rows: any = [];
  if (user.orders) {
    rows = user.orders.map((invoice: any) => {
      return {
        id: invoice.id,
        name: invoice.name,
        status: invoice.status,
        amount: formatPrice(invoice.amount),
        paymentStatus: invoice.status,
        paymentMethod: invoice.paymentMethod,
        deliveryStatus: invoice.deliveryStatus,
        products: invoice.products,
        address: invoice.address,
        phoneNumber: invoice.phoneNumber,
        createDate: formatDate(invoice.createdAt)
      };
    });
  }

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'Hóa đơn',
      width: 100
    },
    {
      field: 'amount',
      headerName: 'Tổng tiền',
      width: 110
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
    { field: 'createDate', headerName: 'Ngày tạo', width: 200 },
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
      .put(`/api/orders/${id}`, { status: newStatus })
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
      .put('/api/orders', {
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
        axios.put(`/api/orders/${id}`, { status: OrderStatus.completed }),
        axios.put('/api/orders', { id, deliveryStatus: DeliveryStatus.delivered })
      ]);

      toast.success('Cập nhật và giao hàng thành công');
      router.refresh(); // Làm mới dữ liệu trong bảng
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật đơn hàng hoặc giao hàng');
      console.error(error);
    }
  };

  const toggleUpdateModalOpen = () => {
    setIsUpdateModalOpen(!isUpdatedModalOpen);
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const toggleDelete = () => {
    setIsDelete(!isDelete);
  };

  // Hàm cập nhật giá trị id, value: label
  const setCustomValue = (id: string, value: any) => {
    setValue(id, value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  const handleOpenUpdateModal = (user: any) => {
    setSelectedUser(user);
    // Cập nhật giá trị lên defaultValues
    const fieldsToSet = ['name', 'email', 'role'];
    fieldsToSet.forEach(field => setCustomValue(field, user[field]));

    toggleUpdateModalOpen();
  };

  // Xác nhận xóa
  const handleConfirmDelete = async () => {
    if (selectedUser) {
      await handleDelete(selectedUser.id);
    }
    toggleDelete();
  };

  const handleDelete = async (id: string) => {
    toast('Đang xóa tài khoản, xin chờ...');

    axios
      .delete(`/api/user/${id}`)
      .then(() => {
        toast.success('Xóa tài khoản thành công');
        router.push('/admin/manage-users');
      })
      .catch(error => {
        toast.error('Có lỗi xảy ra khi xóa');
        console.error(error);
      });
  };

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    setIsLoading(true);

    axios
      .put(`/api/user/${data.id}`, {
        name: data.name,
        email: data.email,
        newPassword: data.newPassword,
        role: data.role
      })
      .then(() => {
        toggleOpen();
        toast.success('Lưu thông tin thành công');
        router.refresh();
      })
      .catch(error => {
        toast.error('Có lỗi xảy ra khi cập nhật thông tin');
        setIsLoading(false);
        console.error(error);
      })
      .finally(() => {
        setIsLoading(false);
        toggleOpen();
        setValue('newPassword', '');
      });
  };

  const roles = [
    { label: 'ADMIN', value: Role.ADMIN },
    { label: 'USER', value: Role.USER }
  ];

  // Handle block success
  const handleBlockSuccess = () => {
    setBlockModalOpen(false);
    router.refresh(); // Refresh to show updated status
  };

  return (
    <>
      <div className='flex justify-between items-center flex-wrap gap-y-4 mb-6 mt-6 px-6 lg:px-0'>
        <div>
          <h4 className='text-2xl'> ID tài khoản {user.id}</h4>
          <p className='text-gray-500 mb-0'>{formatDate(user.createAt)}</p>
        </div>
        <div className='flex gap-3'>
          {/* Block/Unblock Button */}
          <button
            type='button'
            className={`border rounded-lg px-[18px] py-2 transition-colors duration-200 ${
              user.isBlocked
                ? 'border-green-500 hover:bg-green-50 text-green-600'
                : 'border-orange-500 hover:bg-orange-50 text-orange-600'
            }`}
            onClick={() => setBlockModalOpen(true)}
          >
            <span className='whitespace-nowrap text-base font-semibold flex items-center gap-2'>
              {user.isBlocked ? (
                <>
                  <MdLockOpen size={16} />
                  Mở khóa tài khoản
                </>
              ) : (
                <>
                  <MdBlock size={16} />
                  Khóa tài khoản
                </>
              )}
            </span>
          </button>

          {/* Delete Button */}
          <button
            type='button'
            className='border border-[#ff4c51] rounded-lg px-[18px] py-2 hover:bg-red-100'
            onClick={() => {
              setSelectedUser(user);
              toggleDelete();
            }}
          >
            <span className='whitespace-nowrap text-[#ff4c51] text-base font-semibold flex items-center gap-2'>
              <MdDelete size={16} />
              Xóa tài khoản
            </span>
          </button>
        </div>
      </div>
      <div className='w-full flex md:flex-row flex-col justify-center gap-6 mt-3 px-6 lg:px-0'>
        <div className='md:w-1/3 w-full'>
          <div className='flex flex-col items-center'>
            <div className='bg-white p-6 w-full border border-neutral-200 rounded'>
              <div className='text-center pt-12 pb-6'>
                <div className='w-28 h-w-28 rounded-lg overflow-hidden mx-auto'>
                  <img className='w-full h-full object-cover' src='/dog-meme.png' alt='User Avatar' loading='lazy' />
                </div>
                <h5 className='text-xl font-medium mt-4 mb-3'>{user.name}</h5>

                {/* Role Badge */}
                <div className='flex flex-col gap-2 items-center'>
                  {user.role === 'ADMIN' ? (
                    <span className='bg-red-200 text-rose-500 text-xs font-semibold px-2 py-1 rounded-full'>ADMIN</span>
                  ) : (
                    <span className='bg-green-200 text-green-500 text-xs font-semibold px-2 py-1 rounded-full'>
                      USER
                    </span>
                  )}

                  {/* Account Status Badge */}
                  {user.isBlocked ? (
                    <span className='bg-red-100 text-red-600 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1'>
                      <MdBlock size={12} />
                      Đã khóa
                    </span>
                  ) : (
                    <span className='bg-green-100 text-green-600 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1'>
                      <MdLockOpen size={12} />
                      Hoạt động
                    </span>
                  )}
                </div>
              </div>
              <div className='flex lg:justify-center justify-stretch flex-wrap gap-6 pb-6'>
                <div className='flex items-center 4xl:me-8'>
                  {/* <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center mr-4">
										<i className="ri-check-line text-2xl"  />
									</div> */}
                  <div className='bg-blue-100 text-blue-600 rounded-md w-11 h-11 flex items-center justify-center mr-4'>
                    <FaCartShopping className='text-2xl text-blue-500' />
                  </div>
                  <div>
                    <h6 className='text-lg'>{user.orders.length}</h6>
                    <span>Đơn hàng</span>
                  </div>
                </div>
                <div className='flex items-center 5xl:me-4'>
                  <div className='bg-blue-100 text-blue-600 rounded-md w-11 h-11 flex items-center justify-center mr-4'>
                    <FaDollarSign className='text-2xl text-blue-500' />
                  </div>
                  <div>
                    <h6 className='text-lg'>{formatPrice(total)}</h6>
                    <span>Đã chi</span>
                  </div>
                </div>
              </div>
              <div className='pb-6'>
                <h5 className='text-lg'>Chi tiết</h5>
                <hr className='my-4' />
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span className='font-medium'>Tài khoản</span>
                    <span className='text-gray-700 text-sm'>{user.email}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='font-medium'>Email</span>
                    <span className='text-gray-700 text-sm'>{user.email}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='font-medium'>Trạng thái</span>
                    <span className='bg-green-200 text-green-500 font-semibold  text-xs px-2 py-1 rounded-full'>
                      Hoạt động
                    </span>
                  </div>

                  <div className='flex justify-between'>
                    <span className='font-medium'>Liên hệ</span>
                    <span className='text-gray-700'>{user.phoneNumber || 'Chưa có'}</span>
                  </div>

                  <div className='flex justify-between'>
                    <span className='font-medium'>Quốc tịch</span>
                    <span className='text-gray-700'>Việt Nam</span>
                  </div>

                  <div className='flex justify-between'>
                    <span className='font-medium'>Lần cuối đăng nhập</span>
                    <span className='text-gray-700 text-sm'>
                      {user.lastLogin ? formatDate(user.lastLogin) : 'Chưa có'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                className='bg-[#16B1FF] text-white font-semibold py-1 px-3 w-full rounded mr-4 hover:opacity-80'
                onClick={() => {
                  handleOpenUpdateModal(user);
                }}
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
        <div className='md:w-2/3 w-full'>
          {loading ? (
            <div className='bg-white p-6 rounded border border-neutral-200 text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
              <p>Đang tải lịch sử hoạt động...</p>
            </div>
          ) : (
            <ActivityTimeline
              activities={activities}
              userName={user.name || 'Unknown User'}
              showDateFilter={true}
              showActivityCount={true}
            />
          )}
          <div className='h-[600px] mt-5'>
            <DataGrid
              rows={rows}
              columns={columns}
              className='py-5'
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 }
                }
              }}
              slots={{ toolbar: CustomToolbar }}
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
      </div>
      {selectedUser && (
        <AdminModal isOpen={isUpdatedModalOpen} handleClose={toggleUpdateModalOpen}>
          <FormWarp custom='!pt-8'>
            <Heading title='Cập nhật thông tin' center>
              <></>
            </Heading>
            <Input
              id='name'
              label='Tên người dùng'
              disabled={isLoading}
              register={register}
              errors={errors}
              defaultValue={selectedUser?.name}
              required
            />
            <Input
              id='email'
              label='Email người dùng'
              disabled={isLoading}
              register={register}
              errors={errors}
              defaultValue={selectedUser?.email}
              required
            />
            <Input
              id='newPassword'
              label='Mật khẩu mới'
              disabled={isLoading}
              register={register}
              errors={errors}
              required
            />
            <Input
              id='role'
              label='Role'
              disabled={isLoading}
              type='combobox'
              register={register}
              errors={errors}
              defaultValue={selectedUser?.role}
              options={roles}
              required
            />

            <Button label='Lưu thông tin' onClick={handleSubmit(onSubmit)} isLoading={isLoading} />
          </FormWarp>
        </AdminModal>
      )}
      {isDelete && <ConfirmDialog isOpen={isDelete} handleClose={toggleDelete} onConfirm={handleConfirmDelete} />}
      {isOpen && selectedOrder && (
        <AdminModal isOpen={isOpen} handleClose={toggleOpen}>
          <OrderDetails
            order={{
              ...selectedOrder,
              user: {
                ...user,
                createAt: user.createAt,
                updateAt: user.updateAt,
                emailVerified: user.emailVerified?.toString() || null,
                lastLogin: user.lastLogin || null
              } as unknown as SafeUser
            }}
            currentUser={
              {
                ...user,
                createAt: user.createAt,
                updateAt: user.updateAt,
                emailVerified: user.emailVerified?.toString() || null,
                lastLogin: user.lastLogin || null
              } as unknown as SafeUser
            }
            showCancelButton={false}
            onOrderCancelled={() => {
              toggleOpen();
            }}
          />
        </AdminModal>
      )}

      {/* Block/Unblock User Modal */}
      <BlockUserModal
        open={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        user={user}
        onSuccess={handleBlockSuccess}
      />
    </>
  );
};
function CustomToolbar(props: any) {
  return (
    <div className='flex flex-col justify-stretch items-center w-full'>
      <h2 className='text-lg font-semibold w-full px-[15px] text-slate-700'>Đơn hàng đã đặt</h2>
      <div className='w-full'>
        <GridToolbar {...props} />
      </div>
    </div>
  );
}
export default UserDetailsClient;

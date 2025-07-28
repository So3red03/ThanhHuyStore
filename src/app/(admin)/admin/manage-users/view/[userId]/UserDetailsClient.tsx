'use client';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { CartProductType, DeliveryStatus, OrderStatus, Role } from '@prisma/client';
import { formatPrice } from '../../../../../../../utils/formatPrice';
import Link from 'next/link';
import Status from '@/app/components/Status';
import {
  MdAccessTimeFilled,
  MdDelete,
  MdDeliveryDining,
  MdDone,
  MdRemoveRedEye,
  MdBlock,
  MdLockOpen,
  MdSearch,
  MdStar,
  MdStarBorder
} from 'react-icons/md';
import ActionBtn from '@/app/components/ActionBtn';
import { FaDollarSign, FaTicketAlt, FaGift } from 'react-icons/fa';
import { FaBagShopping, FaCartShopping } from 'react-icons/fa6';
import { useState, useEffect } from 'react';
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
import { useUserActivities } from '@/app/hooks/useUserActivities';
import OrderDetails from '@/app/components/OrderDetails';
import { SafeUser } from '../../../../../../../types';
import { slugConvert } from '../../../../../../../utils/Slug';
import AddUserModal from '../../AddUserModal';

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

  // New state for search and tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'vouchers' | 'reviews' | 'activities'>('orders');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [customerSegment, setCustomerSegment] = useState<any>(null);
  const [loadingSegment, setLoadingSegment] = useState(false);

  // Function to determine customer segment
  const determineCustomerSegment = (customerData: any) => {
    if (!customerData || customerData.role !== 'USER') return null;

    const totalSpent = customerData.totalSpent || 0;
    const orderCount = customerData.totalOrders || 0;
    const lastOrderDate = customerData.lastOrderDate ? new Date(customerData.lastOrderDate) : null;
    const daysSinceLastOrder = lastOrderDate
      ? Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    if (totalSpent > 5000000 && orderCount >= 3 && (daysSinceLastOrder === null || daysSinceLastOrder <= 60)) {
      return {
        id: 'vip_customers',
        name: 'VIP',
        color: '#9c27b0',
        description: 'Chi tiêu > 5M, đặt hàng thường xuyên'
      };
    } else if (orderCount <= 2 && (daysSinceLastOrder === null || daysSinceLastOrder <= 30)) {
      return {
        id: 'new_customers',
        name: 'Mới',
        color: '#4caf50',
        description: 'Đăng ký gần đây, ít đơn hàng'
      };
    } else if (daysSinceLastOrder !== null && daysSinceLastOrder >= 90 && orderCount >= 1) {
      return {
        id: 'at_risk_customers',
        name: 'Có nguy cơ rời bỏ',
        color: '#f44336',
        description: 'Không mua hàng trong 90 ngày'
      };
    }

    return null;
  };

  // Fetch customer segment for USER role
  useEffect(() => {
    const fetchCustomerSegment = async () => {
      if (user && user.role === 'USER') {
        setLoadingSegment(true);
        try {
          const response = await axios.get(`/api/analytics/customer-detail?userId=${user.id}`);
          if (response.data.success) {
            const segment = determineCustomerSegment(response.data.data.user);
            setCustomerSegment(segment);
          }
        } catch (error) {
          console.error('Error fetching customer segment:', error);
        } finally {
          setLoadingSegment(false);
        }
      }
    };

    fetchCustomerSegment();
  }, [user]);

  // Search functionality
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/admin/users');
        setAllUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const filtered = allUsers.filter(
        u =>
          u.name?.toLowerCase().includes(query.toLowerCase()) ||
          u.email?.toLowerCase().includes(query.toLowerCase()) ||
          u.id?.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

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
            {/* Search Bar */}
            <div className='bg-white p-4 w-full border border-neutral-200 rounded mb-4'>
              <div className='relative'>
                <input
                  type='text'
                  placeholder='Tìm kiếm tài khoản...'
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  onChange={e => handleSearch(e.target.value)}
                />
                <MdSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' size={20} />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className='mt-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg'>
                  {searchResults.slice(0, 5).map(searchUser => (
                    <div
                      key={searchUser.id}
                      className='p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0'
                      onClick={() => router.push(`/admin/manage-users/view/${searchUser.id}`)}
                    >
                      <div className='flex items-center gap-3'>
                        <div className='w-8 h-8 rounded-full overflow-hidden bg-gray-200'>
                          <img
                            src={searchUser.image || '/no-avatar-2.jpg'}
                            alt='Avatar'
                            className='w-full h-full object-cover'
                          />
                        </div>
                        <div className='flex-1'>
                          <p className='font-medium text-sm'>{searchUser.name}</p>
                          <p className='text-xs text-gray-500'>{searchUser.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isSearching && (
                <div className='mt-3 text-center text-gray-500'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto'></div>
                </div>
              )}
            </div>

            <div className='bg-white p-6 w-full border border-neutral-200 rounded'>
              <div className='text-center pt-12 pb-6'>
                <div className='w-28 h-w-28 rounded-full overflow-hidden mx-auto'>
                  <img
                    className='w-full h-full object-cover'
                    src={user.image || '/no-avatar-2.jpg'}
                    alt='User Avatar'
                    loading='lazy'
                  />
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
                  {/* Customer Segment Badge - Only for USER role */}
                  {user.role === 'USER' && (
                    <div className='mt-2'>
                      {loadingSegment ? (
                        <div className='flex items-center gap-2'>
                          <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500'></div>
                          <span className='text-xs text-gray-500'>Đang tải phân khúc...</span>
                        </div>
                      ) : customerSegment ? (
                        <span
                          className='text-xs font-semibold px-3 py-1 rounded-full text-white'
                          style={{ backgroundColor: customerSegment.color }}
                        >
                          {customerSegment.name}
                        </span>
                      ) : (
                        <span className='bg-gray-200 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full'>
                          Khách hàng thường
                        </span>
                      )}
                    </div>
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

                  <div className='flex justify-between'>
                    <span className='font-medium'>Liên hệ</span>
                    <span className='text-gray-700'>{user.phoneNumber || 'Chưa có'}</span>
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
          <div className='bg-white border border-neutral-200 rounded'>
            {/* Tab Navigation */}
            <div className='border-b border-gray-200'>
              <nav className='flex space-x-8 px-6 py-4'>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-2 pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'orders'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FaCartShopping size={16} />
                  Hóa đơn
                  <span className='bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full'>
                    {user.orders?.length || 0}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('vouchers')}
                  className={`flex items-center gap-2 pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'vouchers'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FaTicketAlt size={16} />
                  Voucher
                  <span className='bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full'>
                    {user.userVouchers?.filter((uv: any) => uv.usedAt).length || 0}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`flex items-center gap-2 pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'reviews'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <MdStar size={16} />
                  Đánh giá
                  <span className='bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full'>
                    {user.reviews?.length || 0}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('activities')}
                  className={`flex items-center gap-2 pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'activities'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <MdAccessTimeFilled size={16} />
                  Hoạt động
                  <span className='bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded-full'>
                    {activities?.length || 0}
                  </span>
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className='p-6'>
              {activeTab === 'orders' && (
                <div className='h-[700px]'>
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
                      border: '1px solid #e5e7eb',
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
              )}

              {activeTab === 'vouchers' && <VoucherTab userVouchers={user.userVouchers || []} />}

              {activeTab === 'reviews' && <ReviewsTab reviews={user.reviews || []} />}

              {activeTab === 'activities' && (
                <div className='min-h-[400px]'>
                  {loading ? (
                    <div className='text-center py-12'>
                      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
                      <p className='text-gray-500'>Đang tải lịch sử hoạt động...</p>
                    </div>
                  ) : (
                    <ActivityTimeline
                      activities={activities}
                      userName={user.name || 'Unknown User'}
                      showDateFilter={true}
                      showActivityCount={true}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {selectedUser && (
        <AddUserModal
          open={isUpdatedModalOpen}
          onClose={toggleUpdateModalOpen}
          editData={selectedUser}
          onUserAdded={() => {
            toggleUpdateModalOpen();
            router.refresh();
          }}
        />
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
// Voucher Tab Component
const VoucherTab: React.FC<{ userVouchers: any[] }> = ({ userVouchers }) => {
  const usedVouchers = userVouchers.filter(uv => uv.usedAt);

  if (usedVouchers.length === 0) {
    return (
      <div className='text-center py-12'>
        <FaGift className='mx-auto text-gray-300 mb-4' size={48} />
        <p className='text-gray-500'>Chưa sử dụng voucher nào</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {usedVouchers.map(userVoucher => (
        <div key={userVoucher.id} className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'>
          <div className='flex items-center gap-4'>
            {/* Voucher Image */}
            <div className='w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0'>
              {userVoucher.voucher.image ? (
                <img
                  src={userVoucher.voucher.image}
                  alt={userVoucher.voucher.code}
                  className='w-full h-full object-cover'
                />
              ) : (
                <div className='w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center'>
                  <FaTicketAlt className='text-white' size={24} />
                </div>
              )}
            </div>

            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-1'>
                <h3 className='font-semibold text-lg'>{userVoucher.voucher.code}</h3>
                <span className='bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full'>
                  Đã sử dụng
                </span>
              </div>
              <p className='text-gray-600 text-sm mb-2'>{userVoucher.voucher.description}</p>
              <div className='flex items-center gap-4 text-sm text-gray-500 mb-2'>
                <span>
                  Giảm:{' '}
                  {userVoucher.voucher.discountType === 'PERCENTAGE'
                    ? `${userVoucher.voucher.discountValue}%`
                    : `${formatPrice(userVoucher.voucher.discountValue)}`}
                </span>
                <span>•</span>
                <span>Sử dụng: {formatDate(userVoucher.usedAt)}</span>
              </div>

              {/* Order Information */}
              {userVoucher.orderId && (
                <div className='bg-blue-50 border border-blue-200 rounded-md p-2 mt-2'>
                  <p className='text-xs text-blue-700'>
                    <span className='font-medium'>Áp dụng cho đơn hàng:</span> #{userVoucher.orderId.slice(-8)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Reviews Tab Component
const ReviewsTab: React.FC<{ reviews: any[] }> = ({ reviews }) => {
  if (reviews.length === 0) {
    return (
      <div className='text-center py-12'>
        <MdStarBorder className='mx-auto text-gray-300 mb-4' size={48} />
        <p className='text-gray-500'>Chưa có đánh giá nào</p>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span key={index}>
        {index < rating ? (
          <MdStar className='text-yellow-400' size={16} />
        ) : (
          <MdStarBorder className='text-gray-300' size={16} />
        )}
      </span>
    ));
  };

  return (
    <div className='space-y-4'>
      {reviews.map(review => (
        <div key={review.id} className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'>
          <div className='flex items-start gap-4'>
            {review.product?.thumbnail && (
              <div className='w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0'>
                <img src={review.product.thumbnail} alt={review.product.name} className='w-full h-full object-cover' />
              </div>
            )}
            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-2'>
                <div className='flex items-center'>{renderStars(review.rating)}</div>
                <span className='text-sm text-gray-500'>{formatDate(review.createdDate)}</span>
              </div>

              {review.product && (
                <Link
                  className='text-[#212B36] hover:text-blue-500'
                  href={`/product/${slugConvert(review.product.name)}-${review.product.id}`}
                >
                  <h4 className='font-medium text-gray-900 mb-2'>{review.product.name}</h4>
                </Link>
              )}
              <p className='text-gray-700 text-sm leading-relaxed'>{review.comment}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

function CustomToolbar(props: any) {
  return (
    <div className='flex flex-col justify-stretch items-center w-full'>
      <div className='w-full'>
        <GridToolbar {...props} />
      </div>
    </div>
  );
}
export default UserDetailsClient;

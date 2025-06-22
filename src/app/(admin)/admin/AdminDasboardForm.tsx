'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChatRoomType, SafeUser } from '../../../../types';
import NullData from '@/app/components/NullData';
import ChatList from '@/app/components/admin/chat/ChatList';

import DashboardStats from '@/app/components/admin/DashboardStats';
import DashboardCharts from '@/app/components/admin/DashboardCharts';
import BestSellingProducts from '@/app/components/admin/BestSellingProducts';
import OrdersTable from '@/app/components/admin/OrdersTable';
import ReviewsSection from '@/app/components/admin/ReviewsSection';
import { Chip, Button } from '@mui/material';
import { MdDashboard, MdDateRange, MdAutorenew, MdRefresh } from 'react-icons/md';

type Review = {
  id: any;
  userId: any;
  productId: any;
  rating: number;
  comment: any;
  reply: any;
  createdDate: any;
  product: {
    id: any;
    name: any;
    description: any;
    price: any;
    category: any;
    inStock: any;
    images: any[];
  };
  user: {
    id: any;
    name: any;
    email: any;
    emailVerified: any;
    image: any;
    hashedPassword: any;
    createAt: any;
    updateAt: any;
    role: any;
  };
};

interface AdminDashBoardFormProps {
  orders: (any & { products: any[] })[];
  users: any[];
  totalRevenue: number;
  columnData: any[];
  currentUser: SafeUser | null | undefined;
  reviews: any;
  conversations: ChatRoomType[];
  userInSession: any[];
}

const AdminDashBoardForm: React.FC<AdminDashBoardFormProps> = ({
  orders,
  users,
  totalRevenue,
  columnData,
  currentUser,
  reviews,
  userInSession,
  conversations
}) => {
  const router = useRouter();

  // State for period filtering and auto refresh
  const [selectedPeriod, setSelectedPeriod] = useState(0); // 0 = All time (từ trước đến giờ)
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState(orders);
  const [filteredRevenue, setFilteredRevenue] = useState(totalRevenue);
  const [showDateRange, setShowDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter data based on selected period or date range
  const filterDataByPeriod = (period: number) => {
    if (period === 0) {
      // All time - từ trước đến giờ
      setFilteredOrders(orders);
      setFilteredRevenue(totalRevenue);
      setShowDateRange(false);
      return;
    }

    if (period === -1) {
      // Custom date range
      setShowDateRange(true);
      return;
    }

    setShowDateRange(false);
    const now = new Date();
    const startDate = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);

    const filtered =
      orders?.filter(order => {
        const orderDate = new Date(order.createDate);
        return orderDate >= startDate && orderDate <= now;
      }) || [];

    const revenue = filtered.reduce((sum, order) => sum + order.amount, 0);

    setFilteredOrders(filtered);
    setFilteredRevenue(revenue);
  };

  // Filter data by custom date range
  const filterDataByDateRange = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
    }

    if (!startDate || !endDate) {
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end date

    const filtered =
      orders?.filter(order => {
        const orderDate = new Date(order.createDate);
        return orderDate >= start && orderDate <= end;
      }) || [];

    const revenue = filtered.reduce((sum, order) => sum + order.amount, 0);

    setFilteredOrders(filtered);
    setFilteredRevenue(revenue);
  };

  // Handle period change
  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    const period = Number(e.target.value);
    setSelectedPeriod(period);
    filterDataByPeriod(period);
  };

  // Handle refresh
  const handleRefresh = () => {
    // Re-filter data with current period
    filterDataByPeriod(selectedPeriod);
  };

  // Initialize filtered data
  useEffect(() => {
    filterDataByPeriod(selectedPeriod);
  }, [orders, totalRevenue]);

  // Auto refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, selectedPeriod]);

  // Tránh các đơn hàng bị trùng - use filtered orders
  const uniqueProducts = filteredOrders?.reduce((acc: any[], order) => {
    return acc.concat(order.products?.filter((product: any) => !acc.some(p => p.id === product.id)));
  }, []);

  const filteredClient = users?.filter(user => user.role === 'USER');
  const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  const salesWeeklyData = {
    labels: days,
    datasets: [
      {
        label: 'Sản phẩm',
        data: [65, 40, 75, 55, 62, 120],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(255, 159, 64, 0.2)',
          'rgba(255, 205, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(153, 102, 255, 0.2)'
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(255, 159, 64)',
          'rgb(255, 205, 86)',
          'rgb(75, 192, 192)',
          'rgb(54, 162, 235)',
          'rgb(153, 102, 255)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Use filtered data for calculations
  const successOrder = filteredOrders?.filter(
    order => order.status === 'completed' && order.deliveryStatus === 'delivered'
  );
  const cancelledOrders = filteredOrders?.filter(order => order.status === 'canceled');
  const orderPieData = {
    labels: ['Đơn hàng thành công', 'Đơn hàng bị huỷ'],
    datasets: [
      {
        data: [successOrder?.length || 0, cancelledOrders?.length || 0],
        backgroundColor: ['#5dc2a7', '#ff6384']
      }
    ]
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
      {/* Enhanced Header với Controls */}
      <div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 w-[78.5vw] mt-6'>
        <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6'>
          {/* Title Section */}
          <div className='flex items-center gap-4'>
            <div className='p-3 bg-blue-600 rounded-xl text-white'>
              <MdDashboard className='text-2xl' />
            </div>
            <div>
              <h1 className='text-xl font-bold text-gray-800 flex items-center gap-2'>
                Tổng quan hệ thống
                <Chip
                  label='Live'
                  size='small'
                  sx={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    fontWeight: 600,
                    animation: 'pulse 2s infinite'
                  }}
                />
              </h1>
            </div>
          </div>

          {/* Controls Section */}
          <div className='flex flex-wrap items-center gap-3'>
            {/* Period Selector */}
            <div className='flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm'>
              <MdDateRange className='text-blue-600' />
              <select
                value={selectedPeriod}
                onChange={handlePeriodChange}
                className='bg-transparent border-none focus:outline-none text-sm font-medium'
              >
                <option value={0}>Từ trước đến giờ</option>
                <option value={1}>24 giờ qua</option>
                <option value={7}>7 ngày qua</option>
                <option value={30}>30 ngày qua</option>
                <option value={90}>90 ngày qua</option>
                <option value={-1}>Từ ngày đến ngày</option>
              </select>
            </div>

            {/* Auto Refresh Toggle */}
            <div className='flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm'>
              <MdAutorenew className={`text-lg ${autoRefresh ? 'text-green-500' : 'text-gray-400'}`} />
              <input
                type='checkbox'
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
                className='rounded'
              />
              <span className='text-sm font-medium text-gray-700'>Auto refresh</span>
            </div>

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

        {/* Date Range Picker */}
        {showDateRange && (
          <div className='mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200'>
            <h4 className='font-medium text-blue-800 mb-3'>Chọn khoảng thời gian</h4>
            <div className='flex flex-wrap items-center gap-3'>
              <div className='flex items-center gap-2'>
                <label className='text-sm font-medium text-gray-700'>Từ ngày:</label>
                <input
                  type='date'
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className='px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                />
              </div>
              <div className='flex items-center gap-2'>
                <label className='text-sm font-medium text-gray-700'>Đến ngày:</label>
                <input
                  type='date'
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className='px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                />
              </div>
              <Button
                variant='contained'
                onClick={filterDataByDateRange}
                disabled={!startDate || !endDate}
                size='small'
                sx={{
                  backgroundColor: '#10b981',
                  '&:hover': { backgroundColor: '#059669' },
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Áp dụng
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Original Layout - Giữ nguyên như cũ */}
      <div className='w-[78.5vw] flex flex-col xl:flex-row justify-around gap-3 mt-6'>
        <div className='w-full lg:w-2/3'>
          <DashboardStats
            ordersCount={filteredOrders.length}
            totalRevenue={filteredRevenue}
            clientsCount={filteredClient.length}
          />
          <div className='grid grid-cols-1 mt-5'>
            <div className='relative border border-gray-200 rounded-lg p-6'>
              <h2 className='text-center font-bold text-lg text-gray-500'>Doanh số hằng tuần</h2>
              <div className='w-full h-auto block mx-auto'>
                <DashboardCharts salesWeeklyData={salesWeeklyData} type='bar' />
              </div>
            </div>
          </div>

          <BestSellingProducts uniqueProducts={uniqueProducts} />
          <OrdersTable orders={filteredOrders} />
        </div>

        <div className='w-full lg:w-1/3 flex flex-col'>
          <div className='mb-4 rounded-lg border border-gray-200 w-full px-3 py-6 pb-1'>
            <h2 className='text-center font-bold text-lg text-gray-500'>Doanh số tổng đơn</h2>
            <div className='w-[40vw] max-w-full h-[25vh] max-h-[500px] block mx-auto'>
              <DashboardCharts orderPieData={orderPieData} type='pie' />
            </div>
          </div>
          <ReviewsSection reviews={reviews} />
          <div className='rounded-lg border max-h-96 scroll-bar overflow-y-auto scrollbar-thin scrollbar-thumb-[#c0c0c0] scrollbar-track-transparent border-gray-200 w-full py-6 flex-1'>
            <h2 className='mb-3 text-gray-500 px-6 font-semibold text-lg'>Tin nhắn</h2>
            <ChatList conversations={conversations} userInSession={userInSession} dashboard={true} />
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashBoardForm;

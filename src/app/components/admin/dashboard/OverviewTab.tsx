'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Chip
} from '@mui/material';
import { MdRefresh, MdDateRange, MdFilterList } from 'react-icons/md';
import EnhancedDashboardStats from '../EnhancedDashboardStats';
import DashboardCharts from '../DashboardCharts';
import ReviewsSection from '../ReviewsSection';
import ChatList from '../chat/ChatList';

interface OverviewTabProps {
  orders: any[];
  users: any[];
  totalRevenue: any;
  currentUser: any;
  reviews?: any;
  conversations?: any[];
  userInSession?: any[];
  avgOrderValue?: number;
  orderPieData?: any;
  salesWeeklyData?: any;
  // onRefresh prop removed - now using page refresh
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  orders,
  users,
  totalRevenue,
  currentUser,
  reviews,
  conversations = [],
  userInSession = [],
  avgOrderValue = 0,
  orderPieData,
  salesWeeklyData
}) => {
  // State for time filter
  const [timeFilter, setTimeFilter] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDateRange, setShowDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 🎯 IMPROVED: Handle refresh function using page reload instead of onRefresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Since OverviewTab receives data via props from parent page,
      // we'll trigger a page refresh to reload all data
      window.location.reload();
    } catch (error) {
      console.error('❌ Error refreshing overview data:', error);
      setIsRefreshing(false);
    }
    // Note: setIsRefreshing(false) not needed here since page will reload
  };

  // Handle time filter change
  const handleTimeFilterChange = (value: string) => {
    setTimeFilter(value);
    if (value === 'custom') {
      setShowDateRange(true);
    } else {
      setShowDateRange(false);
      setStartDate('');
      setEndDate('');
    }
  };

  // Filter data based on time selection
  const filteredData = useMemo(() => {
    const now = new Date();
    let filterDate = new Date();

    // Calculate filter date based on selection
    switch (timeFilter) {
      case '1d':
        filterDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        filterDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        filterDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        filterDate.setDate(now.getDate() - 90);
        break;
      case 'custom':
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);

          return {
            orders:
              orders?.filter(order => {
                const orderDate = new Date(order.createdAt || order.createDate);
                return orderDate >= start && orderDate <= end;
              }) || [],
            users:
              users?.filter(user => {
                const userDate = new Date(user.createdAt || user.createAt);
                return userDate >= start && userDate <= end;
              }) || []
          };
        }
        return { orders: orders || [], users: users || [] };
      default:
        return { orders: orders || [], users: users || [] };
    }

    return {
      orders:
        orders?.filter(order => {
          const orderDate = new Date(order.createdAt || order.createDate);
          return orderDate >= filterDate;
        }) || [],
      users:
        users?.filter(user => {
          const userDate = new Date(user.createdAt || user.createAt);
          return userDate >= filterDate;
        }) || []
    };
  }, [timeFilter, startDate, endDate, orders, users]);

  // Filter client users
  const filteredClient = filteredData.users.filter(user => user.role === 'USER') || [];

  // Calculate cancelled orders metrics
  const cancelledOrders = filteredData.orders.filter(order => order.status === 'canceled') || [];
  const cancelledOrdersCount = cancelledOrders.length;
  const cancelledRevenue = cancelledOrders.reduce((total, order) => total + (order.amount || 0), 0);

  // Convert salesWeeklyData to chart format
  const chartWeeklyData =
    salesWeeklyData && Array.isArray(salesWeeklyData)
      ? {
          labels: salesWeeklyData.map(item => item.day || 'N/A'),
          datasets: [
            {
              label: 'Doanh số (VNĐ)',
              data: salesWeeklyData.map(item => item.totalAmount || 0),
              backgroundColor: 'rgba(59, 130, 246, 0.5)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1
            }
          ]
        }
      : null;

  // Create pie chart data based on filtered data using OrderStatus
  const defaultOrderPieData = orderPieData || {
    labels: ['Hoàn thành', 'Đang xử lý', 'Đã hủy', 'Đã xác nhận'],
    datasets: [
      {
        data: [
          filteredData.orders?.filter(order => order.status === 'completed').length || 0,
          filteredData.orders?.filter(order => order.status === 'pending').length || 0,
          filteredData.orders?.filter(order => order.status === 'canceled').length || 0,
          filteredData.orders?.filter(order => order.status === 'confirmed').length || 0
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'],
        borderWidth: 0
      }
    ]
  };

  return (
    <Box>
      {/* Time Filter & Refresh Controls */}
      <Card sx={{ mb: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <CardContent sx={{ p: 3 }}>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <MdDateRange size={20} className='text-blue-600' />
              <Typography variant='h6' component='h3' sx={{ fontWeight: 600, color: '#1f2937' }}>
                Tổng quan Dashboard
              </Typography>
            </div>

            <div className='flex items-center gap-3 flex-wrap'>
              <FormControl size='small' sx={{ minWidth: 140 }}>
                <InputLabel>Thời gian</InputLabel>
                <Select value={timeFilter} label='Thời gian' onChange={e => handleTimeFilterChange(e.target.value)}>
                  <MenuItem value='1d'>24 giờ</MenuItem>
                  <MenuItem value='7d'>7 ngày</MenuItem>
                  <MenuItem value='30d'>30 ngày</MenuItem>
                  <MenuItem value='90d'>90 ngày</MenuItem>
                  <MenuItem value='custom'>Tùy chọn</MenuItem>
                </Select>
              </FormControl>

              {/* Date Range Picker */}
              {showDateRange && (
                <>
                  <TextField
                    type='date'
                    label='Từ ngày'
                    size='small'
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 140 }}
                  />
                  <TextField
                    type='date'
                    label='Đến ngày'
                    size='small'
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 140 }}
                  />
                  {startDate && endDate && (
                    <Chip
                      label={`${filteredData.orders.length} đơn hàng`}
                      color='primary'
                      size='small'
                      sx={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        fontWeight: 500
                      }}
                    />
                  )}
                </>
              )}

              {/* Manual Refresh */}
              <Button
                variant='contained'
                startIcon={
                  isRefreshing ? (
                    <div className='animate-spin'>
                      <MdRefresh />
                    </div>
                  ) : (
                    <MdRefresh />
                  )
                }
                onClick={handleRefresh}
                disabled={isRefreshing}
                size='medium'
                sx={{
                  backgroundColor: '#3b82f6',
                  '&:hover': { backgroundColor: '#2563eb' },
                  '&:disabled': {
                    backgroundColor: '#9ca3af',
                    color: '#ffffff'
                  },
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
                }}
              >
                {isRefreshing ? 'Đang tải...' : 'Làm mới'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Dashboard Stats - Using filtered data */}
      <div className='w-full'>
        <EnhancedDashboardStats
          ordersCount={filteredData.orders?.length || 0}
          totalRevenue={totalRevenue}
          clientsCount={filteredClient.length}
          avgOrderValue={avgOrderValue}
          cancelledOrdersCount={cancelledOrdersCount}
          cancelledRevenue={cancelledRevenue}
        />
      </div>

      {/* Layout mới - Doanh số hàng tuần bên trái, Doanh số tổng đơn bên phải */}
      <div className='w-full flex flex-col xl:flex-row justify-around gap-6 mt-6'>
        {/* Left Side - Doanh số hàng tuần */}
        <div className='w-full lg:w-1/2'>
          <div className='rounded-lg border border-gray-200 w-full px-4 py-6'>
            <h2 className='text-center font-bold text-lg text-gray-500 mb-4'>Doanh số hàng tuần</h2>
            <div className='w-full max-w-full h-[30vh] max-h-[400px] block mx-auto'>
              {chartWeeklyData ? (
                <DashboardCharts salesWeeklyData={chartWeeklyData} type='bar' />
              ) : (
                <DashboardCharts
                  salesWeeklyData={{
                    labels: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'],
                    datasets: [
                      {
                        label: 'Doanh số (VNĐ)',
                        data: [0, 0, 0, 0, 0, 0, 0], // Show 0 data instead of fake data
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1
                      }
                    ]
                  }}
                  type='bar'
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Doanh số tổng đơn */}
        <div className='w-full lg:w-1/2'>
          <div className='rounded-lg border border-gray-200 w-full px-4 py-6'>
            <h2 className='text-center font-bold text-lg text-gray-500 mb-4'>Doanh số tổng đơn</h2>
            <div className='w-full max-w-full h-[30vh] max-h-[400px] block mx-auto'>
              <DashboardCharts orderPieData={defaultOrderPieData} type='pie' />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row - Tin nhắn bên trái, Đánh giá sản phẩm bên phải */}
      <div className='w-full flex flex-col xl:flex-row justify-around gap-6 mt-6'>
        {/* Left Side - Chat Messages */}
        <div className='w-full lg:w-1/2'>
          <div className='rounded-lg border max-h-96 scroll-bar overflow-y-auto scrollbar-thin scrollbar-thumb-[#c0c0c0] scrollbar-track-transparent border-gray-200 w-full py-6'>
            <h2 className='mb-3 text-gray-500 px-6 font-semibold text-lg'>Tin nhắn</h2>
            <ChatList conversations={conversations} userInSession={userInSession} dashboard={true} />
          </div>
        </div>

        {/* Right Side - Reviews Section */}
        <div className='w-full lg:w-1/2'>
          {reviews && (
            <div className='rounded-lg border border-gray-200 w-full p-4'>
              <ReviewsSection reviews={reviews} />
            </div>
          )}
        </div>
      </div>
    </Box>
  );
};

export default OverviewTab;

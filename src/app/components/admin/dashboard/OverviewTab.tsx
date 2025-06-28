'use client';

import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { MdRefresh, MdDateRange } from 'react-icons/md';
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
  newsData?: any;
  businessAlerts?: any[];
  conversionRate?: number;
  avgOrderValue?: number;
  returnRequestsCount?: number;
  orderPieData?: any;
  salesWeeklyData?: any;
  onRefresh?: () => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  orders,
  users,
  totalRevenue,
  currentUser,
  reviews,
  conversations = [],
  userInSession = [],
  newsData,
  businessAlerts = [],
  conversionRate = 0,
  avgOrderValue = 0,
  returnRequestsCount = 0,
  orderPieData,
  salesWeeklyData,
  onRefresh
}) => {
  // State for time filter
  const [timeFilter, setTimeFilter] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setIsRefreshing(false);
    }
  };
  // Filter client users
  const filteredClient = users?.filter(user => user.role === 'USER') || [];

  // Create pie chart data if not provided
  const defaultOrderPieData = orderPieData || {
    labels: ['Đã giao', 'Đang xử lý', 'Đã hủy'],
    datasets: [
      {
        data: [
          orders?.filter(order => order.deliveryStatus === 'delivered').length || 0,
          orders?.filter(order => order.deliveryStatus === 'pending').length || 0,
          orders?.filter(order => order.deliveryStatus === 'cancelled').length || 0
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
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

            <div className='flex items-center gap-3'>
              <FormControl size='small' sx={{ minWidth: 120 }}>
                <InputLabel>Thời gian</InputLabel>
                <Select value={timeFilter} label='Thời gian' onChange={e => setTimeFilter(e.target.value)}>
                  <MenuItem value='1d'>24 giờ</MenuItem>
                  <MenuItem value='7d'>7 ngày</MenuItem>
                  <MenuItem value='30d'>30 ngày</MenuItem>
                  <MenuItem value='90d'>90 ngày</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant='outlined'
                startIcon={<MdRefresh />}
                onClick={handleRefresh}
                disabled={isRefreshing}
                size='small'
                sx={{ textTransform: 'none' }}
              >
                {isRefreshing ? 'Đang tải...' : 'Làm mới'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Dashboard Stats - Giữ nguyên từ AdminDashBoardForm */}
      <div className='w-full'>
        <EnhancedDashboardStats
          ordersCount={orders?.length || 0}
          totalRevenue={totalRevenue}
          clientsCount={filteredClient.length}
          newsData={newsData}
          businessAlerts={businessAlerts}
          conversionRate={conversionRate}
          avgOrderValue={avgOrderValue}
          returnRequestsCount={returnRequestsCount}
        />
      </div>

      {/* Layout mới - Doanh số hàng tuần bên trái, Doanh số tổng đơn bên phải */}
      <div className='w-full flex flex-col xl:flex-row justify-around gap-6 mt-6'>
        {/* Left Side - Doanh số hàng tuần */}
        <div className='w-full lg:w-1/2'>
          <div className='rounded-lg border border-gray-200 w-full px-4 py-6'>
            <h2 className='text-center font-bold text-lg text-gray-500 mb-4'>Doanh số hàng tuần</h2>
            <div className='w-full max-w-full h-[30vh] max-h-[400px] block mx-auto'>
              {salesWeeklyData ? (
                <DashboardCharts salesWeeklyData={salesWeeklyData} type='bar' />
              ) : (
                <DashboardCharts
                  salesWeeklyData={{
                    labels: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'],
                    datasets: [
                      {
                        label: 'Doanh số (VNĐ)',
                        data: [12000000, 19000000, 15000000, 25000000, 22000000, 30000000, 28000000],
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

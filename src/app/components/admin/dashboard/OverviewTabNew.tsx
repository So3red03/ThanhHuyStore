'use client';

import React from 'react';
import { Box } from '@mui/material';
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
  orderPieData
}) => {
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

      {/* Layout giống AdminDashBoardForm - Phân bổ thông minh */}
      <div className='w-full flex flex-col xl:flex-row justify-around gap-3 mt-6'>
        {/* Pie Chart - Doanh số tổng đơn */}
        <div className='w-full lg:w-1/3'>
          <div className='mb-4 rounded-lg border border-gray-200 w-full px-3 py-6 pb-1'>
            <h2 className='text-center font-bold text-lg text-gray-500'>Doanh số tổng đơn</h2>
            <div className='w-full max-w-full h-[25vh] max-h-[500px] block mx-auto'>
              <DashboardCharts orderPieData={defaultOrderPieData} type='pie' />
            </div>
          </div>
        </div>

        {/* Right Side - Reviews & Chat */}
        <div className='w-full lg:w-2/3 flex flex-col gap-4'>
          {/* Reviews Section */}
          {reviews && (
            <div className='rounded-lg border border-gray-200 w-full p-4'>
              <ReviewsSection reviews={reviews} />
            </div>
          )}

          {/* Chat Messages */}
          <div className='rounded-lg border max-h-96 scroll-bar overflow-y-auto scrollbar-thin scrollbar-thumb-[#c0c0c0] scrollbar-track-transparent border-gray-200 w-full py-6 flex-1'>
            <h2 className='mb-3 text-gray-500 px-6 font-semibold text-lg'>Tin nhắn</h2>
            <ChatList conversations={conversations} userInSession={userInSession} dashboard={true} />
          </div>
        </div>
      </div>
    </Box>
  );
};

export default OverviewTab;

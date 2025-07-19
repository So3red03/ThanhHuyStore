'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Box, Chip, Avatar, Grid } from '@mui/material';
import { MdPeople, MdTrendingUp, MdShoppingCart, MdAttachMoney, MdNewReleases, MdHistory } from 'react-icons/md';
import { formatPrice } from '../../../../utils/formatPrice';
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import moment from 'moment';

interface CustomerAnalyticsProps {
  users: any[];
  orders: any[];
}

const CustomerAnalytics: React.FC<CustomerAnalyticsProps> = ({ users = [], orders = [] }) => {
  // 🎯 LOGIC PHÂN LOẠI KHÁCH HÀNG:
  // - Khách hàng MỚI: Đăng ký trong vòng 30 ngày gần đây
  // - Khách hàng CŨ: Đăng ký từ 30 ngày trước trở về
  const NEW_CUSTOMER_THRESHOLD_DAYS = 30;

  const customerAnalysis = useMemo(() => {
    const now = moment();
    const thresholdDate = now.clone().subtract(NEW_CUSTOMER_THRESHOLD_DAYS, 'days');

    // Phân loại khách hàng dựa trên ngày đăng ký
    const newCustomers = users.filter(user => {
      const createDate = moment(user.createAt);
      return createDate.isAfter(thresholdDate);
    });

    const existingCustomers = users.filter(user => {
      const createDate = moment(user.createAt);
      return createDate.isBefore(thresholdDate);
    });

    // Tính toán thống kê mua hàng cho từng khách hàng
    const calculateCustomerStats = (customerList: any[]) => {
      return customerList
        .map(customer => {
          const customerOrders = orders.filter(order => order.userId === customer.id && order.status === 'complete');
          const totalSpent = customerOrders.reduce((sum, order) => sum + order.amount, 0);
          const totalOrders = customerOrders.length;
          const lastOrderDate =
            customerOrders.length > 0
              ? moment(Math.max(...customerOrders.map(order => new Date(order.createdAt).getTime())))
              : null;

          return {
            ...customer,
            totalSpent,
            totalOrders,
            lastOrderDate,
            avgOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0
          };
        })
        .sort((a, b) => b.totalSpent - a.totalSpent);
    };

    const newCustomersWithStats = calculateCustomerStats(newCustomers);
    const existingCustomersWithStats = calculateCustomerStats(existingCustomers);

    // Dữ liệu cho Chart.js pie chart
    const pieData = {
      labels: ['Khách hàng mới', 'Khách hàng cũ'],
      datasets: [
        {
          data: [newCustomers.length, existingCustomers.length],
          backgroundColor: ['#3b82f6', '#10b981'],
          borderColor: ['#2563eb', '#059669'],
          borderWidth: 2,
          hoverBackgroundColor: ['#2563eb', '#059669'],
          hoverBorderColor: ['#1d4ed8', '#047857'],
          hoverBorderWidth: 3
        }
      ]
    };

    // Top khách hàng mua nhiều nhất (tổng hợp)
    const allCustomersWithStats = calculateCustomerStats(users);
    const topCustomers = allCustomersWithStats.slice(0, 10);

    return {
      newCustomers: newCustomersWithStats,
      existingCustomers: existingCustomersWithStats,
      pieData,
      topCustomers,
      totalNewRevenue: newCustomersWithStats.reduce((sum, customer) => sum + customer.totalSpent, 0),
      totalExistingRevenue: existingCustomersWithStats.reduce((sum, customer) => sum + customer.totalSpent, 0)
    };
  }, [users, orders]);

  return (
    <div className='space-y-6'>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e5e7eb', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-blue-100 rounded-lg'>
                  <MdNewReleases size={20} className='text-blue-600' />
                </div>
                <div>
                  <Typography variant='h6' sx={{ fontWeight: 700, color: '#1f2937' }}>
                    {customerAnalysis.newCustomers.length}
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    Khách hàng mới
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e5e7eb', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-green-100 rounded-lg'>
                  <MdHistory size={20} className='text-green-600' />
                </div>
                <div>
                  <Typography variant='h6' sx={{ fontWeight: 700, color: '#1f2937' }}>
                    {customerAnalysis.existingCustomers.length}
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    Khách hàng cũ
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e5e7eb', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-purple-100 rounded-lg'>
                  <MdAttachMoney size={20} className='text-purple-600' />
                </div>
                <div>
                  <Typography variant='h6' sx={{ fontWeight: 700, color: '#1f2937' }}>
                    {formatPrice(customerAnalysis.totalNewRevenue)}
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    Doanh thu KH mới
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e5e7eb', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-orange-100 rounded-lg'>
                  <MdTrendingUp size={20} className='text-orange-600' />
                </div>
                <div>
                  <Typography variant='h6' sx={{ fontWeight: 700, color: '#1f2937' }}>
                    {formatPrice(customerAnalysis.totalExistingRevenue)}
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    Doanh thu KH cũ
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pie Chart and Top Customers */}
      <Grid container spacing={4}>
        {/* Pie Chart */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant='h6' sx={{ fontWeight: 600, mb: 1, color: '#1f2937' }}>
                Phân bố khách hàng
              </Typography>
              <Typography variant='body2' sx={{ mb: 3, color: '#6b7280' }}>
                Dựa trên thời gian đăng ký (30 ngày gần đây = mới)
              </Typography>
              <div style={{ width: '100%', height: 300 }}>
                <Pie
                  data={customerAnalysis.pieData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                        labels: {
                          padding: 20,
                          usePointStyle: true,
                          font: {
                            size: 12
                          }
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Customers Table */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <CardContent sx={{ p: 0 }}>
              {/* Header */}
              <div className='bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 p-4 text-white'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-white/20 backdrop-blur-sm rounded-lg'>
                    <MdTrendingUp size={24} className='text-white' />
                  </div>
                  <div>
                    <Typography variant='h6' sx={{ fontWeight: 700, color: 'white' }}>
                      Top Khách hàng mua nhiều nhất
                    </Typography>
                    <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.9)' }}>
                      Danh sách khách hàng có tổng chi tiêu cao nhất
                    </Typography>
                  </div>
                </div>
              </div>

              {/* Table Content */}
              <div className='p-4'>
                {customerAnalysis.topCustomers.length > 0 ? (
                  <div className='space-y-3'>
                    {customerAnalysis.topCustomers.map((customer, index) => (
                      <div
                        key={customer.id}
                        className='flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
                      >
                        <div className='flex items-center gap-3'>
                          <div className='flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm'>
                            {index + 1}
                          </div>
                          <Avatar src={customer.image} sx={{ width: 40, height: 40 }}>
                            {customer.name?.charAt(0) || customer.email?.charAt(0)}
                          </Avatar>
                          <div>
                            <Typography variant='body1' sx={{ fontWeight: 600, color: '#1f2937' }}>
                              {customer.name || 'Khách hàng'}
                            </Typography>
                            <Typography variant='body2' color='textSecondary'>
                              {customer.email}
                            </Typography>
                          </div>
                        </div>

                        <div className='text-right'>
                          <Typography variant='body1' sx={{ fontWeight: 700, color: '#059669' }}>
                            {formatPrice(customer.totalSpent)}
                          </Typography>
                          <div className='flex items-center gap-2 mt-1'>
                            <Chip
                              label={`${customer.totalOrders} đơn`}
                              size='small'
                              sx={{
                                backgroundColor: '#dbeafe',
                                color: '#1e40af',
                                fontSize: '0.75rem',
                                height: 20
                              }}
                            />
                            {customer.lastOrderDate && (
                              <Typography variant='caption' color='textSecondary'>
                                {moment(customer.lastOrderDate).fromNow()}
                              </Typography>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='flex flex-col items-center justify-center py-8 text-gray-500'>
                    <MdPeople size={48} className='mb-2 opacity-50' />
                    <Typography variant='h6' color='textSecondary'>
                      Chưa có dữ liệu khách hàng
                    </Typography>
                    <Typography variant='body2' color='textSecondary'>
                      Chưa có khách hàng nào thực hiện mua hàng
                    </Typography>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default CustomerAnalytics;

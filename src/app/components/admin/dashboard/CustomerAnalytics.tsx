'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Box, Chip, Avatar, Grid } from '@mui/material';
import { MdPeople, MdTrendingUp, MdShoppingCart, MdAttachMoney, MdNewReleases, MdHistory } from 'react-icons/md';
import { formatPrice } from '../../../../../utils/formatPrice';
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import moment from 'moment';

interface CustomerAnalyticsProps {
  users: any[];
  orders: any[];
  loading?: boolean;
}

const CustomerAnalytics: React.FC<CustomerAnalyticsProps> = ({ users = [], orders = [], loading = false }) => {
  // Loading state - show loading if explicitly loading or if no data available
  if (loading || (users.length === 0 && orders.length === 0)) {
    return (
      <Card sx={{ mb: 6, borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <CardContent sx={{ p: 6 }}>
          <div className='flex items-center gap-3 mb-6'>
            <div className='p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl'>
              <MdPeople size={24} className='text-blue-600' />
            </div>
            <div>
              <Typography variant='h5' sx={{ fontWeight: 700, color: '#1f2937', mb: 1 }}>
                Phân tích khách hàng
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                Đang tải dữ liệu chi tiết...
              </Typography>
            </div>
          </div>
          <div className='space-y-3'>
            <div className='h-4 bg-gradient-to-r from-blue-200 via-indigo-200 to-blue-200 rounded-full animate-pulse'></div>
            <div className='h-4 bg-gradient-to-r from-blue-200 via-indigo-200 to-blue-200 rounded-full animate-pulse w-3/4'></div>
            <div className='h-4 bg-gradient-to-r from-blue-200 via-indigo-200 to-blue-200 rounded-full animate-pulse w-1/2'></div>
          </div>
        </CardContent>
      </Card>
    );
  }
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
          const customerOrders = orders.filter(order => order.userId === customer.id && order.status === 'completed');
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
    <Card sx={{ mb: 4, borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <CardContent sx={{ p: 0 }}>
        {/* Header Section - Same vibe as VoucherAnalytics */}
        <div className='bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 p-4 text-white'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-white/20 backdrop-blur-sm rounded-lg'>
                <MdPeople size={20} className='text-white' />
              </div>
              <div>
                <Typography variant='h5' sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                  Phân tích khách hàng
                </Typography>
                <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Insights về khách hàng mới và cũ, hành vi mua sắm
                </Typography>
              </div>
            </div>
            <div className='text-right'>
              <div className='text-2xl font-bold'>{users.length}</div>
              <div className='text-xs opacity-90'>Tổng khách hàng</div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Same style as VoucherAnalytics */}
        <div className='p-4'>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 16px rgba(59, 130, 246, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(59, 130, 246, 0.3)'
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
                  <div className='flex justify-center mb-2'>
                    <div className='p-2 bg-white/20 rounded-full'>
                      <MdNewReleases size={20} />
                    </div>
                  </div>
                  <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '1.5rem' }}>
                    {customerAnalysis.newCustomers.length}
                  </Typography>
                  <Typography variant='body2' sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                    Khách hàng mới
                  </Typography>
                  <div className='mt-1 text-xs bg-white/20 rounded-full px-2 py-0.5'>30 ngày</div>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)'
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
                  <div className='flex justify-center mb-2'>
                    <div className='p-2 bg-white/20 rounded-full'>
                      <MdHistory size={20} />
                    </div>
                  </div>
                  <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '1.5rem' }}>
                    {customerAnalysis.existingCustomers.length}
                  </Typography>
                  <Typography variant='body2' sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                    Khách hàng cũ
                  </Typography>
                  <div className='mt-1 text-xs bg-white/20 rounded-full px-2 py-0.5'>Trung thành</div>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: 'white',
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 16px rgba(139, 92, 246, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(139, 92, 246, 0.3)'
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
                  <div className='flex justify-center mb-2'>
                    <div className='p-2 bg-white/20 rounded-full'>
                      <MdAttachMoney size={20} />
                    </div>
                  </div>
                  <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '1.3rem' }}>
                    {formatPrice(customerAnalysis.totalNewRevenue)}
                  </Typography>
                  <Typography variant='body2' sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                    Doanh thu KH mới
                  </Typography>
                  <div className='mt-1 text-xs bg-white/20 rounded-full px-2 py-0.5'>30 ngày</div>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(245, 158, 11, 0.3)'
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
                  <div className='flex justify-center mb-2'>
                    <div className='p-2 bg-white/20 rounded-full'>
                      <MdTrendingUp size={20} />
                    </div>
                  </div>
                  <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '1.3rem' }}>
                    {formatPrice(customerAnalysis.totalExistingRevenue)}
                  </Typography>
                  <Typography variant='body2' sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                    Doanh thu KH cũ
                  </Typography>
                  <div className='mt-1 text-xs bg-white/20 rounded-full px-2 py-0.5'>Tích lũy</div>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </div>

        <Box sx={{ p: 3 }}>
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
        </Box>
      </CardContent>
    </Card>
  );
};

export default CustomerAnalytics;

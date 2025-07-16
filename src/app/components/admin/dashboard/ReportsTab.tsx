'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { MdSchedule, MdDownload, MdRefresh, MdDateRange } from 'react-icons/md';
import OrdersTable from '../OrdersTable';
import PaymentMethodChart from '../../analytics/PaymentMethodChart';
import PromotionChart from '../../analytics/PromotionChart';
import { usePaymentMethodAnalytics, useVoucherAnalytics } from '@/app/hooks/useAnalytics';
import axios from 'axios';
import toast from 'react-hot-toast';
import VoucherAnalytics from '../VoucherAnalytics';
import BestSellingProducts from '../BestSellingProducts';

interface ReportsTabProps {
  orders: any[];
  users: any[];
  totalRevenue: any;
  // onRefresh prop removed - now using direct axios refetch
}

const ReportsTab: React.FC<ReportsTabProps> = ({ orders, users, totalRevenue }) => {
  // State for time filter
  const [timeFilter, setTimeFilter] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Convert timeFilter to days
  const getDaysFromFilter = (filter: string) => {
    switch (filter) {
      case '1d':
        return 1;
      case '7d':
        return 7;
      case '30d':
        return 30;
      case '90d':
        return 90;
      default:
        return 7;
    }
  };

  // Analytics hooks từ AdminNewsDashboard với refetch functions
  const {
    data: paymentData,
    loading: paymentLoading,
    refetch: refetchPayments
  } = usePaymentMethodAnalytics(getDaysFromFilter(timeFilter));

  const {
    data: voucherData,
    loading: voucherLoading,
    refetch: refetchVouchers
  } = useVoucherAnalytics(getDaysFromFilter(timeFilter));

  // Report sending state từ AdminNewsDashboard
  const [reportLoading, setReportLoading] = useState(false);
  const [showReportAlert, setShowReportAlert] = useState(false);

  // 🎯 IMPROVED: Handle refresh function using axios refetch instead of onRefresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh all analytics data simultaneously
      await Promise.all([refetchPayments(), refetchVouchers()]);
    } catch (error) {
      console.error(' Error refreshing reports data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle send report function - SỬA LỖI API ENDPOINT
  const handleSendReport = async () => {
    setReportLoading(true);
    try {
      const response = await axios.post('/api/admin/reports/discord', {
        type: 'report',
        hours: getDaysFromFilter(timeFilter) * 24
      });
      if (response.data.success) {
        setShowReportAlert(true);
        toast.success('📊 Báo cáo đã được gửi thành công qua Discord!');
      }
    } catch (error) {
      toast.error('❌ Lỗi khi gửi báo cáo');
    } finally {
      setReportLoading(false);
    }
  };

  // Tránh các đơn hàng bị trùng
  const uniqueProducts = orders?.reduce((acc: any[], order) => {
    return acc.concat(order.products?.filter((product: any) => !acc.some(p => p.id === product.id)));
  }, []);

  return (
    <Box>
      {/* Time Filter & Refresh Controls */}
      <Card sx={{ mb: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <CardContent sx={{ p: 3 }}>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <MdDateRange size={20} className='text-blue-600' />
              <Typography variant='h6' component='h3' sx={{ fontWeight: 600, color: '#1f2937' }}>
                Báo cáo & Xuất dữ liệu
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

      {/* Report Actions */}
      <Card sx={{ mb: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <CardContent sx={{ p: 3 }}>
          <div className='flex items-center justify-between'>
            <Typography variant='body1' sx={{ color: '#6b7280' }}>
              Gửi báo cáo tự động qua Discord hoặc xuất dữ liệu Excel
            </Typography>

            <div className='flex gap-3'>
              <Button
                variant='contained'
                startIcon={<MdSchedule />}
                onClick={handleSendReport}
                disabled={reportLoading}
                size='small'
                sx={{
                  backgroundColor: '#10b981',
                  '&:hover': { backgroundColor: '#059669' },
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                {reportLoading ? 'Đang gửi...' : 'Gửi báo cáo Discord'}
              </Button>

              <Button variant='outlined' startIcon={<MdDownload />} size='small' sx={{ textTransform: 'none' }}>
                Xuất Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Analytics Charts */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
        {/* Enhanced Payment Method Chart */}
        <Card
          sx={{ borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
        >
          <CardContent sx={{ p: 4 }}>
            <div className='flex items-center gap-3 mb-4'>
              <div className='p-2 bg-blue-100 rounded-lg'>
                <svg className='w-6 h-6 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
                  />
                </svg>
              </div>
              <div>
                <Typography variant='h6' sx={{ fontWeight: 600, color: '#1f2937' }}>
                  Phương thức thanh toán
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  Thống kê theo {getDaysFromFilter(timeFilter)} ngày qua
                </Typography>
              </div>
            </div>
            {paymentLoading ? (
              <div className='flex justify-center items-center h-64'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              </div>
            ) : paymentData && paymentData.data && paymentData.data.length > 0 ? (
              <div>
                <PaymentMethodChart data={paymentData.data} />
                <div className='mt-4 p-3 bg-gray-50 rounded-lg'>
                  <Typography variant='body2' color='textSecondary'>
                    📊 Tổng {paymentData.summary?.totalOrders || 0} đơn hàng •{' '}
                    {paymentData.summary?.totalAmount
                      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                          paymentData.summary.totalAmount
                        )
                      : '0 VNĐ'}
                  </Typography>
                </div>
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center h-64 text-gray-500'>
                <div className='text-4xl mb-2'>�</div>
                <Typography variant='h6' color='textSecondary'>
                  Không có dữ liệu thanh toán
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  Chưa có đơn hàng nào trong khoảng thời gian này
                </Typography>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Voucher Chart */}
        <Card
          sx={{ borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
        >
          <CardContent sx={{ p: 4 }}>
            <div className='flex items-center gap-3 mb-4'>
              <div className='p-2 bg-purple-100 rounded-lg'>
                <svg className='w-6 h-6 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
                  />
                </svg>
              </div>
              <div>
                <Typography variant='h6' sx={{ fontWeight: 600, color: '#1f2937' }}>
                  Top 5 Voucher phổ biến
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  Voucher được sử dụng nhiều nhất
                </Typography>
              </div>
            </div>
            {voucherLoading ? (
              <div className='flex justify-center items-center h-64'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600'></div>
              </div>
            ) : voucherData && voucherData.data && voucherData.data.length > 0 ? (
              <div>
                <PromotionChart data={voucherData.data} title='Top 5 Voucher được sử dụng nhiều nhất' />
                <div className='mt-4 p-3 bg-gray-50 rounded-lg'>
                  <Typography variant='body2' color='textSecondary'>
                    🎫 {voucherData.summary?.totalUsage || 0} lượt sử dụng • Tiết kiệm{' '}
                    {voucherData.summary?.totalDiscount
                      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                          voucherData.summary.totalDiscount
                        )
                      : '0 VNĐ'}
                  </Typography>
                </div>
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center h-64 text-gray-500'>
                <div className='text-4xl mb-2'>🎫</div>
                <Typography variant='h6' color='textSecondary'>
                  Không có dữ liệu voucher
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  Chưa có voucher nào được sử dụng trong khoảng thời gian này
                </Typography>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 🎯 ENHANCED: Best Selling Products with purchase quantities */}
      <div className='mb-4'>
        <BestSellingProducts uniqueProducts={uniqueProducts} orders={orders} />
      </div>

      {/* Voucher Analytics Section */}
      <VoucherAnalytics timeFilter={timeFilter} />

      {/* Success Alert */}
      <Snackbar
        open={showReportAlert}
        autoHideDuration={6000}
        onClose={() => setShowReportAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setShowReportAlert(false)} severity='success' sx={{ width: '100%' }}>
          📊 Báo cáo đã được gửi thành công qua Discord!
        </Alert>
      </Snackbar>

      {/* Loading States */}
      {(paymentLoading || voucherLoading) && (
        <div className='flex justify-center items-center py-8'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      )}
    </Box>
  );
};

export default ReportsTab;

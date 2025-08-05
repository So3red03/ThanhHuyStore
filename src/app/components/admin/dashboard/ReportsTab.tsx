'use client';

import React, { useState, useMemo } from 'react';
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
  InputLabel,
  TextField,
  Chip
} from '@mui/material';
import { MdSchedule, MdDownload, MdRefresh, MdDateRange, MdFilterList } from 'react-icons/md';
import OrdersTable from '../OrdersTable';
import PaymentMethodChart from '../../analytics/PaymentMethodChart';
import PaymentMethodStackedChart from '../../analytics/PaymentMethodStackedChart';

import { usePaymentMethodAnalytics } from '@/app/hooks/useAnalytics';
import axios from 'axios';
import toast from 'react-hot-toast';

import BestSellingProducts from '../BestSellingProducts';
import { ExcelExportService } from '@/app/utils/excelExport';

interface ReportsTabProps {
  orders: any[];
  users: any[];
  totalRevenue: any;
  products?: any[]; // Add products prop for consistent data source
  // onRefresh prop removed - now using direct axios refetch
}

const ReportsTab: React.FC<ReportsTabProps> = ({ orders, users, totalRevenue, products = [] }) => {
  // State for time filter
  const [timeFilter, setTimeFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showDateRange, setShowDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Convert timeFilter to days
  const getDaysFromFilter = (filter: string) => {
    if (filter === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }

    switch (filter) {
      case 'all':
        return 0; // 0 means no time filter
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

  // Calculate days based on filter and custom dates
  const days = useMemo(() => {
    return getDaysFromFilter(timeFilter);
  }, [timeFilter, startDate, endDate]);

  // Analytics hooks từ AdminNewsDashboard với refetch functions
  const { data: paymentData, loading: paymentLoading, refetch: refetchPayments } = usePaymentMethodAnalytics(days);

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

  // Report sending state từ AdminNewsDashboard
  const [reportLoading, setReportLoading] = useState(false);
  const [showReportAlert, setShowReportAlert] = useState(false);

  // 🎯 IMPROVED: Handle refresh function using axios refetch instead of onRefresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh all analytics data simultaneously
      await Promise.all([refetchPayments()]);
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
        toast.success('Báo cáo đã được gửi thành công qua Discord!');
      }
    } catch (error) {
      toast.error('Lỗi khi gửi báo cáo');
    } finally {
      setReportLoading(false);
    }
  };

  // Handle Excel Export
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);

      const reportData = {
        orders,
        users,
        paymentData,
        totalRevenue,
        timeFilter
      };

      const fileName = ExcelExportService.exportOverviewReport(reportData);
      toast.success(`Xuất Excel thành công`);
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Lỗi khi xuất file Excel');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Export Product Excel
  const handleExportProductExcel = async () => {
    try {
      setIsExporting(true);

      // Prepare product data with sales info (consistent with ManageProductsClient logic)
      const productData = uniqueProducts.map((product: any) => {
        // Tính số lượng thực tế đã bán = Tổng mua - Tổng trả (cho từng sản phẩm)
        const totalPurchased = orders.reduce((total: number, order: any) => {
          if (order.status !== 'completed' || !order.products || !Array.isArray(order.products)) {
            return total;
          }

          const orderProduct = order.products.find((p: any) => p.id === product.id);
          return total + (orderProduct?.quantity || 0);
        }, 0);

        const totalReturned = orders.reduce((total: number, order: any) => {
          if (order.status !== 'completed' || !order.returnRequests || !Array.isArray(order.returnRequests)) {
            return total;
          }

          const returnedQuantity = order.returnRequests.reduce((returnTotal: number, returnReq: any) => {
            if (returnReq.status !== 'COMPLETED' || !returnReq.items || !Array.isArray(returnReq.items)) {
              return returnTotal;
            }

            const returnedItem = returnReq.items.find((item: any) => item.productId === product.id);
            return returnTotal + (returnedItem?.quantity || 0);
          }, 0);

          return total + returnedQuantity;
        }, 0);

        const soldQuantity = Math.max(0, totalPurchased - totalReturned);

        // Calculate stock for variant products (consistent with other components)
        let displayStock = product.inStock || 0;
        if (product.productType === 'VARIANT' && product.variants && product.variants.length > 0) {
          displayStock = product.variants.reduce((total: number, variant: any) => {
            return total + (variant.stock || 0);
          }, 0);
        }

        return {
          ...product,
          soldQuantity,
          inStock: displayStock, // Use calculated stock
          category: product.category?.name || 'Không xác định'
        };
      });

      const fileName = ExcelExportService.exportProductReport(productData, timeFilter);
      toast.success(`Xuất Excel sản phẩm thành công`);
    } catch (error) {
      console.error('Product Excel export error:', error);
      toast.error('Lỗi khi xuất file Excel sản phẩm');
    } finally {
      setIsExporting(false);
    }
  };

  // Use products from database for consistent data source (same as ManageProductsClient)
  // Filter out soft deleted products to match getProducts behavior
  const uniqueProducts = products?.filter(product => !product.isDeleted) || [];

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
              <FormControl size='small' sx={{ minWidth: 140 }}>
                <InputLabel>Thời gian</InputLabel>
                <Select value={timeFilter} label='Thời gian' onChange={e => handleTimeFilterChange(e.target.value)}>
                  <MenuItem value='all'>Tất cả</MenuItem>
                  <MenuItem value='1d'>24 giờ</MenuItem>
                  <MenuItem value='7d'>7 ngày</MenuItem>
                  <MenuItem value='30d'>30 ngày</MenuItem>
                  <MenuItem value='90d'>90 ngày</MenuItem>
                  <MenuItem value='custom'>Tùy chọn</MenuItem>
                </Select>
              </FormControl>

              {showDateRange && (
                <>
                  <TextField
                    label='Từ ngày'
                    type='date'
                    size='small'
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 140 }}
                  />
                  <TextField
                    label='Đến ngày'
                    type='date'
                    size='small'
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 140 }}
                  />
                </>
              )}

              <Button
                variant='outlined'
                startIcon={<MdDownload />}
                onClick={handleExportExcel}
                disabled={isExporting}
                size='medium'
                sx={{
                  borderColor: '#10b981',
                  color: '#10b981',
                  '&:hover': {
                    borderColor: '#059669',
                    backgroundColor: 'rgba(16, 185, 129, 0.04)'
                  },
                  '&:disabled': {
                    borderColor: '#9ca3af',
                    color: '#9ca3af'
                  },
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                {isExporting ? 'Đang xuất...' : 'Xuất Excel'}
              </Button>

              <Button
                variant='contained'
                startIcon={<MdSchedule />}
                onClick={handleSendReport}
                disabled={reportLoading}
                size='medium'
                sx={{
                  backgroundColor: '#8b5cf6',
                  '&:hover': { backgroundColor: '#7c3aed' },
                  '&:disabled': {
                    backgroundColor: '#9ca3af',
                    color: '#ffffff'
                  },
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)'
                }}
              >
                {reportLoading ? 'Đang gửi...' : 'Gửi Discord'}
              </Button>

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
                  Thống kê{' '}
                  {timeFilter === 'all' ? 'tất cả thời gian' : `theo ${getDaysFromFilter(timeFilter)} ngày qua`}
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
                    Tổng {paymentData.summary?.totalOrders || 0} đơn hàng •{' '}
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

        {/* Payment Method Stacked Chart */}
        <div>
          {paymentLoading ? (
            <div className='flex justify-center items-center h-64'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600'></div>
            </div>
          ) : paymentData && paymentData.data && paymentData.data.length > 0 ? (
            <PaymentMethodStackedChart data={paymentData.data} title='So sánh phương thức thanh toán' />
          ) : (
            <div className='bg-white p-6 rounded-lg border border-gray-200 shadow-sm'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>So sánh phương thức thanh toán</h3>
              <div className='flex flex-col items-center justify-center h-64 text-gray-500'>
                <div className='text-4xl mb-2'>📊</div>
                <Typography variant='h6' color='textSecondary'>
                  Không có dữ liệu thanh toán
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  Chưa có đơn hàng nào trong khoảng thời gian này
                </Typography>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🎯 ENHANCED: Best Selling Products with purchase quantities */}
      <div className='mb-4'>
        <Card sx={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <CardContent sx={{ p: 3 }}>
            <div className='flex items-center justify-between mb-4'>
              <Typography variant='h6' component='h3' sx={{ fontWeight: 600, color: '#1f2937' }}></Typography>
              <Button
                variant='outlined'
                startIcon={<MdDownload />}
                onClick={handleExportProductExcel}
                disabled={isExporting}
                size='small'
                sx={{
                  borderColor: '#10b981',
                  color: '#10b981',
                  '&:hover': {
                    borderColor: '#059669',
                    backgroundColor: 'rgba(16, 185, 129, 0.04)'
                  },
                  '&:disabled': {
                    borderColor: '#9ca3af',
                    color: '#9ca3af'
                  },
                  borderRadius: '6px',
                  textTransform: 'none',
                  fontWeight: 500
                }}
              >
                {isExporting ? 'Đang xuất...' : 'Xuất Excel'}
              </Button>
            </div>
            <BestSellingProducts uniqueProducts={uniqueProducts} orders={orders} />
          </CardContent>
        </Card>
      </div>

      {/* Success Alert */}
      <Snackbar
        open={showReportAlert}
        autoHideDuration={6000}
        onClose={() => setShowReportAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setShowReportAlert(false)} severity='success' sx={{ width: '100%' }}>
          Báo cáo đã được gửi thành công qua Discord!
        </Alert>
      </Snackbar>

      {/* Loading States */}
      {paymentLoading && (
        <div className='flex justify-center items-center py-8'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      )}
    </Box>
  );
};

export default ReportsTab;

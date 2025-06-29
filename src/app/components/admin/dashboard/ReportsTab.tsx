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
import BestSellingProducts from '../BestSellingProducts';
import OrdersTable from '../OrdersTable';
import PaymentMethodChart from '../../analytics/PaymentMethodChart';
import PromotionChart from '../../analytics/PromotionChart';
import { usePaymentMethodAnalytics, usePromotionAnalytics } from '@/app/hooks/useAnalytics';
import axios from 'axios';
import toast from 'react-hot-toast';

interface ReportsTabProps {
  orders: any[];
  users: any[];
  totalRevenue: any;
  onRefresh?: () => void;
}

const ReportsTab: React.FC<ReportsTabProps> = ({ orders, users, totalRevenue, onRefresh }) => {
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

  // Analytics hooks từ AdminNewsDashboard
  const { data: paymentData, loading: paymentLoading } = usePaymentMethodAnalytics(getDaysFromFilter(timeFilter));
  const { data: promotionData, loading: promotionLoading } = usePromotionAnalytics(getDaysFromFilter(timeFilter));

  // Report sending state từ AdminNewsDashboard
  const [reportLoading, setReportLoading] = useState(false);
  const [showReportAlert, setShowReportAlert] = useState(false);

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
      console.error('Discord report error:', error);
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

      {/* Payment Methods & Promotions Charts từ AdminNewsDashboard */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
        {paymentData && !paymentLoading && (
          <PaymentMethodChart data={paymentData.data} title='Phương thức thanh toán' />
        )}
        {promotionData && !promotionLoading && (
          <PromotionChart data={promotionData.data} title='Top 5 Chương trình khuyến mãi' />
        )}
      </div>

      {/* Best Selling Products từ AdminDashBoardForm */}
      <div className='mb-6'>
        <BestSellingProducts uniqueProducts={uniqueProducts} />
      </div>

      {/* Orders Table từ AdminDashBoardForm */}
      <div className='mb-6'>
        <OrdersTable orders={orders} />
      </div>

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
      {(paymentLoading || promotionLoading) && (
        <div className='flex justify-center items-center py-8'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      )}
    </Box>
  );
};

export default ReportsTab;

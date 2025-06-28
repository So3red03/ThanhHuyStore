'use client';

import React, { useState } from 'react';
import { Box, Button, Typography, Snackbar, Alert } from '@mui/material';
import { MdSchedule, MdDownload } from 'react-icons/md';
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
}

const ReportsTab: React.FC<ReportsTabProps> = ({ orders, users, totalRevenue }) => {
  // Analytics hooks từ AdminNewsDashboard
  const { data: paymentData, loading: paymentLoading } = usePaymentMethodAnalytics(7);
  const { data: promotionData, loading: promotionLoading } = usePromotionAnalytics(7);

  // Report sending state từ AdminNewsDashboard
  const [reportLoading, setReportLoading] = useState(false);
  const [showReportAlert, setShowReportAlert] = useState(false);

  // Handle send report function từ AdminNewsDashboard
  const handleSendReport = async () => {
    setReportLoading(true);
    try {
      const response = await axios.post('/api/discord/send-report');
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
      {/* Header với Discord Report Button từ AdminNewsDashboard */}
      <div className='mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200'>
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
          <div>
            <Typography variant='h4' fontWeight={700} gutterBottom>
              📋 Báo cáo & Xuất dữ liệu
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              Quản lý báo cáo và xuất dữ liệu kinh doanh
            </Typography>
          </div>

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
      </div>

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

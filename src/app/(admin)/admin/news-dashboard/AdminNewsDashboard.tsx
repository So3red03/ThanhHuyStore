'use client';

import { useState, useEffect } from 'react';
import {
  useAnalyticsOverview,
  useProductAnalytics,
  useArticleAnalytics,
  usePaymentMethodAnalytics,
  usePromotionAnalytics
} from '@/app/hooks/useAnalytics';
import AnalyticsKPICards from '@/app/components/analytics/AnalyticsKPICards';
import AnalyticsTrendChart from '@/app/components/analytics/AnalyticsTrendChart';
import TopProductsTable from '@/app/components/analytics/TopProductsTable';
import TopArticlesTable from '@/app/components/analytics/TopArticlesTable';
import PaymentMethodChart from '@/app/components/analytics/PaymentMethodChart';
import PromotionChart from '@/app/components/analytics/PromotionChart';

import { Button, Chip, Card, CardContent, Typography, Box, LinearProgress, Alert, Snackbar } from '@mui/material';
import {
  MdRefresh,
  MdAutorenew,
  MdDateRange,
  MdTrendingUp,
  MdAssessment,
  MdNotifications,
  MdSchedule,
  MdSend
} from 'react-icons/md';
import { useSettings } from '@/app/hooks/useSettings';
import axios from 'axios';
import toast from 'react-hot-toast';

const NewsDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [lastReportTime, setLastReportTime] = useState<Date | null>(null);
  const [nextReportTime, setNextReportTime] = useState<Date | null>(null);
  const [showReportAlert, setShowReportAlert] = useState(false);
  const [showDateRange, setShowDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Get settings for report intervals
  const { settings, isLoading: settingsLoading } = useSettings();

  const {
    data: overviewData,
    loading: overviewLoading,
    error: overviewError,
    refetch: refetchOverview
  } = useAnalyticsOverview(selectedPeriod);

  const {
    data: productData,
    loading: productLoading,
    error: productError,
    refetch: refetchProducts
  } = useProductAnalytics(selectedPeriod, 10);

  const {
    data: articleData,
    loading: articleLoading,
    error: articleError,
    refetch: refetchArticles
  } = useArticleAnalytics(selectedPeriod, 10);

  const {
    data: paymentData,
    loading: paymentLoading,
    error: paymentError,
    refetch: refetchPayments
  } = usePaymentMethodAnalytics(selectedPeriod);

  const {
    data: promotionData,
    loading: promotionLoading,
    error: promotionError,
    refetch: refetchPromotions
  } = usePromotionAnalytics(selectedPeriod);

  // Auto refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetchOverview();
      refetchProducts();
      refetchArticles();
      refetchPayments();
      refetchPromotions();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, refetchOverview, refetchProducts, refetchArticles]);

  // Calculate next report time based on settings
  useEffect(() => {
    if (settings?.dailyReports && settings?.reportInterval) {
      const now = new Date();
      const nextReport = new Date(now.getTime() + settings.reportInterval * 60 * 60 * 1000);
      setNextReportTime(nextReport);
    }
  }, [settings]);

  // Send test report function
  const handleSendTestReport = async () => {
    setReportLoading(true);
    try {
      const response = await axios.post('/api/admin/reports/discord', {
        type: 'test'
      });

      if (response.data.success) {
        toast.success('Báo cáo test đã được gửi thành công!');
        setLastReportTime(new Date());
        setShowReportAlert(true);
      } else {
        toast.error('Gửi báo cáo thất bại');
      }
    } catch (error) {
      console.error('Error sending test report:', error);
      toast.error('Có lỗi xảy ra khi gửi báo cáo');
    } finally {
      setReportLoading(false);
    }
  };

  // Send actual report function
  const handleSendReport = async () => {
    setReportLoading(true);
    try {
      const response = await axios.post('/api/admin/reports/discord', {
        type: 'report',
        hours: settings?.reportInterval || 24
      });

      if (response.data.success) {
        toast.success('✅ Báo cáo thống kê đã được gửi!');
        setLastReportTime(new Date());
      } else {
        toast.error('❌ Gửi báo cáo thất bại');
      }
    } catch (error) {
      console.error('Error sending report:', error);
      toast.error('❌ Có lỗi xảy ra khi gửi báo cáo');
    } finally {
      setReportLoading(false);
    }
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    const days = Number(e.target.value);
    setSelectedPeriod(days);

    if (days === -1) {
      // Custom date range
      setShowDateRange(true);
      return;
    }

    setShowDateRange(false);
  };

  // Handle date range filtering
  const handleDateRangeFilter = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
    }

    if (!startDate || !endDate) {
      return;
    }

    // Refetch data with custom date range
    // Note: You might need to modify the API calls to accept date range parameters
    handleRefresh();
  };

  const handleRefresh = () => {
    refetchOverview();
    refetchProducts();
    refetchArticles();
    refetchPayments();
    refetchPromotions();
  };

  if (overviewLoading && productLoading && articleLoading && paymentLoading && promotionLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (overviewError || productError || articleError || paymentError || promotionError) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
        <p className='text-red-600'>
          Lỗi tải dữ liệu: {overviewError || productError || articleError || paymentError || promotionError}
        </p>
        <button onClick={handleRefresh} className='mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'>
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className='space-y-8 w-[78.5vw] mt-6'>
      {/* Enhanced Header */}
      <div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100'>
        <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6'>
          {/* Title Section */}
          <div className='flex items-center gap-4'>
            <div className='p-3 bg-blue-600 rounded-xl text-white'>
              <MdAssessment className='text-2xl' />
            </div>
            <div>
              <h1 className='text-xl font-bold text-gray-800 flex items-center gap-2'>
                Thống kê và phân tích dữ liệu kinh doanh
                <Chip
                  label='Real-time'
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
            <div className='flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200'>
              <MdDateRange className='text-blue-600' />
              <select
                value={selectedPeriod}
                onChange={handlePeriodChange}
                className='bg-transparent border-none focus:outline-none text-sm font-medium'
              >
                <option value={1}>24 giờ qua</option>
                <option value={7}>7 ngày qua</option>
                <option value={30}>30 ngày qua</option>
                <option value={90}>90 ngày qua</option>
                <option value={-1}>Từ ngày đến ngày</option>
              </select>
            </div>

            {/* Auto Refresh Toggle */}
            <div className='flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200'>
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
                onClick={handleDateRangeFilter}
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

        {/* Report Controls */}
        {settings?.dailyReports && (
          <div className='mt-6 pt-6 border-t border-blue-200'>
            <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4'>
              <div className='flex items-center gap-3'>
                <div>
                  <h3 className='font-semibold text-gray-800'>Báo cáo tự động</h3>
                  <p className='text-sm text-gray-600'>
                    Gửi báo cáo mỗi {settings.reportInterval} giờ
                    {nextReportTime && (
                      <span className='ml-2 text-blue-600 font-medium'>
                        • Báo cáo tiếp theo: {nextReportTime.toLocaleTimeString('vi-VN')}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                {lastReportTime && (
                  <div className='text-sm text-gray-600 bg-green-50 px-3 py-1 rounded-lg border border-green-200'>
                    ✅ Gửi lần cuối: {lastReportTime.toLocaleTimeString('vi-VN')}
                  </div>
                )}

                <Button
                  variant='outlined'
                  startIcon={<MdSend />}
                  onClick={handleSendTestReport}
                  disabled={reportLoading}
                  size='small'
                  sx={{
                    borderColor: '#f59e0b',
                    color: '#f59e0b',
                    '&:hover': {
                      borderColor: '#d97706',
                      backgroundColor: '#fef3c7'
                    }
                  }}
                >
                  {reportLoading ? 'Đang gửi...' : 'Test báo cáo'}
                </Button>

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
                  {reportLoading ? 'Đang gửi...' : 'Gửi báo cáo ngay'}
                </Button>
              </div>
            </div>
          </div>
        )}
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

      {/* KPI Cards */}
      {overviewData && <AnalyticsKPICards data={overviewData.overview} />}

      {/* Enhanced Charts Section */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Trend Chart */}
        <div className='lg:col-span-2'>
          <Card sx={{ height: '100%', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <CardContent sx={{ p: 3 }}>
              <div className='flex items-center gap-2 mb-4'>
                <Typography variant='h6' component='h3' sx={{ fontWeight: 600, color: '#1f2937' }}>
                  📈 Xu hướng truy cập theo ngày
                </Typography>
              </div>
              {overviewData && <AnalyticsTrendChart data={overviewData.trends} title='' />}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Quick Stats */}
        <Card sx={{ height: '100%', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <CardContent sx={{ p: 3 }}>
            <div className='flex items-center gap-2 mb-4'>
              <Typography variant='h6' component='h3' sx={{ fontWeight: 600, color: '#1f2937' }}>
                ⚡ Thống kê nhanh
              </Typography>
            </div>
            <div className='space-y-4'>
              {overviewData && (
                <>
                  <div className='flex justify-between items-center p-3 bg-gray-50 rounded-lg'>
                    <span className='text-gray-600 font-medium'>📊 Tổng sự kiện:</span>
                    <span className='font-bold text-blue-600'>
                      {overviewData.overview.totalEvents.toLocaleString()}
                    </span>
                  </div>
                  <div className='flex justify-between items-center p-3 bg-green-50 rounded-lg'>
                    <span className='text-gray-600 font-medium'>💹 Tỷ lệ chuyển đổi:</span>
                    <span className='font-bold text-green-600'>
                      {overviewData.overview.pageViews > 0
                        ? ((overviewData.overview.purchases / overviewData.overview.pageViews) * 100).toFixed(2)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className='flex justify-between items-center p-3 bg-purple-50 rounded-lg'>
                    <span className='text-gray-600 font-medium'>👁️ Avg. views/visitor:</span>
                    <span className='font-bold text-purple-600'>
                      {overviewData.overview.uniqueVisitors > 0
                        ? (overviewData.overview.pageViews / overviewData.overview.uniqueVisitors).toFixed(1)
                        : 0}
                    </span>
                  </div>

                  {/* Performance Indicator */}
                  <div className='mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-sm font-medium text-gray-700'>🎯 Performance Score</span>
                      <span className='text-sm font-bold text-blue-600'>
                        {overviewData.overview.pageViews > 100
                          ? 'Excellent'
                          : overviewData.overview.pageViews > 50
                          ? 'Good'
                          : 'Growing'}
                      </span>
                    </div>
                    <LinearProgress
                      variant='determinate'
                      value={Math.min((overviewData.overview.pageViews / 100) * 100, 100)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#e5e7eb',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor:
                            overviewData.overview.pageViews > 100
                              ? '#10b981'
                              : overviewData.overview.pageViews > 50
                              ? '#3b82f6'
                              : '#f59e0b',
                          borderRadius: 4
                        }
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content-Commerce Integration Insights */}
      <Card sx={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <CardContent sx={{ p: 3 }}>
          <div className='flex items-center gap-2 mb-4'>
            <Typography variant='h6' component='h3' sx={{ fontWeight: 600, color: '#1f2937' }}>
              🔗 Tích hợp Nội dung - Thương mại
            </Typography>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Content Performance */}
            <div className='bg-purple-50 p-4 rounded-lg border border-purple-200'>
              <h4 className='font-semibold text-purple-800 mb-3'>📰 Hiệu quả nội dung</h4>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-600'>Tổng lượt đọc:</span>
                  <span className='font-medium text-purple-600'>
                    {articleData?.summary?.totalViews?.toLocaleString() || 0}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-600'>Độc giả duy nhất:</span>
                  <span className='font-medium text-purple-600'>
                    {articleData?.summary?.uniqueReaders?.toLocaleString() || 0}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-600'>Avg. views/reader:</span>
                  <span className='font-medium text-purple-600'>
                    {articleData?.summary?.averageViewsPerReader || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Commerce Performance */}
            <div className='bg-green-50 p-4 rounded-lg border border-green-200'>
              <h4 className='font-semibold text-green-800 mb-3'>🛒 Hiệu quả bán hàng</h4>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-600'>Sản phẩm được xem:</span>
                  <span className='font-medium text-green-600'>
                    {(productData as any)?.data?.length?.toLocaleString() || 0}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-600'>Sản phẩm phổ biến:</span>
                  <span className='font-medium text-green-600'>
                    {(productData as any)?.data?.slice(0, 3).length || 0}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-600'>Avg. views/product:</span>
                  <span className='font-medium text-green-600'>
                    {(productData as any)?.data?.length > 0
                      ? (
                          (productData as any).data.reduce((sum: number, p: any) => sum + (p.views || 0), 0) /
                          (productData as any).data.length
                        ).toFixed(1)
                      : 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Integration Insights */}
            <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
              <h4 className='font-semibold text-blue-800 mb-3'>💡 Insights tích hợp</h4>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-600'>Content → Product:</span>
                  <span className='font-medium text-blue-600'>
                    {/* Calculate content to product conversion */}
                    {(articleData?.summary?.totalViews || 0) > 0 && (productData as any)?.data?.length > 0
                      ? (((productData as any).data.length / (articleData?.summary?.totalViews || 1)) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-600'>Engagement rate:</span>
                  <span className='font-medium text-blue-600'>
                    {(overviewData?.overview?.uniqueVisitors || 0) > 0
                      ? (
                          (overviewData?.overview?.totalEvents || 0) / (overviewData?.overview?.uniqueVisitors || 1)
                        ).toFixed(1)
                      : 0}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-600'>ROI Score:</span>
                  <span className='font-medium text-blue-600'>
                    {(overviewData?.overview?.purchases || 0) > 0 && (articleData?.summary?.totalViews || 0) > 0
                      ? 'High'
                      : (overviewData?.overview?.purchases || 0) > 0
                      ? 'Medium'
                      : 'Growing'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods Chart */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {paymentData && <PaymentMethodChart data={paymentData.data} title='Phương thức thanh toán' />}
        {promotionData && <PromotionChart data={promotionData.data} title='Top 5 Chương trình khuyến mãi' />}
      </div>

      {/* Products Analytics */}
      <div className='grid grid-cols-1 gap-6'>
        {productData && (
          <TopProductsTable
            products={productData.topViewedProducts}
            type='views'
            title='Sản phẩm được xem nhiều nhất'
          />
        )}
      </div>

      {/* Articles Analytics */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Article Trends */}
        <div className='lg:col-span-2'>
          {articleData && (
            <AnalyticsTrendChart data={articleData.articleTrends} title='Xu hướng đọc bài viết theo ngày' />
          )}
        </div>

        {/* Article Stats */}
        <div className='bg-white p-6 rounded-lg border border-gray-200'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>Thống kê bài viết</h3>
          <div className='space-y-4'>
            {articleData && (
              <>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-600'>Tổng lượt xem:</span>
                  <span className='font-semibold text-blue-600'>{articleData.summary.totalViews.toLocaleString()}</span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-600'>Độc giả duy nhất:</span>
                  <span className='font-semibold text-green-600'>
                    {articleData.summary.uniqueReaders.toLocaleString()}
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-600'>Avg. views/reader:</span>
                  <span className='font-semibold'>{articleData.summary.averageViewsPerReader}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Top Articles */}
      <div className='grid grid-cols-1 gap-6'>
        {articleData && <TopArticlesTable articles={articleData.topArticles} title='Bài viết được đọc nhiều nhất' />}
      </div>

      {/* Real Data Management Panel - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className='grid grid-cols-1 gap-6'>
          <div className='bg-white p-6 rounded-lg border border-gray-200'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>🔧 Analytics Data Management</h3>
            <div className='flex flex-wrap gap-3'>
              <Button
                variant='outlined'
                color='error'
                onClick={async () => {
                  try {
                    await axios.post('/api/analytics/seed', { action: 'clear' });
                    toast.success('✅ Đã xóa tất cả mock data!');
                    handleRefresh();
                  } catch (error) {
                    toast.error('❌ Lỗi khi xóa data');
                  }
                }}
                sx={{ textTransform: 'none' }}
              >
                🗑️ Clear All Mock Data
              </Button>

              <Button
                variant='outlined'
                onClick={async () => {
                  try {
                    const response = await axios.get('/api/analytics/overview?days=7');
                    const totalEvents = response.data.overview.totalEvents;
                    toast.success(`📊 Total real events: ${totalEvents}`);
                  } catch (error) {
                    toast.error('❌ Lỗi khi check data');
                  }
                }}
                sx={{ textTransform: 'none' }}
              >
                📊 Check Real Data Count
              </Button>

              <Button
                variant='contained'
                onClick={() => {
                  toast.success('🎯 Hãy click vào sản phẩm để test tracking!');
                  window.open('/', '_blank');
                }}
                sx={{
                  textTransform: 'none',
                  backgroundColor: '#10b981',
                  '&:hover': { backgroundColor: '#059669' }
                }}
              >
                🧪 Test Product Tracking
              </Button>
            </div>

            <div className='mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200'>
              <h4 className='font-medium text-blue-800 mb-2'>📋 How to Test Real Tracking:</h4>
              <ol className='text-sm text-blue-700 space-y-1'>
                <li>1. Click &quot;Clear All Mock Data&quot; để xóa dữ liệu giả</li>
                <li>2. Click &quot;Test Product Tracking&quot; để mở trang chủ</li>
                <li>3. Click vào các sản phẩm, search, đọc bài viết</li>
                <li>4. Quay lại dashboard và click &quot;Làm mới&quot; để xem data thật</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsDashboard;

'use client';

import { useState, useEffect } from 'react';
import { useAnalyticsOverview, useProductAnalytics, useArticleAnalytics } from '@/app/hooks/useAnalytics';
import AnalyticsKPICards from '@/app/components/analytics/AnalyticsKPICards';
import AnalyticsTrendChart from '@/app/components/analytics/AnalyticsTrendChart';
import TopProductsTable from '@/app/components/analytics/TopProductsTable';
import TopArticlesTable from '@/app/components/analytics/TopArticlesTable';
import AnalyticsTestPanel from '@/app/components/analytics/AnalyticsTestPanel';
import { Button } from '@mui/material';
import { MdRefresh, MdAutorenew, MdDateRange } from 'react-icons/md';

const NewsDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const [autoRefresh, setAutoRefresh] = useState(true);

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

  // Auto refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetchOverview();
      refetchProducts();
      refetchArticles();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, refetchOverview, refetchProducts, refetchArticles]);

  const handlePeriodChange = (days: number) => {
    setSelectedPeriod(days);
  };

  const handleRefresh = () => {
    refetchOverview();
    refetchProducts();
    refetchArticles();
  };

  if (overviewLoading && productLoading && articleLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (overviewError || productError || articleError) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
        <p className='text-red-600'>Lỗi tải dữ liệu: {overviewError || productError || articleError}</p>
        <button onClick={handleRefresh} className='mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'>
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className='space-y-6 w-[78.5vw] mt-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div></div>
        <div className='flex items-center gap-3'>
          {/* Period Selector */}
          <div className='flex items-center gap-2'>
            <MdDateRange className='text-gray-500' />
            <select
              value={selectedPeriod}
              onChange={e => handlePeriodChange(Number(e.target.value))}
              className='px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value={1}>24 giờ qua</option>
              <option value={7}>7 ngày qua</option>
              <option value={30}>30 ngày qua</option>
              <option value={90}>90 ngày qua</option>
            </select>
          </div>

          {/* Auto Refresh Toggle */}
          <label className='flex items-center gap-2'>
            <MdAutorenew className={`text-lg ${autoRefresh ? 'text-green-500' : 'text-gray-400'}`} />
            <input
              type='checkbox'
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className='rounded'
            />
            <span className='text-sm text-gray-600'>Tự động cập nhật</span>
          </label>

          {/* Manual Refresh */}
          <Button
            variant='contained'
            startIcon={<MdRefresh />}
            onClick={handleRefresh}
            size='small'
            className='bg-blue-600 hover:bg-blue-700'
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {overviewData && <AnalyticsKPICards data={overviewData.overview} />}

      {/* Charts Section */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Trend Chart */}
        <div className='lg:col-span-2'>
          {overviewData && <AnalyticsTrendChart data={overviewData.trends} title='Xu hướng truy cập theo ngày' />}
        </div>

        {/* Quick Stats */}
        <div className='bg-white p-6 rounded-lg border border-gray-200 shadow-sm'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>Thống kê nhanh</h3>
          <div className='space-y-4'>
            {overviewData && (
              <>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-600'>Tổng sự kiện:</span>
                  <span className='font-semibold'>{overviewData.overview.totalEvents.toLocaleString()}</span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-600'>Tỷ lệ chuyển đổi:</span>
                  <span className='font-semibold text-green-600'>
                    {overviewData.overview.pageViews > 0
                      ? ((overviewData.overview.purchases / overviewData.overview.pageViews) * 100).toFixed(2)
                      : 0}
                    %
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-600'>Avg. views/visitor:</span>
                  <span className='font-semibold'>
                    {overviewData.overview.uniqueVisitors > 0
                      ? (overviewData.overview.pageViews / overviewData.overview.uniqueVisitors).toFixed(1)
                      : 0}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Products Analytics */}
      <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
        {productData && (
          <>
            <TopProductsTable
              products={productData.topViewedProducts}
              type='views'
              title='Sản phẩm được xem nhiều nhất'
            />
            <TopProductsTable
              products={productData.topClickedProducts}
              type='clicks'
              title='Sản phẩm được click nhiều nhất'
            />
          </>
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
        <div className='bg-white p-6 rounded-lg border border-gray-200 shadow-sm'>
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

      {/* Test Panel - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className='grid grid-cols-1 gap-6'>
          <AnalyticsTestPanel />
        </div>
      )}
    </div>
  );
};

export default NewsDashboard;

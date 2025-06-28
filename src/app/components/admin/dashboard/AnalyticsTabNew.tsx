'use client';

import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import DashboardCharts from '../DashboardCharts';
import { useAnalyticsOverview, useProductAnalytics, useArticleAnalytics } from '@/app/hooks/useAnalytics';
import AnalyticsKPICards from '../../analytics/AnalyticsKPICards';
import AnalyticsTrendChart from '../../analytics/AnalyticsTrendChart';
import TopProductsTable from '../../analytics/TopProductsTable';
import TopArticlesTable from '../../analytics/TopArticlesTable';

interface AnalyticsTabProps {
  orders: any[];
  users: any[];
  totalRevenue: any;
  columnData: any;
  salesWeeklyData?: any;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ orders, users, totalRevenue, columnData, salesWeeklyData }) => {
  // Analytics hooks từ AdminNewsDashboard
  const { data: overviewData, loading: overviewLoading } = useAnalyticsOverview(7);
  const { data: productData, loading: productLoading } = useProductAnalytics(7);
  const { data: articleData, loading: articleLoading } = useArticleAnalytics(7);

  // Create default weekly sales data if not provided
  const defaultSalesWeeklyData = salesWeeklyData || {
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
  };

  return (
    <Box>
      {/* KPI Cards từ AdminNewsDashboard */}
      {overviewData && !overviewLoading && (
        <div className='mb-6'>
          <AnalyticsKPICards data={overviewData.overview} />
        </div>
      )}

      {/* Charts Section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
        {/* Bar Chart - Doanh số hằng tuần từ AdminDashBoardForm */}
        <div className='relative border border-gray-200 rounded-lg p-6'>
          <h2 className='text-center font-bold text-lg text-gray-500 mb-4'>Doanh số hằng tuần</h2>
          <div className='w-full h-auto block mx-auto'>
            <DashboardCharts salesWeeklyData={defaultSalesWeeklyData} type='bar' />
          </div>
        </div>

        {/* Trend Chart từ AdminNewsDashboard */}
        <Card sx={{ height: '100%', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <CardContent sx={{ p: 3 }}>
            <div className='flex items-center gap-2 mb-4'>
              <Typography variant='h6' component='h3' sx={{ fontWeight: 600, color: '#1f2937' }}>
                📈 Xu hướng truy cập theo ngày
              </Typography>
            </div>
            {overviewData && !overviewLoading && <AnalyticsTrendChart data={overviewData.trends} title='' />}
          </CardContent>
        </Card>
      </div>

      {/* Products Analytics từ AdminNewsDashboard */}
      <div className='grid grid-cols-1 gap-6 mb-6'>
        {productData && !productLoading && (
          <TopProductsTable
            products={productData.topViewedProducts}
            type='views'
            title='Sản phẩm được xem nhiều nhất'
          />
        )}
      </div>

      {/* Articles Analytics từ AdminNewsDashboard */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Article Trends */}
        <div className='lg:col-span-2'>
          {articleData && !articleLoading && (
            <AnalyticsTrendChart data={articleData.articleTrends} title='Xu hướng đọc bài viết theo ngày' />
          )}
        </div>

        {/* Top Articles */}
        <div className='lg:col-span-1'>
          {articleData && !articleLoading && (
            <TopArticlesTable articles={articleData.topArticles || []} title='Bài viết được đọc nhiều nhất' />
          )}
        </div>
      </div>

      {/* Loading States */}
      {(overviewLoading || productLoading || articleLoading) && (
        <div className='flex justify-center items-center py-8'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      )}
    </Box>
  );
};

export default AnalyticsTab;

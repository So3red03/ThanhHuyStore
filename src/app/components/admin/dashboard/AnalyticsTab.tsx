'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid
} from '@mui/material';
import { MdRefresh, MdDateRange, MdVisibility, MdShoppingCart, MdPeople, MdSearch, MdPercent } from 'react-icons/md';
import { useAnalyticsOverview, useProductAnalytics, useArticleAnalytics } from '@/app/hooks/useAnalytics';
import AnalyticsTrendChart from '../../analytics/AnalyticsTrendChart';
import TopProductsTable from '../../analytics/TopProductsTable';
import TopArticlesTable from '../../analytics/TopArticlesTable';

interface AnalyticsTabProps {
  orders: any[];
  users: any[];
  totalRevenue: any;
  columnData: any;
  salesWeeklyData?: any;
  onRefresh?: () => void;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  orders,
  users,
  totalRevenue,
  columnData,
  salesWeeklyData,
  onRefresh
}) => {
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
  const { data: overviewData, loading: overviewLoading } = useAnalyticsOverview(getDaysFromFilter(timeFilter));
  const { data: productData, loading: productLoading } = useProductAnalytics(getDaysFromFilter(timeFilter));
  const { data: articleData, loading: articleLoading } = useArticleAnalytics(getDaysFromFilter(timeFilter));

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

  // Create real analytics stats from API data
  const analyticsStatsData = [
    {
      title: 'Lượt xem trang',
      value: overviewData?.overview?.pageViews || 0,
      change: overviewLoading ? '...' : `${overviewData?.overview?.pageViews || 0}`,
      icon: MdVisibility,
      color: '#3b82f6',
      loading: overviewLoading
    },
    {
      title: 'Khách truy cập',
      value: overviewData?.overview?.uniqueVisitors || 0,
      change: overviewLoading ? '...' : `${overviewData?.overview?.uniqueVisitors || 0}`,
      icon: MdPeople,
      color: '#10b981',
      loading: overviewLoading
    },
    {
      title: 'Xem sản phẩm',
      value: overviewData?.overview?.productViews || 0,
      change: overviewLoading ? '...' : `${overviewData?.overview?.productViews || 0}`,
      icon: MdShoppingCart,
      color: '#8b5cf6',
      loading: overviewLoading
    },
    {
      title: 'Xem bài viết',
      value: overviewData?.overview?.articleViews || 0,
      change: overviewLoading ? '...' : `${overviewData?.overview?.articleViews || 0}`,
      icon: MdSearch,
      color: '#f59e0b',
      loading: overviewLoading
    },
    {
      title: 'Đơn hàng',
      value: overviewData?.overview?.purchases || 0,
      change: overviewLoading ? '...' : `${overviewData?.overview?.purchases || 0}`,
      icon: MdShoppingCart,
      color: '#8b5cf6',
      loading: overviewLoading
    }
  ];

  return (
    <Box>
      {/* Time Filter & Refresh Controls */}
      <Card sx={{ mb: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <CardContent sx={{ p: 3 }}>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <MdDateRange size={20} className='text-blue-600' />
              <Typography variant='h6' component='h3' sx={{ fontWeight: 600, color: '#1f2937' }}>
                Phân tích chi tiết
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

      {/* Real Analytics Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {analyticsStatsData.map((stat, index) => (
          <Grid item xs={12} md={6} lg={4} key={index}>
            <Card sx={{ borderRadius: '12px', border: '1px solid #e5e7eb', height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <div className='flex items-center justify-between'>
                  <div>
                    <Typography variant='body2' sx={{ color: '#6b7280', mb: 1 }}>
                      {stat.title}
                    </Typography>
                    {stat.loading ? (
                      <div className='animate-pulse'>
                        <div className='h-8 bg-gray-200 rounded w-16 mb-2'></div>
                        <div className='h-4 bg-gray-200 rounded w-12'></div>
                      </div>
                    ) : (
                      <>
                        <Typography variant='h4' sx={{ fontWeight: 700, color: '#1f2937', mb: 1 }}>
                          {stat.value.toLocaleString()}
                        </Typography>
                        <Typography variant='body2' sx={{ color: '#10b981', fontWeight: 600 }}>
                          {stat.change}
                        </Typography>
                      </>
                    )}
                  </div>
                  <div className='p-3 rounded-lg' style={{ backgroundColor: `${stat.color}15` }}>
                    <stat.icon size={24} style={{ color: stat.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <div className='grid grid-cols-1 gap-6 mb-6'>
        {/* Trend Chart từ AdminNewsDashboard */}
        <Card sx={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}>
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

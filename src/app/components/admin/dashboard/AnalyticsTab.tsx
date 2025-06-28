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
import {
  MdRefresh,
  MdDateRange,
  MdVisibility,
  MdShoppingCart,
  MdTrendingUp,
  MdPeople,
  MdSearch,
  MdPercent
} from 'react-icons/md';
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

  // Create custom stats data for 3-column layout
  const customStatsData = [
    {
      title: 'Lượt xem trang',
      value: 68,
      change: '+12%',
      icon: MdVisibility,
      color: '#3b82f6'
    },
    {
      title: 'Khách truy cập',
      value: 43,
      change: '+8%',
      icon: MdPeople,
      color: '#10b981'
    },
    {
      title: 'Xem sản phẩm',
      value: 4,
      change: '+15%',
      icon: MdShoppingCart,
      color: '#8b5cf6'
    },
    {
      title: 'Xem bài viết',
      value: 2,
      change: '+5%',
      icon: MdSearch,
      color: '#f59e0b'
    },
    {
      title: 'Tìm kiếm',
      value: 0,
      change: '+20%',
      icon: MdTrendingUp,
      color: '#06b6d4'
    },
    {
      title: 'Mua hàng',
      value: 0,
      change: '+3%',
      icon: MdPercent,
      color: '#ef4444'
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
                variant='outlined'
                startIcon={<MdRefresh />}
                onClick={handleRefresh}
                disabled={isRefreshing}
                size='small'
                sx={{ textTransform: 'none' }}
              >
                {isRefreshing ? 'Đang tải...' : 'Làm mới'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Stats Cards - 3 columns layout */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {customStatsData.map((stat, index) => (
          <Grid item xs={12} md={6} lg={4} key={index}>
            <Card sx={{ borderRadius: '12px', border: '1px solid #e5e7eb', height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <div className='flex items-center justify-between'>
                  <div>
                    <Typography variant='body2' sx={{ color: '#6b7280', mb: 1 }}>
                      {stat.title}
                    </Typography>
                    <Typography variant='h4' sx={{ fontWeight: 700, color: '#1f2937', mb: 1 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant='body2' sx={{ color: '#10b981', fontWeight: 600 }}>
                      {stat.change}
                    </Typography>
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

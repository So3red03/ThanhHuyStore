'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
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
import { MdRefresh, MdDateRange, MdVisibility, MdArticle } from 'react-icons/md';
import { SiDiscord } from 'react-icons/si';
import { useAnalyticsOverview, useProductAnalytics, useArticleAnalytics } from '@/app/hooks/useAnalytics';
import AnalyticsTrendChart from '../../analytics/AnalyticsTrendChart';
import TopProductsTable from '../../analytics/TopProductsTable';
import TopArticlesTable from '../../analytics/TopArticlesTable';

interface AnalyticsTabProps {
  // onRefresh prop removed - now using direct axios refetch
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = () => {
  const router = useRouter();

  // State for time filter
  const [timeFilter, setTimeFilter] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSendingDiscord, setIsSendingDiscord] = useState(false);

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
    data: overviewData,
    loading: overviewLoading,
    refetch: refetchOverview
  } = useAnalyticsOverview(getDaysFromFilter(timeFilter));

  const {
    data: productData,
    loading: productLoading,
    refetch: refetchProducts
  } = useProductAnalytics(getDaysFromFilter(timeFilter));

  const {
    data: articleData,
    loading: articleLoading,
    refetch: refetchArticles
  } = useArticleAnalytics(getDaysFromFilter(timeFilter));

  // 🎯 IMPROVED: Handle refresh function using axios refetch instead of onRefresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh all analytics data simultaneously
      await Promise.all([refetchOverview(), refetchProducts(), refetchArticles()]);

      console.log('✅ Analytics data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing analytics data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSendDiscordInsights = async () => {
    setIsSendingDiscord(true);
    try {
      const days = getDaysFromFilter(timeFilter);
      const response = await axios.post('/api/analytics/send-insights', { days });

      if (response.data.success) {
        toast.success('Phân tích & đề xuất đã được gửi qua Discord thành công!');
      }
    } catch (error: any) {
      console.error('❌ Error sending Discord insights:', error);
      const errorMessage = error.response?.data?.error || 'Có lỗi xảy ra khi gửi phân tích qua Discord';
      toast.error(errorMessage);
    } finally {
      setIsSendingDiscord(false);
    }
  };

  // Create real analytics stats from API data
  const analyticsStatsData = [
    {
      title: 'Xem sản phẩm',
      value: overviewData?.overview?.productViews || 0,
      change: overviewLoading ? '...' : `${overviewData?.overview?.productViews || 0}`,
      icon: MdVisibility,
      color: '#3b82f6',
      loading: overviewLoading
    },
    {
      title: 'Xem bài viết',
      value: overviewData?.overview?.articleViews || 0,
      change: overviewLoading ? '...' : `${overviewData?.overview?.articleViews || 0}`,
      icon: MdArticle,
      color: '#10b981',
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
                variant='outlined'
                startIcon={
                  isSendingDiscord ? (
                    <div className='animate-spin'>
                      <SiDiscord />
                    </div>
                  ) : (
                    <SiDiscord />
                  )
                }
                onClick={handleSendDiscordInsights}
                disabled={isSendingDiscord || isRefreshing}
                size='medium'
                sx={{
                  borderColor: '#5865f2',
                  color: '#5865f2',
                  '&:hover': {
                    backgroundColor: '#5865f2',
                    color: '#ffffff',
                    borderColor: '#5865f2'
                  },
                  '&:disabled': {
                    borderColor: '#9ca3af',
                    color: '#9ca3af'
                  },
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  mr: 2
                }}
              >
                {isSendingDiscord ? 'Đang phân tích...' : 'Phân tích Discord'}
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
      {/* Trend Charts - 50/50 Layout */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
        {/* Product Access Trends */}
        <Card sx={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <CardContent sx={{ p: 3 }}>
            <div className='flex items-center gap-2 mb-4'>
              <Typography variant='h6' component='h3' sx={{ fontWeight: 600, color: '#1f2937' }}>
                📈 Xu hướng truy cập sản phẩm theo ngày
              </Typography>
            </div>
            {overviewData && !overviewLoading && <AnalyticsTrendChart data={overviewData.trends} title='' />}
          </CardContent>
        </Card>

        {/* Article Reading Trends */}
        <Card sx={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <CardContent sx={{ p: 3 }}>
            <div className='flex items-center gap-2 mb-4'>
              <Typography variant='h6' component='h3' sx={{ fontWeight: 600, color: '#1f2937' }}>
                📰 Xu hướng đọc bài viết theo ngày
              </Typography>
            </div>
            {articleData && !articleLoading && <AnalyticsTrendChart data={articleData.articleTrends} title='' />}
          </CardContent>
        </Card>
      </div>

      {/* Top Products Table - Full Width */}
      <div className='grid grid-cols-1 gap-6 mb-6'>
        {productData && !productLoading && (
          <TopProductsTable
            products={productData.topViewedProducts}
            type='views'
            title='Sản phẩm được xem nhiều nhất'
          />
        )}
      </div>

      {/* Top Articles Table - Full Width */}
      <div className='grid grid-cols-1 gap-6 mb-6'>
        {articleData && !articleLoading && (
          <TopArticlesTable articles={articleData.topArticles || []} title='Bài viết được đọc nhiều nhất' />
        )}
      </div>

      {/* Marketing Action Card */}
      {/* <Box sx={{ mt: 4, mb: 4 }}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '200px',
              height: '200px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              transform: 'translate(50%, -50%)'
            }
          }}
        >
          <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
            <Grid container spacing={3} alignItems='center'>
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      borderRadius: '12px',
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <MdEmail size={24} />
                  </Box>
                  <Typography variant='h5' sx={{ fontWeight: 700 }}>
                    Email Marketing
                  </Typography>
                </Box>

                <Typography variant='body1' sx={{ mb: 2, opacity: 0.9 }}>
                  Tăng doanh số bằng cách gửi email thông báo sản phẩm mới đến khách hàng đã quan tâm
                </Typography>

                <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MdTrendingUp size={18} />
                    <Typography variant='body2' sx={{ opacity: 0.9 }}>
                      Tăng conversion rate
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MdPeople size={18} />
                    <Typography variant='body2' sx={{ opacity: 0.9 }}>
                      Targeting thông minh
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Button
                  variant='contained'
                  size='large'
                  onClick={() => {
                    router.push('/admin/manage-products?openEmailModal=true');
                  }}
                  startIcon={<MdSend />}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '12px',
                    px: 3,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  Gửi Email Marketing
                </Button>

                <Typography variant='caption' sx={{ display: 'block', mt: 1, opacity: 0.8 }}>
                  Chọn sản phẩm và khách hàng để gửi
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box> */}

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

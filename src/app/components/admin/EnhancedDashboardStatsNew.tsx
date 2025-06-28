'use client';

import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Chip, Link as MuiLink, Skeleton } from '@mui/material';
import {
  FaFileInvoiceDollar,
  FaSearchDollar,
  FaUsers,
  FaNewspaper,
  FaExclamationTriangle,
  FaPercentage,
  FaShoppingCart
} from 'react-icons/fa';
import { formatPrice } from '../../../../utils/formatPrice';
import Link from 'next/link';
import StatsCard from '../ui/StatsCard';

interface EnhancedDashboardStatsNewProps {
  ordersCount: number;
  totalRevenue: number;
  clientsCount: number;
  newsData?: {
    totalViews: number;
    topArticles: any[];
    uniqueReaders: number;
  };
  businessAlerts?: any[];
  conversionRate?: number;
  avgOrderValue?: number;
  returnRequestsCount?: number;
  loading?: boolean;
}

/**
 * Professional MUI-based dashboard stats component
 * Replaces hand-coded stats cards with Material-UI implementation
 */
const EnhancedDashboardStatsNew: React.FC<EnhancedDashboardStatsNewProps> = ({
  ordersCount,
  totalRevenue,
  clientsCount,
  newsData,
  businessAlerts = [],
  conversionRate = 0,
  avgOrderValue = 0,
  returnRequestsCount = 0,
  loading = false
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      {/* Primary Stats Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6} lg={4}>
          <StatsCard
            title='Đơn hàng'
            value={ordersCount}
            icon={FaFileInvoiceDollar}
            iconColor='#2563eb' // blue-600
            iconBgColor='#eff6ff' // blue-50
            link={{
              href: '/admin/manage-orders',
              label: 'View All'
            }}
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <StatsCard
            title='Doanh Thu'
            value={formatPrice(totalRevenue)}
            icon={FaSearchDollar}
            iconColor='#16a34a' // green-600
            iconBgColor='#f0fdf4' // green-50
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <StatsCard
            title='Khách hàng'
            value={clientsCount}
            icon={FaUsers}
            iconColor='#ea580c' // orange-600
            iconBgColor='#fff7ed' // orange-50
            link={{
              href: '/admin/manage-users',
              label: 'View All'
            }}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Enhanced Business Metrics Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6} lg={4}>
          <Card
            sx={{
              height: '100%',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display='flex' alignItems='center' gap={2} mb={2}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: '#fef3c7', // yellow-100
                    color: '#f59e0b' // yellow-500
                  }}
                >
                  <FaPercentage size={24} />
                </Box>
                <Box>
                  <Typography variant='body2' color='text.secondary' fontWeight={500}>
                    Tỷ lệ chuyển đổi
                  </Typography>
                  <Typography variant='h5' fontWeight={700} color='#f59e0b'>
                    {loading ? '...' : `${conversionRate.toFixed(1)}%`}
                  </Typography>
                </Box>
              </Box>
              <Typography variant='body2' color='text.secondary'>
                Tỷ lệ khách hàng hoàn thành đơn hàng
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <Card
            sx={{
              height: '100%',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display='flex' alignItems='center' gap={2} mb={2}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: '#e0f2fe', // cyan-50
                    color: '#0891b2' // cyan-600
                  }}
                >
                  <FaShoppingCart size={24} />
                </Box>
                <Box>
                  <Typography variant='body2' color='text.secondary' fontWeight={500}>
                    Giá trị đơn hàng TB
                  </Typography>
                  <Typography variant='h5' fontWeight={700} color='#0891b2'>
                    {loading ? '...' : formatPrice(avgOrderValue)}
                  </Typography>
                </Box>
              </Box>
              <Typography variant='body2' color='text.secondary'>
                Giá trị trung bình mỗi đơn hàng
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <Card
            sx={{
              height: '100%',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display='flex' alignItems='center' gap={2} mb={2}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: '#fef2f2', // red-50
                    color: '#dc2626' // red-600
                  }}
                >
                  <FaExclamationTriangle size={24} />
                </Box>
                <Box>
                  <Typography variant='body2' color='text.secondary' fontWeight={500}>
                    Yêu cầu đổi/trả
                  </Typography>
                  <Typography variant='h5' fontWeight={700} color='#dc2626'>
                    {loading ? '...' : returnRequestsCount}
                  </Typography>
                </Box>
              </Box>
              <Link href='/admin/manage-returns' passHref>
                <MuiLink
                  variant='body2'
                  color='error.main'
                  sx={{
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Xem chi tiết →
                </MuiLink>
              </Link>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* News Analytics Section */}
      {newsData && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={4}>
            <Card
              sx={{
                height: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display='flex' alignItems='center' gap={2} mb={2}>
                  <FaNewspaper size={32} />
                  <Box>
                    <Typography variant='h6' fontWeight={600}>
                      Tin tức hôm nay
                    </Typography>
                    <Typography variant='body2' sx={{ opacity: 0.9 }}>
                      Phân tích nội dung
                    </Typography>
                  </Box>
                </Box>
                <Typography variant='h4' fontWeight={700} mb={1}>
                  {newsData.totalViews.toLocaleString()}
                </Typography>
                <Typography variant='body2' sx={{ opacity: 0.9 }}>
                  Lượt xem • {newsData.uniqueReaders} độc giả
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={8}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant='h6' fontWeight={600} mb={2}>
                  📈 Bài viết nổi bật
                </Typography>
                {newsData.topArticles.length === 0 ? (
                  <Typography variant='body2' color='text.secondary'>
                    Chưa có dữ liệu bài viết
                  </Typography>
                ) : (
                  <Box>
                    {newsData.topArticles.slice(0, 3).map((article, index) => (
                      <Box
                        key={article.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          py: 1,
                          borderBottom: index < 2 ? '1px solid' : 'none',
                          borderColor: 'divider'
                        }}
                      >
                        <Chip label={`#${index + 1}`} size='small' color='primary' sx={{ minWidth: 40 }} />
                        <Box flex={1}>
                          <Typography variant='body2' fontWeight={500} noWrap>
                            {article.title}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {article.views} lượt xem
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Business Alerts */}
      {businessAlerts.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant='h6' fontWeight={600} mb={2}>
            ⚠️ Cảnh báo kinh doanh
          </Typography>
          <Grid container spacing={2}>
            {businessAlerts.map((alert, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card
                  sx={{
                    borderLeft: '4px solid',
                    borderColor: alert.severity === 'high' ? 'error.main' : 'warning.main'
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant='body2' fontWeight={500}>
                      {alert.message}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {alert.timestamp}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default EnhancedDashboardStatsNew;

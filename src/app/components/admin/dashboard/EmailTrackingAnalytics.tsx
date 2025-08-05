'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Tooltip,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  MdExpandMore,
  MdEmail,
  MdTrendingUp,
  MdTrendingDown,
  MdMouse,
  MdPercent,
  MdCampaign,
  MdBarChart,
  MdStar,
  MdInsights,
  MdRefresh,
  MdDateRange,
  MdAttachMoney,
  MdPeople,
  MdTimeline,
  MdVisibility,
  MdShoppingCart
} from 'react-icons/md';
import axios from 'axios';
import toast from 'react-hot-toast';
import moment from 'moment';

interface EmailAnalyticsProps {
  // Remove timeFilter prop - will manage internally
}

interface EmailAnalyticsData {
  overview: {
    totalCampaigns: number;
    totalEmailsSent: number;
    totalClicks: number;
    averageCTR: number;
    deliveryRate: number;
    engagementRate: number;
    totalRevenue: number;
    roi: number;
  };
  campaignPerformance: {
    campaignId: string;
    campaignTitle: string;
    campaignType: string;
    sentAt: string;
    recipientCount: number;
    clickCount: number;
    ctr: number;
    productName?: string;
    status: string;
    engagement: 'high' | 'medium' | 'low';
    trend: 'up' | 'down' | 'stable';
  }[];
  productPerformance: {
    productId: string;
    productName: string;
    categoryName: string;
    campaignCount: number;
    totalEmailsSent: number;
    totalClicks: number;
    ctr: number;
    conversionRate: number;
    revenue: number;
  }[];
  campaignTypeStats: {
    type: string;
    count: number;
    emailsSent: number;
    clicks: number;
    ctr: number;
    avgEngagement: number;
  }[];
  timeAnalysis: {
    period: string;
    campaigns: number;
    emailsSent: number;
    clicks: number;
    ctr: number;
    trend: number;
  }[];
}

const EmailTrackingAnalytics: React.FC<EmailAnalyticsProps> = () => {
  const [data, setData] = useState<EmailAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');
  const [showDateRange, setShowDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  const fetchData = async () => {
    try {
      setIsLoading(true);
      let url;
      if (timeFilter === 'custom' && startDate && endDate) {
        // For custom date range, use startDate and endDate parameters
        url = `/api/marketing/analytics?startDate=${startDate}&endDate=${endDate}`;
      } else {
        // For predefined filters, use days parameter
        url = `/api/marketing/analytics?timeRange=${days}`;
      }
      const response = await axios.get(url);

      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching email analytics:', error);
      toast.error('Không thể tải dữ liệu phân tích email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
    } catch (error) {
      console.error('Error refreshing email analytics:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days, timeFilter, startDate, endDate]); // Include all filter dependencies

  if (!data || !data.overview) {
    return (
      <Card sx={{ mb: 4, borderRadius: '16px', border: '1px solid #e5e7eb' }}>
        <CardContent sx={{ p: 6 }}>
          <div className='flex flex-col items-center justify-center text-center py-12'>
            <div className='w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6'>
              <MdEmail size={40} className='text-gray-400' />
            </div>
            <Typography variant='h5' sx={{ fontWeight: 600, color: '#374151', mb: 2 }}>
              Phân tích Email Marketing
            </Typography>
            <Typography variant='body1' color='textSecondary' sx={{ mb: 4 }}>
              Không có dữ liệu email marketing trong khoảng thời gian này
            </Typography>
            <div className='px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium'>
              💡 Hãy gửi email marketing để bắt đầu theo dõi hiệu suất
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { overview, productPerformance, campaignTypeStats } = data;

  return (
    <Box>
      {/* Time Filter & Refresh Controls */}
      <Card sx={{ mb: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <CardContent sx={{ p: 3 }}>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <MdDateRange size={20} className='text-blue-600' />
              <Typography variant='h6' component='h3' sx={{ fontWeight: 600, color: '#1f2937' }}>
                Bộ lọc thời gian
              </Typography>
            </div>

            <div className='flex items-center gap-3 flex-wrap'>
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

              {/* Date Range Picker */}
              {showDateRange && (
                <>
                  <TextField
                    type='date'
                    label='Từ ngày'
                    size='small'
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 140 }}
                  />
                  <TextField
                    type='date'
                    label='Đến ngày'
                    size='small'
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 140 }}
                  />
                </>
              )}

              {/* Manual Refresh */}
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

      <Card sx={{ mb: 4, borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <CardContent sx={{ p: 0 }}>
          {/* Header Section */}
          <div
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '1.5rem',
              color: 'white'
            }}
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-white/20 backdrop-blur-sm rounded-lg'>
                  <MdEmail size={20} className='text-white' />
                </div>
                <div>
                  <Typography variant='h5' sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                    Phân tích Email Marketing
                  </Typography>
                  <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Theo dõi hiệu suất chiến dịch email marketing trong {days} ngày qua
                  </Typography>
                </div>
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold'>{overview.totalCampaigns}</div>
                <div className='text-xs opacity-90'>Tổng chiến dịch</div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className='p-4'>
            {isLoading ? (
              <div className='flex justify-center items-center py-12'>
                <div className='text-center'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4'></div>
                  <Typography variant='body2' color='textSecondary'>
                    Đang tải dữ liệu phân tích...
                  </Typography>
                </div>
              </div>
            ) : (
              <>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 16px rgba(102, 126, 234, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(102, 126, 234, 0.3)'
                        }
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
                        <div className='flex justify-center mb-2'>
                          <div className='p-2 bg-white/20 rounded-full'>
                            <MdCampaign size={20} />
                          </div>
                        </div>
                        <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '1.5rem' }}>
                          {overview.totalCampaigns?.toLocaleString() || '0'}
                        </Typography>
                        <Typography variant='body2' sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                          Tổng chiến dịch
                        </Typography>
                        <div className='mt-1 text-xs bg-white/20 rounded-full px-2 py-0.5'>Tổng quan</div>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{
                        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                        color: 'white',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 16px rgba(17, 153, 142, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(17, 153, 142, 0.3)'
                        }
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
                        <div className='flex justify-center mb-2'>
                          <div className='p-2 bg-white/20 rounded-full'>
                            <MdEmail size={20} />
                          </div>
                        </div>
                        <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '1.3rem' }}>
                          {overview.totalEmailsSent?.toLocaleString() || '0'}
                        </Typography>
                        <Typography variant='body2' sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                          Email đã gửi
                        </Typography>
                        <div className='mt-1 text-xs bg-white/20 rounded-full px-2 py-0.5'>Tổng gửi</div>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{
                        background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                        color: 'white',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 16px rgba(255, 154, 158, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(255, 154, 158, 0.3)'
                        }
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
                        <div className='flex justify-center mb-2'>
                          <div className='p-2 bg-white/20 rounded-full'>
                            <MdMouse size={20} />
                          </div>
                        </div>
                        <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '1.3rem' }}>
                          {overview.totalClicks?.toLocaleString() || '0'}
                        </Typography>
                        <Typography variant='body2' sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                          Lượt click
                        </Typography>
                        <div className='mt-1 text-xs bg-white/20 rounded-full px-2 py-0.5'>Tương tác</div>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{
                        background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                        color: '#374151',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 16px rgba(168, 237, 234, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(168, 237, 234, 0.3)'
                        }
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
                        <div className='flex justify-center mb-2'>
                          <div className='p-2 bg-white/60 rounded-full'>
                            <MdPercent size={20} className='text-purple-600' />
                          </div>
                        </div>
                        <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '1.5rem' }}>
                          {overview.averageCTR || '0'}%
                        </Typography>
                        <Typography variant='body2' sx={{ opacity: 0.8, fontSize: '0.75rem' }}>
                          CTR trung bình
                        </Typography>
                        <div className='mt-1 text-xs bg-white/60 text-purple-700 rounded-full px-2 py-0.5'>
                          Hiệu suất
                        </div>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Analytics Sections */}
                <div className='px-4 pb-4'>
                  <Grid container spacing={3}>
                    {/* Campaign Performance */}
                    <Grid item xs={12} lg={8}>
                      <Accordion defaultExpanded sx={{ borderRadius: '16px', mb: 3 }}>
                        <AccordionSummary expandIcon={<MdExpandMore />}>
                          <div className='flex items-center gap-2'>
                            <MdBarChart className='text-blue-600' />
                            <Typography variant='h6' sx={{ fontWeight: 600 }}>
                              Hiệu suất chiến dịch
                            </Typography>
                          </div>
                        </AccordionSummary>
                        <AccordionDetails>
                          <TableContainer>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 600 }}>Chiến dịch</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Loại</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Email gửi</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Clicks</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>CTR</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {data.campaignPerformance?.slice(0, 10).map(campaign => (
                                  <TableRow key={campaign.campaignId} hover>
                                    <TableCell>
                                      <div>
                                        <Typography variant='body2' sx={{ fontWeight: 500 }}>
                                          {campaign.campaignTitle || 'Chiến dịch không tên'}
                                        </Typography>
                                        <Typography variant='caption' color='textSecondary'>
                                          {moment(campaign.sentAt).format('DD/MM/YYYY HH:mm')}
                                        </Typography>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        label={campaign.campaignType}
                                        size='small'
                                        variant='outlined'
                                        sx={{
                                          borderColor: '#667eea',
                                          color: '#667eea',
                                          fontSize: '0.7rem'
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant='body2' sx={{ fontWeight: 500 }}>
                                        {campaign.recipientCount.toLocaleString()}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant='body2' sx={{ fontWeight: 500 }}>
                                        {campaign.clickCount.toLocaleString()}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <div className='flex items-center gap-2'>
                                        <Typography variant='body2' sx={{ fontWeight: 500 }}>
                                          {campaign.ctr}%
                                        </Typography>
                                        <LinearProgress
                                          variant='determinate'
                                          value={Math.min(campaign.ctr * 2, 100)}
                                          sx={{
                                            width: 40,
                                            height: 4,
                                            borderRadius: 2,
                                            backgroundColor: '#e5e7eb',
                                            '& .MuiLinearProgress-bar': {
                                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                            }
                                          }}
                                        />
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        label={campaign.status === 'sent' ? 'Đã gửi' : campaign.status}
                                        size='small'
                                        color={campaign.status === 'sent' ? 'success' : 'default'}
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </AccordionDetails>
                      </Accordion>
                    </Grid>

                    {/* Top Products Performance */}
                    <Grid item xs={12} lg={4}>
                      <Accordion defaultExpanded sx={{ borderRadius: '16px', mb: 3 }}>
                        <AccordionSummary expandIcon={<MdExpandMore />}>
                          <div className='flex items-center gap-2'>
                            <MdStar className='text-yellow-600' />
                            <Typography variant='h6' sx={{ fontWeight: 600 }}>
                              Top sản phẩm hiệu quả
                            </Typography>
                          </div>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List dense>
                            {productPerformance.slice(0, 8).map((product, index) => (
                              <ListItem key={product.productId} sx={{ px: 0, py: 1 }}>
                                <div className='flex items-center justify-between w-full'>
                                  <div className='flex items-center gap-3'>
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                                        index === 0
                                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                                          : index === 1
                                          ? 'bg-gradient-to-br from-gray-400 to-gray-600'
                                          : index === 2
                                          ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                                          : 'bg-gradient-to-br from-blue-400 to-blue-600'
                                      }`}
                                    >
                                      {index + 1}
                                    </div>
                                    <div>
                                      <Typography variant='body2' sx={{ fontWeight: 500, lineHeight: 1.2 }}>
                                        {product.productName}
                                      </Typography>
                                      <Typography variant='caption' color='textSecondary'>
                                        {product.categoryName}
                                      </Typography>
                                    </div>
                                  </div>
                                  <div className='text-right'>
                                    <Typography variant='body2' sx={{ fontWeight: 600, color: '#667eea' }}>
                                      {product.ctr}%
                                    </Typography>
                                    <Typography variant='caption' color='textSecondary'>
                                      {product.totalClicks} clicks
                                    </Typography>
                                  </div>
                                </div>
                              </ListItem>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                  </Grid>

                  {/* Campaign Type Performance */}
                  <Accordion sx={{ borderRadius: '16px', mb: 3 }}>
                    <AccordionSummary expandIcon={<MdExpandMore />}>
                      <div className='flex items-center gap-2'>
                        <MdInsights className='text-purple-600' />
                        <Typography variant='h6' sx={{ fontWeight: 600 }}>
                          Hiệu suất theo loại chiến dịch
                        </Typography>
                      </div>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={3}>
                        {campaignTypeStats.map(stat => (
                          <Grid item xs={12} sm={6} md={3} key={stat.type}>
                            <Card
                              sx={{
                                borderRadius: '12px',
                                border: '1px solid #e5e7eb',
                                background:
                                  'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                              }}
                            >
                              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant='h6' sx={{ fontWeight: 600, color: '#667eea', mb: 1 }}>
                                  {stat.type === 'NEW_PRODUCT'
                                    ? 'Sản phẩm mới'
                                    : stat.type === 'VOUCHER_PROMOTION'
                                    ? 'Voucher'
                                    : stat.type === 'CROSS_SELL'
                                    ? 'Gợi ý'
                                    : stat.type}
                                </Typography>
                                <Typography variant='h4' sx={{ fontWeight: 700, color: '#1f2937', mb: 1 }}>
                                  {stat.ctr}%
                                </Typography>
                                <Typography variant='body2' color='textSecondary'>
                                  CTR từ {stat.count} chiến dịch
                                </Typography>
                                <Typography variant='caption' color='textSecondary' sx={{ display: 'block', mt: 1 }}>
                                  {stat.clicks.toLocaleString()} clicks / {stat.emailsSent.toLocaleString()} emails
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmailTrackingAnalytics;

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
  MdTrendingUp,
  MdTrendingDown,
  MdWarning,
  MdInfo,
  MdAssignment,
  MdSwapHoriz,
  MdUndo,
  MdBugReport,
  MdPsychology,
  MdShoppingCart,
  MdAttachMoney,
  MdPercent,
  MdTimeline,
  MdInsights,
  MdRefresh,
  MdDateRange,
  MdFilterList
} from 'react-icons/md';
import axios from 'axios';
import { formatPrice } from '../../../utils/formatPrice';

interface ReturnOrderAnalyticsProps {
  // Remove timeFilter prop - will manage internally
}

interface ReturnAnalyticsData {
  overview: {
    totalReturns: number;
    totalExchanges: number;
    returnRate: number;
    exchangeRate: number;
    totalRefunded: number;
    averageRefundAmount: number;
    totalProcessingTime: number;
    customerSatisfactionRate: number;
  };
  reasonAnalysis: {
    reason: string;
    count: number;
    percentage: number;
    totalRefunded: number;
    averageProcessingTime: number;
    trend: 'up' | 'down' | 'stable';
    businessImpact: 'high' | 'medium' | 'low';
  }[];
  productAnalysis: {
    productId: string;
    productName: string;
    returnCount: number;
    exchangeCount: number;
    returnRate: number;
    totalRefunded: number;
    mainReasons: string[];
    totalSold: number;
    totalRevenue: number;
  }[];
  timeAnalysis: {
    period: string;
    returns: number;
    exchanges: number;
    refunded: number;
    trend: number;
  }[];
  businessInsights: {
    type: 'warning' | 'info' | 'success';
    title: string;
    description: string;
    actionRequired: boolean;
    impact: 'high' | 'medium' | 'low';
  }[];
}

const ReturnOrderAnalytics: React.FC<ReturnOrderAnalyticsProps> = () => {
  const [data, setData] = useState<ReturnAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [timeFilter, setTimeFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
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
        return 30;
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

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchAnalyticsData(), fetchStats()]);
    } catch (error) {
      console.error('Error refreshing return analytics:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
    fetchStats();
  }, [days, timeFilter, startDate, endDate]); // Include all filter dependencies

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let url;
      if (timeFilter === 'custom' && startDate && endDate) {
        // For custom date range, use startDate and endDate parameters
        url = `/api/analytics/returns?startDate=${startDate}&endDate=${endDate}`;
      } else {
        // For predefined filters, use days parameter
        url = `/api/analytics/returns?days=${days}`;
      }

      const response = await axios.get(url);
      setData(response.data);
    } catch (error: any) {
      console.error('Error fetching return analytics:', error);
      setError('Không thể tải dữ liệu phân tích');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      let url;
      if (timeFilter === 'custom' && startDate && endDate) {
        // For custom date range, pass dates to stats API if it supports it
        url = '/api/orders/return-request/admin';
      } else {
        url = '/api/orders/return-request/admin';
      }

      const response = await axios.post(url, {
        action: 'stats',
        // Add filter parameters for stats if needed
        ...(timeFilter === 'custom' && startDate && endDate ? { startDate, endDate } : { days })
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'DEFECTIVE':
        return <MdBugReport className='text-red-500' />;
      case 'WRONG_ITEM':
        return <MdWarning className='text-orange-500' />;
      case 'CHANGE_MIND':
        return <MdPsychology className='text-purple-500' />;
      case 'SIZE_COLOR':
        return <MdSwapHoriz className='text-blue-500' />;
      case 'DIFFERENT_MODEL':
        return <MdShoppingCart className='text-green-500' />;
      default:
        return <MdInfo className='text-gray-500' />;
    }
  };

  const getReasonText = (reason: string) => {
    switch (reason) {
      case 'DEFECTIVE':
        return 'Sản phẩm bị lỗi';
      case 'WRONG_ITEM':
        return 'Giao sai sản phẩm';
      case 'CHANGE_MIND':
        return 'Đổi ý không muốn mua';
      case 'SIZE_COLOR':
        return 'Đổi size/màu';
      case 'DIFFERENT_MODEL':
        return 'Đổi model khác';
      default:
        return reason;
    }
  };

  const getBusinessImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'info';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <MdTrendingUp className='text-red-500' />;
      case 'down':
        return <MdTrendingDown className='text-green-500' />;
      default:
        return <MdTimeline className='text-gray-500' />;
    }
  };

  if (error || !data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error'>{error || 'Không có dữ liệu'}</Alert>
      </Box>
    );
  }

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
          {/* Header Section - Same vibe as VoucherAnalytics */}
          <div className='bg-gradient-to-r from-red-600 via-red-700 to-pink-600 p-4 text-white'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-white/20 backdrop-blur-sm rounded-lg'>
                  <MdInsights size={20} className='text-white' />
                </div>
                <div>
                  <Typography variant='h5' sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                    Phân tích đổi/trả hàng - Góc nhìn kinh doanh
                  </Typography>
                  <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Insights chuyên sâu để tối ưu hóa chất lượng sản phẩm{' '}
                    {timeFilter === 'all' ? 'tất cả thời gian' : `trong ${days} ngày qua`}
                  </Typography>
                </div>
              </div>
              {stats && (
                <div className='text-right'>
                  <div className='text-2xl font-bold'>{stats.total || 0}</div>
                  <div className='text-xs opacity-90'>Tổng yêu cầu</div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards - Moved from ManageReturnsClient */}
          <div className='p-4'>
            {isLoading ? (
              <div className='flex justify-center items-center py-12'>
                <div className='text-center'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4'></div>
                  <Typography variant='body2' color='textSecondary'>
                    Đang tải dữ liệu phân tích...
                  </Typography>
                </div>
              </div>
            ) : stats ? (
              <>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        color: 'white',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 16px rgba(59, 130, 246, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(59, 130, 246, 0.3)'
                        }
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
                        <div className='flex justify-center mb-2'>
                          <div className='p-2 bg-white/20 rounded-full'>
                            <MdAssignment size={20} />
                          </div>
                        </div>
                        <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '1.5rem' }}>
                          {stats.total?.toLocaleString() || '0'}
                        </Typography>
                        <Typography variant='body2' sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                          Tổng yêu cầu
                        </Typography>
                        <div className='mt-1 text-xs bg-white/20 rounded-full px-2 py-0.5'>Tổng quan</div>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: 'white',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 16px rgba(245, 158, 11, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(245, 158, 11, 0.3)'
                        }
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
                        <div className='flex justify-center mb-2'>
                          <div className='p-2 bg-white/20 rounded-full'>
                            <MdTimeline size={20} />
                          </div>
                        </div>
                        <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '1.5rem' }}>
                          {stats.pending?.toLocaleString() || '0'}
                        </Typography>
                        <Typography variant='body2' sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                          Chờ duyệt
                        </Typography>
                        <div className='mt-1 text-xs bg-white/20 rounded-full px-2 py-0.5'>Cần xử lý</div>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)'
                        }
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
                        <div className='flex justify-center mb-2'>
                          <div className='p-2 bg-white/20 rounded-full'>
                            <MdTrendingUp size={20} />
                          </div>
                        </div>
                        <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '1.5rem' }}>
                          {stats.completed?.toLocaleString() || '0'}
                        </Typography>
                        <Typography variant='body2' sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                          Hoàn tất
                        </Typography>
                        <div className='mt-1 text-xs bg-white/20 rounded-full px-2 py-0.5'>Thành công</div>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        color: 'white',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 16px rgba(139, 92, 246, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(139, 92, 246, 0.3)'
                        }
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
                        <div className='flex justify-center mb-2'>
                          <div className='p-2 bg-white/20 rounded-full'>
                            <MdAttachMoney size={20} />
                          </div>
                        </div>
                        <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '1.3rem' }}>
                          {formatPrice(stats.totalRefundAmount || 0)}
                        </Typography>
                        <Typography variant='body2' sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                          Tổng hoàn tiền
                        </Typography>
                        <div className='mt-1 text-xs bg-white/20 rounded-full px-2 py-0.5'>Tài chính</div>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Box sx={{ p: 3 }}>
                  {/* Business Insights - Ưu tiên cao nhất */}
                  {data.businessInsights && data.businessInsights.length > 0 && (
                    <Card sx={{ mb: 3, border: '2px solid #e3f2fd' }}>
                      <CardContent>
                        <Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MdWarning className='text-orange-500' />
                          Insights kinh doanh quan trọng
                        </Typography>
                        <Grid container spacing={2}>
                          {data.businessInsights.map((insight, index) => (
                            <Grid item xs={12} md={6} key={index}>
                              <Alert
                                severity={insight.type}
                                sx={{ height: '100%' }}
                                action={
                                  insight.actionRequired && (
                                    <Chip
                                      label='Cần hành động'
                                      size='small'
                                      color={getBusinessImpactColor(insight.impact) as any}
                                    />
                                  )
                                }
                              >
                                <Typography variant='subtitle2' fontWeight='bold'>
                                  {insight.title}
                                </Typography>
                                <Typography variant='body2'>{insight.description}</Typography>
                              </Alert>
                            </Grid>
                          ))}
                        </Grid>
                      </CardContent>
                    </Card>
                  )}

                  {/* Phân tích theo lý do - Trọng tâm kinh doanh */}
                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<MdExpandMore />}>
                      <Typography variant='h6' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MdAssignment />
                        Phân tích theo lý do đổi/trả
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer component={Paper} sx={{ mb: 2 }}>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                              <TableCell>
                                <strong>Lý do</strong>
                              </TableCell>
                              <TableCell align='center'>
                                <strong>Số lượng</strong>
                              </TableCell>
                              <TableCell align='center'>
                                <strong>Tỷ lệ</strong>
                              </TableCell>
                              <TableCell align='right'>
                                <strong>Tổng hoàn tiền</strong>
                              </TableCell>
                              <TableCell align='center'>
                                <strong>Xu hướng</strong>
                              </TableCell>
                              <TableCell align='center'>
                                <strong>Tác động KD</strong>
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {data.reasonAnalysis.map((reason, index) => (
                              <TableRow key={index} hover>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {getReasonIcon(reason.reason)}
                                    {getReasonText(reason.reason)}
                                  </Box>
                                </TableCell>
                                <TableCell align='center'>
                                  <Chip label={reason.count} size='small' />
                                </TableCell>
                                <TableCell align='center'>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <LinearProgress
                                      variant='determinate'
                                      value={reason.percentage}
                                      sx={{ width: 60, height: 8, borderRadius: 4 }}
                                    />
                                    <Typography variant='body2'>{reason.percentage.toFixed(1)}%</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell align='right'>
                                  <Typography variant='body2' fontWeight='bold' color='error.main'>
                                    {formatPrice(reason.totalRefunded)}
                                  </Typography>
                                </TableCell>
                                <TableCell align='center'>
                                  <Tooltip
                                    title={`Xu hướng ${
                                      reason.trend === 'up' ? 'tăng' : reason.trend === 'down' ? 'giảm' : 'ổn định'
                                    }`}
                                  >
                                    {getTrendIcon(reason.trend)}
                                  </Tooltip>
                                </TableCell>
                                <TableCell align='center'>
                                  <Chip
                                    label={
                                      reason.businessImpact === 'high'
                                        ? 'Cao'
                                        : reason.businessImpact === 'medium'
                                        ? 'Trung bình'
                                        : 'Thấp'
                                    }
                                    size='small'
                                    color={getBusinessImpactColor(reason.businessImpact) as any}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>

                  {/* Phân tích sản phẩm có vấn đề */}
                  <Accordion>
                    <AccordionSummary expandIcon={<MdExpandMore />}>
                      <Typography variant='h6' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MdShoppingCart />
                        Sản phẩm cần chú ý
                        {data.productAnalysis && data.productAnalysis.length > 0 && (
                          <Chip
                            label={`${data.productAnalysis.length} sản phẩm`}
                            size='small'
                            color='warning'
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer component={Paper}>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                              <TableCell>
                                <strong>Sản phẩm</strong>
                              </TableCell>
                              <TableCell align='center'>
                                <strong>Đã bán</strong>
                              </TableCell>
                              <TableCell align='center'>
                                <strong>Trả hàng</strong>
                              </TableCell>
                              <TableCell align='center'>
                                <strong>Đổi hàng</strong>
                              </TableCell>
                              <TableCell align='center'>
                                <strong>Tỷ lệ trả (%)</strong>
                              </TableCell>
                              <TableCell align='right'>
                                <strong>Tổng hoàn tiền</strong>
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {data.productAnalysis && data.productAnalysis.length > 0 ? (
                              data.productAnalysis.map((product, index) => (
                                <TableRow key={index} hover>
                                  <TableCell>
                                    <Box>
                                      <Typography variant='body2' fontWeight='bold'>
                                        {product.productName}
                                      </Typography>
                                      <Typography variant='caption' color='text.secondary'>
                                        ID: {product.productId.substring(0, 8)}...
                                      </Typography>
                                      {product.mainReasons && product.mainReasons.length > 0 && (
                                        <Box sx={{ mt: 0.5 }}>
                                          {product.mainReasons.slice(0, 2).map((reason, idx) => (
                                            <Chip
                                              key={idx}
                                              label={getReasonText(reason)}
                                              size='small'
                                              variant='outlined'
                                              sx={{ mr: 0.5, fontSize: '0.6rem', height: '16px' }}
                                            />
                                          ))}
                                        </Box>
                                      )}
                                    </Box>
                                  </TableCell>
                                  <TableCell align='center'>
                                    <Typography variant='body2' fontWeight='bold' color='primary.main'>
                                      {product.totalSold || 0}
                                    </Typography>
                                    {product.totalRevenue && (
                                      <Typography variant='caption' color='text.secondary' display='block'>
                                        {formatPrice(product.totalRevenue)}
                                      </Typography>
                                    )}
                                  </TableCell>
                                  <TableCell align='center'>
                                    <Chip label={product.returnCount} size='small' color='error' />
                                  </TableCell>
                                  <TableCell align='center'>
                                    <Chip label={product.exchangeCount} size='small' color='warning' />
                                  </TableCell>
                                  <TableCell align='center'>
                                    <Typography
                                      variant='body2'
                                      color={
                                        product.returnRate > 10
                                          ? 'error.main'
                                          : product.returnRate > 5
                                          ? 'warning.main'
                                          : 'success.main'
                                      }
                                      fontWeight='bold'
                                    >
                                      {product.returnRate > 0 ? product.returnRate.toFixed(2) : '0.00'}%
                                    </Typography>
                                    {product.totalSold > 0 && (
                                      <Typography variant='caption' color='text.secondary' display='block'>
                                        {product.returnCount}/{product.totalSold}
                                      </Typography>
                                    )}
                                  </TableCell>
                                  <TableCell align='right'>
                                    <Typography variant='body2' fontWeight='bold' color='error.main'>
                                      {formatPrice(product.totalRefunded)}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} align='center' sx={{ py: 4 }}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <MdShoppingCart size={48} className='text-gray-400 mb-2' />
                                    <Typography variant='body2' color='text.secondary'>
                                      Chưa có dữ liệu sản phẩm cần chú ý
                                    </Typography>
                                    <Typography variant='caption' color='text.secondary'>
                                      Dữ liệu sẽ hiển thị khi có yêu cầu đổi/trả hàng
                                    </Typography>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>

                  {/* Khuyến nghị hành động */}
                  <Card sx={{ mt: 3, background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)' }}>
                    <CardContent>
                      <Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MdPsychology className='text-purple-600' />
                        Khuyến nghị hành động
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemText
                            primary='🎯 Tập trung cải thiện chất lượng sản phẩm'
                            secondary="Ưu tiên các sản phẩm có tỷ lệ trả hàng > 10% và lý do 'Sản phẩm bị lỗi'"
                          />
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemText
                            primary='📋 Cải thiện mô tả sản phẩm'
                            secondary="Giảm thiểu lý do 'Giao sai sản phẩm' và 'Đổi ý không muốn mua'"
                          />
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemText
                            primary='🚀 Tối ưu hóa quy trình đổi hàng'
                            secondary='Khuyến khích đổi hàng thay vì trả hàng để giữ chân khách hàng'
                          />
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemText
                            primary='💰 Theo dõi tác động tài chính'
                            secondary='Thiết lập ngưỡng cảnh báo khi tỷ lệ trả hàng vượt quá 5% doanh thu'
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Box>
              </>
            ) : (
              <div className='flex justify-center items-center py-12'>
                <Typography variant='body2' color='textSecondary'>
                  Không có dữ liệu để hiển thị
                </Typography>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReturnOrderAnalytics;

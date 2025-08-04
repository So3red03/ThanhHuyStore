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
  Avatar,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  MdExpandMore,
  MdTrendingUp,
  MdShoppingCart,
  MdPeople,
  MdAttachMoney,
  MdLocalOffer,
  MdBarChart,
  MdTrendingDown,
  MdInfo,
  MdStar,
  MdVerified,
  MdSearch,
  MdVisibility,
  MdRefresh,
  MdDateRange
} from 'react-icons/md';
import axios from 'axios';
import { formatPrice } from '../../../utils/formatPrice';
import moment from 'moment';

interface VoucherAnalyticsProps {
  // Remove timeFilter prop - will manage internally
}

interface VoucherData {
  id: string;
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  totalUsageCount: number;
  usageInPeriod: number;
  ordersInPeriod: number;
  totalRevenue: number;
  totalDiscount: number;
  averageOrderValue: number;
  conversionRate: number;
  topProducts: any[];
  recentUsers: any[];
  isActive: boolean;
}

const VoucherAnalytics: React.FC<VoucherAnalyticsProps> = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState('7d');
  const [showDateRange, setShowDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // State for voucher table
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherData | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const getDaysFromFilter = (filter: string) => {
    if (filter === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }

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

  const fetchData = async () => {
    try {
      setLoading(true);
      let url;
      if (timeFilter === 'custom' && startDate && endDate) {
        // For custom date range, use startDate and endDate parameters
        url = `/api/admin/voucher-analytics?startDate=${startDate}&endDate=${endDate}`;
      } else {
        // For predefined filters, use days parameter
        url = `/api/admin/voucher-analytics?days=${days}`;
      }
      const response = await axios.get(url);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching voucher analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
    } catch (error) {
      console.error('Error refreshing voucher analytics:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days, timeFilter, startDate, endDate]); // Include all filter dependencies

  // Helper functions for voucher table
  const getFilteredVouchers = () => {
    if (!data?.vouchers) return [];
    return data.vouchers.filter(
      (voucher: VoucherData) =>
        voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voucher.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleViewDetails = (voucher: VoucherData) => {
    setSelectedVoucher(voucher);
    setDetailDialogOpen(true);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (!data || !data.vouchers.length) {
    return (
      <Card sx={{ mb: 4, borderRadius: '16px', border: '1px solid #e5e7eb' }}>
        <CardContent sx={{ p: 6 }}>
          <div className='flex flex-col items-center justify-center text-center py-12'>
            <div className='w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6'>
              <MdLocalOffer size={40} className='text-gray-400' />
            </div>
            <Typography variant='h5' sx={{ fontWeight: 600, color: '#374151', mb: 2 }}>
              Phân tích Voucher & Khuyến mãi
            </Typography>
            <Typography variant='body1' color='textSecondary' sx={{ mb: 4 }}>
              Không có dữ liệu voucher trong khoảng thời gian này
            </Typography>
            <div className='px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium'>
              💡 Hãy tạo voucher mới để bắt đầu theo dõi hiệu suất
            </div>
          </div>
        </CardContent>
      </Card>
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
          {/* Compact Header Section */}
          <div className='bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 p-4 text-white'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-white/20 backdrop-blur-sm rounded-lg'>
                  <MdLocalOffer size={20} className='text-white' />
                </div>
                <div>
                  <Typography variant='h5' sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                    Phân tích Voucher & Khuyến mãi
                  </Typography>
                  <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Báo cáo chi tiết hiệu suất voucher trong {days} ngày qua
                  </Typography>
                </div>
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold'>{data.vouchers.length}</div>
                <div className='text-xs opacity-90'>Voucher đang theo dõi</div>
              </div>
            </div>
          </div>

          {/* Compact Summary Cards */}
          <div className='p-4'>
            {loading ? (
              <div className='flex justify-center items-center py-12'>
                <div className='text-center'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4'></div>
                  <Typography variant='body2' color='textSecondary'>
                    Đang tải dữ liệu voucher...
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
                            <MdShoppingCart size={20} />
                          </div>
                        </div>
                        <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '1.5rem' }}>
                          {data.summary.totalUsage?.toLocaleString() || '0'}
                        </Typography>
                        <Typography variant='body2' sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                          Lượt sử dụng
                        </Typography>
                        <div className='mt-1 text-xs bg-white/20 rounded-full px-2 py-0.5'>Tổng tương tác</div>
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
                            <MdAttachMoney size={20} />
                          </div>
                        </div>
                        <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '1.3rem' }}>
                          {formatPrice(data.summary.totalRevenue)}
                        </Typography>
                        <Typography variant='body2' sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                          Doanh thu tạo ra
                        </Typography>
                        <div className='mt-1 text-xs bg-white/20 rounded-full px-2 py-0.5'>Tổng thu nhập</div>
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
                            <MdTrendingDown size={20} />
                          </div>
                        </div>
                        <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '1.3rem' }}>
                          {formatPrice(data.summary.totalDiscount)}
                        </Typography>
                        <Typography variant='body2' sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                          Tổng giảm giá
                        </Typography>
                        <div className='mt-1 text-xs bg-white/20 rounded-full px-2 py-0.5'>Tiết kiệm khách hàng</div>
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
                            <MdVerified size={20} className='text-purple-600' />
                          </div>
                        </div>
                        <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '1.5rem' }}>
                          {data.summary.activeVouchers || '0'}
                        </Typography>
                        <Typography variant='body2' sx={{ opacity: 0.8, fontSize: '0.75rem' }}>
                          Voucher hoạt động
                        </Typography>
                        <div className='mt-1 text-xs bg-white/60 text-purple-700 rounded-full px-2 py-0.5'>
                          Đang chạy
                        </div>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Compact Top Products Section */}
                <div className='px-4 pb-3'>
                  <Card
                    sx={{
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <div className='flex items-center gap-3 mb-4'>
                        <div className='p-2 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg'>
                          <MdStar size={24} className='text-yellow-600' />
                        </div>
                        <div>
                          <Typography variant='h6' sx={{ fontWeight: 600, color: '#1f2937' }}>
                            Sản phẩm được áp dụng voucher nhiều nhất
                          </Typography>
                          <Typography variant='body2' color='textSecondary'>
                            Top 10 sản phẩm có hiệu suất voucher tốt nhất
                          </Typography>
                        </div>
                      </div>

                      <div className='overflow-x-auto'>
                        <Table size='small' sx={{ minWidth: 650 }}>
                          <TableHead>
                            <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                              <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Sản phẩm</TableCell>
                              <TableCell align='right' sx={{ fontWeight: 600, color: '#374151' }}>
                                Số lượng bán
                              </TableCell>
                              <TableCell align='right' sx={{ fontWeight: 600, color: '#374151' }}>
                                Số đơn hàng
                              </TableCell>
                              <TableCell align='right' sx={{ fontWeight: 600, color: '#374151' }}>
                                Voucher áp dụng
                              </TableCell>
                              <TableCell align='right' sx={{ fontWeight: 600, color: '#374151' }}>
                                Giá
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {data.topProducts.slice(0, 10).map((product: any, index: number) => (
                              <TableRow
                                key={product.id}
                                sx={{
                                  '&:hover': { backgroundColor: '#f8fafc' },
                                  borderBottom: '1px solid #e5e7eb'
                                }}
                              >
                                <TableCell>
                                  <div className='flex items-center gap-3'>
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                        index === 0
                                          ? 'bg-yellow-500'
                                          : index === 1
                                          ? 'bg-gray-400'
                                          : index === 2
                                          ? 'bg-orange-500'
                                          : 'bg-blue-500'
                                      }`}
                                    >
                                      {index + 1}
                                    </div>
                                    <Typography variant='body2' sx={{ fontWeight: 'medium', color: '#1f2937' }}>
                                      {product.name}
                                    </Typography>
                                  </div>
                                </TableCell>
                                <TableCell align='right'>
                                  <span className='font-semibold text-blue-600'>{product.quantity}</span>
                                </TableCell>
                                <TableCell align='right'>
                                  <span className='font-semibold text-green-600'>{product.orderCount}</span>
                                </TableCell>
                                <TableCell align='right'>
                                  <span className='font-semibold text-purple-600'>{product.voucherCount}</span>
                                </TableCell>
                                <TableCell align='right'>
                                  <span className='font-semibold text-gray-900'>{formatPrice(product.price)}</span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Enhanced Voucher Details */}
                <div className='px-6 pb-6'>
                  <Card
                    sx={{
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <div className='flex items-center gap-3 mb-4'>
                        <div className='p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg'>
                          <MdLocalOffer size={24} className='text-purple-600' />
                        </div>
                        <div>
                          <Typography variant='h6' sx={{ fontWeight: 600, color: '#1f2937' }}>
                            Chi tiết từng Voucher
                          </Typography>
                          <Typography variant='body2' color='textSecondary'>
                            Phân tích hiệu suất chi tiết cho từng voucher
                          </Typography>
                        </div>
                      </div>

                      {/* Search and Filter */}
                      <div className='mb-4'>
                        <TextField
                          fullWidth
                          size='small'
                          placeholder='Tìm kiếm voucher theo mã hoặc mô tả...'
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position='start'>
                                <MdSearch className='text-gray-400' />
                              </InputAdornment>
                            )
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px'
                            }
                          }}
                        />
                      </div>

                      {/* Voucher Table */}
                      <TableContainer component={Paper} sx={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <Table size='small'>
                          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Mã Voucher</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Giảm giá</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Lượt sử dụng</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Doanh thu</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Tỷ lệ chuyển đổi</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Thao tác</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {getFilteredVouchers()
                              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                              .map((voucher: VoucherData, index: number) => (
                                <TableRow key={voucher.id} hover>
                                  <TableCell>
                                    <div className='flex items-center gap-2'>
                                      <Typography variant='body2' sx={{ fontWeight: 600, color: '#1f2937' }}>
                                        {voucher.code}
                                      </Typography>
                                    </div>
                                    <Typography variant='caption' color='textSecondary'>
                                      {voucher.description}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={voucher.isActive ? 'Hoạt động' : 'Tạm dừng'}
                                      color={voucher.isActive ? 'success' : 'default'}
                                      size='small'
                                      sx={{ fontSize: '0.7rem' }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant='body2' sx={{ fontWeight: 500 }}>
                                      {voucher.discountType === 'PERCENTAGE'
                                        ? `${voucher.discountValue}%`
                                        : formatPrice(voucher.discountValue)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant='body2' sx={{ fontWeight: 600, color: '#3b82f6' }}>
                                      {voucher.usageInPeriod}
                                    </Typography>
                                    <Typography variant='caption' color='textSecondary'>
                                      / {voucher.totalUsageCount} tổng
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant='body2' sx={{ fontWeight: 600, color: '#10b981' }}>
                                      {formatPrice(voucher.totalRevenue)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant='body2' sx={{ fontWeight: 500 }}>
                                      {voucher.conversionRate.toFixed(1)}%
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <IconButton
                                      size='small'
                                      onClick={() => handleViewDetails(voucher)}
                                      sx={{ color: '#3b82f6' }}
                                    >
                                      <MdVisibility size={16} />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      {/* Pagination */}
                      <TablePagination
                        component='div'
                        count={getFilteredVouchers().length}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[5, 10, 25]}
                        labelRowsPerPage='Số dòng mỗi trang:'
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
                      />
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog - Outside loading condition */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Chi tiết Voucher</DialogTitle>
        <DialogContent>
          {selectedVoucher && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                  <Typography variant='h6' gutterBottom>
                    Thông tin cơ bản
                  </Typography>
                  <div className='space-y-2'>
                    <div>
                      <strong>Mã:</strong> {selectedVoucher.code}
                    </div>
                    <div>
                      <strong>Loại:</strong>{' '}
                      {selectedVoucher.discountType === 'PERCENTAGE' ? 'Phần trăm' : 'Số tiền cố định'}
                    </div>
                    <div>
                      <strong>Giá trị:</strong>{' '}
                      {selectedVoucher.discountType === 'PERCENTAGE'
                        ? `${selectedVoucher.discountValue}%`
                        : formatPrice(selectedVoucher.discountValue)}
                    </div>
                    <div>
                      <strong>Mô tả:</strong> {selectedVoucher.description || 'Không có mô tả'}
                    </div>
                    <div>
                      <strong>Trạng thái:</strong> {selectedVoucher.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                    </div>
                  </div>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2, bgcolor: '#f0f9ff' }}>
                  <Typography variant='h6' gutterBottom>
                    Thống kê sử dụng
                  </Typography>
                  <div className='space-y-2'>
                    <div>
                      <strong>Tổng lượt sử dụng:</strong> {selectedVoucher.totalUsageCount}
                    </div>
                    <div>
                      <strong>Sử dụng trong kỳ:</strong> {selectedVoucher.usageInPeriod}
                    </div>
                    <div>
                      <strong>Tỷ lệ chuyển đổi:</strong> {selectedVoucher.conversionRate.toFixed(1)}%
                    </div>
                    <div>
                      <strong>Doanh thu tạo ra:</strong> {formatPrice(selectedVoucher.totalRevenue)}
                    </div>
                    <div>
                      <strong>Tiết kiệm cho khách:</strong> {formatPrice(selectedVoucher.totalDiscount)}
                    </div>
                    <div>
                      <strong>Đơn hàng trung bình:</strong> {formatPrice(selectedVoucher.averageOrderValue)}
                    </div>
                  </div>
                </Card>
              </Grid>
              {selectedVoucher.topProducts && selectedVoucher.topProducts.length > 0 && (
                <Grid item xs={12}>
                  <Card sx={{ p: 2 }}>
                    <Typography variant='h6' gutterBottom>
                      Top sản phẩm được mua với voucher này
                    </Typography>
                    <div className='space-y-2'>
                      {selectedVoucher.topProducts.map((product: any, index: number) => (
                        <div key={index} className='flex items-center gap-3 p-2 bg-gray-50 rounded'>
                          <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm'>
                            {index + 1}
                          </div>
                          <div className='flex-1'>
                            <div className='font-medium text-sm'>{product.name}</div>
                            <div className='text-xs text-gray-500'>
                              {product.quantity} sản phẩm • {product.orderCount} đơn hàng
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VoucherAnalytics;

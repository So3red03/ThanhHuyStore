'use client';

import React, { useState, useEffect } from 'react';
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
  Button
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
  MdVisibility
} from 'react-icons/md';
import axios from 'axios';
import { formatPrice } from '../../../../utils/formatPrice';
import moment from 'moment';

interface VoucherAnalyticsProps {
  timeFilter: string;
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

const VoucherAnalytics: React.FC<VoucherAnalyticsProps> = ({ timeFilter }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // State for voucher table
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherData | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

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
        return 30;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const days = getDaysFromFilter(timeFilter);
        const response = await axios.get(`/api/admin/voucher-analytics?days=${days}`);
        setData(response.data);
      } catch (error) {
        console.error('Error fetching voucher analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeFilter]);

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

  if (loading) {
    return (
      <Card sx={{ mb: 6, borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <CardContent sx={{ p: 6 }}>
          <div className='flex items-center gap-3 mb-6'>
            <div className='p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl'>
              <MdLocalOffer size={24} className='text-purple-600' />
            </div>
            <div>
              <Typography variant='h5' sx={{ fontWeight: 700, color: '#1f2937', mb: 1 }}>
                Phân tích Voucher & Khuyến mãi
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                Đang tải dữ liệu chi tiết...
              </Typography>
            </div>
          </div>
          <div className='space-y-3'>
            <div className='h-4 bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 rounded-full animate-pulse'></div>
            <div className='h-4 bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 rounded-full animate-pulse w-3/4'></div>
            <div className='h-4 bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 rounded-full animate-pulse w-1/2'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
                  Báo cáo chi tiết hiệu suất voucher trong {getDaysFromFilter(timeFilter)} ngày qua
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
                  <div className='mt-1 text-xs bg-white/20 rounded-full px-2 py-0.5'>🎯 Tổng tương tác</div>
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
                  <div className='mt-1 text-xs bg-white/20 rounded-full px-2 py-0.5'>💰 Tổng thu nhập</div>
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
                  <div className='mt-1 text-xs bg-white/20 rounded-full px-2 py-0.5'>🎁 Tiết kiệm khách hàng</div>
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
                  <div className='mt-1 text-xs bg-white/60 text-purple-700 rounded-full px-2 py-0.5'>✅ Đang chạy</div>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </div>

        {/* Compact Top Products Section */}
        <div className='px-4 pb-3'>
          <Card
            sx={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
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
            sx={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
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

        {/* Detail Dialog */}
        <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth='md' fullWidth>
          <DialogTitle>
            <div className='flex items-center justify-between'>
              <Typography variant='h6' sx={{ fontWeight: 600 }}>
                Chi tiết Voucher: {selectedVoucher?.code}
              </Typography>
              <IconButton onClick={() => setDetailDialogOpen(false)}>
                <MdExpandMore style={{ transform: 'rotate(180deg)' }} />
              </IconButton>
            </div>
          </DialogTitle>
          <DialogContent>
            {selectedVoucher && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, backgroundColor: '#f8fafc' }}>
                    <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 2 }}>
                      📈 Thống kê sử dụng
                    </Typography>
                    <div className='space-y-2'>
                      <div className='flex justify-between'>
                        <span>Tổng lượt sử dụng:</span>
                        <strong>{selectedVoucher.totalUsageCount}</strong>
                      </div>
                      <div className='flex justify-between'>
                        <span>Sử dụng trong kỳ:</span>
                        <strong>{selectedVoucher.usageInPeriod}</strong>
                      </div>
                      <div className='flex justify-between'>
                        <span>Tỷ lệ chuyển đổi:</span>
                        <strong>{selectedVoucher.conversionRate.toFixed(1)}%</strong>
                      </div>
                      <div className='flex justify-between'>
                        <span>Đơn hàng trung bình:</span>
                        <strong>{formatPrice(selectedVoucher.averageOrderValue)}</strong>
                      </div>
                    </div>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, backgroundColor: '#f8fafc' }}>
                    <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 2 }}>
                      🛍️ Sản phẩm phổ biến
                    </Typography>
                    <div className='space-y-2'>
                      {selectedVoucher.topProducts.slice(0, 5).map((product: any, index: number) => (
                        <div key={product.id} className='flex items-center gap-2 p-2 bg-white rounded'>
                          <div className='w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold'>
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
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)}>Đóng</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default VoucherAnalytics;

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
  Tooltip
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
  MdVerified
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
                📊 Phân tích Voucher & Khuyến mãi
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
              📊 Phân tích Voucher & Khuyến mãi
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
        {/* Header Section */}
        <div className='bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 p-6 text-white'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div className='p-3 bg-white/20 backdrop-blur-sm rounded-xl'>
                <MdLocalOffer size={28} className='text-white' />
              </div>
              <div>
                <Typography variant='h4' sx={{ fontWeight: 700, color: 'white', mb: 1 }}>
                  📊 Phân tích Voucher & Khuyến mãi
                </Typography>
                <Typography variant='body1' sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Báo cáo chi tiết hiệu suất voucher trong {getDaysFromFilter(timeFilter)} ngày qua
                </Typography>
              </div>
            </div>
            <div className='text-right'>
              <div className='text-3xl font-bold'>{data.vouchers.length}</div>
              <div className='text-sm opacity-90'>Voucher đang theo dõi</div>
            </div>
          </div>
        </div>

        {/* Enhanced Summary Cards */}
        <div className='p-6'>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '16px',
                  border: 'none',
                  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)'
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <div className='flex justify-center mb-3'>
                    <div className='p-3 bg-white/20 rounded-full'>
                      <MdShoppingCart size={28} />
                    </div>
                  </div>
                  <Typography variant='h3' sx={{ fontWeight: 'bold', mb: 1 }}>
                    {data.summary.totalUsage?.toLocaleString() || '0'}
                  </Typography>
                  <Typography variant='body2' sx={{ opacity: 0.9 }}>
                    Lượt sử dụng
                  </Typography>
                  <div className='mt-2 text-xs bg-white/20 rounded-full px-3 py-1'>🎯 Tổng tương tác</div>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  color: 'white',
                  borderRadius: '16px',
                  border: 'none',
                  boxShadow: '0 8px 32px rgba(17, 153, 142, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(17, 153, 142, 0.4)'
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <div className='flex justify-center mb-3'>
                    <div className='p-3 bg-white/20 rounded-full'>
                      <MdAttachMoney size={28} />
                    </div>
                  </div>
                  <Typography variant='h3' sx={{ fontWeight: 'bold', mb: 1, fontSize: '1.8rem' }}>
                    {formatPrice(data.summary.totalRevenue)}
                  </Typography>
                  <Typography variant='body2' sx={{ opacity: 0.9 }}>
                    Doanh thu tạo ra
                  </Typography>
                  <div className='mt-2 text-xs bg-white/20 rounded-full px-3 py-1'>💰 Tổng thu nhập</div>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                  color: 'white',
                  borderRadius: '16px',
                  border: 'none',
                  boxShadow: '0 8px 32px rgba(255, 154, 158, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(255, 154, 158, 0.4)'
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <div className='flex justify-center mb-3'>
                    <div className='p-3 bg-white/20 rounded-full'>
                      <MdTrendingDown size={28} />
                    </div>
                  </div>
                  <Typography variant='h3' sx={{ fontWeight: 'bold', mb: 1, fontSize: '1.8rem' }}>
                    {formatPrice(data.summary.totalDiscount)}
                  </Typography>
                  <Typography variant='body2' sx={{ opacity: 0.9 }}>
                    Tổng giảm giá
                  </Typography>
                  <div className='mt-2 text-xs bg-white/20 rounded-full px-3 py-1'>🎁 Tiết kiệm khách hàng</div>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                  color: '#374151',
                  borderRadius: '16px',
                  border: 'none',
                  boxShadow: '0 8px 32px rgba(168, 237, 234, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(168, 237, 234, 0.4)'
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <div className='flex justify-center mb-3'>
                    <div className='p-3 bg-white/60 rounded-full'>
                      <MdVerified size={28} className='text-purple-600' />
                    </div>
                  </div>
                  <Typography variant='h3' sx={{ fontWeight: 'bold', mb: 1 }}>
                    {data.summary.activeVouchers || '0'}
                  </Typography>
                  <Typography variant='body2' sx={{ opacity: 0.8 }}>
                    Voucher hoạt động
                  </Typography>
                  <div className='mt-2 text-xs bg-white/60 text-purple-700 rounded-full px-3 py-1'>✅ Đang chạy</div>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </div>

        {/* Enhanced Top Products Section */}
        <div className='px-6 pb-4'>
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
                    🏆 Sản phẩm được áp dụng voucher nhiều nhất
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
                    🎫 Chi tiết từng Voucher
                  </Typography>
                  <Typography variant='body2' color='textSecondary'>
                    Phân tích hiệu suất chi tiết cho từng voucher
                  </Typography>
                </div>
              </div>

              <div className='space-y-3'>
                {data.vouchers.map((voucher: VoucherData, index: number) => (
                  <Accordion
                    key={voucher.id}
                    sx={{
                      borderRadius: '12px !important',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      '&:before': { display: 'none' },
                      '&.Mui-expanded': {
                        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<MdExpandMore />}
                      sx={{
                        borderRadius: '12px',
                        '&.Mui-expanded': {
                          borderBottomLeftRadius: 0,
                          borderBottomRightRadius: 0
                        }
                      }}
                    >
                      <div className='flex items-center justify-between w-full pr-4'>
                        <div className='flex items-center gap-3'>
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                              voucher.isActive ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <Typography variant='subtitle1' sx={{ fontWeight: 'bold', color: '#1f2937' }}>
                              {voucher.code}
                            </Typography>
                            <div className='flex items-center gap-2 mt-1'>
                              <Chip
                                label={voucher.isActive ? '✅ Hoạt động' : '⏸️ Tạm dừng'}
                                color={voucher.isActive ? 'success' : 'default'}
                                size='small'
                                sx={{ fontSize: '0.75rem' }}
                              />
                              <span className='text-xs text-gray-500'>
                                {voucher.discountType === 'PERCENTAGE'
                                  ? `${voucher.discountValue}%`
                                  : formatPrice(voucher.discountValue)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className='text-right'>
                          <div className='text-lg font-bold text-blue-600'>{voucher.usageInPeriod}</div>
                          <div className='text-xs text-gray-500'>lượt sử dụng</div>
                          <div className='text-sm font-semibold text-green-600'>
                            {formatPrice(voucher.totalRevenue)}
                          </div>
                        </div>
                      </div>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 4, backgroundColor: '#f8fafc' }}>
                      <Grid container spacing={4}>
                        <Grid item xs={12} md={6}>
                          <div className='bg-white rounded-lg p-4 border border-gray-200'>
                            <Typography
                              variant='subtitle2'
                              gutterBottom
                              sx={{ fontWeight: 600, color: '#374151', mb: 3 }}
                            >
                              📈 Thống kê sử dụng
                            </Typography>
                            <div className='space-y-3'>
                              <div className='flex justify-between items-center p-2 bg-blue-50 rounded-lg'>
                                <span className='text-sm font-medium text-gray-700'>Tổng lượt sử dụng</span>
                                <span className='font-bold text-blue-600'>{voucher.totalUsageCount} lượt</span>
                              </div>
                              <div className='flex justify-between items-center p-2 bg-green-50 rounded-lg'>
                                <span className='text-sm font-medium text-gray-700'>Sử dụng trong kỳ</span>
                                <span className='font-bold text-green-600'>{voucher.usageInPeriod} lượt</span>
                              </div>
                              <div className='flex justify-between items-center p-2 bg-purple-50 rounded-lg'>
                                <span className='text-sm font-medium text-gray-700'>Tỷ lệ chuyển đổi</span>
                                <span className='font-bold text-purple-600'>{voucher.conversionRate.toFixed(1)}%</span>
                              </div>
                              <div className='flex justify-between items-center p-2 bg-orange-50 rounded-lg'>
                                <span className='text-sm font-medium text-gray-700'>Đơn hàng TB</span>
                                <span className='font-bold text-orange-600'>
                                  {formatPrice(voucher.averageOrderValue)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <div className='bg-white rounded-lg p-4 border border-gray-200'>
                            <Typography
                              variant='subtitle2'
                              gutterBottom
                              sx={{ fontWeight: 600, color: '#374151', mb: 3 }}
                            >
                              🛍️ Sản phẩm phổ biến
                            </Typography>
                            <div className='space-y-2'>
                              {voucher.topProducts.slice(0, 3).map((product: any, productIndex: number) => (
                                <div key={product.id} className='flex items-center gap-3 p-2 bg-gray-50 rounded-lg'>
                                  <div className='w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold'>
                                    {productIndex + 1}
                                  </div>
                                  <div className='flex-1'>
                                    <div className='font-medium text-gray-900 text-sm'>{product.name}</div>
                                    <div className='text-xs text-gray-500'>
                                      {product.quantity} sản phẩm • {product.orderCount} đơn hàng
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoucherAnalytics;

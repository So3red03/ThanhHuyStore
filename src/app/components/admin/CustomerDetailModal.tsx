'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Card,
  CardContent,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
  Alert,
  Grid,
  Paper
} from '@mui/material';
import {
  MdClose,
  MdPerson,
  MdEmail,
  MdShoppingCart,
  MdAttachMoney,
  MdCalendarToday,
  MdTrendingUp,
  MdStar
} from 'react-icons/md';
import axios from 'axios';
import toast from 'react-hot-toast';

interface CustomerDetailModalProps {
  open: boolean;
  onClose: () => void;
  customer: any;
}

interface CustomerSegment {
  id: string;
  name: string;
  color: string;
  description: string;
}

const CUSTOMER_SEGMENTS: CustomerSegment[] = [
  {
    id: 'vip_customers',
    name: 'Khách VIP',
    color: '#9c27b0',
    description: 'Chi tiêu > 5M, đặt hàng thường xuyên'
  },
  {
    id: 'new_customers',
    name: 'Khách mới',
    color: '#4caf50',
    description: 'Đăng ký gần đây, ít đơn hàng'
  },
  {
    id: 'at_risk_customers',
    name: 'Có nguy cơ rời bỏ',
    color: '#f44336',
    description: 'Không mua hàng trong 90 ngày'
  }
];

const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({ open, onClose, customer }) => {
  const [customerDetail, setCustomerDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (open && customer?.id) {
      fetchCustomerDetail();
    }
  }, [open, customer?.id]);

  const fetchCustomerDetail = async () => {
    setLoading(true);
    try {
      console.log('🔍 [DEBUG] Fetching customer detail for:', customer.id);

      // Fetch customer detail with orders using the correct API
      const customerResponse = await axios.get(`/api/analytics/customer-detail?userId=${customer.id}`);
      console.log('✅ [DEBUG] Customer detail response:', customerResponse.data);

      if (customerResponse.data.success) {
        const { data } = customerResponse.data;
        setCustomerDetail(data.user);
        setOrders(data.recentOrders || []);
        setProducts(data.products || []);
        setCategories(data.categories || []);
      } else {
        throw new Error('Failed to fetch customer data');
      }
    } catch (error: any) {
      console.error('❌ [DEBUG] Error fetching customer detail:', error);
      toast.error('Không thể tải chi tiết khách hàng');
      // Fallback to basic customer data
      setCustomerDetail(customer);
      setOrders([]);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate customer metrics
  const calculateMetrics = () => {
    if (!customerDetail) return null;

    // Use data from customerDetail
    const totalSpent = customerDetail.totalSpent || 0;
    const orderCount = customerDetail.totalOrders || 0;
    const lastOrderDate = customerDetail.lastOrderDate ? new Date(customerDetail.lastOrderDate) : null;
    const daysSinceLastOrder = lastOrderDate
      ? Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      totalSpent,
      orderCount,
      lastOrderDate,
      daysSinceLastOrder
    };
  };

  // Determine customer segment
  const determineSegment = () => {
    const metrics = calculateMetrics();
    if (!metrics) return null;

    const { totalSpent, orderCount, daysSinceLastOrder } = metrics;

    if (totalSpent > 5000000 && orderCount >= 3 && (daysSinceLastOrder === null || daysSinceLastOrder <= 60)) {
      return CUSTOMER_SEGMENTS.find(s => s.id === 'vip_customers');
    } else if (orderCount <= 2 && (daysSinceLastOrder === null || daysSinceLastOrder <= 30)) {
      return CUSTOMER_SEGMENTS.find(s => s.id === 'new_customers');
    } else if (daysSinceLastOrder !== null && daysSinceLastOrder >= 90 && orderCount >= 1) {
      return CUSTOMER_SEGMENTS.find(s => s.id === 'at_risk_customers');
    }

    return null;
  };

  const metrics = calculateMetrics();
  const segment = determineSegment();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '16px',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
            <MdPerson />
          </Avatar>
          <Box>
            <Typography variant='h6' sx={{ fontWeight: 700 }}>
              Chi tiết khách hàng
            </Typography>
            <Typography variant='body2' sx={{ opacity: 0.9 }}>
              {customer?.name || 'Khách hàng'}
            </Typography>
          </Box>
        </Box>
        <Button onClick={onClose} sx={{ color: 'white', minWidth: 'auto', p: 1 }}>
          <MdClose />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {/* Customer Info */}
            <Card sx={{ mb: 3, borderRadius: '12px' }}>
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <MdEmail color='#666' />
                      <Typography variant='body2' color='text.secondary'>
                        Email: {customer?.email || 'Không có'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <MdCalendarToday color='#666' />
                      <Typography variant='body2' color='text.secondary'>
                        Đăng ký:{' '}
                        {customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString('vi-VN') : 'Không rõ'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    {segment && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant='body2' sx={{ mb: 1, fontWeight: 600 }}>
                          Phân khúc khách hàng:
                        </Typography>
                        <Chip
                          label={segment.name}
                          sx={{
                            backgroundColor: segment.color,
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                        <Typography variant='caption' sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                          {segment.description}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Metrics */}
            {metrics && (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', borderRadius: '12px' }}>
                    <MdShoppingCart size={24} color='#2196f3' />
                    <Typography variant='h6' sx={{ fontWeight: 600, mt: 1 }}>
                      {metrics.orderCount}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Đơn hàng
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', borderRadius: '12px' }}>
                    <MdAttachMoney size={24} color='#4caf50' />
                    <Typography variant='h6' sx={{ fontWeight: 600, mt: 1 }}>
                      {metrics.totalSpent.toLocaleString()}đ
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Tổng chi tiêu
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', borderRadius: '12px' }}>
                    <MdTrendingUp size={24} color='#ff9800' />
                    <Typography variant='h6' sx={{ fontWeight: 600, mt: 1 }}>
                      {metrics.orderCount > 0
                        ? Math.round(metrics.totalSpent / metrics.orderCount).toLocaleString()
                        : 0}
                      đ
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Giá trị TB/đơn
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', borderRadius: '12px' }}>
                    <MdCalendarToday size={24} color='#9c27b0' />
                    <Typography variant='h6' sx={{ fontWeight: 600, mt: 1 }}>
                      {metrics.daysSinceLastOrder !== null ? `${metrics.daysSinceLastOrder} ngày` : 'Chưa có'}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Lần mua cuối
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <Card sx={{ mb: 3, borderRadius: '12px' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant='h6'
                    sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <MdStar color='#ffc107' />
                    Danh mục đã mua ({categories.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    {categories.map((category: any, index: number) => (
                      <Chip
                        key={index}
                        label={category.name || category}
                        variant='outlined'
                        sx={{
                          borderColor: '#2196f3',
                          color: '#2196f3',
                          fontWeight: 500,
                          '&:hover': {
                            backgroundColor: '#e3f2fd'
                          }
                        }}
                      />
                    ))}
                  </Box>
                  <Typography
                    variant='caption'
                    sx={{ display: 'block', mt: 2, color: 'text.secondary', fontStyle: 'italic' }}
                  >
                    💡 Thông tin này giúp phân khúc khách hàng cho chiến dịch email marketing
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Product History */}
            <Card sx={{ borderRadius: '12px' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant='h6' sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MdShoppingCart color='#1976d2' />
                  Lịch sử sản phẩm ({products.length})
                </Typography>
                {products.length > 0 && (
                  <Typography variant='caption' sx={{ display: 'block', mb: 2, color: 'text.secondary' }}>
                    Tất cả sản phẩm đã mua (sắp xếp theo thời gian mua gần nhất)
                  </Typography>
                )}
                {products.length === 0 ? (
                  <Alert severity='info'>Khách hàng chưa mua sản phẩm nào</Alert>
                ) : (
                  <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
                    {products.map((product, index) => (
                      <ListItem key={product.id || index} sx={{ px: 0, py: 1.5 }}>
                        <ListItemAvatar>
                          <Avatar src={product.thumbnail} sx={{ bgcolor: '#e3f2fd', width: 50, height: 50 }}>
                            <MdShoppingCart color='#1976d2' />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                                {product.name}
                              </Typography>
                              <Chip
                                label={`${(product.price || 0).toLocaleString()}đ`}
                                size='small'
                                color='primary'
                                variant='outlined'
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant='caption' color='text.secondary'>
                                Danh mục: {product.category} • Mua lần cuối:{' '}
                                {new Date(product.firstPurchased).toLocaleDateString('vi-VN')}
                              </Typography>
                              <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                                Tổng số lượng đã mua: {product.totalQuantity}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #e5e7eb' }}>
        <Button onClick={onClose} variant='outlined' sx={{ borderRadius: '8px' }}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerDetailModal;

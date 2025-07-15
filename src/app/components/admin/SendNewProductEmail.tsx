'use client';

import { useState, useEffect } from 'react';
import { Product } from '@prisma/client';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Box,
  Chip,
  LinearProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  CircularProgress,
  Paper,
  Grid
} from '@mui/material';
import {
  MdEmail,
  MdSend,
  MdCheckCircle,
  MdInfo,
  MdWarning,
  MdTrendingUp,
  MdPeople,
  MdPercent,
  MdClose,
  MdFilterAlt,
  MdPreview
} from 'react-icons/md';

interface SendNewProductEmailProps {
  products: Product[];
  onClose?: () => void;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  role: string;
  lastOrderDate: string | null;
}

interface CategoryStat {
  categoryId: string;
  categoryName: string;
  parentId?: string;
  parentName?: string;
  isParent: boolean;
  userCount: number;
  recentUserCount: number;
  mediumUserCount: number;
  olderUserCount: number;
  subcategories?: CategoryStat[];
  customers?: {
    recent: Customer[];
    medium: Customer[];
    older: Customer[];
  };
}

interface CategoryAnalyticsData {
  hierarchical: CategoryStat[];
  flat: CategoryStat[];
  summary: {
    totalParentCategories: number;
    totalSubcategories: number;
    totalCategories: number;
  };
}

const SendNewProductEmail: React.FC<SendNewProductEmailProps> = ({ products, onClose }) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [tabValue, setTabValue] = useState(0);
  const [categoryData, setCategoryData] = useState<CategoryAnalyticsData | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | 'recent' | 'medium' | 'older'>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'hierarchical' | 'flat'>('hierarchical');
  const [selectedCategory, setSelectedCategory] = useState<CategoryStat | null>(null);
  const [customerViewMode, setCustomerViewMode] = useState<'recent' | 'medium' | 'older' | 'all'>('all');

  // Lấy thông tin về khách hàng theo danh mục
  useEffect(() => {
    const fetchCategoryStats = async () => {
      setIsLoadingStats(true);
      try {
        const response = await axios.get('/api/analytics/customer-categories');
        if (response.data.success) {
          setCategoryData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching category stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchCategoryStats();
  }, []);

  // Toggle expand/collapse category
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSendEmails = async () => {
    if (!selectedProductId) {
      toast.error('Vui lòng chọn sản phẩm');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/api/send-new-product-emails', {
        productId: selectedProductId,
        timeframe: selectedTimeframe
      });

      const result = response.data;
      setLastResult(result);

      toast.success(`Đã gửi email thành công cho ${result.sentCount}/${result.totalUsers} người dùng`);
    } catch (error: any) {
      console.error('Error sending emails:', error);
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra khi gửi email');
    } finally {
      setIsLoading(false);
    }
  };

  // Lọc sản phẩm mới (trong 30 ngày gần đây)
  const recentProducts = products
    ?.filter(product => {
      const productDate = new Date(product.createdAt || Date.now());
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return productDate >= thirtyDaysAgo;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || Date.now());
      const dateB = new Date(b.createdAt || Date.now());
      return dateB.getTime() - dateA.getTime();
    });

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth='lg'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          minHeight: '600px'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: '12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MdEmail size={24} />
            </Box>
            <Box>
              <Typography variant='h5' sx={{ fontWeight: 700, color: '#1f2937', mb: 0.5 }}>
                Email Marketing
              </Typography>
              <Typography variant='body2' sx={{ color: '#6b7280' }}>
                Gửi thông báo sản phẩm mới đến khách hàng tiềm năng
              </Typography>
            </Box>
          </Box>
          <Button onClick={onClose} sx={{ minWidth: 'auto', p: 1, borderRadius: '8px' }}>
            <MdClose size={20} />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab
              label='Gửi Email'
              icon={<MdSend />}
              iconPosition='start'
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
            <Tab
              label='Chi tiết khách hàng'
              icon={<MdPeople />}
              iconPosition='start'
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
            <Tab
              label='Thống kê danh mục'
              icon={<MdFilterAlt />}
              iconPosition='start'
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
            <Tab
              label='Xem trước Email'
              icon={<MdPreview />}
              iconPosition='start'
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Tab Panel 0: Gửi Email */}
          {tabValue === 0 && (
            <Box>
              {/* Product Selection */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Chọn sản phẩm mới</InputLabel>
                <Select
                  value={selectedProductId}
                  label='Chọn sản phẩm mới'
                  onChange={e => setSelectedProductId(e.target.value)}
                  disabled={isLoading}
                  sx={{ borderRadius: '12px' }}
                >
                  <MenuItem value=''>
                    <em>-- Chọn sản phẩm --</em>
                  </MenuItem>
                  {recentProducts?.map(product => (
                    <MenuItem key={product.id} value={product.id}>
                      <Box
                        sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}
                      >
                        <Typography sx={{ fontWeight: 500 }}>{product.name}</Typography>
                        <Chip
                          label={new Date(product.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                          size='small'
                          color='primary'
                          variant='outlined'
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Timeframe Selection */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Lọc khách hàng theo thời gian mua hàng</InputLabel>
                <Select
                  value={selectedTimeframe}
                  label='Lọc khách hàng theo thời gian mua hàng'
                  onChange={e => setSelectedTimeframe(e.target.value as any)}
                  disabled={isLoading}
                  sx={{ borderRadius: '12px' }}
                >
                  <MenuItem value='all'>Tất cả khách hàng</MenuItem>
                  <MenuItem value='recent'>Mua hàng trong 30 ngày gần đây</MenuItem>
                  <MenuItem value='medium'>Mua hàng trong 30-90 ngày trước</MenuItem>
                  <MenuItem value='older'>Mua hàng trên 90 ngày trước</MenuItem>
                </Select>
              </FormControl>

              {/* Info Alert */}
              {selectedProductId && (
                <Alert icon={<MdInfo />} severity='info' sx={{ mb: 3, borderRadius: '12px' }}>
                  <Typography variant='body2'>
                    <strong>Lưu ý:</strong> Email sẽ được gửi đến những khách hàng đã từng mua sản phẩm trong cùng danh
                    mục với sản phẩm được chọn (
                    {selectedTimeframe === 'all'
                      ? 'tất cả'
                      : selectedTimeframe === 'recent'
                      ? 'mua trong 30 ngày gần đây'
                      : selectedTimeframe === 'medium'
                      ? 'mua trong 30-90 ngày trước'
                      : 'mua trên 90 ngày trước'}
                    ).
                  </Typography>
                </Alert>
              )}
            </Box>
          )}

          {/* Tab Panel 1: Chi tiết khách hàng */}
          {tabValue === 1 && (
            <Box>
              <Typography variant='h6' sx={{ mb: 3, fontWeight: 600 }}>
                Danh sách khách hàng theo danh mục
              </Typography>

              {isLoadingStats ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : categoryData ? (
                <Box>
                  {/* Customer Filter */}
                  <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      size='small'
                      variant={customerViewMode === 'all' ? 'contained' : 'outlined'}
                      onClick={() => setCustomerViewMode('all')}
                      sx={{
                        textTransform: 'none',
                        backgroundColor: customerViewMode === 'all' ? '#3b82f6' : 'transparent',
                        borderColor: '#3b82f6',
                        color: customerViewMode === 'all' ? 'white' : '#3b82f6',
                        '&:hover': {
                          backgroundColor: customerViewMode === 'all' ? '#2563eb' : '#eff6ff'
                        }
                      }}
                    >
                      Tất cả
                    </Button>
                    <Button
                      size='small'
                      variant={customerViewMode === 'recent' ? 'contained' : 'outlined'}
                      onClick={() => setCustomerViewMode('recent')}
                      sx={{
                        textTransform: 'none',
                        backgroundColor: customerViewMode === 'recent' ? '#22c55e' : 'transparent',
                        borderColor: '#22c55e',
                        color: customerViewMode === 'recent' ? 'white' : '#22c55e',
                        '&:hover': {
                          backgroundColor: customerViewMode === 'recent' ? '#16a34a' : '#f0fdf4'
                        }
                      }}
                    >
                      30 ngày gần đây
                    </Button>
                    <Button
                      size='small'
                      variant={customerViewMode === 'medium' ? 'contained' : 'outlined'}
                      onClick={() => setCustomerViewMode('medium')}
                      sx={{
                        textTransform: 'none',
                        backgroundColor: customerViewMode === 'medium' ? '#f59e0b' : 'transparent',
                        borderColor: '#f59e0b',
                        color: customerViewMode === 'medium' ? 'white' : '#f59e0b',
                        '&:hover': {
                          backgroundColor: customerViewMode === 'medium' ? '#d97706' : '#fef3c7'
                        }
                      }}
                    >
                      30-90 ngày trước
                    </Button>
                    <Button
                      size='small'
                      variant={customerViewMode === 'older' ? 'contained' : 'outlined'}
                      onClick={() => setCustomerViewMode('older')}
                      sx={{
                        textTransform: 'none',
                        backgroundColor: customerViewMode === 'older' ? '#6b7280' : 'transparent',
                        borderColor: '#6b7280',
                        color: customerViewMode === 'older' ? 'white' : '#6b7280',
                        '&:hover': {
                          backgroundColor: customerViewMode === 'older' ? '#4b5563' : '#f9fafb'
                        }
                      }}
                    >
                      Trên 90 ngày
                    </Button>
                  </Box>

                  {/* Customer List */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {categoryData.flat.map(category => {
                      if (!category.customers) return null;

                      let customersToShow: Customer[] = [];
                      switch (customerViewMode) {
                        case 'recent':
                          customersToShow = category.customers.recent;
                          break;
                        case 'medium':
                          customersToShow = category.customers.medium;
                          break;
                        case 'older':
                          customersToShow = category.customers.older;
                          break;
                        default:
                          customersToShow = [
                            ...category.customers.recent,
                            ...category.customers.medium,
                            ...category.customers.older
                          ];
                      }

                      if (customersToShow.length === 0) return null;

                      return (
                        <Paper
                          key={category.categoryId}
                          sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}
                        >
                          <Typography variant='h6' sx={{ fontWeight: 600, mb: 2, color: '#1f2937' }}>
                            {category.categoryName} ({customersToShow.length} khách hàng)
                          </Typography>

                          <Grid container spacing={2}>
                            {customersToShow.map(customer => (
                              <Grid item xs={12} md={6} lg={4} key={customer.id}>
                                <Paper
                                  sx={{
                                    p: 2,
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb',
                                    backgroundColor: '#f8fafc',
                                    '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                                      {customer.name}
                                    </Typography>
                                    <Chip
                                      label={
                                        customer.role === 'ADMIN'
                                          ? 'Admin'
                                          : customer.role === 'STAFF'
                                          ? 'Staff'
                                          : 'Khách hàng'
                                      }
                                      size='small'
                                      color={
                                        customer.role === 'ADMIN'
                                          ? 'error'
                                          : customer.role === 'STAFF'
                                          ? 'warning'
                                          : 'default'
                                      }
                                      variant='outlined'
                                    />
                                  </Box>
                                  <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                                    {customer.email}
                                  </Typography>
                                  {customer.lastOrderDate && (
                                    <Typography variant='caption' color='text.secondary'>
                                      Mua gần nhất: {new Date(customer.lastOrderDate).toLocaleDateString('vi-VN')}
                                    </Typography>
                                  )}
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                        </Paper>
                      );
                    })}
                  </Box>
                </Box>
              ) : (
                <Alert severity='info' sx={{ borderRadius: '12px' }}>
                  Không có dữ liệu khách hàng để hiển thị.
                </Alert>
              )}
            </Box>
          )}

          {/* Tab Panel 2: Thống kê danh mục */}
          {tabValue === 2 && (
            <Box>
              {/* Header với controls */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant='h6' sx={{ fontWeight: 600 }}>
                  Thống kê khách hàng theo danh mục
                </Typography>

                {/* View Mode Toggle */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size='small'
                    variant={viewMode === 'hierarchical' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('hierarchical')}
                    sx={{
                      textTransform: 'none',
                      backgroundColor: viewMode === 'hierarchical' ? '#3b82f6' : 'transparent',
                      borderColor: '#3b82f6',
                      color: viewMode === 'hierarchical' ? 'white' : '#3b82f6',
                      '&:hover': {
                        backgroundColor: viewMode === 'hierarchical' ? '#2563eb' : '#eff6ff'
                      }
                    }}
                  >
                    Phân tầng
                  </Button>
                  <Button
                    size='small'
                    variant={viewMode === 'flat' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('flat')}
                    sx={{
                      textTransform: 'none',
                      backgroundColor: viewMode === 'flat' ? '#3b82f6' : 'transparent',
                      borderColor: '#3b82f6',
                      color: viewMode === 'flat' ? 'white' : '#3b82f6',
                      '&:hover': {
                        backgroundColor: viewMode === 'flat' ? '#2563eb' : '#eff6ff'
                      }
                    }}
                  >
                    Danh sách
                  </Button>
                </Box>
              </Box>

              {/* Summary Cards */}
              {categoryData && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={4}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        borderRadius: '12px',
                        backgroundColor: '#f0f9ff',
                        border: '1px solid #0ea5e9'
                      }}
                    >
                      <Typography variant='h4' sx={{ fontWeight: 700, color: '#0ea5e9' }}>
                        {categoryData.summary.totalParentCategories}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Danh mục chính
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        borderRadius: '12px',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #22c55e'
                      }}
                    >
                      <Typography variant='h4' sx={{ fontWeight: 700, color: '#22c55e' }}>
                        {categoryData.summary.totalSubcategories}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Danh mục con
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        borderRadius: '12px',
                        backgroundColor: '#fef3c7',
                        border: '1px solid #f59e0b'
                      }}
                    >
                      <Typography variant='h4' sx={{ fontWeight: 700, color: '#f59e0b' }}>
                        {categoryData.hierarchical.reduce((sum, cat) => sum + cat.userCount, 0)}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Tổng khách hàng
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {isLoadingStats ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : categoryData ? (
                viewMode === 'hierarchical' ? (
                  // Hierarchical View
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {categoryData.hierarchical.map(parentCategory => (
                      <Paper
                        key={parentCategory.categoryId}
                        sx={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}
                      >
                        {/* Parent Category Header */}
                        <Box
                          sx={{
                            p: 3,
                            backgroundColor: '#f8fafc',
                            borderBottom: '1px solid #e5e7eb',
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: '#f1f5f9' }
                          }}
                          onClick={() => toggleCategory(parentCategory.categoryId)}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant='h6' sx={{ fontWeight: 700, color: '#1f2937' }}>
                                {parentCategory.categoryName}
                              </Typography>
                              <Chip
                                label={`${parentCategory.subcategories?.length || 0} danh mục con`}
                                size='small'
                                color='primary'
                                variant='outlined'
                              />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant='h5' sx={{ fontWeight: 700, color: '#3b82f6' }}>
                                  {parentCategory.userCount}
                                </Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  Tổng KH
                                </Typography>
                              </Box>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant='h6' sx={{ fontWeight: 600, color: '#22c55e' }}>
                                  {parentCategory.recentUserCount}
                                </Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  30 ngày
                                </Typography>
                              </Box>
                              <Typography
                                variant='h6'
                                sx={{
                                  color: expandedCategories.has(parentCategory.categoryId) ? '#ef4444' : '#6b7280'
                                }}
                              >
                                {expandedCategories.has(parentCategory.categoryId) ? '▼' : '▶'}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        {/* Subcategories */}
                        {expandedCategories.has(parentCategory.categoryId) && parentCategory.subcategories && (
                          <Box sx={{ p: 2 }}>
                            <Grid container spacing={2}>
                              {parentCategory.subcategories.map(subCategory => (
                                <Grid item xs={12} md={6} lg={4} key={subCategory.categoryId}>
                                  <Paper
                                    sx={{
                                      p: 2,
                                      borderRadius: '8px',
                                      border: '1px solid #e5e7eb',
                                      backgroundColor: 'white',
                                      '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
                                    }}
                                  >
                                    <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1, color: '#374151' }}>
                                      {subCategory.categoryName}
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                      <Typography variant='body2' color='text.secondary'>
                                        Tổng:
                                      </Typography>
                                      <Typography variant='body2' fontWeight={600}>
                                        {subCategory.userCount}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                      <Typography variant='body2' color='text.secondary'>
                                        30 ngày:
                                      </Typography>
                                      <Typography variant='body2' fontWeight={600} color='success.main'>
                                        {subCategory.recentUserCount}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                      <Typography variant='body2' color='text.secondary'>
                                        30-90 ngày:
                                      </Typography>
                                      <Typography variant='body2' fontWeight={600} color='warning.main'>
                                        {subCategory.mediumUserCount}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <Typography variant='body2' color='text.secondary'>
                                        90+ ngày:
                                      </Typography>
                                      <Typography variant='body2' fontWeight={600} color='text.secondary'>
                                        {subCategory.olderUserCount}
                                      </Typography>
                                    </Box>
                                  </Paper>
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        )}
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  // Flat View
                  <Grid container spacing={2}>
                    {categoryData.flat.map(stat => (
                      <Grid item xs={12} md={6} lg={4} key={stat.categoryId}>
                        <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Typography variant='h6' sx={{ fontWeight: 600 }}>
                              {stat.categoryName}
                            </Typography>
                            {stat.parentName && (
                              <Chip label={stat.parentName} size='small' color='secondary' variant='outlined' />
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant='body2' color='text.secondary'>
                                Tổng khách hàng:
                              </Typography>
                              <Typography variant='body2' fontWeight={600}>
                                {stat.userCount}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant='body2' color='text.secondary'>
                                Mua trong 30 ngày:
                              </Typography>
                              <Typography variant='body2' fontWeight={600} color='success.main'>
                                {stat.recentUserCount}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant='body2' color='text.secondary'>
                                Mua 30-90 ngày trước:
                              </Typography>
                              <Typography variant='body2' fontWeight={600} color='warning.main'>
                                {stat.mediumUserCount}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant='body2' color='text.secondary'>
                                Mua trên 90 ngày:
                              </Typography>
                              <Typography variant='body2' fontWeight={600} color='text.secondary'>
                                {stat.olderUserCount}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )
              ) : (
                <Alert severity='info' sx={{ borderRadius: '12px' }}>
                  Không có dữ liệu khách hàng để hiển thị.
                </Alert>
              )}
            </Box>
          )}

          {/* Tab Panel 3: Xem trước Email */}
          {tabValue === 3 && (
            <Box>
              <Typography variant='h6' sx={{ mb: 3, fontWeight: 600 }}>
                Xem trước nội dung Email
              </Typography>

              {selectedProductId ? (
                <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb', backgroundColor: '#f8fafc' }}>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                    Đây là bản xem trước email sẽ được gửi đến khách hàng:
                  </Typography>

                  <Box
                    sx={{
                      backgroundColor: 'white',
                      p: 3,
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontFamily: 'Arial, sans-serif'
                    }}
                  >
                    <Typography variant='h5' sx={{ color: '#3b82f6', fontWeight: 700, mb: 2 }}>
                      🎉 Sản phẩm mới đã có mặt!
                    </Typography>
                    <Typography variant='body1' sx={{ mb: 2 }}>
                      Xin chào [Tên khách hàng],
                    </Typography>
                    <Typography variant='body1' sx={{ mb: 2 }}>
                      Chúng tôi vừa ra mắt một sản phẩm mới trong danh mục mà bạn quan tâm:
                    </Typography>

                    {(() => {
                      const selectedProduct = recentProducts?.find(p => p.id === selectedProductId);
                      return selectedProduct ? (
                        <Box
                          sx={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            p: 2,
                            my: 2,
                            backgroundColor: '#f8fafc'
                          }}
                        >
                          <Typography variant='h6' sx={{ fontWeight: 600, mb: 1 }}>
                            {selectedProduct.name}
                          </Typography>
                          <Typography variant='body2' sx={{ mb: 2 }}>
                            {selectedProduct.description || 'Mô tả sản phẩm...'}
                          </Typography>
                          <Typography variant='h6' sx={{ color: '#e74c3c', fontWeight: 700 }}>
                            {selectedProduct.price?.toLocaleString('vi-VN')}₫
                          </Typography>
                        </Box>
                      ) : null;
                    })()}

                    <Typography variant='body1' sx={{ mb: 2 }}>
                      Đừng bỏ lỡ cơ hội sở hữu sản phẩm mới nhất từ ThanhHuy Store!
                    </Typography>
                  </Box>
                </Paper>
              ) : (
                <Alert severity='info' sx={{ borderRadius: '12px' }}>
                  Vui lòng chọn sản phẩm ở tab Gửi Email để xem trước nội dung email.
                </Alert>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #e5e7eb' }}>
        <Button onClick={onClose} color='inherit' sx={{ textTransform: 'none', fontWeight: 600 }}>
          Đóng
        </Button>
        {tabValue === 0 && (
          <Button
            variant='contained'
            size='large'
            startIcon={isLoading ? null : <MdSend />}
            onClick={handleSendEmails}
            disabled={isLoading || !selectedProductId}
            sx={{
              py: 1.5,
              px: 3,
              borderRadius: '12px',
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' },
              '&:disabled': { backgroundColor: '#e5e7eb', color: '#9ca3af' },
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '16px'
            }}
          >
            {isLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress sx={{ width: 20, height: 2 }} />
                Đang gửi email...
              </Box>
            ) : (
              'Gửi Email Marketing'
            )}
          </Button>
        )}
      </DialogActions>

      {/* Results Modal/Alert */}
      {lastResult && (
        <Box sx={{ position: 'absolute', bottom: 20, right: 20, zIndex: 1000 }}>
          <Card sx={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', minWidth: 300 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <MdCheckCircle color='#16a34a' size={20} />
                <Typography variant='h6' sx={{ color: '#16a34a', fontWeight: 600 }}>
                  Kết quả gửi email
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mt: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                    <MdTrendingUp color='#3b82f6' size={16} />
                    <Typography variant='body2' sx={{ color: '#6b7280', fontWeight: 500 }}>
                      Sản phẩm
                    </Typography>
                  </Box>
                  <Typography variant='body1' sx={{ fontWeight: 600, color: '#1f2937' }}>
                    {lastResult.product.name}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                    <MdPeople color='#10b981' size={16} />
                    <Typography variant='body2' sx={{ color: '#6b7280', fontWeight: 500 }}>
                      Đã gửi
                    </Typography>
                  </Box>
                  <Typography variant='body1' sx={{ fontWeight: 600, color: '#1f2937' }}>
                    {lastResult.sentCount}/{lastResult.totalUsers}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                    <MdPercent color='#8b5cf6' size={16} />
                    <Typography variant='body2' sx={{ color: '#6b7280', fontWeight: 500 }}>
                      Tỷ lệ thành công
                    </Typography>
                  </Box>
                  <Typography variant='body1' sx={{ fontWeight: 600, color: '#1f2937' }}>
                    {((lastResult.sentCount / lastResult.totalUsers) * 100).toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* No Products Warning */}
      {recentProducts?.length === 0 && tabValue === 0 && (
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%' }}>
          <Alert icon={<MdWarning />} severity='warning' sx={{ borderRadius: '12px' }}>
            <Typography variant='body2'>
              Không có sản phẩm mới nào trong 30 ngày gần đây để gửi email marketing.
            </Typography>
          </Alert>
        </Box>
      )}
    </Dialog>
  );
};

export default SendNewProductEmail;

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
  Grid,
  IconButton,
  Checkbox,
  FormControlLabel,
  Switch,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar
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
  open?: boolean;
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

const SendNewProductEmail: React.FC<SendNewProductEmailProps> = ({ products, onClose, open = true }) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | 'recent' | 'medium' | 'older'>('all');
  const [showResult, setShowResult] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUserDetail, setSelectedUserDetail] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [customerDetailData, setCustomerDetailData] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Auto-hide result after 5 seconds
  useEffect(() => {
    if (lastResult) {
      setShowResult(true);
      const timer = setTimeout(() => {
        setShowResult(false);
        setTimeout(() => setLastResult(null), 300); // Wait for animation to complete
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [lastResult]);

  // Load all users for manual selection
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await axios.get('/api/customers');
        if (response.data.success && response.data.data) {
          setAllUsers(response.data.data);
        } else {
          setAllUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setAllUsers([]);
      }
    };

    if (open) {
      fetchAllUsers();
    }
  }, [open]);

  // Fetch customer detail
  const fetchCustomerDetail = async (userId: string) => {
    setLoadingDetail(true);
    try {
      // Find user data from allUsers array (already loaded)
      const userData = allUsers.find(user => user.id === userId);
      if (userData) {
        setCustomerDetailData({
          user: {
            totalOrders: userData.totalOrders,
            totalSpent: userData.totalSpent
          },
          categories: userData.categories || [],
          products: userData.products || []
        });
      } else {
        toast.error('Không tìm thấy thông tin khách hàng');
      }
    } catch (error) {
      console.error('Error fetching customer detail:', error);
      toast.error('Không thể tải thông tin chi tiết khách hàng');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSendEmails = async () => {
    if (!selectedProductId) {
      toast.error('Vui lòng chọn sản phẩm');
      return;
    }

    if (manualMode && selectedUsers.length === 0) {
      toast.error('Vui lòng chọn ít nhất một khách hàng');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/api/send-new-product-emails', {
        productId: selectedProductId,
        timeframe: selectedTimeframe,
        manualMode,
        selectedUserIds: manualMode ? selectedUsers : undefined
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
  const recentProducts =
    products
      ?.filter(product => {
        if (!product || !product.id) return false;
        const productDate = new Date(product.createdAt || Date.now());
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return productDate >= thirtyDaysAgo;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || Date.now());
        const dateB = new Date(b.createdAt || Date.now());
        return dateB.getTime() - dateA.getTime();
      }) || [];

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
                  {recentProducts?.map(product =>
                    product && product.id && product.name ? (
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
                    ) : null
                  )}
                </Select>
              </FormControl>

              {/* Timeframe Selection - Only show in auto mode */}
              <Collapse in={!manualMode}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Lọc khách hàng theo thời gian mua hàng</InputLabel>
                  <Select
                    value={selectedTimeframe}
                    label='Lọc khách hàng theo thời gian mua hàng'
                    onChange={e => setSelectedTimeframe(e.target.value as any)}
                    disabled={isLoading}
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value='all'>Tất cả khách hàng đã mua cùng danh mục</MenuItem>
                    <MenuItem value='recent'>Khách hàng mua trong 30 ngày gần đây</MenuItem>
                    <MenuItem value='medium'>Khách hàng mua trong 30-90 ngày trước</MenuItem>
                    <MenuItem value='older'>Khách hàng mua trên 90 ngày trước</MenuItem>
                  </Select>
                </FormControl>
              </Collapse>

              {/* Manual Customer Selection Toggle */}
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch checked={manualMode} onChange={e => setManualMode(e.target.checked)} color='primary' />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MdPeople size={20} />
                      <Typography variant='body1' sx={{ fontWeight: 500 }}>
                        Chọn khách hàng thủ công
                      </Typography>
                    </Box>
                  }
                  sx={{
                    '& .MuiFormControlLabel-label': {
                      color: manualMode ? '#3b82f6' : 'text.primary'
                    }
                  }}
                />
                <Typography variant='body2' color='text.secondary' sx={{ ml: 4, mt: 0.5 }}>
                  {manualMode
                    ? 'Tự chọn khách hàng từ danh sách bên dưới (bỏ qua filter thời gian)'
                    : 'Hệ thống tự động tìm khách hàng đã mua sản phẩm cùng danh mục theo filter thời gian'}
                </Typography>
              </Box>

              {/* Info Alert */}
              {selectedProductId && !manualMode && (
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

              {/* Manual Customer Selection List */}
              <Collapse in={manualMode}>
                <Paper
                  sx={{
                    mb: 3,
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    maxHeight: '400px',
                    overflow: 'hidden'
                  }}
                >
                  <Box sx={{ p: 2, borderBottom: '1px solid #e5e7eb', backgroundColor: '#f8fafc' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant='h6' sx={{ fontWeight: 600, color: '#1f2937' }}>
                        Danh sách khách hàng ({allUsers.length})
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size='small'
                          variant='outlined'
                          onClick={() => setSelectedUsers(allUsers.map(u => u.id))}
                          sx={{ textTransform: 'none' }}
                        >
                          Chọn tất cả
                        </Button>
                        <Button
                          size='small'
                          variant='outlined'
                          onClick={() => setSelectedUsers([])}
                          sx={{ textTransform: 'none' }}
                        >
                          Bỏ chọn
                        </Button>
                      </Box>
                    </Box>
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                      Đã chọn: {selectedUsers.length} khách hàng
                    </Typography>
                  </Box>

                  <List sx={{ maxHeight: '300px', overflow: 'auto', p: 0 }}>
                    {allUsers.map(user => (
                      <ListItem
                        key={user.id}
                        sx={{
                          borderBottom: '1px solid #f3f4f6',
                          '&:hover': { backgroundColor: '#f9fafb' }
                        }}
                      >
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                            }
                          }}
                          color='primary'
                        />
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                                {user.name || 'Khách hàng'}
                              </Typography>
                              <Chip
                                label={user.role === 'ADMIN' ? 'Admin' : user.role === 'STAFF' ? 'Staff' : 'Khách hàng'}
                                size='small'
                                color={user.role === 'ADMIN' ? 'error' : user.role === 'STAFF' ? 'warning' : 'default'}
                                variant='outlined'
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              <Typography variant='body2' color='text.secondary'>
                                {user.email || 'Email không có'}
                              </Typography>
                              {user.lastOrderDate && (
                                <Typography variant='caption' color='text.secondary'>
                                  Mua gần nhất: {new Date(user.lastOrderDate).toLocaleDateString('vi-VN')}
                                </Typography>
                              )}
                              {user.categories && user.categories.length > 0 && (
                                <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {user.categories.slice(0, 3).map((category: any, index: number) => (
                                    <Chip
                                      key={index}
                                      label={category.name || category}
                                      size='small'
                                      variant='outlined'
                                      sx={{
                                        fontSize: '0.7rem',
                                        height: '20px',
                                        borderColor: '#3b82f6',
                                        color: '#3b82f6'
                                      }}
                                    />
                                  ))}
                                  {user.categories.length > 3 && (
                                    <Chip
                                      label={`+${user.categories.length - 3}`}
                                      size='small'
                                      variant='outlined'
                                      sx={{
                                        fontSize: '0.7rem',
                                        height: '20px',
                                        borderColor: '#6b7280',
                                        color: '#6b7280'
                                      }}
                                    />
                                  )}
                                </Box>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Button
                            size='small'
                            variant='outlined'
                            onClick={() => {
                              setSelectedUserDetail(user);
                              setDetailModalOpen(true);
                              fetchCustomerDetail(user.id);
                            }}
                            sx={{
                              textTransform: 'none',
                              borderColor: '#3b82f6',
                              color: '#3b82f6',
                              '&:hover': {
                                backgroundColor: '#eff6ff',
                                borderColor: '#2563eb'
                              }
                            }}
                          >
                            Chi tiết
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Collapse>
            </Box>
          )}

          {/* Tab Panel 1: Chi tiết khách hàng */}
          {tabValue === 1 && (
            <Box>
              <Typography variant='h6' sx={{ mb: 3, fontWeight: 600 }}>
                Danh sách tất cả khách hàng ({allUsers.length})
              </Typography>

              <Grid container spacing={2}>
                {allUsers.map(user => (
                  <Grid item xs={12} md={6} lg={4} key={user.id}>
                    <Paper
                      sx={{
                        p: 2,
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: '#fafafa',
                        '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                          {user.name || 'Khách hàng'}
                        </Typography>
                        <Chip
                          label={user.role === 'ADMIN' ? 'Admin' : user.role === 'STAFF' ? 'Staff' : 'Khách hàng'}
                          size='small'
                          color={user.role === 'ADMIN' ? 'error' : user.role === 'STAFF' ? 'warning' : 'default'}
                          variant='outlined'
                        />
                      </Box>
                      <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                        {user.email || 'Email không có'}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant='caption' color='text.secondary'>
                          Đơn hàng:
                        </Typography>
                        <Typography variant='caption' fontWeight={600}>
                          {user.totalOrders || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant='caption' color='text.secondary'>
                          Tổng chi:
                        </Typography>
                        <Typography variant='caption' fontWeight={600} color='success.main'>
                          {user.totalSpent
                            ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                                user.totalSpent
                              )
                            : '0₫'}
                        </Typography>
                      </Box>
                      {user.lastOrderDate && (
                        <Typography variant='caption' color='text.secondary'>
                          Mua gần nhất: {new Date(user.lastOrderDate).toLocaleDateString('vi-VN')}
                        </Typography>
                      )}
                      {user.categories && user.categories.length > 0 && (
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {user.categories.slice(0, 2).map((category: any, index: number) => (
                            <Chip
                              key={index}
                              label={category.name || category}
                              size='small'
                              variant='outlined'
                              sx={{
                                fontSize: '0.6rem',
                                height: '18px',
                                borderColor: '#3b82f6',
                                color: '#3b82f6'
                              }}
                            />
                          ))}
                          {user.categories.length > 2 && (
                            <Chip
                              label={`+${user.categories.length - 2}`}
                              size='small'
                              variant='outlined'
                              sx={{
                                fontSize: '0.6rem',
                                height: '18px',
                                borderColor: '#6b7280',
                                color: '#6b7280'
                              }}
                            />
                          )}
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Tab Panel 2: Thống kê danh mục */}
          {tabValue === 2 && (
            <Box>
              <Typography variant='h6' sx={{ fontWeight: 600, mb: 3 }}>
                Thống kê khách hàng theo danh mục
              </Typography>

              {/* Summary Cards */}
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
                      {(() => {
                        const allCategories = new Set();
                        allUsers.forEach(user => {
                          user.categories?.forEach((cat: any) => {
                            allCategories.add(cat.name);
                          });
                        });
                        return allCategories.size;
                      })()}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Tổng danh mục
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
                      {(() => {
                        const allProducts = new Set();
                        allUsers.forEach(user => {
                          user.products?.forEach((product: any) => {
                            allProducts.add(product.id);
                          });
                        });
                        return allProducts.size;
                      })()}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Sản phẩm đã bán
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
                      {allUsers.length}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Tổng khách hàng
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Category Statistics */}
              <Typography variant='h6' sx={{ fontWeight: 600, mb: 2 }}>
                Thống kê theo danh mục
              </Typography>
              {(() => {
                // Calculate category statistics from allUsers
                const categoryStats = new Map();
                allUsers.forEach(user => {
                  user.categories?.forEach((cat: any) => {
                    if (!categoryStats.has(cat.name)) {
                      categoryStats.set(cat.name, {
                        name: cat.name,
                        userCount: 0,
                        totalSpent: 0,
                        productCount: 0
                      });
                    }
                    const stats = categoryStats.get(cat.name);
                    stats.userCount += 1;
                    stats.totalSpent += cat.totalSpent || 0;
                    stats.productCount += cat.productCount || 0;
                  });
                });

                const sortedCategories = Array.from(categoryStats.values()).sort((a, b) => b.userCount - a.userCount);

                return (
                  <Grid container spacing={2}>
                    {sortedCategories.map((category, index) => (
                      <Grid item xs={12} md={6} lg={4} key={index}>
                        <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                          <Typography variant='h6' sx={{ fontWeight: 600, mb: 2 }}>
                            {category.name}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant='body2' color='text.secondary'>
                              Khách hàng:
                            </Typography>
                            <Typography variant='body2' fontWeight={600}>
                              {category.userCount}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant='body2' color='text.secondary'>
                              Sản phẩm:
                            </Typography>
                            <Typography variant='body2' fontWeight={600}>
                              {category.productCount}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant='body2' color='text.secondary'>
                              Doanh thu:
                            </Typography>
                            <Typography variant='body2' fontWeight={600} color='success.main'>
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                                category.totalSpent
                              )}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                );
              })()}
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
                      const selectedProduct = recentProducts?.find(p => p && p.id === selectedProductId);
                      return selectedProduct && selectedProduct.name ? (
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
                            {selectedProduct.name || 'Sản phẩm mới'}
                          </Typography>
                          <Typography variant='body2' sx={{ mb: 2 }}>
                            {selectedProduct.description || 'Mô tả sản phẩm...'}
                          </Typography>
                          <Typography variant='h6' sx={{ color: '#e74c3c', fontWeight: 700 }}>
                            {selectedProduct.price?.toLocaleString('vi-VN') || '0'}₫
                          </Typography>
                        </Box>
                      ) : (
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
                            Sản phẩm mới
                          </Typography>
                          <Typography variant='body2' sx={{ mb: 2 }}>
                            Mô tả sản phẩm...
                          </Typography>
                          <Typography variant='h6' sx={{ color: '#e74c3c', fontWeight: 700 }}>
                            0₫
                          </Typography>
                        </Box>
                      );
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
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1300,
            transform: showResult ? 'translateY(0)' : 'translateY(100%)',
            opacity: showResult ? 1 : 0,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            maxWidth: '400px'
          }}
        >
          <Card
            sx={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1px solid #bbf7d0',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      backgroundColor: '#16a34a',
                      borderRadius: '50%',
                      p: 0.5,
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)', opacity: 1 },
                        '50%': { transform: 'scale(1.1)', opacity: 0.8 },
                        '100%': { transform: 'scale(1)', opacity: 1 }
                      },
                      animation: 'pulse 2s infinite'
                    }}
                  >
                    <MdCheckCircle color='white' size={16} />
                  </Box>
                  <Typography variant='h6' sx={{ color: '#16a34a', fontWeight: 600, fontSize: '1rem' }}>
                    Gửi email thành công!
                  </Typography>
                </Box>
                <IconButton
                  size='small'
                  onClick={() => setShowResult(false)}
                  sx={{ color: '#16a34a', '&:hover': { backgroundColor: 'rgba(22, 163, 74, 0.1)' } }}
                >
                  <MdClose size={16} />
                </IconButton>
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
                    {lastResult.product?.name || 'Sản phẩm mới'}
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

      {/* Customer Detail Modal */}
      <Dialog
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedUserDetail(null);
          setCustomerDetailData(null);
        }}
        maxWidth='md'
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px', maxHeight: '90vh' }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#3b82f6', width: 48, height: 48 }}>
              {selectedUserDetail?.name?.charAt(0) || selectedUserDetail?.email?.charAt(0) || 'U'}
            </Avatar>
            <Box>
              <Typography variant='h6' sx={{ fontWeight: 600 }}>
                Chi tiết khách hàng
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {selectedUserDetail?.name} ({selectedUserDetail?.email})
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {loadingDetail ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : customerDetailData ? (
            <Box>
              {/* Customer Summary */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', borderRadius: '12px', backgroundColor: '#f0f9ff' }}>
                    <Typography variant='h4' sx={{ fontWeight: 700, color: '#3b82f6' }}>
                      {customerDetailData.user?.totalOrders || 0}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Tổng đơn hàng
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', borderRadius: '12px', backgroundColor: '#f0fdf4' }}>
                    <Typography variant='h4' sx={{ fontWeight: 700, color: '#22c55e' }}>
                      {customerDetailData.products?.length || 0}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Sản phẩm đã mua
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', borderRadius: '12px', backgroundColor: '#fef3c7' }}>
                    <Typography variant='h4' sx={{ fontWeight: 700, color: '#f59e0b' }}>
                      {customerDetailData.categories?.length || 0}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Danh mục
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', borderRadius: '12px', backgroundColor: '#fce7f3' }}>
                    <Typography variant='h4' sx={{ fontWeight: 700, color: '#ec4899' }}>
                      {customerDetailData.user?.totalSpent
                        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                            customerDetailData.user.totalSpent
                          )
                        : '0₫'}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Tổng chi tiêu
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Categories */}
              <Typography variant='h6' sx={{ fontWeight: 600, mb: 2 }}>
                Danh mục đã mua
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {customerDetailData.categories?.map((category: any, index: number) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                      <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1 }}>
                        {category.name || 'Danh mục không xác định'}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant='body2' color='text.secondary'>
                          Số sản phẩm:
                        </Typography>
                        <Typography variant='body2' fontWeight={600}>
                          {category.productCount || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant='body2' color='text.secondary'>
                          Tổng chi:
                        </Typography>
                        <Typography variant='body2' fontWeight={600} color='success.main'>
                          {category.totalSpent
                            ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                                category.totalSpent
                              )
                            : '0₫'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant='body2' color='text.secondary'>
                          Mua gần nhất:
                        </Typography>
                        <Typography variant='body2' fontWeight={600}>
                          {category.lastPurchased
                            ? new Date(category.lastPurchased).toLocaleDateString('vi-VN')
                            : 'Không xác định'}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Recent Products */}
              <Typography variant='h6' sx={{ fontWeight: 600, mb: 2 }}>
                Sản phẩm đã mua ({customerDetailData.products?.length || 0})
              </Typography>
              <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
                <Grid container spacing={2}>
                  {customerDetailData.products?.map((product: any) => (
                    <Grid item xs={12} md={6} key={product.id}>
                      <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', gap: 2 }}>
                        <Box
                          component='img'
                          src={product.thumbnail || '/noavatar.png'}
                          alt={product.name || 'Sản phẩm'}
                          onError={e => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/noavatar.png';
                          }}
                          sx={{
                            width: 60,
                            height: 60,
                            borderRadius: '8px',
                            objectFit: 'cover',
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #e5e7eb'
                          }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 0.5 }}>
                            {product.name || 'Sản phẩm không xác định'}
                          </Typography>
                          <Chip
                            label={product.category || 'Không có danh mục'}
                            size='small'
                            color='primary'
                            variant='outlined'
                            sx={{ mb: 0.5 }}
                          />
                          <Typography variant='body2' color='text.secondary'>
                            Mua lần đầu:{' '}
                            {product.firstPurchased
                              ? new Date(product.firstPurchased).toLocaleDateString('vi-VN')
                              : 'Không xác định'}
                          </Typography>
                          <Typography variant='body2' color='success.main' sx={{ fontWeight: 600 }}>
                            {product.price
                              ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                                  product.price
                                )
                              : '0₫'}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Box>
          ) : (
            <Alert severity='error' sx={{ borderRadius: '12px' }}>
              Không thể tải thông tin chi tiết khách hàng.
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => {
              setDetailModalOpen(false);
              setSelectedUserDetail(null);
              setCustomerDetailData(null);
            }}
            variant='outlined'
            sx={{ textTransform: 'none' }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default SendNewProductEmail;

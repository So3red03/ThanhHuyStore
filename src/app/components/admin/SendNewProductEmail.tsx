'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  List,
  ListItem,
  ListItemText,
  TextField
} from '@mui/material';
import {
  MdEmail,
  MdTrendingUp,
  MdPeople,
  MdPercent,
  MdClose,
  MdPreview,
  MdLocalOffer,
  MdCampaign,
  MdInfo
} from 'react-icons/md';
import CustomerDetailModal from './CustomerDetailModal';

// Campaign types
type CampaignType = 'NEW_PRODUCT' | 'VOUCHER_PROMOTION' | 'RETENTION' | 'CROSS_SELL';

// Customer segments
interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: {
    totalSpent?: { min?: number; max?: number };
    orderCount?: { min?: number; max?: number };
    lastOrderDays?: { min?: number; max?: number };
    customerType?: 'NEW' | 'ACTIVE' | 'AT_RISK' | 'VIP';
  };
  estimatedSize?: number;
}

interface SendNewProductEmailProps {
  products: Product[];
  onClose?: () => void;
  open?: boolean;
}

const SendNewProductEmailClean: React.FC<SendNewProductEmailProps> = ({ products, onClose, open = true }) => {
  // Campaign configuration
  const [campaignType, setCampaignType] = useState<CampaignType>('NEW_PRODUCT');
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVoucherIds, setSelectedVoucherIds] = useState<string[]>([]);

  // Wizard steps
  const [currentStep, setCurrentStep] = useState(1);

  // Existing states
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [tabValue, setTabValue] = useState(0);

  const [manualMode, setManualMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);

  // Customer detail modal
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerDetailOpen, setCustomerDetailOpen] = useState(false);

  // Customer segmentation
  const [selectedSegments, setSelectedSegments] = useState<string[]>(['all']);
  const [customerSegments, setCustomerSegments] = useState<Map<string, any>>(new Map());

  // Predefined customer segments
  const CUSTOMER_SEGMENTS: CustomerSegment[] = [
    {
      id: 'all',
      name: 'Tất cả khách hàng',
      description: 'Gửi cho tất cả khách hàng đã mua hàng',
      criteria: {}
    },
    {
      id: 'vip_customers',
      name: 'Khách hàng VIP',
      description: 'Chi tiêu > 5M, đặt hàng thường xuyên',
      criteria: {
        totalSpent: { min: 5000000 },
        orderCount: { min: 3 },
        lastOrderDays: { max: 60 }
      }
    },
    {
      id: 'new_customers',
      name: 'Khách hàng mới',
      description: 'Đăng ký gần đây, ít đơn hàng',
      criteria: {
        orderCount: { max: 2 },
        lastOrderDays: { max: 30 }
      }
    },
    {
      id: 'at_risk_customers',
      name: 'Khách hàng có nguy cơ rời bỏ',
      description: 'Không mua hàng trong 90 ngày',
      criteria: {
        lastOrderDays: { min: 90 },
        orderCount: { min: 1 }
      }
    },
    {
      id: 'active_customers',
      name: 'Khách hàng tích cực',
      description: 'Mua hàng thường xuyên trong 60 ngày',
      criteria: {
        lastOrderDays: { max: 60 },
        orderCount: { min: 2 }
      }
    }
  ];

  // Get recent products (last 30 days)
  const recentProducts = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return (
      products
        ?.filter(product => {
          const createdAt = new Date(product.createdAt || Date.now());
          return createdAt >= thirtyDaysAgo;
        })
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        }) || []
    );
  }, [products]);

  // Fetch all users and vouchers when component mounts
  useEffect(() => {
    fetchAllUsers();
    fetchVouchers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      console.log('🔍 [DEBUG] Fetching customers from /api/customers...');
      const response = await axios.get('/api/customers');
      console.log('✅ [DEBUG] Customers response:', response.data);

      if (response.data.success) {
        const users = response.data.data || [];
        setAllUsers(users);
        console.log('📊 [DEBUG] Loaded customers:', users.length);

        // Fetch customer segments
        await fetchCustomerSegments(users);
      } else {
        console.error('❌ [DEBUG] API returned success: false');
        setAllUsers([]);
      }
    } catch (error: any) {
      console.error('❌ [DEBUG] Error fetching customers:', error);
      console.error('❌ [DEBUG] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      toast.error('Không thể tải danh sách khách hàng');
      setAllUsers([]);
    }
  };

  const fetchCustomerSegments = async (users: any[]) => {
    try {
      console.log('🔍 [DEBUG] Fetching customer segments for', users.length, 'users');

      const segmentPromises = users.map(async (user: any) => {
        if (user.role === 'USER') {
          try {
            const response = await axios.get(`/api/analytics/customer-detail?userId=${user.id}`);
            if (response.data.success) {
              const { data } = response.data;
              const segment = determineCustomerSegment(data.user);
              console.log('✅ [DEBUG] Segment for user', user.name, ':', segment);
              return { userId: user.id, segment };
            }
          } catch (error) {
            console.error('❌ [DEBUG] Error fetching segment for user', user.id, ':', error);
          }
        }
        return { userId: user.id, segment: null };
      });

      const results = await Promise.all(segmentPromises);
      const segmentMap = new Map();
      results.forEach(result => {
        if (result.segment) {
          segmentMap.set(result.userId, result.segment);
        }
      });

      console.log('📊 [DEBUG] Customer segments map:', segmentMap);
      setCustomerSegments(segmentMap);
    } catch (error) {
      console.error('❌ [DEBUG] Error fetching customer segments:', error);
    }
  };

  // Function to determine customer segment
  const determineCustomerSegment = (customerData: any) => {
    if (!customerData || customerData.role !== 'USER') return null;

    const totalSpent = customerData.totalSpent || 0;
    const orderCount = customerData.totalOrders || 0;
    const lastOrderDate = customerData.lastOrderDate ? new Date(customerData.lastOrderDate) : null;
    const daysSinceLastOrder = lastOrderDate
      ? Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    if (totalSpent > 5000000 && orderCount >= 3 && (daysSinceLastOrder === null || daysSinceLastOrder <= 60)) {
      return {
        id: 'vip_customers',
        name: 'VIP',
        color: '#9c27b0',
        description: 'Chi tiêu > 5M, đặt hàng thường xuyên'
      };
    } else if (orderCount <= 2 && (daysSinceLastOrder === null || daysSinceLastOrder <= 30)) {
      return { id: 'new_customers', name: 'Mới', color: '#4caf50', description: 'Đăng ký gần đây, ít đơn hàng' };
    } else if (daysSinceLastOrder !== null && daysSinceLastOrder >= 90 && orderCount >= 1) {
      return {
        id: 'at_risk_customers',
        name: 'Có nguy cơ rời bỏ',
        color: '#f44336',
        description: 'Không mua hàng trong 90 ngày'
      };
    } else if (daysSinceLastOrder !== null && daysSinceLastOrder <= 60 && orderCount >= 2) {
      return {
        id: 'active_customers',
        name: 'Tích cực',
        color: '#2196f3',
        description: 'Mua hàng thường xuyên trong 60 ngày'
      };
    }

    return null;
  };

  const fetchVouchers = async () => {
    try {
      console.log('🔍 [DEBUG] Fetching vouchers from /api/voucher...');
      const response = await axios.get('/api/voucher');
      console.log('✅ [DEBUG] Vouchers response:', response.data);

      setAvailableVouchers(response.data || []);
      console.log('📊 [DEBUG] Loaded vouchers:', response.data?.length || 0);
    } catch (error: any) {
      console.error('❌ [DEBUG] Error fetching vouchers:', error);
      console.error('❌ [DEBUG] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      toast.error('Không thể tải danh sách voucher');
      setAvailableVouchers([]);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSendEmails = async () => {
    console.log('🚀 [DEBUG] Starting email campaign...');
    console.log('📋 [DEBUG] Campaign config:', {
      campaignType,
      campaignTitle,
      campaignDescription,
      selectedProductId,
      selectedVoucherIds,
      selectedSegments,
      manualMode,
      selectedUsersCount: selectedUsers.length
    });

    // Validation based on campaign type
    if (campaignType === 'NEW_PRODUCT' && !selectedProductId) {
      console.log('❌ [DEBUG] Validation failed: No product selected for NEW_PRODUCT campaign');
      toast.error('Vui lòng chọn sản phẩm');
      return;
    }

    if (campaignType === 'VOUCHER_PROMOTION' && selectedVoucherIds.length === 0) {
      console.log('❌ [DEBUG] Validation failed: No voucher selected for VOUCHER_PROMOTION campaign');
      toast.error('Vui lòng chọn ít nhất một voucher');
      return;
    }

    if (manualMode && selectedUsers.length === 0) {
      console.log('❌ [DEBUG] Validation failed: Manual mode but no users selected');
      toast.error('Vui lòng chọn ít nhất một khách hàng');
      return;
    }

    if (!manualMode && (!selectedSegments || selectedSegments.length === 0)) {
      console.log('❌ [DEBUG] Validation failed: Auto mode but no segments selected');
      toast.error('Vui lòng chọn ít nhất một phân khúc khách hàng');
      return;
    }

    console.log('✅ [DEBUG] Validation passed, sending API request...');
    setIsLoading(true);
    try {
      const requestPayload = {
        // Campaign configuration
        campaignType,
        campaignTitle,
        campaignDescription,

        // Product/Content selection
        productId: selectedProductId,
        voucherIds: selectedVoucherIds,

        // Customer targeting
        selectedSegments,
        manualMode,
        selectedUserIds: manualMode ? selectedUsers : undefined,

        // Debug mode - always true for console logging
        debugMode: true
      };

      console.log('📤 [DEBUG] Sending request to /api/marketing/emails');
      console.log('📦 [DEBUG] Request payload:', requestPayload);

      const response = await axios.post('/api/marketing/emails', requestPayload);

      console.log('📥 [DEBUG] API Response:', response.data);
      const result = response.data;
      setLastResult(result);

      const campaignTypeText = {
        NEW_PRODUCT: 'sản phẩm mới',
        VOUCHER_PROMOTION: 'voucher khuyến mãi',
        RETENTION: 'giữ chân khách hàng',
        CROSS_SELL: 'gợi ý sản phẩm'
      }[campaignType];

      console.log('✅ [DEBUG] Email campaign successful!');
      console.log('📊 [DEBUG] Results:', {
        sentCount: result.sentCount,
        totalUsers: result.totalUsers,
        campaignType: campaignTypeText
      });

      toast.success(
        `Đã gửi email ${campaignTypeText} thành công cho ${result.sentCount}/${result.totalUsers} người dùng`
      );
    } catch (error: any) {
      console.error('❌ [DEBUG] Error sending emails:', error);
      console.error('❌ [DEBUG] Error response:', error.response?.data);
      console.error('❌ [DEBUG] Error status:', error.response?.status);

      toast.error(error.response?.data?.error || 'Có lỗi xảy ra khi gửi email');
      setLastResult({ error: error.response?.data?.error || 'Có lỗi xảy ra khi gửi email' });
    } finally {
      console.log('🏁 [DEBUG] Email campaign finished');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth='lg'
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
            <MdEmail size={28} />
            <Box>
              <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
                Smart Marketing Campaign
              </Typography>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>
                Tạo và gửi email marketing thông minh
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <MdClose />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab
                label='Tạo chiến dịch'
                icon={<MdCampaign />}
                iconPosition='start'
                sx={{ textTransform: 'none', fontWeight: 600 }}
              />
              <Tab
                label='Danh sách khách hàng'
                icon={<MdPeople />}
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
            {/* Tab Panel 0: Tạo chiến dịch */}
            {tabValue === 0 && (
              <Box>
                {/* Step Indicator */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
                    Tạo chiến dịch email marketing
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    {[1, 2, 3].map(step => (
                      <Box key={step} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: currentStep >= step ? '#1976d2' : '#e0e0e0',
                            color: currentStep >= step ? 'white' : '#666',
                            fontWeight: 600,
                            fontSize: '14px'
                          }}
                        >
                          {step}
                        </Box>
                        <Typography
                          variant='body2'
                          sx={{
                            color: currentStep >= step ? '#1976d2' : '#666',
                            fontWeight: currentStep === step ? 600 : 400
                          }}
                        >
                          {step === 1 && 'Chọn mục đích'}
                          {step === 2 && 'Cấu hình nội dung'}
                          {step === 3 && 'Chọn khách hàng'}
                        </Typography>
                        {step < 3 && (
                          <Box
                            sx={{
                              width: 40,
                              height: 2,
                              backgroundColor: currentStep > step ? '#1976d2' : '#e0e0e0',
                              mx: 1
                            }}
                          />
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Step 1: Campaign Purpose Selection */}
                {currentStep === 1 && (
                  <Card sx={{ mb: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography
                        variant='h6'
                        sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <MdCampaign className='text-blue-600' />
                        Bạn muốn gửi email để làm gì?
                      </Typography>

                      <Box
                        sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}
                      >
                        {[
                          {
                            type: 'NEW_PRODUCT',
                            icon: <MdTrendingUp size={24} />,
                            title: 'Giới thiệu sản phẩm mới',
                            description: 'Thông báo về sản phẩm mới ra mắt cho khách hàng quan tâm',
                            color: '#4caf50',
                            examples: ['iPhone 15 mới ra mắt', 'Laptop gaming mới nhất', 'Phụ kiện công nghệ hot']
                          },
                          {
                            type: 'VOUCHER_PROMOTION',
                            icon: <MdLocalOffer size={24} />,
                            title: 'Khuyến mãi & Voucher',
                            description: 'Gửi mã giảm giá và chương trình khuyến mãi đặc biệt',
                            color: '#9c27b0',
                            examples: ['Sale 50% cuối năm', 'Voucher sinh nhật', 'Khuyến mãi Black Friday']
                          },
                          // {
                          //   type: 'RETENTION',
                          //   icon: <MdPeople size={24} />,
                          //   title: 'Giữ chân khách hàng',
                          //   description: 'Gửi voucher đặc biệt cho khách hàng lâu không mua hàng (>90 ngày)',
                          //   color: '#ff9800',
                          //   examples: ['Comeback offer 30%', 'Chúng tôi nhớ bạn', 'Voucher độc quyền 25%']
                          // },
                          {
                            type: 'CROSS_SELL',
                            icon: <MdPercent size={24} />,
                            title: 'Gợi ý sản phẩm liên quan',
                            description: 'Gửi sản phẩm bổ sung dựa trên lịch sử mua hàng của khách',
                            color: '#2196f3',
                            examples: ['Phụ kiện cho iPhone đã mua', 'Case + cường lực', 'Tai nghe cho laptop']
                          }
                        ].map(campaign => (
                          <Card
                            key={campaign.type}
                            sx={{
                              cursor: 'pointer',
                              border:
                                campaignType === campaign.type ? `2px solid ${campaign.color}` : '1px solid #e0e0e0',
                              borderRadius: '12px',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                borderColor: campaign.color,
                                transform: 'translateY(-2px)',
                                boxShadow: `0 4px 12px ${campaign.color}20`
                              }
                            }}
                            onClick={() => setCampaignType(campaign.type as CampaignType)}
                          >
                            <CardContent sx={{ p: 3 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Box sx={{ color: campaign.color }}>{campaign.icon}</Box>
                                <Typography variant='h6' sx={{ fontWeight: 600 }}>
                                  {campaign.title}
                                </Typography>
                              </Box>
                              <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                                {campaign.description}
                              </Typography>
                              <Box>
                                <Typography variant='caption' sx={{ fontWeight: 600, color: campaign.color }}>
                                  Ví dụ:
                                </Typography>
                                {campaign.examples.map((example, index) => (
                                  <Typography
                                    key={index}
                                    variant='caption'
                                    sx={{ display: 'block', color: 'text.secondary' }}
                                  >
                                    • {example}
                                  </Typography>
                                ))}
                              </Box>
                            </CardContent>
                          </Card>
                        ))}
                      </Box>

                      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          variant='contained'
                          onClick={() => setCurrentStep(2)}
                          disabled={!campaignType}
                          sx={{ borderRadius: '8px', px: 4 }}
                        >
                          Tiếp theo
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {/* Step 2: Content Configuration */}
                {currentStep === 2 && (
                  <Card sx={{ mb: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography
                          variant='h6'
                          sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <MdCampaign className='text-blue-600' />
                          Cấu hình nội dung chiến dịch
                        </Typography>
                        <Button variant='outlined' onClick={() => setCurrentStep(1)} sx={{ borderRadius: '8px' }}>
                          Quay lại
                        </Button>
                      </Box>

                      {/* Campaign Title & Description */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 600 }}>
                          Thông tin chiến dịch
                        </Typography>
                        <TextField
                          fullWidth
                          label='Tiêu đề chiến dịch'
                          value={campaignTitle}
                          onChange={e => setCampaignTitle(e.target.value)}
                          placeholder={
                            campaignType === 'NEW_PRODUCT'
                              ? 'VD: Ra mắt iPhone 15 Pro Max'
                              : campaignType === 'VOUCHER_PROMOTION'
                              ? 'VD: Sale cuối năm - Giảm đến 50%'
                              : campaignType === 'RETENTION'
                              ? 'VD: Chúng tôi nhớ bạn - Ưu đãi đặc biệt'
                              : 'VD: Phụ kiện hoàn hảo cho thiết bị của bạn'
                          }
                          sx={{ mb: 2, borderRadius: '8px' }}
                        />
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label='Mô tả chiến dịch'
                          value={campaignDescription}
                          onChange={e => setCampaignDescription(e.target.value)}
                          placeholder='Mô tả ngắn gọn về mục đích và nội dung của chiến dịch này...'
                          sx={{ borderRadius: '8px' }}
                        />
                      </Box>

                      {/* Product Selection for NEW_PRODUCT and CROSS_SELL */}
                      {(campaignType === 'NEW_PRODUCT' || campaignType === 'CROSS_SELL') && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 600 }}>
                            Chọn sản phẩm
                          </Typography>
                          <FormControl fullWidth>
                            <InputLabel>Chọn sản phẩm để giới thiệu</InputLabel>
                            <Select
                              value={selectedProductId}
                              label='Chọn sản phẩm để giới thiệu'
                              onChange={e => setSelectedProductId(e.target.value)}
                              disabled={isLoading}
                              sx={{ borderRadius: '8px' }}
                            >
                              <MenuItem value=''>
                                <em>-- Chọn sản phẩm --</em>
                              </MenuItem>
                              {recentProducts?.map(product =>
                                product && product.id && product.name ? (
                                  <MenuItem key={product.id} value={product.id}>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        width: '100%',
                                        alignItems: 'center'
                                      }}
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
                        </Box>
                      )}

                      {/* Voucher Configuration for VOUCHER_PROMOTION and RETENTION */}
                      {(campaignType === 'VOUCHER_PROMOTION' || campaignType === 'RETENTION') && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 600 }}>
                            Chọn Voucher
                          </Typography>

                          <FormControl fullWidth>
                            <InputLabel>Chọn voucher có sẵn</InputLabel>
                            <Select
                              multiple
                              value={selectedVoucherIds}
                              label='Chọn voucher có sẵn'
                              onChange={e =>
                                setSelectedVoucherIds(
                                  typeof e.target.value === 'string' ? [e.target.value] : e.target.value
                                )
                              }
                              disabled={isLoading}
                              sx={{ borderRadius: '8px' }}
                              renderValue={selected => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {selected.map(value => {
                                    const voucher = availableVouchers.find(v => v.id === value);
                                    return <Chip key={value} label={voucher?.code || value} size='small' />;
                                  })}
                                </Box>
                              )}
                            >
                              {availableVouchers.map(voucher => (
                                <MenuItem key={voucher.id} value={voucher.id}>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      width: '100%',
                                      alignItems: 'center'
                                    }}
                                  >
                                    <Typography sx={{ fontWeight: 500 }}>{voucher.code}</Typography>
                                    <Chip
                                      label={`${
                                        voucher.discountType === 'PERCENTAGE'
                                          ? voucher.discountValue + '%'
                                          : voucher.discountValue.toLocaleString() + 'đ'
                                      }`}
                                      size='small'
                                      color='secondary'
                                      variant='outlined'
                                    />
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                          variant='contained'
                          onClick={() => setCurrentStep(3)}
                          disabled={
                            ((campaignType === 'NEW_PRODUCT' || campaignType === 'CROSS_SELL') && !selectedProductId) ||
                            ((campaignType === 'VOUCHER_PROMOTION' || campaignType === 'RETENTION') &&
                              selectedVoucherIds.length === 0)
                          }
                          sx={{ borderRadius: '8px', px: 4 }}
                        >
                          Tiếp theo
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {/* Step 3: Customer Selection */}
                {currentStep === 3 && (
                  <Card sx={{ mb: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography
                          variant='h6'
                          sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <MdPeople className='text-blue-600' />
                          Chọn khách hàng nhận email
                        </Typography>
                        <Button variant='outlined' onClick={() => setCurrentStep(2)} sx={{ borderRadius: '8px' }}>
                          Quay lại
                        </Button>
                      </Box>

                      {/* Customer Segmentation - Only show in auto mode */}
                      {!manualMode && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 600 }}>
                            Phân khúc khách hàng
                          </Typography>
                          <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Chọn nhóm khách hàng</InputLabel>
                            <Select
                              multiple
                              value={selectedSegments}
                              label='Chọn nhóm khách hàng'
                              onChange={e =>
                                setSelectedSegments(
                                  typeof e.target.value === 'string' ? [e.target.value] : e.target.value
                                )
                              }
                              disabled={isLoading}
                              sx={{ borderRadius: '8px' }}
                              renderValue={selected => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {selected.map(value => {
                                    const segment = CUSTOMER_SEGMENTS.find(s => s.id === value);
                                    return <Chip key={value} label={segment?.name || value} size='small' />;
                                  })}
                                </Box>
                              )}
                            >
                              {CUSTOMER_SEGMENTS.map(segment => (
                                <MenuItem key={segment.id} value={segment.id}>
                                  <Box>
                                    <Typography sx={{ fontWeight: 500 }}>{segment.name}</Typography>
                                    <Typography variant='caption' color='text.secondary'>
                                      {segment.description}
                                    </Typography>
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <Alert severity='info' sx={{ borderRadius: '8px' }}>
                            Đã chọn {selectedSegments.length} nhóm khách hàng.
                            {selectedSegments.includes('all') && ' (Bao gồm tất cả khách hàng)'}
                          </Alert>
                        </Box>
                      )}

                      {/* Manual Customer Selection Toggle */}
                      <Box sx={{ mb: 3 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={manualMode}
                              onChange={e => setManualMode(e.target.checked)}
                              color='primary'
                            />
                          }
                          label='Chọn khách hàng cụ thể (thay vì dùng phân khúc tự động)'
                          sx={{ mb: 2 }}
                        />

                        {manualMode && (
                          <Button variant='outlined' onClick={() => setTabValue(1)} sx={{ borderRadius: '8px' }}>
                            Chọn khách hàng từ danh sách
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </Box>
            )}

            {/* Tab Panel 1: Customer List */}
            {tabValue === 1 && (
              <Box>
                <Typography variant='h6' sx={{ mb: 3, fontWeight: 600 }}>
                  Danh sách khách hàng ({allUsers.length})
                </Typography>

                <Paper
                  sx={{ borderRadius: '12px', border: '1px solid #e5e7eb', maxHeight: '500px', overflow: 'hidden' }}
                >
                  <Box sx={{ p: 2, borderBottom: '1px solid #e5e7eb', backgroundColor: '#f8fafc' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                        Chọn khách hàng nhận email
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

                  <List sx={{ maxHeight: '400px', overflow: 'auto', p: 0 }}>
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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                                {user.name || 'Khách hàng'}
                              </Typography>
                              <Chip
                                label={user.role === 'ADMIN' ? 'Admin' : user.role === 'STAFF' ? 'Staff' : 'Khách hàng'}
                                size='small'
                                color={user.role === 'ADMIN' ? 'error' : user.role === 'STAFF' ? 'warning' : 'default'}
                                variant='outlined'
                              />
                              {/* Customer Segment Chip */}
                              {user.role === 'USER' &&
                                (() => {
                                  const segment = customerSegments.get(user.id);
                                  console.log('🔍 [DEBUG] Rendering segment for user', user.name, ':', segment);

                                  if (segment) {
                                    return (
                                      <Chip
                                        label={segment.name}
                                        size='small'
                                        sx={{
                                          backgroundColor: segment.color,
                                          color: 'white',
                                          fontWeight: 600,
                                          fontSize: '0.7rem'
                                        }}
                                      />
                                    );
                                  }

                                  // Fallback chip for debugging
                                  return (
                                    <Chip
                                      label='Đang tải...'
                                      size='small'
                                      sx={{
                                        backgroundColor: '#9e9e9e',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '0.7rem'
                                      }}
                                    />
                                  );
                                })()}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant='body2' color='text.secondary'>
                                {user.email || 'Email không có'}
                              </Typography>
                              {/* Customer Segment Description */}
                              {user.role === 'USER' && customerSegments.get(user.id) && (
                                <Typography variant='caption' color='text.secondary' sx={{ fontStyle: 'italic' }}>
                                  {customerSegments.get(user.id).description}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <Button
                          size='small'
                          variant='outlined'
                          startIcon={<MdInfo />}
                          onClick={() => {
                            setSelectedCustomer(user);
                            setCustomerDetailOpen(true);
                          }}
                          sx={{
                            borderRadius: '8px',
                            textTransform: 'none',
                            minWidth: 'auto',
                            px: 2
                          }}
                        >
                          Chi tiết
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Box>
            )}

            {/* Tab Panel 2: Email Preview */}
            {tabValue === 2 && (
              <Box>
                <Typography variant='h6' sx={{ mb: 3, fontWeight: 600 }}>
                  Xem trước nội dung email
                </Typography>

                {/* Email Preview Card */}
                <Card sx={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                  <CardContent sx={{ p: 0 }}>
                    {/* Email Header */}
                    <Box
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        p: 3,
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant='h5' sx={{ fontWeight: 700, mb: 1 }}>
                        ThanhHuy Store
                      </Typography>
                      <Typography variant='subtitle1' sx={{ opacity: 0.9 }}>
                        {campaignTitle || 'Tiêu đề chiến dịch'}
                      </Typography>
                    </Box>

                    {/* Email Body */}
                    <Box sx={{ p: 3 }}>
                      <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
                        Xin chào [Tên khách hàng],
                      </Typography>

                      <Typography variant='body1' sx={{ mb: 3, lineHeight: 1.6 }}>
                        {campaignDescription || 'Mô tả chiến dịch sẽ hiển thị ở đây...'}
                      </Typography>

                      {/* Campaign-specific content */}
                      {campaignType === 'NEW_PRODUCT' && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
                            🎉 Sản phẩm mới vừa ra mắt!
                          </Typography>
                          {selectedProductId && (
                            <Box
                              sx={{
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                p: 2,
                                backgroundColor: '#f8fafc'
                              }}
                            >
                              <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                {products.find(p => p.id === selectedProductId)?.name || 'Tên sản phẩm'}
                              </Typography>
                              <Typography variant='body2' color='text.secondary'>
                                Khám phá ngay sản phẩm mới nhất của chúng tôi!
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}

                      {campaignType === 'VOUCHER_PROMOTION' && selectedVoucherIds.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
                            🎁 Ưu đãi đặc biệt dành cho bạn!
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {selectedVoucherIds.map(voucherId => {
                              const voucher = availableVouchers.find(v => v.id === voucherId);
                              return voucher ? (
                                <Chip
                                  key={voucherId}
                                  label={`${voucher.code} - ${
                                    voucher.discountType === 'PERCENTAGE'
                                      ? voucher.discountValue + '%'
                                      : voucher.discountValue.toLocaleString() + 'đ'
                                  }`}
                                  color='secondary'
                                  sx={{ fontWeight: 600 }}
                                />
                              ) : null;
                            })}
                          </Box>
                        </Box>
                      )}

                      {campaignType === 'RETENTION' && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
                            💝 Chúng tôi nhớ bạn!
                          </Typography>
                          <Typography variant='body1' sx={{ mb: 2 }}>
                            Đã lâu rồi bạn không ghé thăm cửa hàng. Hãy quay lại với những ưu đãi đặc biệt!
                          </Typography>
                          {selectedVoucherIds.length > 0 && (
                            <Alert severity='success' sx={{ borderRadius: '8px' }}>
                              <Typography variant='subtitle2'>
                                Voucher comeback đặc biệt đã được chuẩn bị cho bạn!
                              </Typography>
                            </Alert>
                          )}
                        </Box>
                      )}

                      {campaignType === 'CROSS_SELL' && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
                            🛍️ Sản phẩm bổ sung cho bạn
                          </Typography>
                          <Typography variant='body1' sx={{ mb: 2 }}>
                            Dựa trên lịch sử mua hàng, chúng tôi nghĩ bạn sẽ thích những sản phẩm này:
                          </Typography>
                          {selectedProductId && (
                            <Box
                              sx={{
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                p: 2,
                                backgroundColor: '#f8fafc'
                              }}
                            >
                              <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                {products.find(p => p.id === selectedProductId)?.name || 'Sản phẩm gợi ý'}
                              </Typography>
                              <Typography variant='body2' color='text.secondary'>
                                Hoàn thiện bộ sưu tập của bạn!
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}

                      {/* CTA Button */}
                      <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Button
                          variant='contained'
                          size='large'
                          sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '8px',
                            px: 4,
                            py: 1.5,
                            fontWeight: 600,
                            textTransform: 'none'
                          }}
                        >
                          {campaignType === 'NEW_PRODUCT'
                            ? 'Khám phá ngay'
                            : campaignType === 'VOUCHER_PROMOTION'
                            ? 'Sử dụng voucher'
                            : campaignType === 'RETENTION'
                            ? 'Quay lại mua sắm'
                            : 'Xem sản phẩm'}
                        </Button>
                      </Box>

                      {/* Footer */}
                      <Divider sx={{ my: 2 }} />
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        sx={{ textAlign: 'center', display: 'block' }}
                      >
                        Cảm ơn bạn đã tin tưởng ThanhHuy Store
                        <br />
                        Nếu không muốn nhận email này, bạn có thể hủy đăng ký tại đây.
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>

                {/* Preview Info */}
                <Alert severity='info' sx={{ mt: 2, borderRadius: '8px' }}>
                  <Typography variant='subtitle2' sx={{ mb: 1 }}>
                    📧 Thông tin gửi email:
                  </Typography>
                  <Typography variant='body2'>
                    • Loại chiến dịch:{' '}
                    <strong>
                      {campaignType === 'NEW_PRODUCT'
                        ? 'Sản phẩm mới'
                        : campaignType === 'VOUCHER_PROMOTION'
                        ? 'Khuyến mãi voucher'
                        : campaignType === 'RETENTION'
                        ? 'Giữ chân khách hàng'
                        : 'Gợi ý sản phẩm liên quan'}
                    </strong>
                    <br />• Phân khúc:{' '}
                    <strong>{selectedSegments.length > 0 ? selectedSegments.join(', ') : 'Chưa chọn'}</strong>
                    <br />• Chế độ: <strong>{manualMode ? 'Chọn thủ công' : 'Tự động theo phân khúc'}</strong>
                  </Typography>
                </Alert>
              </Box>
            )}

            {/* Results Display */}
            {lastResult && (
              <Box sx={{ mt: 4 }}>
                {lastResult.error ? (
                  <Alert severity='error' sx={{ borderRadius: '8px' }}>
                    <Typography variant='h6' sx={{ mb: 1, fontWeight: 600 }}>
                      Lỗi gửi email
                    </Typography>
                    <Typography variant='body2'>{lastResult.error}</Typography>
                  </Alert>
                ) : (
                  <Alert severity='success' sx={{ borderRadius: '8px' }}>
                    <Typography variant='h6' sx={{ mb: 1, fontWeight: 600 }}>
                      Gửi email thành công!
                    </Typography>
                    <Typography variant='body2'>
                      Đã gửi thành công {lastResult.sentCount}/{lastResult.totalUsers} email
                    </Typography>
                    {lastResult.failedEmails && lastResult.failedEmails.length > 0 && (
                      <Typography variant='body2' color='error' sx={{ mt: 1 }}>
                        Gửi thất bại: {lastResult.failedEmails.length} email
                      </Typography>
                    )}
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
          {tabValue === 0 && currentStep === 3 && (
            <Button
              variant='contained'
              onClick={handleSendEmails}
              disabled={isLoading || (manualMode && selectedUsers.length === 0)}
              sx={{
                borderRadius: '8px',
                px: 4,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                }
              }}
            >
              {isLoading ? 'Đang gửi...' : 'Gửi Email Marketing'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        open={customerDetailOpen}
        onClose={() => {
          setCustomerDetailOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
      />
    </>
  );
};

export default SendNewProductEmailClean;

// Also export as the original name for compatibility
export { SendNewProductEmailClean as SendNewProductEmail };

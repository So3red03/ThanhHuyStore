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
  TextField,
  Container
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
  MdInfo,
  MdArrowBack,
  MdHome,
  MdDone
} from 'react-icons/md';
import CustomerDetailModal from '@/app/components/admin/CustomerDetailModal';
import { useRouter } from 'next/navigation';
import { Breadcrumbs, Link, Tooltip } from '@mui/material';

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

const EmailMarketingClient: React.FC = () => {
  const router = useRouter();

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

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

  // Fetch products, users and vouchers when component mounts
  useEffect(() => {
    fetchProducts();
    fetchAllUsers();
    fetchVouchers();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      console.log('🔍 [DEBUG] Fetching products from /api/product...');
      const response = await axios.get('/api/product');
      console.log('✅ [DEBUG] Products response:', response.data);

      // API trả về { products: [...], pagination: {...} }
      if (response.data.products) {
        setProducts(response.data.products || []);
        console.log('📊 [DEBUG] Loaded products:', response.data.products.length);
      } else {
        console.error('❌ [DEBUG] No products field in response');
        setProducts([]);
      }
    } catch (error: any) {
      console.error('❌ [DEBUG] Error fetching products:', error);
      console.error('❌ [DEBUG] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      toast.error('Không thể tải danh sách sản phẩm');
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      console.log('🔍 [DEBUG] Fetching customers from /api/customers...');
      const response = await axios.get('/api/customers');
      console.log('✅ [DEBUG] Customers response:', response.data);

      if (response.data.success) {
        const users = response.data.data || [];
        setAllUsers(users);
        console.log('📊 [DEBUG] Loaded customers:', users.length);
        console.log('📊 [DEBUG] Sample user data:', users[0]);
        console.log('📊 [DEBUG] Sample user categories:', users[0]?.categories);

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
      console.log('🔍 [DEBUG] Calculating customer segments for', users.length, 'users');

      const segmentMap = new Map();

      users.forEach(user => {
        if (user.role === 'USER') {
          // Use data from /api/customers response (already has totalSpent, totalOrders, etc.)
          const userData = {
            totalSpent: user.totalSpent || 0,
            totalOrders: user.totalOrders || 0,
            lastOrderDate: user.lastOrderDate ? new Date(user.lastOrderDate) : null,
            joinDate: user.joinDate ? new Date(user.joinDate) : new Date()
          };

          const segment = determineCustomerSegment(userData);
          if (segment) {
            segmentMap.set(user.id, segment);
            console.log('✅ [DEBUG] Segment for user', user.name, ':', segment.name);
          }
        }
      });

      console.log('📊 [DEBUG] Customer segments map:', segmentMap);
      console.log('📊 [DEBUG] Map entries:', Array.from(segmentMap.entries()));
      setCustomerSegments(segmentMap);

      console.log('🔄 [DEBUG] Segments calculated - total:', segmentMap.size);
    } catch (error) {
      console.error('❌ [DEBUG] Error calculating customer segments:', error);
    }
  };

  // Function to determine customer segment
  const determineCustomerSegment = (customerData: any) => {
    if (!customerData) return null;

    const totalSpent = customerData.totalSpent || 0;
    const orderCount = customerData.totalOrders || 0;
    const lastOrderDate = customerData.lastOrderDate ? new Date(customerData.lastOrderDate) : null;
    const daysSinceLastOrder = lastOrderDate
      ? Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    console.log('🔍 [DEBUG] Customer data for segment calculation:', {
      totalSpent,
      orderCount,
      lastOrderDate,
      daysSinceLastOrder
    });

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
    }

    return null;
  };

  const fetchVouchers = async () => {
    try {
      console.log('🔍 [DEBUG] Fetching vouchers from /api/voucher...');
      const response = await axios.get('/api/voucher');
      console.log('✅ [DEBUG] Vouchers response:', response.data);

      // API trả về trực tiếp array vouchers
      if (Array.isArray(response.data)) {
        setAvailableVouchers(response.data);
        console.log('📊 [DEBUG] Loaded vouchers:', response.data.length);
      } else {
        console.error('❌ [DEBUG] Response is not an array:', typeof response.data);
        setAvailableVouchers([]);
      }
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

  // Removed handleTabChange - using direct onClick handlers now

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

  if (isLoadingProducts) {
    return (
      <Container maxWidth='xl' sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth='xl' sx={{ py: 4 }}>
      {/* Main Content */}
      <Box sx={{ borderRadius: '20px', p: 4, mb: 4 }}>
        {/* Modern Tab Navigation */}
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              backgroundColor: 'white',
              borderRadius: '12px',
              p: 1,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #e5e7eb'
            }}
          >
            {[
              { value: 0, label: 'Tạo chiến dịch', icon: <MdCampaign size={18} /> },
              { value: 1, label: 'Danh sách khách hàng', icon: <MdPeople size={18} /> },
              { value: 2, label: 'Xem trước Email', icon: <MdPreview size={18} /> }
            ].map(tab => (
              <Button
                key={tab.value}
                onClick={() => setTabValue(tab.value)}
                startIcon={tab.icon}
                variant={tabValue === tab.value ? 'contained' : 'text'}
                sx={{
                  flex: 1,
                  py: 1.5,
                  px: 3,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  ...(tabValue === tab.value
                    ? {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                      }
                    : {
                        color: '#6b7280',
                        '&:hover': {
                          backgroundColor: '#f3f4f6',
                          color: '#374151'
                        }
                      })
                }}
              >
                {tab.label}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Content Area */}
        <Box
          sx={{
            backgroundColor: 'white',
            borderRadius: '16px',
            minHeight: '600px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}
        >
          {/* Tab Panel 0: Tạo chiến dịch */}
          {tabValue === 0 && (
            <Box sx={{ p: 6 }}>
              {/* Modern Step Indicator */}
              <Box sx={{ mb: 6 }}>
                <Typography variant='h5' sx={{ mb: 1, fontWeight: 700, color: '#1f2937' }}>
                  Tạo chiến dịch email marketing
                </Typography>

                {/* Modern Progress Steps */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 4,
                    position: 'relative'
                  }}
                >
                  {/* Progress Line */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '20%',
                      right: '20%',
                      height: '2px',
                      backgroundColor: '#e5e7eb',
                      zIndex: 0
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '20%',
                      width: `${((currentStep - 1) / 2) * 60}%`,
                      height: '2px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      zIndex: 1,
                      transition: 'width 0.3s ease'
                    }}
                  />

                  {[
                    { step: 1, title: 'Chọn mục đích', desc: 'Xác định loại chiến dịch' },
                    { step: 2, title: 'Cấu hình nội dung', desc: 'Thiết lập thông tin chi tiết' },
                    { step: 3, title: 'Chọn khách hàng', desc: 'Xác định đối tượng nhận' }
                  ].map(item => (
                    <Box
                      key={item.step}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        flex: 1,
                        zIndex: 2,
                        position: 'relative'
                      }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: currentStep >= item.step ? 'transparent' : '#f3f4f6',
                          background:
                            currentStep >= item.step ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f3f4f6',
                          color: currentStep >= item.step ? 'white' : '#9ca3af',
                          fontWeight: 700,
                          fontSize: '16px',
                          boxShadow: currentStep >= item.step ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none',
                          border: currentStep === item.step ? '3px solid #fff' : 'none',
                          transition: 'all 0.3s ease',
                          mb: 2
                        }}
                      >
                        {item.step}
                      </Box>
                      <Typography
                        variant='subtitle2'
                        sx={{
                          color: currentStep >= item.step ? '#1f2937' : '#9ca3af',
                          fontWeight: currentStep >= item.step ? 600 : 400,
                          textAlign: 'center',
                          mb: 0.5
                        }}
                      >
                        {item.title}
                      </Typography>
                      <Typography
                        variant='caption'
                        sx={{
                          color: '#6b7280',
                          textAlign: 'center',
                          maxWidth: '120px'
                        }}
                      >
                        {item.desc}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
              {/* Step 1: Campaign Purpose Selection */}
              {currentStep === 1 && (
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography
                      variant='h6'
                      sx={{
                        mb: 2,
                        fontWeight: 600,
                        color: '#1f2937',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1
                      }}
                    >
                      <MdCampaign size={24} style={{ color: '#667eea' }} />
                      Bạn muốn gửi email để làm gì?
                    </Typography>
                    <Typography variant='body2' sx={{ color: '#6b7280', maxWidth: '500px', mx: 'auto' }}>
                      Chọn loại chiến dịch phù hợp với mục tiêu marketing của bạn
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                      gap: 3,
                      mb: 4
                    }}
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
                      }
                      // {
                      //   type: 'CROSS_SELL',
                      //   icon: <MdPercent size={24} />,
                      //   title: 'Gợi ý sản phẩm liên quan',
                      //   description: 'Gửi sản phẩm bổ sung dựa trên lịch sử mua hàng của khách',
                      //   color: '#2196f3',
                      //   examples: ['Phụ kiện cho iPhone đã mua', 'Case + cường lực', 'Tai nghe cho laptop']
                      // }
                    ].map(campaign => (
                      <Box
                        key={campaign.type}
                        onClick={() => setCampaignType(campaign.type as CampaignType)}
                        sx={{
                          cursor: 'pointer',
                          borderRadius: '16px',
                          border: campaignType === campaign.type ? `3px solid ${campaign.color}` : '2px solid #e5e7eb',
                          backgroundColor: campaignType === campaign.type ? `${campaign.color}08` : 'white',
                          p: 4,
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          overflow: 'hidden',
                          '&:hover': {
                            borderColor: campaign.color,
                            transform: 'translateY(-4px)',
                            boxShadow: `0 8px 25px ${campaign.color}25`,
                            backgroundColor: `${campaign.color}05`
                          },
                          '&::before':
                            campaignType === campaign.type
                              ? {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  height: '4px',
                                  background: `linear-gradient(90deg, ${campaign.color}, ${campaign.color}80)`
                                }
                              : {}
                        }}
                      >
                        {/* Icon and Title */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: '12px',
                              backgroundColor: `${campaign.color}15`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: campaign.color
                            }}
                          >
                            {campaign.icon}
                          </Box>
                          <Typography variant='h6' sx={{ fontWeight: 700, color: '#1f2937' }}>
                            {campaign.title}
                          </Typography>
                          {campaignType === campaign.type && (
                            <Box
                              sx={{
                                ml: 'auto',
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                backgroundColor: campaign.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                              }}
                            >
                              <MdDone size={16} />
                            </Box>
                          )}
                        </Box>

                        {/* Description */}
                        <Typography variant='body2' sx={{ color: '#6b7280', mb: 3, lineHeight: 1.6 }}>
                          {campaign.description}
                        </Typography>

                        {/* Examples */}
                        <Box>
                          <Typography
                            variant='caption'
                            sx={{
                              fontWeight: 600,
                              color: campaign.color,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              mb: 1,
                              display: 'block'
                            }}
                          >
                            Ví dụ điển hình
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {campaign.examples.map((example, index) => (
                              <Typography
                                key={index}
                                variant='caption'
                                sx={{
                                  color: '#9ca3af',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: '50%',
                                    backgroundColor: campaign.color
                                  }}
                                />
                                {example}
                              </Typography>
                            ))}
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Button
                      variant='contained'
                      onClick={() => setCurrentStep(2)}
                      disabled={!campaignType}
                      size='large'
                      sx={{
                        borderRadius: '12px',
                        px: 6,
                        py: 1.5,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                        },
                        fontWeight: 600,
                        fontSize: '1rem'
                      }}
                    >
                      Tiếp theo
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Step 2: Content Configuration */}
              {currentStep === 2 && (
                <Card sx={{ mb: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant='h6' sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
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
                              <em>-- Chọn sản phẩm ({recentProducts?.length || 0} sản phẩm) --</em>
                            </MenuItem>
                            {recentProducts?.length > 0 ? (
                              recentProducts.map(product =>
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
                              )
                            ) : (
                              <MenuItem disabled>
                                <em>Không có sản phẩm nào</em>
                              </MenuItem>
                            )}
                          </Select>
                        </FormControl>

                        {/* Debug info */}
                        {process.env.NODE_ENV === 'development' && (
                          <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                            <Typography variant='caption' sx={{ display: 'block', mb: 1 }}>
                              Debug: Tổng sản phẩm: {products?.length || 0}
                            </Typography>
                            <Typography variant='caption' sx={{ display: 'block', mb: 1 }}>
                              Debug: Sản phẩm gần đây: {recentProducts?.length || 0}
                            </Typography>
                            <Typography variant='caption' sx={{ display: 'block' }}>
                              Debug: Loading: {isLoadingProducts ? 'Yes' : 'No'}
                            </Typography>
                          </Box>
                        )}
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
                            {availableVouchers?.length > 0 ? (
                              availableVouchers.map(voucher => (
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
                              ))
                            ) : (
                              <MenuItem disabled>
                                <em>Không có voucher nào ({availableVouchers?.length || 0} vouchers)</em>
                              </MenuItem>
                            )}
                          </Select>
                        </FormControl>

                        {/* Debug info */}
                        {process.env.NODE_ENV === 'development' && (
                          <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                            <Typography variant='caption' sx={{ display: 'block' }}>
                              Debug: Vouchers: {availableVouchers?.length || 0}
                            </Typography>
                          </Box>
                        )}
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
                      <Typography variant='h6' sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MdPeople className='text-blue-600' />
                        Chọn khách hàng nhận email
                      </Typography>
                      <Button variant='outlined' onClick={() => setCurrentStep(2)} sx={{ borderRadius: '8px' }}>
                        Quay lại
                      </Button>
                    </Box>

                    {/* Notice about customer segments */}
                    <Alert severity='info' sx={{ borderRadius: '8px', mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant='body2'>
                          <strong>Mẹo:</strong> Để xem phân khúc khách hàng chi tiết (VIP, Mới,...), hãy vào
                        </Typography>
                        <Button
                          size='small'
                          variant='outlined'
                          onClick={() => setTabValue(1)}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            py: 0.5,
                            px: 1
                          }}
                        >
                          Tab Danh sách khách hàng
                        </Button>
                      </Box>
                    </Alert>

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

                    {/* Send Email Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                      <Button
                        variant='contained'
                        size='large'
                        onClick={handleSendEmails}
                        disabled={isLoading}
                        startIcon={isLoading ? <CircularProgress size={20} color='inherit' /> : <MdEmail />}
                        sx={{
                          borderRadius: '12px',
                          px: 6,
                          py: 2,
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                          },
                          '&:disabled': {
                            background: 'linear-gradient(135deg, #9e9e9e 0%, #757575 100%)',
                            color: 'white'
                          }
                        }}
                      >
                        {isLoading ? 'Đang gửi email...' : 'Gửi Email Marketing'}
                      </Button>
                    </Box>

                    {/* Loading Progress */}
                    {isLoading && (
                      <Box sx={{ mt: 3 }}>
                        <LinearProgress
                          sx={{
                            borderRadius: '4px',
                            height: '6px',
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            }
                          }}
                        />
                        <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center', mt: 1 }}>
                          Đang xử lý và gửi email cho khách hàng...
                        </Typography>
                      </Box>
                    )}

                    {/* Results Display */}
                    {lastResult && (
                      <Box sx={{ mt: 4 }}>
                        {lastResult.error ? (
                          <Alert severity='error' sx={{ borderRadius: '8px' }}>
                            <Typography variant='body2'>{lastResult.error}</Typography>
                          </Alert>
                        ) : (
                          <Alert severity='success' sx={{ borderRadius: '8px' }}>
                            <Typography variant='body2'>
                              ✅ Đã gửi email thành công cho {lastResult.sentCount}/{lastResult.totalUsers} người dùng
                            </Typography>
                          </Alert>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}
            </Box>
          )}

          {/* Tab Panel 1: Customer List */}
          {tabValue === 1 && (
            <Box sx={{ p: 6 }}>
              {/* Modern Step Indicator */}
              <Box sx={{ mb: 6 }}>
                <Typography variant='h5' sx={{ mb: 1, fontWeight: 700, color: '#1f2937' }}>
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

                                  if (segment) {
                                    return (
                                      <Chip
                                        label={segment.name}
                                        size='small'
                                        sx={{
                                          backgroundColor: segment.color,
                                          color: 'white',
                                          fontWeight: 600,
                                          fontSize: '0.7rem',
                                          ml: 0.5
                                        }}
                                      />
                                    );
                                  }

                                  return null; // Don't show anything if no segment data
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
                              {/* Categories Chips */}
                              {user.role === 'USER' && user.categories && user.categories.length > 0 && (
                                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {user.categories.slice(0, 3).map((category: any, index: number) => (
                                    <Chip
                                      key={index}
                                      label={category.name || category}
                                      size='small'
                                      variant='outlined'
                                      sx={{
                                        borderColor: '#2196f3',
                                        color: '#2196f3',
                                        fontSize: '0.65rem',
                                        height: '20px',
                                        '& .MuiChip-label': {
                                          px: 1
                                        }
                                      }}
                                    />
                                  ))}
                                  {user.categories.length > 3 && (
                                    <Chip
                                      label={`+${user.categories.length - 3}`}
                                      size='small'
                                      variant='outlined'
                                      sx={{
                                        borderColor: '#9e9e9e',
                                        color: '#9e9e9e',
                                        fontSize: '0.65rem',
                                        height: '20px',
                                        '& .MuiChip-label': {
                                          px: 1
                                        }
                                      }}
                                    />
                                  )}
                                </Box>
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
            </Box>
          )}

          {/* Tab Panel 2: Email Preview */}
          {tabValue === 2 && (
            <Box sx={{ p: 6 }}>
              {/* Modern Step Indicator */}
              <Box sx={{ mb: 6 }}>
                <Typography variant='h5' sx={{ mb: 1, fontWeight: 700, color: '#1f2937' }}>
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

                      {campaignType === 'CROSS_SELL' && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
                            💡 Sản phẩm bổ sung hoàn hảo cho bạn!
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
                                Sản phẩm này sẽ hoàn thiện trải nghiệm của bạn!
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}

                      <Typography variant='body1' sx={{ mb: 3, lineHeight: 1.6 }}>
                        Cảm ơn bạn đã tin tưởng và ủng hộ ThanhHuy Store!
                      </Typography>

                      <Typography variant='body2' color='text.secondary' sx={{ fontStyle: 'italic' }}>
                        Trân trọng,
                        <br />
                        Đội ngũ ThanhHuy Store
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          open={customerDetailOpen}
          onClose={() => {
            setCustomerDetailOpen(false);
            setSelectedCustomer(null);
          }}
        />
      )}
    </Container>
  );
};

export default EmailMarketingClient;

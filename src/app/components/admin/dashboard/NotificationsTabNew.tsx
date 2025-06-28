'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button,
  Chip,
  Stack,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  MdAutorenew,
  MdRefresh,
  MdDateRange,
  MdSettings,
  MdWarning,
  MdError,
  MdInfo,
  MdCheckCircle
} from 'react-icons/md';
import axios from 'axios';
import toast from 'react-hot-toast';

interface NotificationsTabProps {
  orders: any[];
  users: any[];
  selectedPeriod?: number;
  setSelectedPeriod?: (period: number) => void;
  autoRefresh?: boolean;
  setAutoRefresh?: (refresh: boolean) => void;
  showDateRange?: boolean;
  setShowDateRange?: (show: boolean) => void;
  startDate?: string;
  setStartDate?: (date: string) => void;
  endDate?: string;
  setEndDate?: (date: string) => void;
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({
  orders,
  users,
  selectedPeriod = 0,
  setSelectedPeriod,
  autoRefresh = false,
  setAutoRefresh,
  showDateRange = false,
  setShowDateRange,
  startDate = '',
  setStartDate,
  endDate = '',
  setEndDate
}) => {
  // Business alerts state
  const [businessAlerts, setBusinessAlerts] = useState<any[]>([
    {
      type: 'warning',
      title: 'Sản phẩm sắp hết hàng',
      message: 'Có 3 sản phẩm sắp hết hàng trong kho',
      time: '5 phút trước'
    },
    {
      type: 'info',
      title: 'Đơn hàng mới',
      message: 'Có 5 đơn hàng mới cần xử lý',
      time: '10 phút trước'
    }
  ]);

  // Period options từ AdminDashBoardForm
  const periodOptions = [
    { label: 'Từ trước đến giờ', value: 0 },
    { label: 'Hôm nay', value: 1 },
    { label: '7 ngày qua', value: 7 },
    { label: '30 ngày qua', value: 30 },
    { label: '90 ngày qua', value: 90 },
    { label: 'Tùy chọn ngày', value: -1 }
  ];

  // Handle period change
  const handlePeriodChange = (period: number) => {
    if (setSelectedPeriod) {
      setSelectedPeriod(period);
    }
    if (period === -1 && setShowDateRange) {
      setShowDateRange(true);
    } else if (setShowDateRange) {
      setShowDateRange(false);
    }
  };

  // Handle auto refresh toggle
  const handleAutoRefreshToggle = () => {
    if (setAutoRefresh) {
      setAutoRefresh(!autoRefresh);
    }
    toast.success(autoRefresh ? '⏸️ Tắt tự động làm mới' : '▶️ Bật tự động làm mới');
  };

  // Test functions từ AdminNewsDashboard
  const handleCheckRealData = async () => {
    try {
      const response = await axios.get('/api/analytics/overview?days=7');
      const totalEvents = response.data.overview.totalEvents;
      toast.success(`📊 Total real events: ${totalEvents}`);
    } catch (error) {
      toast.error('❌ Lỗi khi check data');
    }
  };

  const handleTestProductTracking = () => {
    toast.success('🎯 Hãy click vào sản phẩm để test tracking!');
    window.open('/', '_blank');
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <MdWarning color="orange" />;
      case 'error': return <MdError color="red" />;
      case 'info': return <MdInfo color="blue" />;
      case 'success': return <MdCheckCircle color="green" />;
      default: return <MdInfo color="blue" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'info': return 'info';
      case 'success': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <div className='mb-6'>
        <Typography variant='h4' fontWeight={700} gutterBottom>
          🔔 Thông báo & Điều khiển
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Quản lý thông báo, cài đặt tự động và kiểm tra hệ thống
        </Typography>
      </div>

      {/* Period Filter Controls từ AdminDashBoardForm */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <MdDateRange size={24} />
            <Typography variant='h6' fontWeight={600}>
              Bộ lọc thời gian
            </Typography>
          </Stack>
          
          <div className='flex flex-wrap gap-2 mb-4'>
            {periodOptions.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                onClick={() => handlePeriodChange(option.value)}
                color={selectedPeriod === option.value ? 'primary' : 'default'}
                variant={selectedPeriod === option.value ? 'filled' : 'outlined'}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </div>

          {showDateRange && (
            <div className='flex gap-4 items-center'>
              <input
                type='date'
                value={startDate}
                onChange={(e) => setStartDate && setStartDate(e.target.value)}
                className='border border-gray-300 rounded px-3 py-2'
              />
              <span>đến</span>
              <input
                type='date'
                value={endDate}
                onChange={(e) => setEndDate && setEndDate(e.target.value)}
                className='border border-gray-300 rounded px-3 py-2'
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto Refresh Controls */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <MdAutorenew size={24} />
            <Typography variant='h6' fontWeight={600}>
              Tự động làm mới
            </Typography>
          </Stack>
          
          <div className='flex items-center justify-between'>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={handleAutoRefreshToggle}
                />
              }
              label="Bật tự động làm mới dữ liệu (30 giây)"
            />
            
            <Button
              variant='outlined'
              startIcon={<MdRefresh />}
              onClick={() => window.location.reload()}
              size='small'
              sx={{ textTransform: 'none' }}
            >
              Làm mới ngay
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Business Alerts */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <MdSettings size={24} />
            <Typography variant='h6' fontWeight={600}>
              Cảnh báo kinh doanh
            </Typography>
          </Stack>
          
          <Stack spacing={2}>
            {businessAlerts.map((alert, index) => (
              <div key={index} className='flex items-center gap-3 p-3 border border-gray-200 rounded-lg'>
                {getAlertIcon(alert.type)}
                <div className='flex-1'>
                  <Typography variant='body1' fontWeight={500}>
                    {alert.title}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {alert.message}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {alert.time}
                  </Typography>
                </div>
                <Chip 
                  label={alert.type} 
                  color={getAlertColor(alert.type) as any}
                  size='small'
                />
              </div>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Test Controls từ AdminNewsDashboard */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant='h6' fontWeight={600} gutterBottom>
            🧪 Kiểm tra hệ thống
          </Typography>
          
          <div className='flex flex-wrap gap-3'>
            <Button
              variant='outlined'
              onClick={handleCheckRealData}
              sx={{ textTransform: 'none' }}
            >
              📊 Check Real Data Count
            </Button>

            <Button
              variant='contained'
              onClick={handleTestProductTracking}
              sx={{
                textTransform: 'none',
                backgroundColor: '#10b981',
                '&:hover': { backgroundColor: '#059669' }
              }}
            >
              🧪 Test Product Tracking
            </Button>
          </div>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotificationsTab;

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Pagination,
  TextField
} from '@mui/material';
import {
  MdRefresh,
  MdDateRange,
  MdSecurity,
  MdAdminPanelSettings,
  MdShoppingCart,
  MdPayment,
  MdBugReport,
  MdDataUsage
} from 'react-icons/md';
import axios from 'axios';
import toast from 'react-hot-toast';
import moment from 'moment';

interface AuditLog {
  id: string;
  eventType: string;
  severity: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  description: string;
  metadata: any;
  resourceId?: string;
  resourceType?: string;
  timestamp: string;
}

interface NotificationsTabProps {
  orders: any[];
  users: any[];
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({ orders, users }) => {
  // State for audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  });

  // Filter states
  const [timeFilter, setTimeFilter] = useState('7d');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDateRange, setShowDateRange] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Event type options
  const eventTypeOptions = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Đăng nhập Admin', value: 'ADMIN_LOGIN' },
    { label: 'Thay đổi đơn hàng', value: 'ORDER_STATUS_CHANGED' },
    { label: 'Thanh toán thành công', value: 'PAYMENT_SUCCESS' },
    { label: 'Thanh toán thất bại', value: 'PAYMENT_FAILED' },
    { label: 'Đơn hàng đáng ngờ', value: 'SUSPICIOUS_ORDER' },
    { label: 'Vượt giới hạn', value: 'RATE_LIMIT_EXCEEDED' }
  ];

  // Severity options
  const severityOptions = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Thấp', value: 'LOW' },
    { label: 'Trung bình', value: 'MEDIUM' },
    { label: 'Cao', value: 'HIGH' },
    { label: 'Nghiêm trọng', value: 'CRITICAL' }
  ];

  // Time filter options
  const timeFilterOptions = [
    { label: '24 giờ', value: '1d' },
    { label: '7 ngày', value: '7d' },
    { label: '30 ngày', value: '30d' },
    { label: 'Tùy chọn', value: 'custom' }
  ];

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(eventTypeFilter !== 'all' && { eventType: eventTypeFilter }),
        ...(severityFilter !== 'all' && { severity: severityFilter }),
        ...(timeFilter === 'custom' && startDate && { startDate }),
        ...(timeFilter === 'custom' && endDate && { endDate }),
        ...(timeFilter !== 'custom' && {
          startDate: moment()
            .subtract(parseInt(timeFilter.replace('d', '')), 'days')
            .format('YYYY-MM-DD')
        })
      });

      const response = await axios.get(`/api/admin/audit-logs?${params}`);
      setAuditLogs(response.data.auditLogs);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Lỗi khi tải audit logs');
    } finally {
      setLoading(false);
    }
  };

  // Load audit logs on component mount and filter changes
  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage, eventTypeFilter, severityFilter, timeFilter, startDate, endDate]);

  // Handle time filter change
  const handleTimeFilterChange = (value: string) => {
    setTimeFilter(value);
    setShowDateRange(value === 'custom');
    setCurrentPage(1);
  };

  // Test functions
  const handleGenerateTestData = async () => {
    try {
      await axios.post('/api/admin/audit-logs', { action: 'generateTestData' });
      toast.success('✅ Test data generated successfully!');
      fetchAuditLogs();
    } catch (error) {
      toast.error('❌ Error generating test data');
    }
  };

  const handleClearTestData = async () => {
    try {
      await axios.post('/api/admin/audit-logs', { action: 'clearTestData' });
      toast.success('🗑️ Test data cleared successfully!');
      fetchAuditLogs();
    } catch (error) {
      toast.error('❌ Error clearing test data');
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW':
        return 'success';
      case 'MEDIUM':
        return 'info';
      case 'HIGH':
        return 'warning';
      case 'CRITICAL':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get event type icon
  const getEventTypeIcon = (eventType: string) => {
    if (eventType.includes('ADMIN')) return <MdAdminPanelSettings />;
    if (eventType.includes('ORDER')) return <MdShoppingCart />;
    if (eventType.includes('PAYMENT')) return <MdPayment />;
    if (eventType.includes('SECURITY') || eventType.includes('SUSPICIOUS')) return <MdSecurity />;
    if (eventType.includes('ERROR')) return <MdBugReport />;
    return <MdDataUsage />;
  };

  return (
    <Box>
      {/* Header */}
      <div className='mb-6'>
        <Typography variant='h4' fontWeight={700} gutterBottom>
          🔐 Security Audit Trail
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Theo dõi và phân tích các hoạt động bảo mật trong hệ thống
        </Typography>
      </div>

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <CardContent sx={{ p: 3 }}>
          <div className='flex items-center gap-2 mb-4'>
            <MdDateRange size={20} className='text-blue-600' />
            <Typography variant='h6' component='h3' sx={{ fontWeight: 600, color: '#1f2937' }}>
              Bộ lọc Audit Trail
            </Typography>
          </div>

          <Grid container spacing={3}>
            {/* Time Filter */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size='small'>
                <InputLabel>Thời gian</InputLabel>
                <Select value={timeFilter} label='Thời gian' onChange={e => handleTimeFilterChange(e.target.value)}>
                  {timeFilterOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Event Type Filter */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size='small'>
                <InputLabel>Loại sự kiện</InputLabel>
                <Select value={eventTypeFilter} label='Loại sự kiện' onChange={e => setEventTypeFilter(e.target.value)}>
                  {eventTypeOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Severity Filter */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size='small'>
                <InputLabel>Mức độ</InputLabel>
                <Select value={severityFilter} label='Mức độ' onChange={e => setSeverityFilter(e.target.value)}>
                  {severityOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Refresh Button */}
            <Grid item xs={12} md={3}>
              <Button
                variant='contained'
                startIcon={<MdRefresh />}
                onClick={fetchAuditLogs}
                fullWidth
                size='medium'
                sx={{
                  backgroundColor: '#3b82f6',
                  '&:hover': { backgroundColor: '#2563eb' },
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  height: '40px'
                }}
              >
                Làm mới
              </Button>
            </Grid>
          </Grid>

          {/* Custom Date Range */}
          {showDateRange && (
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  type='date'
                  label='Từ ngày'
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  fullWidth
                  size='small'
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  type='date'
                  label='Đến ngày'
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  fullWidth
                  size='small'
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card sx={{ mb: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <CardContent sx={{ p: 3 }}>
          <div className='flex items-center justify-between mb-4'>
            <Typography variant='h6' component='h3' sx={{ fontWeight: 600, color: '#1f2937' }}>
              📋 Audit Logs ({pagination.totalCount} records)
            </Typography>
            {loading && <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600'></div>}
          </div>

          <TableContainer component={Paper} sx={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <Table size='small'>
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Thời gian</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Loại sự kiện</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Mức độ</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Người dùng</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Mô tả</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>IP Address</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.map(log => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Typography variant='body2' sx={{ fontSize: '0.75rem' }}>
                        {moment(log.timestamp).format('DD/MM/YY HH:mm')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        {getEventTypeIcon(log.eventType)}
                        <Typography variant='body2' sx={{ fontSize: '0.75rem' }}>
                          {log.eventType}
                        </Typography>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.severity}
                        color={getSeverityColor(log.severity) as any}
                        size='small'
                        sx={{ fontSize: '0.7rem', height: '20px' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' sx={{ fontSize: '0.75rem' }}>
                        {log.userEmail || 'System'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' sx={{ fontSize: '0.75rem', maxWidth: '300px' }}>
                        {log.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' sx={{ fontSize: '0.75rem' }}>
                        {log.ipAddress || 'N/A'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className='flex justify-center mt-4'>
              <Pagination
                count={pagination.totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color='primary'
                size='medium'
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card sx={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant='h6' fontWeight={600} gutterBottom sx={{ color: '#1f2937' }}>
            🧪 Test Data Controls
          </Typography>

          <div className='flex flex-wrap gap-3'>
            <Button
              variant='outlined'
              onClick={handleGenerateTestData}
              sx={{
                textTransform: 'none',
                borderColor: '#3b82f6',
                color: '#3b82f6',
                '&:hover': {
                  borderColor: '#2563eb',
                  backgroundColor: '#eff6ff'
                }
              }}
            >
              📊 Generate Test Data
            </Button>

            <Button
              variant='contained'
              onClick={handleClearTestData}
              sx={{
                textTransform: 'none',
                backgroundColor: '#ef4444',
                '&:hover': { backgroundColor: '#dc2626' }
              }}
            >
              🗑️ Clear Test Data
            </Button>
          </div>

          <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
            Sử dụng các nút này để tạo dữ liệu test cho audit trail hoặc xóa dữ liệu test đã tạo.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotificationsTab;

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Pagination,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  IconButton,
  Tooltip,
  Badge,
  Divider,
  Stack,
  Button,
  useTheme,
  alpha,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar
} from '@mui/material';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import {
  MdSearch,
  MdFilterList,
  MdNotifications,
  MdShoppingCart,
  MdMessage,
  MdWarning,
  MdComment,
  MdSettings,
  MdLocalOffer,
  MdMarkAsUnread,
  MdMarkEmailRead,
  MdDelete,
  MdRefresh,
  MdBarChart,
  MdCheck,
  MdClose,
  MdVisibilityOff
} from 'react-icons/md';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import AIActionButtons from '../AIActionButtons';

interface Notification {
  id: string;
  type:
    | 'ORDER_PLACED'
    | 'MESSAGE_RECEIVED'
    | 'LOW_STOCK'
    | 'COMMENT_RECEIVED'
    | 'SYSTEM_ALERT'
    | 'PROMOTION_SUGGESTION'
    | 'VOUCHER_SUGGESTION'
    | 'AI_ASSISTANT';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    image?: string;
  };
  product?: {
    id: string;
    name: string;
    thumbnail?: string;
  };
  data?: any;
  metadata?: {
    memoryId?: string;
    alertId?: string;
    status?: string;
  };
}

const NotificationTab: React.FC = () => {
  const theme = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState('7d');
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const itemsPerPage = 10;

  // Notification type configurations
  const notificationConfig = {
    ORDER_PLACED: {
      icon: <MdShoppingCart size={20} />,
      color: '#2196F3',
      bgGradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
      label: 'Đơn hàng'
    },
    MESSAGE_RECEIVED: {
      icon: <MdMessage size={20} />,
      color: '#4CAF50',
      bgGradient: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
      label: 'Tin nhắn'
    },
    LOW_STOCK: {
      icon: <MdWarning size={20} />,
      color: '#FF9800',
      bgGradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
      label: 'Hết hàng'
    },
    COMMENT_RECEIVED: {
      icon: <MdComment size={20} />,
      color: '#9C27B0',
      bgGradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
      label: 'Bình luận'
    },
    SYSTEM_ALERT: {
      icon: <MdSettings size={20} />,
      color: '#607D8B',
      bgGradient: 'linear-gradient(135deg, #607D8B 0%, #455A64 100%)',
      label: 'Hệ thống'
    },
    PROMOTION_SUGGESTION: {
      icon: <MdLocalOffer size={20} />,
      color: '#E91E63',
      bgGradient: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)',
      label: 'Khuyến mãi'
    },
    VOUCHER_SUGGESTION: {
      icon: <MdLocalOffer size={20} />,
      color: '#673AB7',
      bgGradient: 'linear-gradient(135deg, #673AB7 0%, #512DA8 100%)',
      label: 'Voucher'
    },
    AI_ASSISTANT: {
      icon: <MdBarChart size={20} />,
      color: '#3b82f6',
      bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      label: 'AI Assistant'
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, searchTerm, filterType, filterRead, timeFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterType !== 'all' && { type: filterType }),
        ...(filterRead !== 'all' && { isRead: filterRead }),
        ...(timeFilter !== 'all' && { timeFilter })
      });

      const response = await fetch(`/api/notifications/admin?${params}`);
      const data = await response.json();

      setNotifications(data.notifications || []);
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchNotifications();
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: 'PUT'
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'PUT'
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleClearAllNotifications = async () => {
    setIsClearingAll(true);

    try {
      const response = await fetch('/api/notifications/clear-all', {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Cleared ${data.deletedCount} notifications`);
        fetchNotifications();
        setShowClearAllDialog(false);
      } else {
        console.error('Error clearing all notifications');
        alert('Lỗi khi xóa thông báo. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      alert('Lỗi khi xóa thông báo. Vui lòng thử lại.');
    } finally {
      setIsClearingAll(false);
    }
  };

  // Handle AI Memory status updates
  const handleResolveAlert = async (notificationId: string, memoryId?: string) => {
    if (!memoryId) return;

    try {
      const response = await fetch(`/api/ai-assistant/memory/${memoryId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'RESOLVED',
          note: 'Đã xử lý từ notification panel'
        })
      });

      if (response.ok) {
        fetchNotifications();
        console.log('✅ Alert marked as resolved');
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const handleDismissAlert = async (notificationId: string, memoryId?: string) => {
    if (!memoryId) return;

    try {
      const response = await fetch(`/api/ai-assistant/memory/${memoryId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'DISMISSED',
          note: 'Đã tắt nhắc nhở từ notification panel'
        })
      });

      if (response.ok) {
        fetchNotifications();
        console.log('✅ Alert dismissed');
      }
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  // Database cleanup function
  const handleDatabaseCleanup = async () => {
    if (
      !confirm(
        'Dọn dẹp database sẽ xóa:\n- AIMemory cũ hơn 10 ngày\n- Notifications cũ hơn 30 ngày\n- Duplicate records\n\nBạn có chắc chắn?'
      )
    ) {
      return;
    }

    try {
      const response = await fetch('/api/ai-assistant/cleanup', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          `✅ Cleanup hoàn thành!\n- Xóa ${data.deletedMemories} AIMemory cũ\n- Xóa ${data.deletedNotifications} notifications cũ\n- Xóa ${data.duplicatesRemoved} duplicates`
        );
        fetchNotifications();
      } else {
        alert('❌ Lỗi khi cleanup database');
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      alert('❌ Lỗi khi cleanup database');
    }
  };

  const getNotificationStats = () => {
    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.isRead).length,
      byType: {} as Record<string, number>
    };

    notifications.forEach(notification => {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
    });

    return stats;
  };

  const stats = getNotificationStats();

  return (
    <Box>
      {/* Main Content Card */}
      <Card sx={{ mb: 4, borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <CardContent sx={{ p: 0 }}>
          {/* Compact Header Section */}
          <div className='bg-gradient-to-r from-purple-500 via-pink-400 to-blue-500  p-4 text-white'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-white/20 backdrop-blur-sm rounded-lg'>
                  <MdNotifications size={20} className='text-white' />
                </div>
                <div>
                  <Typography variant='h5' sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                    Quản lý Thông báo
                  </Typography>
                  <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Theo dõi và quản lý tất cả thông báo hệ thống
                  </Typography>
                </div>
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold'>{stats.total}</div>
                <div className='text-xs opacity-90'>Tổng thông báo</div>
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
                    Đang tải dữ liệu thông báo...
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
                            <MdNotifications size={20} />
                          </div>
                        </div>
                        <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '1.5rem' }}>
                          {stats.total}
                        </Typography>
                        <Typography variant='body2' sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                          Tổng thông báo
                        </Typography>
                        <div className='mt-1 text-xs bg-white/20 rounded-full px-2 py-0.5'>Tổng hệ thống</div>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 16px rgba(240, 147, 251, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(240, 147, 251, 0.3)'
                        }
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
                        <div className='flex justify-center mb-2'>
                          <div className='p-2 bg-white/20 rounded-full'>
                            <MdMarkAsUnread size={20} />
                          </div>
                        </div>
                        <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '1.5rem' }}>
                          {stats.unread}
                        </Typography>
                        <Typography variant='body2' sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                          Chưa đọc
                        </Typography>
                        <div className='mt-1 text-xs bg-white/20 rounded-full px-2 py-0.5'>Cần xử lý</div>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        color: 'white',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 16px rgba(79, 172, 254, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(79, 172, 254, 0.3)'
                        }
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
                        <div className='flex justify-center mb-2'>
                          <div className='p-2 bg-white/20 rounded-full'>
                            <MdMarkEmailRead size={20} />
                          </div>
                        </div>
                        <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '1.5rem' }}>
                          {stats.total - stats.unread}
                        </Typography>
                        <Typography variant='body2' sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                          Đã đọc
                        </Typography>
                        <div className='mt-1 text-xs bg-white/20 rounded-full px-2 py-0.5'>Đã xử lý</div>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{
                        background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                        color: '#1f2937',
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
                          <div className='p-2 bg-white/20 rounded-full'>
                            <MdBarChart size={20} />
                          </div>
                        </div>
                        <Typography variant='h4' sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '1.5rem' }}>
                          {Object.keys(stats.byType).length}
                        </Typography>
                        <Typography variant='body2' sx={{ opacity: 0.8, fontSize: '0.75rem' }}>
                          Loại thông báo
                        </Typography>
                        <div className='mt-1 text-xs bg-white/20 rounded-full px-2 py-0.5'>Phân loại</div>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Layout ngang: Filters bên trái, Notifications bên phải */}
      <Grid container spacing={3}>
        {/* Sidebar Filters */}
        <Grid item xs={12} md={3}>
          <Card
            sx={{
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              height: 'fit-content',
              position: 'sticky',
              top: 20
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <div className='flex items-center gap-2 mb-4'>
                <MdFilterList size={20} className='text-blue-600' />
                <Typography variant='h6' sx={{ fontWeight: 600, color: '#1f2937' }}>
                  Bộ lọc
                </Typography>
              </div>

              <Stack spacing={3}>
                {/* Search */}
                <TextField
                  fullWidth
                  placeholder='Tìm kiếm thông báo...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <MdSearch />
                      </InputAdornment>
                    )
                  }}
                  size='small'
                />

                {/* Time Filter */}
                <FormControl fullWidth size='small'>
                  <InputLabel>Thời gian</InputLabel>
                  <Select value={timeFilter} label='Thời gian' onChange={e => setTimeFilter(e.target.value)}>
                    <MenuItem value='1d'>24 giờ</MenuItem>
                    <MenuItem value='7d'>7 ngày</MenuItem>
                    <MenuItem value='30d'>30 ngày</MenuItem>
                    <MenuItem value='all'>Tất cả</MenuItem>
                  </Select>
                </FormControl>

                {/* Type Filter */}
                <FormControl fullWidth size='small'>
                  <InputLabel>Loại thông báo</InputLabel>
                  <Select value={filterType} onChange={e => setFilterType(e.target.value)} label='Loại thông báo'>
                    <MenuItem value='all'>Tất cả</MenuItem>
                    {Object.entries(notificationConfig)
                      .filter(([type]) => type !== 'MESSAGE_RECEIVED') // Bỏ option tin nhắn
                      .map(([type, config]) => (
                        <MenuItem key={type} value={type}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {config.icon}
                            {config.label}
                          </Box>
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                {/* Read Status Filter */}
                <FormControl fullWidth size='small'>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select value={filterRead} onChange={e => setFilterRead(e.target.value)} label='Trạng thái'>
                    <MenuItem value='all'>Tất cả</MenuItem>
                    <MenuItem value='false'>Chưa đọc</MenuItem>
                    <MenuItem value='true'>Đã đọc</MenuItem>
                  </Select>
                </FormControl>

                {/* Quick Actions */}
                <Divider />
                <Stack spacing={2}>
                  <Button
                    variant='outlined'
                    startIcon={<MdMarkEmailRead />}
                    onClick={handleMarkAllAsRead}
                    size='small'
                    fullWidth
                    sx={{
                      borderColor: '#3b82f6',
                      color: '#3b82f6',
                      '&:hover': {
                        borderColor: '#2563eb',
                        backgroundColor: '#eff6ff'
                      }
                    }}
                  >
                    Đánh dấu tất cả đã đọc
                  </Button>

                  <Button
                    variant='outlined'
                    startIcon={<MdDelete />}
                    onClick={() => setShowClearAllDialog(true)}
                    size='small'
                    fullWidth
                    sx={{
                      borderColor: '#ef4444',
                      color: '#ef4444',
                      '&:hover': {
                        borderColor: '#dc2626',
                        backgroundColor: '#fef2f2'
                      }
                    }}
                  >
                    Xóa tất cả thông báo
                  </Button>

                  <Button
                    variant='outlined'
                    startIcon={<MdRefresh />}
                    onClick={handleDatabaseCleanup}
                    size='small'
                    fullWidth
                    sx={{
                      borderColor: '#8b5cf6',
                      color: '#8b5cf6',
                      '&:hover': {
                        borderColor: '#7c3aed',
                        backgroundColor: '#f3f4f6'
                      }
                    }}
                  >
                    Dọn dẹp database
                  </Button>

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
                    size='small'
                    fullWidth
                    sx={{
                      backgroundColor: '#3b82f6',
                      '&:hover': { backgroundColor: '#2563eb' },
                      '&:disabled': {
                        backgroundColor: '#9ca3af',
                        color: '#ffffff'
                      },
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    {isRefreshing ? 'Đang tải...' : 'Làm mới'}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={9}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <CardContent sx={{ p: 0 }}>
              {loading ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography>Đang tải...</Typography>
                </Box>
              ) : notifications.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <MdNotifications size={48} color={theme.palette.grey[400]} />
                  <Typography variant='h6' sx={{ mt: 2, color: 'text.secondary' }}>
                    Không có thông báo nào
                  </Typography>
                </Box>
              ) : (
                <>
                  {/* Notifications List */}
                  <List sx={{ p: 0 }}>
                    {notifications.map((notification, index) => {
                      const config = notificationConfig[notification.type];
                      return (
                        <React.Fragment key={notification.id}>
                          <ListItem
                            sx={{
                              p: 2,
                              bgcolor: notification.isRead ? 'transparent' : alpha(config.color, 0.05),
                              borderLeft: `4px solid ${notification.isRead ? 'transparent' : config.color}`,
                              '&:hover': {
                                bgcolor: alpha(config.color, 0.08)
                              }
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar
                                sx={{
                                  width: 48,
                                  height: 48,
                                  background: config.bgGradient,
                                  color: 'white'
                                }}
                              >
                                {config.icon}
                              </Avatar>
                            </ListItemAvatar>

                            <ListItemText
                              primary={
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between',
                                    mb: 1
                                  }}
                                >
                                  <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                      <Typography
                                        variant='subtitle1'
                                        fontWeight={notification.isRead ? 'normal' : 'bold'}
                                        sx={{ flex: 1 }}
                                      >
                                        {notification.title}
                                      </Typography>

                                      {/* AI Recommendation Badge */}
                                      {notification.type === 'AI_ASSISTANT' && notification.data?.aiAssistant && (
                                        <Chip
                                          label='AI'
                                          size='small'
                                          sx={{
                                            height: 20,
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold',
                                            bgcolor: alpha('#3b82f6', 0.1),
                                            color: '#3b82f6',
                                            '& .MuiChip-label': { px: 1 }
                                          }}
                                        />
                                      )}
                                    </Box>
                                    <Typography
                                      variant='body2'
                                      color='text.secondary'
                                      sx={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                      }}
                                    >
                                      {notification.message}
                                    </Typography>

                                    {/* AI Action Buttons - Only for AI recommendations */}
                                    {notification.type === 'AI_ASSISTANT' &&
                                      notification.data?.aiAssistant &&
                                      notification.data?.eventType && (
                                        <Box sx={{ mt: 2 }}>
                                          <AIActionButtons
                                            productId={notification.data.productId}
                                            productName={notification.data.productName}
                                            suggestionType={notification.data.eventType as any}
                                            suggestedAction={
                                              notification.data.eventType === 'INVENTORY_CRITICAL'
                                                ? 'RESTOCK'
                                                : 'VIEW_PRODUCT'
                                            }
                                            confidence={85} // Default confidence for AI assistant
                                            onActionTaken={(action, value) => {
                                              console.log(`AI Action taken from NotificationTab: ${action}`, value);
                                              // Mark notification as read after action
                                              handleMarkAsRead(notification.id);
                                            }}
                                          />
                                        </Box>
                                      )}
                                  </Box>

                                  {/* Action Buttons */}
                                  <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
                                    {/* AI Assistant specific actions */}
                                    {notification.type === 'AI_ASSISTANT' && (
                                      <>
                                        <Tooltip title='Đã xử lý'>
                                          <IconButton
                                            size='small'
                                            onClick={() =>
                                              handleResolveAlert(notification.id, notification.metadata?.memoryId)
                                            }
                                            sx={{ color: '#10b981' }}
                                          >
                                            <MdCheck size={16} />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title='Tắt nhắc nhở'>
                                          <IconButton
                                            size='small'
                                            onClick={() =>
                                              handleDismissAlert(notification.id, notification.metadata?.memoryId)
                                            }
                                            sx={{ color: '#f59e0b' }}
                                          >
                                            <MdVisibilityOff size={16} />
                                          </IconButton>
                                        </Tooltip>
                                      </>
                                    )}

                                    {!notification.isRead && (
                                      <Tooltip title='Đánh dấu đã đọc'>
                                        <IconButton
                                          size='small'
                                          onClick={() => handleMarkAsRead(notification.id)}
                                          sx={{ color: config.color }}
                                        >
                                          <MdMarkEmailRead size={16} />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                    <Tooltip title='Xóa thông báo'>
                                      <IconButton
                                        size='small'
                                        onClick={() => handleDeleteNotification(notification.id)}
                                        sx={{ color: 'error.main' }}
                                      >
                                        <MdDelete size={16} />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>
                              }
                              secondary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                                  <Chip
                                    label={config.label}
                                    size='small'
                                    sx={{
                                      bgcolor: alpha(config.color, 0.1),
                                      color: config.color,
                                      fontWeight: 'medium'
                                    }}
                                  />

                                  {notification.user && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Avatar src={notification.user.image} sx={{ width: 20, height: 20 }}>
                                        {notification.user.name?.charAt(0)}
                                      </Avatar>
                                      <Typography variant='caption' color='text.secondary'>
                                        {notification.user.name}
                                      </Typography>
                                    </Box>
                                  )}

                                  <Typography variant='caption' color='text.secondary'>
                                    {formatDistanceToNow(new Date(notification.createdAt), {
                                      addSuffix: true,
                                      locale: vi
                                    })}
                                  </Typography>

                                  {!notification.isRead && (
                                    <Badge
                                      color='primary'
                                      variant='dot'
                                      sx={{
                                        '& .MuiBadge-dot': {
                                          bgcolor: config.color
                                        }
                                      }}
                                    />
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < notifications.length - 1 && <Divider />}
                        </React.Fragment>
                      );
                    })}
                  </List>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                      <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(_, newPage) => setPage(newPage)}
                        color='primary'
                        size='large'
                        showFirstButton
                        showLastButton
                      />
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Clear All Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearAllDialog}
        handleClose={() => setShowClearAllDialog(false)}
        onConfirm={handleClearAllNotifications}
        isLoading={isClearingAll}
        loadingText='Đang xóa...'
      >
        <div className='text-center'>
          <Typography variant='body1' sx={{ mb: 2 }}>
            Bạn có chắc chắn muốn <strong>xóa tất cả thông báo</strong>?
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Hành động này không thể hoàn tác. Tất cả thông báo sẽ bị xóa vĩnh viễn.
          </Typography>
        </div>
      </ConfirmDialog>
    </Box>
  );
};

export default NotificationTab;

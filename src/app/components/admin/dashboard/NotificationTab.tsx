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
  MdVisibilityOff,
  MdEvent,
  MdSmartToy,
  MdRestore,
  MdVisibility
} from 'react-icons/md';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { truncateText } from '../../../../../utils/truncateText';
import AIActionButtons from '../AIActionButtons';

interface Notification {
  id: string;
  type:
    | 'ORDER_PLACED' // ✅ Event Notification
    | 'MESSAGE_RECEIVED' // ✅ Event Notification
    | 'COMMENT_RECEIVED' // ✅ Event Notification
    | 'AI_ASSISTANT'; // 🤖 AI Recommendation (ONLY)
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
  const [viewMode, setViewMode] = useState<'all' | 'events' | 'ai'>('all'); // New: View mode filter
  const [timeFilter, setTimeFilter] = useState('7d');
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false); // New: Show deleted notifications
  const [deletedNotifications, setDeletedNotifications] = useState<Notification[]>([]);
  const [normalStats, setNormalStats] = useState({ total: 0, unread: 0 }); // Normal notifications stats
  const [deletedStats, setDeletedStats] = useState({ total: 0, unread: 0 }); // Deleted notifications stats
  const itemsPerPage = 10;

  // Notification type configurations - consistent with SingleNotificationToast
  const notificationConfig = {
    ORDER_PLACED: {
      icon: <MdShoppingCart size={20} />,
      color: '#2196F3',
      bgGradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
      label: 'Đơn hàng'
    },
    COMMENT_RECEIVED: {
      icon: <MdComment size={20} />,
      color: '#9C27B0',
      bgGradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
      label: 'Bình luận'
    },
    AI_ASSISTANT: {
      icon: <MdSmartToy size={20} />,
      color: '#3b82f6',
      bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      label: 'AI Assistant'
    },
    MESSAGE_RECEIVED: {
      icon: <MdMessage size={20} />,
      color: '#4CAF50',
      bgGradient: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
      label: 'Tin nhắn'
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

      console.log('🔍 Normal notifications API response:', {
        total: data.total,
        unreadCount: data.unreadCount,
        notificationsLength: data.notifications?.length,
        params: params.toString()
      });

      setNotifications(data.notifications || []);
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));

      // Update normal stats from API response
      setNormalStats({
        total: data.total || 0,
        unread: data.unreadCount || 0
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch deleted notifications - simple approach like ManageProductsClient
  const fetchDeletedNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/admin?onlyDeleted=true');
      if (response.ok) {
        const data = await response.json();

        console.log('🗑️ Deleted notifications API response:', {
          total: data.total,
          unreadCount: data.unreadCount,
          notificationsLength: data.notifications?.length
        });

        setDeletedNotifications(data.notifications || []);

        // Update deleted stats for deleted notifications
        setDeletedStats({
          total: data.total || 0,
          unread: data.unreadCount || 0
        });
      }
    } catch (error) {
      console.error('Error fetching deleted notifications:', error);
    }
  };

  // Toggle between normal and deleted notifications
  const handleToggleDeleted = async () => {
    if (!showDeleted) {
      await fetchDeletedNotifications();
    }
    setShowDeleted(!showDeleted);
  };

  // Restore deleted notification
  const handleRestoreNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/restore`, {
        method: 'PUT'
      });

      // Refresh both lists
      await fetchDeletedNotifications();
      await fetchNotifications();
    } catch (error) {
      console.error('Error restoring notification:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (showDeleted) {
        await fetchDeletedNotifications();
      } else {
        await fetchNotifications();
      }
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
      // Also refresh deleted list if we're viewing it
      if (showDeleted) {
        await fetchDeletedNotifications();
      }
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
    // Use appropriate stats based on current view
    const currentData = showDeleted ? deletedNotifications : notifications;
    const currentStats = showDeleted ? deletedStats : normalStats;

    const stats = {
      total: currentStats.total, // Real total from API for current view
      unread: currentStats.unread, // Real unread count from API for current view
      byType: {} as Record<string, number>
    };

    // Calculate byType from current visible data (this is OK for display)
    currentData.forEach(notification => {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
    });

    console.log('📊 Stats calculation:', {
      showDeleted,
      currentStats,
      finalStats: stats,
      currentDataLength: currentData.length
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
                    {showDeleted ? 'Thông báo đã xóa' : 'Quản lý Thông báo'}
                  </Typography>
                  <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    {showDeleted
                      ? 'Xem và khôi phục thông báo đã xóa'
                      : 'Theo dõi và quản lý tất cả thông báo hệ thống'}
                  </Typography>
                </div>
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold'>{stats.total}</div>
                <div className='text-xs opacity-90'>{showDeleted ? 'Đã xóa' : 'Tổng thông báo'}</div>
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
                          {showDeleted ? 'Đã xóa' : 'Tổng thông báo'}
                        </Typography>
                        <div className='mt-1 text-xs bg-white/20 rounded-full px-2 py-0.5'>
                          {showDeleted ? 'Đã xóa' : 'Tổng hệ thống'}
                        </div>
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
                          {showDeleted ? 'Chưa đọc (đã xóa)' : 'Chưa đọc'}
                        </Typography>
                        <div className='mt-1 text-xs bg-white/20 rounded-full px-2 py-0.5'>
                          {showDeleted ? 'Đã xóa' : 'Cần xử lý'}
                        </div>
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
                          {showDeleted ? 'Đã đọc (đã xóa)' : 'Đã đọc'}
                        </Typography>
                        <div className='mt-1 text-xs bg-white/20 rounded-full px-2 py-0.5'>
                          {showDeleted ? 'Đã xóa' : 'Đã xử lý'}
                        </div>
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
                          {showDeleted ? 'Loại (đã xóa)' : 'Loại thông báo'}
                        </Typography>
                        <div className='mt-1 text-xs bg-white/20 rounded-full px-2 py-0.5'>
                          {showDeleted ? 'Đã xóa' : 'Phân loại'}
                        </div>
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
                    <MenuItem value='all'>Tất cả</MenuItem>
                    <MenuItem value='1d'>24 giờ</MenuItem>
                    <MenuItem value='7d'>7 ngày</MenuItem>
                    <MenuItem value='30d'>30 ngày</MenuItem>
                  </Select>
                </FormControl>

                {/* View Mode Filter - NEW: Separate Events vs AI Recommendations */}
                <FormControl fullWidth size='small'>
                  <InputLabel>Chế độ xem</InputLabel>
                  <Select
                    value={viewMode}
                    onChange={e => setViewMode(e.target.value as 'all' | 'events' | 'ai')}
                    label='Chế độ xem'
                  >
                    <MenuItem value='all'>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        Tất cả
                      </Box>
                    </MenuItem>
                    <MenuItem value='events'>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MdEvent />
                        Thông báo sự kiện
                      </Box>
                    </MenuItem>
                    <MenuItem value='ai'>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MdSmartToy />
                        AI Recommendations
                      </Box>
                    </MenuItem>
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
                    variant={showDeleted ? 'contained' : 'outlined'}
                    startIcon={showDeleted ? <MdVisibility /> : <MdVisibilityOff />}
                    onClick={handleToggleDeleted}
                    size='small'
                    fullWidth
                    sx={{
                      borderColor: '#f59e0b',
                      color: showDeleted ? 'white' : '#f59e0b',
                      backgroundColor: showDeleted ? '#f59e0b' : 'transparent',
                      '&:hover': {
                        borderColor: '#d97706',
                        backgroundColor: showDeleted ? '#d97706' : '#fef3c7'
                      }
                    }}
                  >
                    {showDeleted ? 'Xem thông báo thường' : 'Xem thông báo đã xóa'}
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
              ) : (showDeleted ? deletedNotifications : notifications).length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <MdNotifications size={48} color={theme.palette.grey[400]} />
                  <Typography variant='h6' sx={{ mt: 2, color: 'text.secondary' }}>
                    {showDeleted ? 'Không có thông báo đã xóa nào' : 'Không có thông báo nào'}
                  </Typography>
                </Box>
              ) : (
                <>
                  {/* Notifications List */}
                  <List sx={{ p: 0 }}>
                    {(showDeleted ? deletedNotifications : notifications)
                      .filter(notification => {
                        // Search filter
                        const matchesSearch =
                          searchTerm === '' ||
                          notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          notification.message.toLowerCase().includes(searchTerm.toLowerCase());

                        // Type filter
                        const matchesType = filterType === 'all' || notification.type === filterType;

                        // Read status filter
                        const matchesRead =
                          filterRead === 'all' ||
                          (filterRead === 'true' && notification.isRead) ||
                          (filterRead === 'false' && !notification.isRead);

                        // View mode filter - NEW: Separate Events vs AI Recommendations
                        const matchesViewMode = (() => {
                          if (viewMode === 'all') return true;
                          if (viewMode === 'events') {
                            // Event notifications: actual events that happened
                            return ['ORDER_PLACED', 'MESSAGE_RECEIVED', 'COMMENT_RECEIVED', 'SYSTEM_ALERT'].includes(
                              notification.type
                            );
                          }
                          if (viewMode === 'ai') {
                            // AI recommendations: proactive suggestions
                            return notification.type === 'AI_ASSISTANT';
                          }
                          return true;
                        })();

                        // Time filter
                        const notificationDate = new Date(notification.createdAt);
                        const now = new Date();
                        let matchesTime = true;

                        switch (timeFilter) {
                          case '1d':
                            matchesTime = now.getTime() - notificationDate.getTime() <= 24 * 60 * 60 * 1000;
                            break;
                          case '3d':
                            matchesTime = now.getTime() - notificationDate.getTime() <= 3 * 24 * 60 * 60 * 1000;
                            break;
                          case '7d':
                            matchesTime = now.getTime() - notificationDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
                            break;
                          case '30d':
                            matchesTime = now.getTime() - notificationDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
                            break;
                          case 'all':
                          default:
                            matchesTime = true;
                        }

                        return matchesSearch && matchesType && matchesRead && matchesViewMode && matchesTime;
                      })
                      .map((notification, index) => {
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

                                      {/* Product/Context Details - For relevant notifications */}
                                      {(notification.data?.productName ||
                                        notification.data?.articleTitle ||
                                        notification.data?.commentContent ||
                                        notification.data?.orderAmount ||
                                        notification.data?.userName ||
                                        notification.data?.customerName) && (
                                        <Box
                                          sx={{ mt: 1, p: 1.5, bgcolor: alpha(config.color, 0.05), borderRadius: 1 }}
                                        >
                                          {(notification.data?.userName || notification.data?.customerName) && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                              <Avatar
                                                src={
                                                  notification.data?.userImage || notification.data?.customerImage || ''
                                                }
                                                sx={{ width: 20, height: 20, fontSize: '0.7rem' }}
                                              >
                                                {(
                                                  notification.data?.userName ||
                                                  notification.data?.customerName ||
                                                  'U'
                                                ).charAt(0)}
                                              </Avatar>
                                              <Typography
                                                variant='body2'
                                                sx={{ fontWeight: 600, color: 'text.primary' }}
                                              >
                                                {notification.data?.userName || notification.data?.customerName}
                                              </Typography>
                                            </Box>
                                          )}
                                          {notification.data?.productName && (
                                            <Typography
                                              variant='body2'
                                              sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}
                                            >
                                              📦 {notification.data.productName}
                                            </Typography>
                                          )}
                                          {notification.data?.articleTitle && (
                                            <Typography
                                              variant='body2'
                                              sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}
                                            >
                                              📰 {truncateText(notification.data.articleTitle, 50)}
                                            </Typography>
                                          )}
                                          {notification.data?.commentContent && (
                                            <Typography
                                              variant='body2'
                                              sx={{ color: 'text.secondary', fontStyle: 'italic', mb: 0.5 }}
                                            >
                                              💬 {truncateText(notification.data.commentContent, 100)}
                                            </Typography>
                                          )}
                                          {notification.data?.orderAmount && (
                                            <Typography variant='body2' sx={{ color: 'success.main', fontWeight: 600 }}>
                                              💰 {notification.data.orderAmount.toLocaleString('vi-VN')}₫
                                            </Typography>
                                          )}
                                        </Box>
                                      )}

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
                                              notificationId={notification.id}
                                              eventType={notification.data.eventType}
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

                                      {showDeleted ? (
                                        // Actions for deleted notifications
                                        <Tooltip title='Khôi phục thông báo'>
                                          <IconButton
                                            size='small'
                                            onClick={() => handleRestoreNotification(notification.id)}
                                            sx={{ color: '#10b981' }}
                                          >
                                            <MdRestore size={16} />
                                          </IconButton>
                                        </Tooltip>
                                      ) : (
                                        // Actions for normal notifications
                                        <>
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
                                        </>
                                      )}
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

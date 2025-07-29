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
  alpha
} from '@mui/material';
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
  MdRefresh
} from 'react-icons/md';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Notification {
  id: string;
  type:
    | 'ORDER_PLACED'
    | 'MESSAGE_RECEIVED'
    | 'LOW_STOCK'
    | 'COMMENT_RECEIVED'
    | 'SYSTEM_ALERT'
    | 'PROMOTION_SUGGESTION'
    | 'VOUCHER_SUGGESTION';
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
}

const NotificationTab: React.FC = () => {
  const theme = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');
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
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, searchTerm, filterType, filterRead]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterType !== 'all' && { type: filterType }),
        ...(filterRead !== 'all' && { isRead: filterRead })
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
    <Box sx={{ p: 3 }}>
      {/* Header with gradient background */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #9C27B0 0%, #2196F3 100%)',
          color: 'white',
          p: 3,
          borderRadius: 3,
          mb: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <MdNotifications size={32} />
            <Box>
              <Typography variant='h5' fontWeight='bold'>
                Danh sách thông báo
              </Typography>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>
                Quản lý tất cả thông báo hệ thống
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant='contained'
              startIcon={<MdRefresh />}
              onClick={fetchNotifications}
              sx={{
                bgcolor: alpha('#fff', 0.2),
                '&:hover': { bgcolor: alpha('#fff', 0.3) }
              }}
            >
              Làm mới
            </Button>
            <Button
              variant='contained'
              startIcon={<MdMarkEmailRead />}
              onClick={handleMarkAllAsRead}
              sx={{
                bgcolor: alpha('#fff', 0.2),
                '&:hover': { bgcolor: alpha('#fff', 0.3) }
              }}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant='h4' fontWeight='bold'>
                {stats.total}
              </Typography>
              <Typography variant='body2'>Tổng thông báo</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #FF5722 0%, #D84315 100%)', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant='h4' fontWeight='bold'>
                {stats.unread}
              </Typography>
              <Typography variant='body2'>Chưa đọc</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant='h4' fontWeight='bold'>
                {stats.total - stats.unread}
              </Typography>
              <Typography variant='body2'>Đã đọc</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant='h4' fontWeight='bold'>
                {Object.keys(stats.byType).length}
              </Typography>
              <Typography variant='body2'>Loại thông báo</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems='center'>
          <Grid item xs={12} md={4}>
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
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size='small'>
              <InputLabel>Loại thông báo</InputLabel>
              <Select value={filterType} onChange={e => setFilterType(e.target.value)} label='Loại thông báo'>
                <MenuItem value='all'>Tất cả</MenuItem>
                {Object.entries(notificationConfig).map(([type, config]) => (
                  <MenuItem key={type} value={type}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {config.icon}
                      {config.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size='small'>
              <InputLabel>Trạng thái</InputLabel>
              <Select value={filterRead} onChange={e => setFilterRead(e.target.value)} label='Trạng thái'>
                <MenuItem value='all'>Tất cả</MenuItem>
                <MenuItem value='false'>Chưa đọc</MenuItem>
                <MenuItem value='true'>Đã đọc</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Notifications List */}
      <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
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
          <Box>
            {notifications.map((notification, index) => {
              const config = notificationConfig[notification.type];
              return (
                <Box key={notification.id}>
                  <Box
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                      bgcolor: notification.isRead ? 'transparent' : alpha(config.color, 0.05),
                      borderLeft: `4px solid ${notification.isRead ? 'transparent' : config.color}`,
                      '&:hover': {
                        bgcolor: alpha(config.color, 0.08)
                      }
                    }}
                  >
                    {/* Notification Icon */}
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: config.bgGradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        flexShrink: 0
                      }}
                    >
                      {config.icon}
                    </Box>

                    {/* Notification Content */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant='subtitle1'
                            fontWeight={notification.isRead ? 'normal' : 'bold'}
                            sx={{ mb: 0.5 }}
                          >
                            {notification.title}
                          </Typography>
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
                        </Box>

                        {/* Action Buttons */}
                        <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
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

                      {/* Metadata */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
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
                    </Box>
                  </Box>
                  {index < notifications.length - 1 && <Divider />}
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
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
    </Box>
  );
};

export default NotificationTab;

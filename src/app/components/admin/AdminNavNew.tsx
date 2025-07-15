'use client';

import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Box,
  TextField,
  InputAdornment,
  Chip,
  Divider,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { MdNotifications, MdOutlineChat, MdSearch, MdMenu, MdSettings, MdLogout, MdPerson } from 'react-icons/md';
import { usePathname, useRouter } from 'next/navigation';
import { useNotifications } from '@/app/hooks/useNotifications';
import { useSidebar } from '@/app/providers/SidebarProvider';
import { signOut } from 'next-auth/react';
import { SafeUser } from '../../../../types';
import axios from 'axios';

// Path titles mapping
const pathTitle: { [key: string]: string } = {
  '/admin': 'Tổng quan',
  '/admin/add-users': 'Thêm người dùng',
  '/admin/manage-products': 'Quản lý sản phẩm',
  '/admin/manage-orders': 'Quản lý đơn hàng',
  '/admin/manage-orders/kanban': 'Kanban Đơn hàng',
  '/admin/manage-returns': 'Quản lý đổi/trả hàng',
  '/admin/manage-users': 'Quản lý người dùng',
  '/admin/manage-staff': 'Quản lý nhân viên',
  '/admin/manage-categories': 'Quản lý danh mục cha',
  '/admin/manage-childCategories': 'Quản lý danh mục con',
  '/admin/manage-banner': 'Quản lý slider',
  '/admin/manage-articles': 'Quản lý bài viết',
  '/admin/manage-articlesCategory': 'Quản lý danh mục',
  '/admin/manage-vouchers': 'Quản lý Voucher',
  '/admin/manage-promotions': 'Quản lý Promotion',
  '/admin/discord-test': 'Discord Test',
  '/admin/news-dashboard': 'Phân tích',
  '/admin/settings': 'Cài đặt hệ thống'
};

interface AdminNavNewProps {
  currentUser: SafeUser | null | undefined;
}

/**
 * Professional MUI-based AdminNav component
 * Replaces hand-coded navigation with Material-UI AppBar
 */
const AdminNavNew: React.FC<AdminNavNewProps> = ({ currentUser }) => {
  const pathname = usePathname();
  const router = useRouter();
  const title = pathname?.startsWith('/admin/chat') ? 'Tin nhắn' : pathTitle[pathname as string];
  const { toggleSidebar, toggleCollapse } = useSidebar();

  // State management
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const [messagesAnchorEl, setMessagesAnchorEl] = useState<null | HTMLElement>(null);
  const [messages, setMessages] = useState<any[]>([]);

  // Notifications hook
  const {
    notifications: rawNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  } = useNotifications(currentUser || null);

  const notifications = Array.isArray(rawNotifications) ? rawNotifications : [];

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get('/api/notifications/messages');
        const messagesData = response.data?.notifications || [];
        setMessages(Array.isArray(messagesData) ? messagesData : []);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
      }
    };

    if (currentUser?.role === 'ADMIN') {
      fetchMessages();
    }
  }, [currentUser]);

  // Event handlers
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
    markAllAsRead();
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleMessagesOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMessagesAnchorEl(event.currentTarget);
  };

  const handleMessagesClose = () => {
    setMessagesAnchorEl(null);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleMessageClick = async (message: any) => {
    if (message.sender?.id) {
      try {
        const response = await axios.post('/api/conversation', {
          userId: message.sender.id
        });
        router.push(`/admin/chat/${response.data.id}`);
      } catch (error) {
        console.error('Error creating conversation:', error);
      }
    } else if (message.chatroomId) {
      router.push(`/admin/chat/${message.chatroomId}`);
    }
    handleMessagesClose();
  };

  return (
    <>
      <AppBar
        position='sticky'
        elevation={0}
        sx={{
          zIndex: 30,
          borderRadius: 2,
          mx: { xs: 0, xl: 1 },
          my: { xs: 0, xl: 1 },
          width: { xs: '100%', xl: 'calc(100% - 16px)' }
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, lg: 3 } }}>
          {/* Left Section */}
          <Box display='flex' alignItems='center' gap={2}>
            {/* Mobile Menu Button */}
            <IconButton
              edge='start'
              color='inherit'
              aria-label='toggle sidebar'
              onClick={toggleSidebar}
              sx={{ display: { xl: 'none' } }}
            >
              <MdMenu />
            </IconButton>

            {/* Desktop Hamburger Menu Button */}
            <IconButton
              color='inherit'
              aria-label='collapse sidebar'
              onClick={toggleCollapse}
              sx={{
                display: { xs: 'none', xl: 'flex' },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <MdMenu />
            </IconButton>

            <Typography variant='h5' component='h1' fontWeight={700} sx={{ display: { xs: 'none', sm: 'block' } }}>
              {title}
            </Typography>
          </Box>

          {/* Right Section */}
          <Box display='flex' alignItems='center' gap={1}>
            {/* Search */}
            <TextField
              size='small'
              placeholder='Tìm kiếm...'
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <MdSearch size={18} />
                  </InputAdornment>
                )
              }}
              sx={{
                width: { xs: 120, lg: 240 },
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.paper'
                }
              }}
            />

            {/* Messages */}
            <IconButton color='inherit' onClick={handleMessagesOpen}>
              <Badge badgeContent={messages.length} color='error'>
                <MdOutlineChat />
              </Badge>
            </IconButton>

            {/* Notifications */}
            <IconButton color='inherit' onClick={handleNotificationsOpen}>
              <Badge badgeContent={unreadCount} color='error'>
                <MdNotifications />
              </Badge>
            </IconButton>

            {/* Profile */}
            <Box display='flex' alignItems='center' gap={1} sx={{ ml: 1 }}>
              <Box sx={{ display: { xs: 'none', lg: 'block' }, textAlign: 'right' }}>
                <Typography variant='body2' fontWeight={600}>
                  {currentUser?.name}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Administrator
                </Typography>
              </Box>
              <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0 }}>
                <Avatar
                  src={currentUser?.image ?? '/no-avatar-2.jpg'}
                  alt={currentUser?.name ?? 'User'}
                  sx={{ width: 40, height: 40 }}
                />
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={profileAnchorEl}
        open={Boolean(profileAnchorEl)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => router.push('/admin')}>
          <ListItemIcon>
            <MdPerson />
          </ListItemIcon>
          <ListItemText>Trang cá nhân</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => router.push('/admin/settings')}>
          <ListItemIcon>
            <MdSettings />
          </ListItemIcon>
          <ListItemText>Cài đặt</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <MdLogout />
          </ListItemIcon>
          <ListItemText>Đăng xuất</ListItemText>
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchorEl}
        open={Boolean(notificationsAnchorEl)}
        onClose={handleNotificationsClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.08)'
          }
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}
        >
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Typography variant='h6' fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🔔 Thông báo
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} mới`}
                size='small'
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 600
                }}
              />
            )}
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  backgroundColor: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '24px'
                }}
              >
                🔕
              </Box>
              <Typography variant='body2' color='text.secondary' fontWeight={500}>
                Không có thông báo nào
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Các thông báo mới sẽ xuất hiện ở đây
              </Typography>
            </Box>
          ) : (
            notifications.slice(0, 8).map((notification: any, index: number) => (
              <MenuItem
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                sx={{
                  py: 2,
                  px: 3,
                  borderLeft: !notification.isRead ? '4px solid #667eea' : '4px solid transparent',
                  backgroundColor: !notification.isRead ? 'rgba(102, 126, 234, 0.05)' : 'transparent',
                  '&:hover': {
                    backgroundColor: '#64748b',
                    color: 'white',
                    '& .MuiTypography-root': {
                      color: 'white'
                    }
                  },
                  transition: 'all 0.2s ease-in-out',
                  borderBottom: index < notifications.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Box display='flex' justifyContent='space-between' alignItems='flex-start' mb={0.5}>
                    <Typography variant='body2' fontWeight={600} sx={{ flex: 1 }}>
                      {notification.title}
                    </Typography>
                    {!notification.isRead && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#ef4444',
                          ml: 1,
                          flexShrink: 0
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 1, lineHeight: 1.4 }}>
                    {notification.message}
                  </Typography>
                  <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 500 }}>
                    {new Date(notification.createdAt).toLocaleString('vi-VN')}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          )}
        </Box>

        {/* Footer */}
        {notifications.length > 0 && (
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              backgroundColor: '#f8fafc'
            }}
          >
            <Box display='flex' justifyContent='space-between' alignItems='center'>
              <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 500 }}>
                Hiển thị {Math.min(8, notifications.length)} / {notifications.length}
              </Typography>
              <Box display='flex' gap={1}>
                {unreadCount > 0 && (
                  <Chip
                    label='Đánh dấu tất cả đã đọc'
                    size='small'
                    onClick={markAllAsRead}
                    sx={{
                      fontSize: '0.75rem',
                      height: 24,
                      backgroundColor: '#64748b',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#475569'
                      }
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Menu>

      {/* Messages Menu */}
      <Menu
        anchorEl={messagesAnchorEl}
        open={Boolean(messagesAnchorEl)}
        onClose={handleMessagesClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: {
              width: 380,
              maxHeight: 500,
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: '1px solid rgba(0,0,0,0.08)'
            }
          }
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white'
          }}
        >
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Typography variant='h6' fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              💬 Tin nhắn
            </Typography>
            <Chip
              label={`${messages.length} tin nhắn`}
              size='small'
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 600
              }}
            />
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
          {messages.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  backgroundColor: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '24px'
                }}
              >
                💬
              </Box>
              <Typography variant='body2' color='text.secondary' fontWeight={500}>
                Không có tin nhắn nào
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Tin nhắn từ khách hàng sẽ xuất hiện ở đây
              </Typography>
            </Box>
          ) : (
            messages.slice(0, 8).map((message: any, index: number) => (
              <MenuItem
                key={message.id}
                onClick={() => handleMessageClick(message)}
                sx={{
                  py: 2,
                  px: 3,
                  '&:hover': {
                    backgroundColor: '#64748b',
                    color: 'white',
                    '& .MuiTypography-root': {
                      color: 'white'
                    },
                    '& .MuiAvatar-root': {
                      transform: 'scale(1.05)'
                    }
                  },
                  transition: 'all 0.2s ease-in-out',
                  borderBottom: index < messages.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <Avatar
                  src={message.sender?.image || '/no-avatar-2.jpg'}
                  sx={{
                    width: 40,
                    height: 40,
                    mr: 2,
                    border: '2px solid #e5e7eb',
                    transition: 'transform 0.2s ease-in-out'
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box display='flex' justifyContent='space-between' alignItems='flex-start' mb={0.5}>
                    <Typography variant='body2' fontWeight={600} sx={{ flex: 1 }}>
                      {message.sender?.name || 'Người dùng'}
                    </Typography>
                    <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 500, ml: 1 }}>
                      {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Box>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.4,
                      maxWidth: '250px'
                    }}
                  >
                    {message.body || message.image ? message.body || '📷 Hình ảnh' : 'Tin nhắn mới'}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          )}
        </Box>

        {/* Footer */}
        {messages.length > 0 && (
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              backgroundColor: '#f8fafc'
            }}
          >
            <Box display='flex' justifyContent='space-between' alignItems='center'>
              <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 500 }}>
                Hiển thị {Math.min(8, messages.length)} / {messages.length}
              </Typography>
              <Chip
                label='Xem tất cả'
                size='small'
                onClick={() => {
                  router.push('/admin/chat');
                  handleMessagesClose();
                }}
                sx={{
                  fontSize: '0.75rem',
                  height: 24,
                  backgroundColor: '#10b981',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#059669'
                  }
                }}
              />
            </Box>
          </Box>
        )}
      </Menu>
    </>
  );
};

export default AdminNavNew;

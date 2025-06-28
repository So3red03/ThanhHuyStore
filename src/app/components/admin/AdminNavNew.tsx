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
import {
  MdAdd,
  MdNotifications,
  MdOutlineChat,
  MdSearch,
  MdMenu,
  MdSettings,
  MdLogout,
  MdPerson
} from 'react-icons/md';
import { usePathname, useRouter } from 'next/navigation';
import { useNotifications } from '@/app/hooks/useNotifications';
import { useSidebar } from '@/app/providers/SidebarProvider';
import { signOut } from 'next-auth/react';
import { SafeUser } from '../../../../types';
import { ArticleCategory } from '@prisma/client';
import axios from 'axios';
import AdminButton from '@/app/components/ui/AdminButton';

// Path titles mapping
const pathTitle: { [key: string]: string } = {
  '/admin': 'Tổng quan',
  '/admin/add-users': 'Thêm người dùng',
  '/admin/manage-products': 'Quản lý sản phẩm',
  '/admin/manage-orders': 'Quản lý đơn hàng',
  '/admin/manage-orders/kanban': 'Kanban Đơn hàng',
  '/admin/manage-returns': 'Quản lý đổi/trả hàng',
  '/admin/manage-users': 'Quản lý người dùng',
  '/admin/manage-categories': 'Quản lý danh mục cha',
  '/admin/manage-childCategories': 'Quản lý danh mục con',
  '/admin/manage-banner': 'Quản lý slider',
  '/admin/manage-articles': 'Quản lý bài viết',
  '/admin/manage-articlesCategory': 'Quản lý danh mục',
  '/admin/manage-vouchers': 'Quản lý Voucher',
  '/admin/manage-promotions': 'Quản lý Promotion',
  '/admin/news-dashboard': 'Phân tích',
  '/admin/settings': 'Cài đặt hệ thống',
  '/admin/test-features': '🧪 Test Features'
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

  // Get add button for current page
  const getAddButton = () => {
    switch (pathname) {
      case '/admin/manage-products':
        return <AdminButton label='Thêm sản phẩm' icon={MdAdd} size='small' variant='outlined' color='primary' />;
      case '/admin/manage-banner':
        return <AdminButton label='Thêm slider' icon={MdAdd} size='small' variant='outlined' color='primary' />;
      case '/admin/manage-articles':
        return <AdminButton label='Thêm bài viết' icon={MdAdd} size='small' variant='outlined' color='primary' />;
      case '/admin/manage-articlesCategory':
      case '/admin/manage-categories':
      case '/admin/manage-childCategories':
        return <AdminButton label='Thêm danh mục' icon={MdAdd} size='small' variant='outlined' color='primary' />;
      default:
        return null;
    }
  };

  return (
    <>
      <AppBar
        position='sticky'
        elevation={0}
        sx={{
          zIndex: 30,
          borderRadius: 2,
          mx: { xs: 0, xl: 2 },
          my: { xs: 0, xl: 1 },
          width: { xs: '100%', xl: 'calc(100% - 16px)' }
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, lg: 3 } }}>
          {/* Left Section */}
          <Box display='flex' alignItems='center' gap={2}>
            <IconButton
              edge='start'
              color='inherit'
              aria-label='toggle sidebar'
              onClick={toggleSidebar}
              sx={{ display: { xl: 'none' } }}
            >
              <MdMenu />
            </IconButton>

            <Typography variant='h5' component='h1' fontWeight={700} sx={{ display: { xs: 'none', sm: 'block' } }}>
              {title}
            </Typography>

            {getAddButton()}
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
        PaperProps={{ sx: { width: 320, maxHeight: 400 } }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant='h6' fontWeight={600}>
            🔔 Thông báo
          </Typography>
          {unreadCount > 0 && <Chip label={`${unreadCount} mới`} size='small' color='error' />}
        </Box>
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant='body2' color='text.secondary'>
              Không có thông báo nào
            </Typography>
          </Box>
        ) : (
          notifications.slice(0, 5).map((notification: any) => (
            <MenuItem
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              sx={{
                borderLeft: !notification.isRead ? '4px solid' : 'none',
                borderColor: 'primary.main'
              }}
            >
              <Box>
                <Typography variant='body2' fontWeight={500}>
                  {notification.title}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {notification.message}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>

      {/* Messages Menu */}
      <Menu
        anchorEl={messagesAnchorEl}
        open={Boolean(messagesAnchorEl)}
        onClose={handleMessagesClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ sx: { width: 320, maxHeight: 400 } }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant='h6' fontWeight={600}>
            💬 Tin nhắn
          </Typography>
          <Chip label={`${messages.length}`} size='small' color='primary' />
        </Box>
        {messages.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant='body2' color='text.secondary'>
              Không có tin nhắn nào
            </Typography>
          </Box>
        ) : (
          messages.slice(0, 5).map((message: any) => (
            <MenuItem key={message.id} onClick={() => handleMessageClick(message)}>
              <Avatar src={message.sender?.image || '/no-avatar-2.jpg'} sx={{ width: 32, height: 32, mr: 2 }} />
              <Box>
                <Typography variant='body2' fontWeight={500}>
                  {message.sender?.name || 'Người dùng'}
                </Typography>
                <Typography variant='caption' color='text.secondary' noWrap>
                  {message.body || 'Tin nhắn'}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default AdminNavNew;

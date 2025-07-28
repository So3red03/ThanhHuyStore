'use client';

import React, { useState, useEffect, useRef } from 'react';
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

import { useSidebar } from '@/app/providers/SidebarProvider';
import { signOut } from 'next-auth/react';
import { SafeUser } from '../../../../types';
import axios from 'axios';
import { pusherClient } from '@/app/libs/pusher';
import NotificationSystem from './NotificationSystem';
import MessageSystem from './MessageSystem';

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
  '/admin/manage-promotions': 'Quản lý khuyến mãi',
  '/admin/news-dashboard': 'Phân tích',
  '/admin/settings': 'Cài đặt hệ thống',
  '/admin/debug-notifications': 'Debug Notifications',
  '/admin/test-notifications': 'Test Notifications'
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  // Event handlers
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
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

            <Typography
              variant='h5'
              component='h1'
              fontWeight={600}
              sx={{
                display: { xs: 'none', sm: 'block' },
                color: 'text.primary',
                fontSize: '1.5rem'
              }}
            >
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
                    <MdSearch size={18} color='#6b7280' />
                  </InputAdornment>
                )
              }}
              sx={{
                width: { xs: 120, lg: 240 },
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)'
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'background.paper'
                  }
                }
              }}
            />

            {/* Notifications */}
            <IconButton
              color='inherit'
              onClick={() => {
                if (showNotifications) {
                  setShowNotifications(false);
                } else {
                  setShowMessages(false); // Close messages if open
                  setShowNotifications(true);
                }
              }}
              sx={{
                borderRadius: 2,
                backgroundColor: showNotifications ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <Badge badgeContent={0} color='error'>
                <MdNotifications size={20} />
              </Badge>
            </IconButton>

            {/* Messages */}
            <IconButton
              color='inherit'
              onClick={() => {
                if (showMessages) {
                  setShowMessages(false);
                } else {
                  setShowNotifications(false); // Close notifications if open
                  setShowMessages(true);
                }
              }}
              sx={{
                borderRadius: 2,
                backgroundColor: showMessages ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <Badge badgeContent={0} color='error' max={99}>
                <MdOutlineChat size={20} />
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
              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{
                  p: 0.5,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                <Avatar
                  src={currentUser?.image ?? '/no-avatar-2.jpg'}
                  alt={currentUser?.name ?? 'User'}
                  sx={{
                    width: 40,
                    height: 40,
                    border: '2px solid rgba(255, 255, 255, 0.2)'
                  }}
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

      {/* Professional Notification & Message Systems - Instant UI */}
      <NotificationSystem
        currentUser={currentUser || null}
        forceShow={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
      <MessageSystem
        currentUser={currentUser || null}
        forceShow={showMessages}
        onClose={() => setShowMessages(false)}
      />
    </>
  );
};

export default AdminNavNew;

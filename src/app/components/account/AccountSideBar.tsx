'use client';

import React, { useState } from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography, Avatar, Paper } from '@mui/material';
import { MdLogout } from 'react-icons/md';
import { signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { AccountItems } from '../../utils/AccountItems';
import { SafeUser } from '../../../../types';
import ConfirmDialog from '../ConfirmDialog';

interface AccountSideBarProps {
  currentUser: SafeUser | null | undefined;
}

const AccountSideBar: React.FC<AccountSideBarProps> = ({ currentUser }) => {
  const [isConfirm, setIsConfirm] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const toggleConfirmSignOut = () => {
    setIsConfirm(!isConfirm);
  };

  const handleConfirm = () => {
    toggleConfirmSignOut();
    handleSignOut();
  };

  return (
    <Paper
      elevation={1}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '20px',
        backgroundColor: '#e2e8f0', // slate-50
        borderRight: '1px solid #e2e8f0' // slate-200
      }}
    >
      {/* User Profile Header */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          borderRadius: '20px 20px 0 0',
          borderBottom: '1px solid #cbd5e1',
          backgroundColor: '#f8fafc'
        }}
      >
        <Avatar
          src={currentUser?.image ?? '/no-avatar-2.jpg'}
          alt={`${currentUser?.name || 'User'} avatar`}
          sx={{
            width: 56,
            height: 56,
            border: '3px solid #3b82f6'
          }}
        />
        <Box sx={{ ml: 2 }}>
          <Typography
            variant='h6'
            sx={{
              fontWeight: 600,
              color: '#1f2937',
              fontSize: '1.1rem'
            }}
          >
            {currentUser?.name}
          </Typography>
          <Typography
            variant='body2'
            sx={{
              color: '#6b7280',
              fontSize: '0.875rem'
            }}
          >
            Tài khoản cá nhân
          </Typography>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, py: 2 }}>
        <List sx={{ px: 2 }}>
          {AccountItems.map(item => {
            const IconComponent = item.icon;
            const isActive = pathname === item.path;

            return (
              <Link key={item.title} href={item.path} style={{ textDecoration: 'none' }}>
                <ListItemButton
                  sx={{
                    borderRadius: '12px',
                    mb: 1,
                    py: 1.5,
                    px: 2,
                    backgroundColor: isActive ? '#64748b' : 'transparent',
                    color: isActive ? 'white' : '#374151',
                    '&:hover': {
                      backgroundColor: '#64748b',
                      color: 'white',

                      // selector con bên trong khi hover
                      '& .MuiListItemIcon-root': {
                        color: 'white'
                      }
                    },
                    transition: 'all 0.1s ease-in-out'
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? 'white' : '#6b7280',
                      minWidth: '40px'
                    }}
                  >
                    <IconComponent size={20} />
                  </ListItemIcon>

                  <ListItemText
                    primary={item.title}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontSize: '0.95rem',
                        fontWeight: isActive ? 600 : 500
                      }
                    }}
                  />
                </ListItemButton>
              </Link>
            );
          })}
        </List>
      </Box>

      {/* Logout Button */}
      <Box sx={{ px: 2, pb: 2, pt: 0 }}>
        <ListItemButton
          onClick={() => setIsConfirm(true)}
          sx={{
            borderRadius: '12px',
            mb: 1,
            py: 1.5,
            px: 2,
            backgroundColor: 'transparent',
            color: '#374151', // slate-700
            fontWeight: 500,
            '&:hover': {
              backgroundColor: '#cbd5e1', // slate-300
              color: '#1f2937', // slate-800
              '& .MuiListItemIcon-root': {
                color: '#1f2937'
              }
            },
            transition: 'all 0.2s ease-in-out'
          }}
        >
          <ListItemIcon
            sx={{
              color: '#6b7280', // slate-500
              minWidth: '40px',
              transform: 'rotate(180deg)',
              transition: 'color 0.2s ease-in-out'
            }}
          >
            <MdLogout size={20} />
          </ListItemIcon>
          <ListItemText
            primary='Đăng xuất'
            sx={{
              '& .MuiListItemText-primary': {
                fontSize: '0.95rem',
                fontWeight: 500
              }
            }}
          />
        </ListItemButton>
      </Box>

      {/* Confirm Dialog */}
      {isConfirm && (
        <ConfirmDialog isOpen={isConfirm} handleClose={toggleConfirmSignOut} alert={false} onConfirm={handleConfirm}>
          Bạn muốn thoát tài khoản?
        </ConfirmDialog>
      )}
    </Paper>
  );
};

export default AccountSideBar;

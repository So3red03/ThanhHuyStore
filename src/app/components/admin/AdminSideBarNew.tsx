'use client';

import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Box,
  Menu,
  MenuItem,
  Divider,
  Avatar
} from '@mui/material';
import { MdExpandLess, MdExpandMore, MdSettings, MdLogout, MdPerson, MdNotifications } from 'react-icons/md';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSidebar } from '@/app/providers/SidebarProvider';
import { redressed } from '../../theme/adminTheme';

import { MenuItems } from '../../../../utils/MenuItems';
import { signOut } from 'next-auth/react';
import { SafeUser } from '../../../../types';

interface AdminSideBarNewProps {
  currentUser?: SafeUser | null;
}

/**
 * Professional MUI-based AdminSideBar component
 * Replaces hand-coded sidebar with Material-UI Drawer and List components
 */
const AdminSideBarNew: React.FC<AdminSideBarNewProps> = ({ currentUser }) => {
  const [openSubItems, setOpenSubItems] = useState<Record<string, boolean>>({});
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { toggleSidebar, isOpen, isCollapsed } = useSidebar();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const toggleSubItem = (title: string) => {
    setOpenSubItems(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };

  const handleSettings = () => {
    router.push('/admin/settings');
    handleProfileMenuClose();
  };

  // Drawer content
  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        // Prevent horizontal overflow
        overflowX: 'hidden',
        width: '100%',
        maxWidth: '100%'
      }}
      className='admin-sidebar-scrollbar admin-sidebar-container'
    >
      {/* Brand Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '70px'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Logo Icon */}
          <Link href='/'>
            <Box
              sx={{
                width: 40,
                height: 40,
                backgroundColor: '#3b82f6',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.2rem'
              }}
            >
              TH
            </Box>
          </Link>

          {/* Brand Text */}
          {!isCollapsed && (
            <Box>
              <Link href='/'>
                <Typography
                  variant='h6'
                  sx={{
                    fontFamily: redressed.style.fontFamily,
                    fontWeight: 700,
                    color: 'text.primary',
                    fontSize: '1.1rem',
                    lineHeight: 1.2,
                    mb: 0,
                    cursor: 'pointer' // Thêm thuộc tính cursor để hiển thị con trỏ chuột khi di chuột qua
                  }}
                >
                  THANHHUY STORE
                </Typography>
              </Link>
            </Box>
          )}
        </Box>
      </Box>

      {/* Navigation Menu */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          py: 2,
          // Prevent horizontal overflow
          overflowX: 'hidden',
          // Ensure proper width constraints
          width: '100%',
          maxWidth: '100%'
        }}
        className='admin-sidebar-scrollbar'
      >
        {MenuItems.map(section => (
          <Box key={section.title} sx={{ mb: 3 }}>
            {/* Section Title - Hide when collapsed */}
            {!isCollapsed && (
              <Typography
                variant='overline'
                sx={{
                  px: 3,
                  mb: 1,
                  display: 'block',
                  color: 'text.secondary',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              >
                {section.title}
              </Typography>
            )}

            <List
              sx={{
                py: 0,
                // Prevent horizontal overflow in lists
                width: '100%',
                maxWidth: '100%',
                overflowX: 'hidden'
              }}
            >
              {/* Menu Items */}
              {section.items?.map(item => (
                <Box key={item.title}>
                  <ListItemButton
                    component={(item as any).path && !(item as any).hasSubmenu ? Link : 'div'}
                    href={(item as any).path && !(item as any).hasSubmenu ? (item as any).path : undefined}
                    onClick={
                      (item as any).hasSubmenu
                        ? () => toggleSubItem(item.title)
                        : (item as any).action === 'logout'
                        ? handleSignOut
                        : undefined
                    }
                    selected={pathname === (item as any).path}
                    sx={{
                      mx: 1,
                      borderRadius: 2,
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      px: isCollapsed ? 1 : 1.5,
                      py: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        color: 'text.primary',
                        '& .MuiListItemIcon-root': {
                          color: 'primary.main'
                        },
                        '& .MuiListItemText-primary': {
                          color: 'text.primary !important'
                        }
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        color: 'primary.main',
                        '& .MuiListItemIcon-root': {
                          color: 'primary.main'
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(59, 130, 246, 0.15)',
                          color: 'primary.main',
                          '& .MuiListItemText-primary': {
                            color: 'primary.main !important'
                          }
                        }
                      }
                    }}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: isCollapsed ? 'auto' : 40,
                        color: 'text.secondary',
                        justifyContent: 'center'
                      }}
                    >
                      <item.icon size={20} />
                    </ListItemIcon>
                    {!isCollapsed && (
                      <>
                        <ListItemText
                          primary={item.title}
                          sx={{
                            '& .MuiListItemText-primary': {
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontSize: '0.875rem',
                              fontWeight: 500
                            }
                          }}
                        />
                        {/* Badge */}
                        {(item as any).badge && (
                          <Box
                            sx={{
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              borderRadius: '50%',
                              width: 20,
                              height: 20,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              mr: 1
                            }}
                          >
                            {(item as any).badge}
                          </Box>
                        )}
                        {/* Expand Arrow */}
                        {(item as any).hasSubmenu && (
                          <Box sx={{ color: 'text.secondary' }}>
                            {openSubItems[item.title] ? <MdExpandLess size={16} /> : <MdExpandMore size={16} />}
                          </Box>
                        )}
                      </>
                    )}
                  </ListItemButton>

                  {/* Submenu */}
                  {(item as any).hasSubmenu && !isCollapsed && (
                    <Collapse in={openSubItems[item.title]} timeout='auto' unmountOnExit>
                      <List
                        sx={{
                          pl: 4,
                          py: 0,
                          width: '100%',
                          maxWidth: '100%',
                          overflowX: 'hidden'
                        }}
                      >
                        {(item as any).submenu?.map((subItem: any) => (
                          <ListItemButton
                            key={subItem.title}
                            component={Link}
                            href={subItem.path || '#'}
                            selected={pathname === subItem.path}
                            sx={{
                              mx: 1,
                              borderRadius: 2,
                              py: 0.75,
                              px: 1,
                              '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                color: 'text.primary',
                                '& .MuiListItemText-primary': {
                                  color: 'text.primary !important'
                                }
                              },
                              '&.Mui-selected': {
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                color: 'primary.main',
                                '&:hover': {
                                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                  color: 'primary.main',
                                  '& .MuiListItemText-primary': {
                                    color: 'primary.main !important'
                                  }
                                }
                              }
                            }}
                          >
                            <ListItemText
                              primary={subItem.title}
                              sx={{
                                '& .MuiListItemText-primary': {
                                  fontSize: '0.8rem',
                                  fontWeight: 400,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }
                              }}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </Collapse>
                  )}
                </Box>
              ))}
            </List>
          </Box>
        ))}
      </Box>

      {/* User Profile Footer */}
      <Box sx={{ p: 2 }}>
        {!isCollapsed && (
          <>
            <Box
              onClick={handleProfileMenuOpen}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                borderRadius: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              {/* User Avatar */}
              <Avatar
                src={currentUser?.image ?? '/no-avatar-2.jpg'}
                alt={currentUser?.name ?? 'User'}
                sx={{
                  width: 40,
                  height: 40,
                  border: '2px solid rgba(255, 255, 255, 0.2)'
                }}
              />

              {/* User Info */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant='body2'
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {currentUser?.name || 'Unknow'}
                </Typography>
                <Typography
                  variant='caption'
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {currentUser?.email || 'Unknow'}
                </Typography>
              </Box>

              {/* Expand Icon */}
              <Box sx={{ color: 'text.secondary' }}>
                <MdExpandMore size={16} />
              </Box>
            </Box>

            {/* Profile Dropdown Menu */}
            <Menu
              anchorEl={profileAnchorEl}
              open={Boolean(profileAnchorEl)}
              onClose={handleProfileMenuClose}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right'
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right'
              }}
              sx={{ left: '225px' }}
              slotProps={{
                paper: {
                  sx: {
                    width: 280,
                    mt: 1,
                    borderRadius: 2,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
                  }
                }
              }}
            >
              {/* User Info Header */}
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    src={currentUser?.image ?? '/no-avatar-2.jpg'}
                    alt={currentUser?.name ?? 'User'}
                    sx={{
                      width: 40,
                      height: 40,
                      border: '2px solid rgba(255, 255, 255, 0.2)'
                    }}
                  />
                  <Box>
                    <Typography variant='body2' fontWeight={600}>
                      {currentUser?.name || 'Unknow'}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {currentUser?.email || 'Unknow'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Menu Items */}
              <MenuItem onClick={handleSettings} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <MdSettings size={20} />
                </ListItemIcon>
                <ListItemText primary='Cài đặt tài khoản' />
              </MenuItem>

              <MenuItem onClick={() => router.push('/admin/notifications')} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <MdNotifications size={20} />
                </ListItemIcon>
                <ListItemText primary='Thông báo' />
              </MenuItem>

              <Divider />

              <MenuItem
                onClick={() => {
                  handleSignOut();
                  handleProfileMenuClose();
                }}
                sx={{
                  py: 1.5,
                  color: 'error.main',
                  '&:hover': {
                    backgroundColor: 'error.50'
                  }
                }}
              >
                <ListItemIcon>
                  <MdLogout size={20} color='inherit' />
                </ListItemIcon>
                <ListItemText primary='Đăng xuất' />
              </MenuItem>
            </Menu>
          </>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1299,
            display: { xs: 'block', xl: 'none' }
          }}
          onClick={toggleSidebar}
        />
      )}

      {/* Drawer */}
      <Drawer
        variant='permanent'
        open={isOpen}
        sx={{
          width: {
            xs: isOpen ? '280px' : 0,
            sm: isOpen ? '320px' : 0,
            xl: isCollapsed ? 80 : 256
          },
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: {
              xs: '280px',
              sm: '320px',
              xl: isCollapsed ? 80 : 256
            },
            boxSizing: 'border-box',
            transform: {
              xs: isOpen ? 'translateX(0)' : 'translateX(-100%)',
              xl: 'translateX(0)'
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            top: 0,
            height: '100vh',
            borderRadius: 0,
            zIndex: { xs: 1300, xl: 1200 },
            // Remove default border and add custom styling
            border: 'none',
            backgroundColor: '#ffffff', // white background
            boxShadow: {
              xs: '0 8px 32px rgba(0, 0, 0, 0.12)',
              xl: '2px 0 8px rgba(0, 0, 0, 0.1)'
            },
            // Professional overflow handling
            overflow: 'hidden',
            overflowY: 'auto',
            overflowX: 'hidden',
            // Ensure proper box model (already set above)
            // Prevent content from expanding beyond container
            '& *': {
              boxSizing: 'border-box',
              maxWidth: '100%'
            }
          }
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default AdminSideBarNew;

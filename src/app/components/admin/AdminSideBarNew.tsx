'use client';

import React, { useState } from 'react';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Collapse, Typography, Box } from '@mui/material';
import { MdLogout, MdExpandLess, MdExpandMore, MdOutlineSettings } from 'react-icons/md';
import { MenuItems } from '../../../../utils/MenuItems';
import { signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSidebar } from '@/app/providers/SidebarProvider';
import { redressed } from '../../theme/adminTheme';

/**
 * Professional MUI-based AdminSideBar component
 * Replaces hand-coded sidebar with Material-UI Drawer and List components
 */
const AdminSideBarNew = () => {
  const [openSubItems, setOpenSubItems] = useState<Record<string, boolean>>({});
  const [openChildItems, setOpenChildItems] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const pathname = usePathname();
  const { toggleSidebar, isOpen, isCollapsed } = useSidebar();

  const handleSetting = () => {
    router.push('/admin/settings');
  };

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

  const toggleChildItem = (parentTitle: string, childTitle: string) => {
    const key = `${parentTitle}-${childTitle}`;
    setOpenChildItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
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
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          minHeight: '80px'
        }}
      >
        {!isCollapsed && (
          <Link href='/' style={{ textDecoration: 'none' }}>
            <Typography
              variant='h5'
              component='h1'
              sx={{
                fontFamily: redressed.style.fontFamily,
                fontWeight: 700,
                color: 'primary.700',
                fontSize: {
                  xs: '0.5rem', // nhỏ hơn khi màn hình nhỏ
                  xl: '2rem' // to hơn khi màn hình lớn
                },
                textAlign: 'center'
              }}
            >
              ThanhHuy Store
            </Typography>
          </Link>
        )}

        {/* Collapse Toggle Button - Only show on desktop */}
        {/* <IconButton
          onClick={toggleCollapse}
          sx={{
            display: { xs: 'none', xl: 'flex' },
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
        >
          {isCollapsed ? <MdChevronRight size={20} /> : <MdChevronLeft size={20} />}
        </IconButton> */}

        {/* Collapsed Logo */}
        {isCollapsed && (
          <Typography
            variant='h6'
            sx={{
              fontFamily: redressed.style.fontFamily,
              fontWeight: 700,
              color: 'primary.700',
              fontSize: '1.2rem'
            }}
          >
            TH
          </Typography>
        )}
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
        {MenuItems.map(item => (
          <Box key={item.title} sx={{ mb: 3 }}>
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
                {item.title}
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
              {/* Dashboard Item */}
              {item.dashboardItem && (
                <ListItemButton
                  component={Link}
                  href={item.dashboardItem.path || '#'}
                  selected={pathname === item.dashboardItem.path}
                  sx={{
                    mx: 1,
                    borderRadius: 3,
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    px: isCollapsed ? 1 : 2,
                    '&:hover': {
                      backgroundColor: '#64748b', // slate-500
                      color: 'white',
                      '& .MuiListItemIcon-root': {
                        color: 'white'
                      },
                      '& .MuiListItemText-primary': {
                        color: 'white'
                      }
                    },
                    '&.Mui-selected': {
                      backgroundColor: '#64748b', // slate-500
                      color: 'white',
                      '& .MuiListItemIcon-root': {
                        color: 'white'
                      },
                      '& .MuiListItemText-primary': {
                        color: 'white'
                      },
                      '&:hover': {
                        backgroundColor: '#64748b', // slate-500
                        color: 'white'
                      }
                    }
                  }}
                  title={isCollapsed ? item.dashboardItem.title : undefined}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: isCollapsed ? 'auto' : 40,
                      color: 'inherit',
                      justifyContent: 'center'
                    }}
                  >
                    <item.dashboardItem.icon size={20} />
                  </ListItemIcon>
                  {!isCollapsed && (
                    <ListItemText
                      primary={item.dashboardItem.title}
                      sx={{
                        '& .MuiListItemText-primary': {
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }
                      }}
                    />
                  )}
                </ListItemButton>
              )}

              {/* Sub Items */}
              {item.subItem && !isCollapsed && (
                <>
                  <ListItemButton
                    onClick={() => toggleSubItem(item.subItem.title)}
                    sx={{
                      mx: 1,
                      borderRadius: 3,
                      width: '100%',
                      '&:hover': {
                        backgroundColor: '#64748b', // slate-500
                        color: 'white',
                        '& .MuiListItemIcon-root': {
                          color: 'white'
                        },
                        '& .MuiListItemText-primary': {
                          color: 'white'
                        }
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                      <item.subItem.icon size={20} />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.subItem.title}
                      sx={{
                        '& .MuiListItemText-primary': {
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }
                      }}
                    />
                    {openSubItems[item.subItem.title] ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
                  </ListItemButton>

                  <Collapse in={openSubItems[item.subItem.title]} timeout='auto' unmountOnExit>
                    <List
                      sx={{
                        pl: 2,
                        width: '100%',
                        maxWidth: '100%',
                        overflowX: 'hidden'
                      }}
                    >
                      {item.subItem.list?.map(subItem => (
                        <Box key={subItem.title}>
                          <ListItemButton
                            onClick={e => {
                              if (subItem.list && subItem.list.length > 0) {
                                e.preventDefault();
                                toggleChildItem(item.subItem.title, subItem.title);
                              } else if (subItem.path) {
                                // Navigate to the path if no children
                                window.location.href = subItem.path;
                              }
                            }}
                            selected={pathname === subItem.path}
                            sx={{
                              mx: 1,
                              borderRadius: 3,
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: '#64748b', // slate-500
                                color: 'white',
                                '& .MuiListItemIcon-root': {
                                  color: 'white'
                                },
                                '& .MuiListItemText-primary': {
                                  color: 'white'
                                }
                              },
                              '&.Mui-selected': {
                                backgroundColor: '#64748b', // slate-500
                                color: 'white',
                                '& .MuiListItemIcon-root': {
                                  color: 'white'
                                },
                                '& .MuiListItemText-primary': {
                                  color: 'white'
                                },
                                '&:hover': {
                                  backgroundColor: '#64748b', // slate-500
                                  color: 'white'
                                }
                              }
                            }}
                          >
                            {subItem.icon && (
                              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                                <subItem.icon size={20} />
                              </ListItemIcon>
                            )}
                            <ListItemText
                              primary={subItem.title}
                              primaryTypographyProps={{
                                fontSize: '0.875rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            />
                            {subItem.list && subItem.list.length > 0 && (
                              <>
                                {openChildItems[`${item.subItem.title}-${subItem.title}`] ? (
                                  <MdExpandLess size={16} />
                                ) : (
                                  <MdExpandMore size={16} />
                                )}
                              </>
                            )}
                          </ListItemButton>

                          {/* Child Items */}
                          {subItem.list && subItem.list.length > 0 && (
                            <Collapse
                              in={openChildItems[`${item.subItem.title}-${subItem.title}`]}
                              timeout='auto'
                              unmountOnExit
                            >
                              <List
                                sx={{
                                  pl: 4,
                                  width: '100%',
                                  maxWidth: '100%',
                                  overflowX: 'hidden'
                                }}
                              >
                                {subItem.list.map(child => (
                                  <ListItemButton
                                    key={child.title}
                                    component={Link}
                                    href={child.path || '#'}
                                    selected={pathname === child.path}
                                    sx={{
                                      mx: 1,
                                      borderRadius: 3,
                                      '&:hover': {
                                        backgroundColor: '#64748b', // slate-500
                                        color: 'white',
                                        '& .MuiListItemText-primary': {
                                          color: 'white'
                                        }
                                      },
                                      '&.Mui-selected': {
                                        backgroundColor: '#64748b', // slate-500
                                        color: 'white',
                                        '& .MuiListItemText-primary': {
                                          color: 'white'
                                        },
                                        '&:hover': {
                                          backgroundColor: '#64748b', // slate-500
                                          color: 'white'
                                        }
                                      }
                                    }}
                                  >
                                    <ListItemText
                                      primary={child.title}
                                      primaryTypographyProps={{
                                        fontSize: '0.8rem',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
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
                  </Collapse>
                </>
              )}

              {/* Collapsed Sub Items - Show as icons only with expand indicator */}
              {item.subItem && isCollapsed && (
                <ListItemButton
                  onClick={() => toggleSubItem(item.subItem.title)}
                  sx={{
                    mx: 1,
                    borderRadius: 3,
                    justifyContent: 'center',
                    px: 1,
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: '#64748b', // slate-500
                      color: 'white',
                      '& .MuiListItemIcon-root': {
                        color: 'white'
                      }
                    }
                  }}
                  title={item.subItem.title}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 'auto',
                      color: 'inherit',
                      justifyContent: 'center'
                    }}
                  >
                    <item.subItem.icon size={20} />
                  </ListItemIcon>
                  {/* Small expand indicator */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 2,
                      right: 2,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: openSubItems[item.subItem.title] ? '#3b82f6' : '#9ca3af',
                      transition: 'background-color 0.2s ease'
                    }}
                  />
                </ListItemButton>
              )}
            </List>
          </Box>
        ))}
      </Box>

      {/* Bottom Actions */}
      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: 1 }}>
        <List
          sx={{
            width: '100%',
            maxWidth: '100%',
            overflowX: 'hidden'
          }}
        >
          <ListItemButton
            onClick={handleSetting}
            sx={{
              mx: 1,
              borderRadius: 3,
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              px: isCollapsed ? 1 : 2,
              '&:hover': {
                backgroundColor: '#64748b', // slate-500
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white'
                },
                '& .MuiListItemText-primary': {
                  color: 'white'
                }
              }
            }}
            title={isCollapsed ? 'Cài đặt' : undefined}
          >
            <ListItemIcon
              sx={{
                minWidth: isCollapsed ? 'auto' : 40,
                color: 'inherit',
                justifyContent: 'center'
              }}
            >
              <MdOutlineSettings size={20} />
            </ListItemIcon>
            {!isCollapsed && (
              <ListItemText
                primary='Cài đặt'
                sx={{
                  '& .MuiListItemText-primary': {
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }
                }}
              />
            )}
          </ListItemButton>

          <ListItemButton
            onClick={handleSignOut}
            sx={{
              mx: 1,
              borderRadius: 3,
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              px: isCollapsed ? 1 : 2,
              '&:hover': {
                backgroundColor: '#64748b', // slate-500
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white'
                },
                '& .MuiListItemText-primary': {
                  color: 'white'
                }
              }
            }}
            title={isCollapsed ? 'Đăng xuất' : undefined}
          >
            <ListItemIcon
              sx={{
                minWidth: isCollapsed ? 'auto' : 40,
                color: 'inherit',
                justifyContent: 'center'
              }}
            >
              <MdLogout size={20} />
            </ListItemIcon>
            {!isCollapsed && (
              <ListItemText
                primary='Đăng xuất'
                sx={{
                  '& .MuiListItemText-primary': {
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }
                }}
              />
            )}
          </ListItemButton>
        </List>
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

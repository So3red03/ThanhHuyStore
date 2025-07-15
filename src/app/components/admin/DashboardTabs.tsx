'use client';

import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper, useTheme, alpha, Card, CardContent, Button, Grid } from '@mui/material';
import {
  MdDashboard,
  MdAnalytics,
  MdAssessment,
  MdNotifications,
  MdHistory,
  MdEmail,
  MdSend,
  MdTrendingUp,
  MdPeople
} from 'react-icons/md';
import { useRouter } from 'next/navigation';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `dashboard-tab-${index}`,
    'aria-controls': `dashboard-tabpanel-${index}`
  };
}

interface DashboardTabsProps {
  overviewContent: React.ReactNode;
  analyticsContent: React.ReactNode;
  reportsContent: React.ReactNode;
  notificationsContent: React.ReactNode;
}

const DashboardTabs: React.FC<DashboardTabsProps> = ({
  overviewContent,
  analyticsContent,
  reportsContent,
  notificationsContent
}) => {
  const [value, setValue] = useState(0);
  const theme = useTheme();
  const router = useRouter();

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const tabs = [
    {
      label: 'Tổng quan',
      icon: <MdDashboard size={20} />,
      content: overviewContent
    },
    {
      label: 'Phân tích',
      icon: <MdAnalytics size={20} />,
      content: analyticsContent
    },
    {
      label: 'Báo cáo',
      icon: <MdAssessment size={20} />,
      content: reportsContent
    },
    {
      label: 'Nhật ký',
      icon: <MdHistory size={20} />,
      content: notificationsContent
    }
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {/* Tabs and Marketing Card Container */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 3,
          mb: 3,
          flexDirection: { xs: 'column', lg: 'row' }
        }}
      >
        {/* Compact Tabs Container */}
        <Paper
          elevation={0}
          sx={{
            backgroundColor: 'transparent',
            borderRadius: 3,
            overflow: 'hidden',
            width: { xs: '100%', lg: '45%' } // Compact width
          }}
        >
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label='Dashboard navigation tabs'
            sx={{
              width: '100%',
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              borderRadius: 3,
              p: 1,
              minHeight: 56,
              '& .MuiTabs-indicator': {
                display: 'none'
              },
              '& .MuiTabs-flexContainer': {
                gap: 1
              }
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                iconPosition='start'
                label={
                  <Typography
                    variant='body2'
                    fontWeight={value === index ? 600 : 500}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.875rem'
                    }}
                  >
                    {tab.label}
                  </Typography>
                }
                {...a11yProps(index)}
                sx={{
                  borderRadius: 2,
                  minHeight: 44,
                  textTransform: 'none',
                  color: value === index ? 'primary.main' : 'text.secondary',
                  backgroundColor: value === index ? 'background.paper' : 'transparent',
                  boxShadow: value === index ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: value === index ? 'background.paper' : alpha(theme.palette.primary.main, 0.08),
                    transform: 'translateY(-1px)'
                  },
                  '& .MuiTab-iconWrapper': {
                    marginBottom: 0,
                    marginRight: 1
                  }
                }}
              />
            ))}
          </Tabs>
        </Paper>

        {/* Marketing Action Card - Compact Version */}
        <Box sx={{ width: { xs: '100%', lg: '50%' } }}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '120px',
                height: '120px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%',
                transform: 'translate(40%, -40%)'
              }
            }}
            onClick={() => {
              router.push('/admin/manage-products?openEmailModal=true');
            }}
          >
            <CardContent
              sx={{
                p: 2.7,
                position: 'relative',
                zIndex: 1,
                height: '56px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Grid container spacing={2} alignItems='center'>
                <Grid item xs={12} sm={8}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        p: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <MdEmail size={20} />
                    </Box>
                    <Box>
                      <Typography variant='subtitle1' sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        Email Marketing
                      </Typography>
                      <Typography variant='caption' sx={{ opacity: 0.9, lineHeight: 1.1, color: 'white' }}>
                        Gửi email sản phẩm mới đến khách hàng quan tâm
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                  <Button
                    variant='contained'
                    size='small'
                    startIcon={<MdSend size={14} />}
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '6px',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      px: 2,
                      py: 0.5,
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.3)'
                      }
                    }}
                  >
                    Gửi Email
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Tab Content */}
      {tabs.map((tab, index) => (
        <TabPanel key={index} value={value} index={index}>
          {tab.content}
        </TabPanel>
      ))}
    </Box>
  );
};

export default DashboardTabs;

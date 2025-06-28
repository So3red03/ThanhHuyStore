'use client';

import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper, useTheme, alpha } from '@mui/material';
import { MdDashboard, MdAnalytics, MdAssessment, MdNotifications } from 'react-icons/md';

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
      label: 'Thông báo',
      icon: <MdNotifications size={20} />,
      content: notificationsContent
    }
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {/* Compact Tabs Container */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          mb: 3
        }}
      >
        <Paper
          elevation={0}
          sx={{
            backgroundColor: 'transparent',
            borderRadius: 3,
            overflow: 'hidden',
            width: { xs: '100%', md: '45%' } // Compact width
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

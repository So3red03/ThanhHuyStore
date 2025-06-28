'use client';

import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto';

interface DashboardChartsNewProps {
  salesWeeklyData?: any;
  orderPieData?: any;
  type?: 'bar' | 'pie';
  title?: string;
  height?: number;
}

/**
 * Professional MUI-based dashboard charts component
 * Wraps charts in Material-UI Paper with consistent styling
 */
const DashboardChartsNew: React.FC<DashboardChartsNewProps> = ({
  salesWeeklyData,
  orderPieData,
  type = 'bar',
  title,
  height = 400,
}) => {
  const renderChart = () => {
    if (type === 'bar' && salesWeeklyData) {
      return (
        <Bar
          data={salesWeeklyData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top' as const,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(0, 0, 0, 0.1)',
                },
              },
              x: {
                grid: {
                  color: 'rgba(0, 0, 0, 0.1)',
                },
              },
            },
          }}
        />
      );
    }

    if (type === 'pie' && orderPieData) {
      return (
        <Pie
          data={orderPieData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom' as const,
                labels: {
                  padding: 20,
                  usePointStyle: true,
                },
              },
            },
          }}
        />
      );
    }

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'text.secondary',
        }}
      >
        <Typography variant="body2">Không có dữ liệu để hiển thị</Typography>
      </Box>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      {title && (
        <Typography
          variant="h6"
          component="h3"
          fontWeight={600}
          color="text.primary"
          sx={{ mb: 3, textAlign: 'center' }}
        >
          {title}
        </Typography>
      )}
      
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          height: height,
          minHeight: height,
        }}
      >
        {renderChart()}
      </Box>
    </Paper>
  );
};

export default DashboardChartsNew;

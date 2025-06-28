'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Link as MuiLink,
} from '@mui/material';
import Link from 'next/link';
import { IconType } from 'react-icons';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: IconType;
  iconColor?: string;
  iconBgColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  link?: {
    href: string;
    label: string;
  };
  loading?: boolean;
}

/**
 * Professional stats card component for dashboard metrics
 * Replaces hand-coded stats cards with consistent MUI implementation
 */
const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor = '#2563eb', // blue-600
  iconBgColor = '#eff6ff', // blue-50
  trend,
  link,
  loading = false,
}) => {
  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header with title and link */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>
          {link && (
            <Link href={link.href} passHref>
              <MuiLink
                variant="body2"
                color="secondary.main"
                sx={{
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                {link.label}
              </MuiLink>
            </Link>
          )}
        </Box>

        {/* Main content with icon and value */}
        <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
          {/* Icon container */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: iconBgColor,
              color: iconColor,
            }}
          >
            <Icon size={28} />
          </Box>

          {/* Value and trend */}
          <Box display="flex" flexDirection="column" alignItems="center">
            <Typography
              variant="h4"
              component="div"
              fontWeight={700}
              color={iconColor}
              sx={{ lineHeight: 1.2 }}
            >
              {loading ? '...' : value}
            </Typography>
            
            {trend && (
              <Box mt={1}>
                <Chip
                  label={`${trend.isPositive ? '+' : ''}${trend.value}%${
                    trend.label ? ` ${trend.label}` : ''
                  }`}
                  size="small"
                  color={trend.isPositive ? 'success' : 'error'}
                  variant="outlined"
                  sx={{
                    fontSize: '0.75rem',
                    height: 24,
                  }}
                />
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatsCard;

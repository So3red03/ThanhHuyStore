'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Typography,
  Box,
  IconButton,
  Skeleton,
} from '@mui/material';
import { IconType } from 'react-icons';

interface AdminCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  icon?: IconType;
  iconColor?: string;
  headerAction?: React.ReactNode;
  loading?: boolean;
  elevation?: number;
  sx?: object;
}

/**
 * Professional admin card component with consistent styling
 * Replaces hand-coded div cards with proper MUI Card implementation
 */
const AdminCard: React.FC<AdminCardProps> = ({
  title,
  subtitle,
  children,
  actions,
  icon: Icon,
  iconColor = 'primary.main',
  headerAction,
  loading = false,
  elevation = 0,
  sx = {},
}) => {
  if (loading) {
    return (
      <Card elevation={elevation} sx={sx}>
        <CardHeader
          title={<Skeleton variant="text" width="60%" height={28} />}
          subtitle={subtitle ? <Skeleton variant="text" width="40%" height={20} /> : undefined}
        />
        <CardContent>
          <Skeleton variant="rectangular" height={120} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={elevation} sx={sx}>
      {(title || subtitle || Icon || headerAction) && (
        <CardHeader
          avatar={
            Icon ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: `${iconColor.replace('.main', '.50')}`,
                  color: iconColor,
                }}
              >
                <Icon size={24} />
              </Box>
            ) : undefined
          }
          title={
            title ? (
              <Typography variant="h6" component="h3" fontWeight={600}>
                {title}
              </Typography>
            ) : undefined
          }
          subheader={
            subtitle ? (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            ) : undefined
          }
          action={headerAction}
        />
      )}
      
      <CardContent sx={{ pt: title || subtitle || Icon ? 0 : 3 }}>
        {children}
      </CardContent>
      
      {actions && (
        <CardActions sx={{ px: 3, pb: 3 }}>
          {actions}
        </CardActions>
      )}
    </Card>
  );
};

export default AdminCard;

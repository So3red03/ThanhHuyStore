'use client';

import React from 'react';
import { Button, ButtonProps, CircularProgress, Box } from '@mui/material';
import { IconType } from 'react-icons';

interface AdminButtonProps extends Omit<ButtonProps, 'startIcon' | 'endIcon'> {
  label: string | React.ReactNode;
  icon?: IconType;
  iconPosition?: 'start' | 'end';
  isLoading?: boolean;
  loadingText?: string;
}

/**
 * Professional admin button component with consistent styling
 * Replaces the hand-coded Button component with MUI-based implementation
 */
const AdminButton: React.FC<AdminButtonProps> = ({
  label,
  icon: Icon,
  iconPosition = 'start',
  isLoading = false,
  loadingText = 'Loading...',
  disabled,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  ...props
}) => {
  // Create icon element if provided
  const iconElement = Icon ? (
    <Box
      component="span"
      sx={{
        display: 'flex',
        alignItems: 'center',
        fontSize: size === 'small' ? '1rem' : size === 'large' ? '1.5rem' : '1.25rem',
      }}
    >
      <Icon />
    </Box>
  ) : undefined;

  // Loading state
  if (isLoading) {
    return (
      <Button
        {...props}
        variant={variant}
        color={color}
        size={size}
        disabled={true}
        startIcon={
          <CircularProgress
            size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
            color="inherit"
          />
        }
      >
        {loadingText}
      </Button>
    );
  }

  // Regular button
  return (
    <Button
      {...props}
      variant={variant}
      color={color}
      size={size}
      disabled={disabled}
      startIcon={iconPosition === 'start' ? iconElement : undefined}
      endIcon={iconPosition === 'end' ? iconElement : undefined}
    >
      {label}
    </Button>
  );
};

export default AdminButton;

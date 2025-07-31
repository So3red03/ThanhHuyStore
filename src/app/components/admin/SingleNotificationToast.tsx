'use client';

import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, Button, Slide, Fade, useTheme, alpha } from '@mui/material';
import { MdClose, MdNotifications, MdVisibility, MdBarChart } from 'react-icons/md';
import { useRouter } from 'next/navigation';

interface SingleNotificationToastProps {
  notification: {
    id: string;
    title: string;
    message: string;
    type: string;
    createdAt: string;
  };
  onClose: () => void;
  onView: () => void;
}

const SingleNotificationToast: React.FC<SingleNotificationToastProps> = ({ notification, onClose, onView }) => {
  const theme = useTheme();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Auto-show animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss after 8 seconds (UX best practice)
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const handleView = () => {
    onView();
    router.push('/admin?tab=notifications');
    handleClose();
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'AI_ASSISTANT':
      case 'SYSTEM_ALERT':
      case 'PROMOTION_SUGGESTION':
        return <MdBarChart size={24} />;
      default:
        return <MdNotifications size={24} />;
    }
  };

  const getNotificationColor = () => {
    switch (notification.type) {
      case 'AI_ASSISTANT':
      case 'SYSTEM_ALERT':
        return '#3b82f6';
      case 'PROMOTION_SUGGESTION':
        return '#10b981';
      case 'LOW_STOCK':
        return '#f59e0b';
      case 'ORDER_PLACED':
        return '#10b981';
      default:
        return '#6366f1';
    }
  };

  return (
    <Slide direction='left' in={isVisible && !isExiting} timeout={300} mountOnEnter unmountOnExit>
      <Fade in={isVisible && !isExiting} timeout={300}>
        <Paper
          elevation={12}
          sx={{
            position: 'fixed',
            top: '5%',
            right: '2.5%',
            transform: 'translate(50%, 60%)',
            zIndex: 9999,
            width: { xs: '90%', sm: '400px' },
            maxWidth: '400px',
            borderRadius: 3,
            overflow: 'hidden',
            background: `linear-gradient(135deg, ${alpha(getNotificationColor(), 0.05)} 0%, ${alpha(
              getNotificationColor(),
              0.02
            )} 100%)`,
            border: `1px solid ${alpha(getNotificationColor(), 0.2)}`,
            backdropFilter: 'blur(10px)',
            boxShadow: `0 20px 40px ${alpha(getNotificationColor(), 0.15)}, 0 0 0 1px ${alpha(
              getNotificationColor(),
              0.1
            )}`
            // animation: 'pulse 2s ease-in-out infinite alternate'
          }}
        >
          {/* Header with colored accent */}
          <Box
            sx={{
              height: 4,
              background: `linear-gradient(90deg, ${getNotificationColor()} 0%, ${alpha(
                getNotificationColor(),
                0.7
              )} 100%)`
            }}
          />

          {/* Content */}
          <Box sx={{ p: 3 }}>
            {/* Header Row */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                mb: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${getNotificationColor()} 0%, ${alpha(
                      getNotificationColor(),
                      0.8
                    )} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: `0 4px 12px ${alpha(getNotificationColor(), 0.3)}`
                  }}
                >
                  {getNotificationIcon()}
                </Box>
                <Box>
                  <Typography variant='subtitle1' fontWeight='bold' sx={{ color: 'text.primary', lineHeight: 1.2 }}>
                    Thông báo mới
                  </Typography>
                  <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                    Vừa xảy ra
                  </Typography>
                </Box>
              </Box>

              <IconButton
                size='small'
                onClick={handleClose}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                    color: 'error.main'
                  }
                }}
              >
                <MdClose size={18} />
              </IconButton>
            </Box>

            {/* Notification Content */}
            <Box sx={{ mb: 3 }}>
              <Typography variant='body1' fontWeight='medium' sx={{ mb: 1, color: 'text.primary' }}>
                {notification.title}
              </Typography>
              <Typography
                variant='body2'
                sx={{
                  color: 'text.secondary',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {notification.message}
              </Typography>
            </Box>

            {/* Action Buttons */}
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                justifyContent: 'flex-end'
              }}
            >
              <Button
                variant='outlined'
                size='small'
                onClick={handleClose}
                sx={{
                  borderColor: alpha(theme.palette.text.secondary, 0.3),
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: alpha(theme.palette.text.secondary, 0.5),
                    backgroundColor: alpha(theme.palette.text.secondary, 0.05)
                  }
                }}
              >
                Bỏ qua
              </Button>
              <Button
                variant='contained'
                size='small'
                startIcon={<MdVisibility size={16} />}
                onClick={handleView}
                sx={{
                  background: `linear-gradient(135deg, ${getNotificationColor()} 0%, ${alpha(
                    getNotificationColor(),
                    0.8
                  )} 100%)`,
                  boxShadow: `0 4px 12px ${alpha(getNotificationColor(), 0.3)}`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${alpha(getNotificationColor(), 0.9)} 0%, ${alpha(
                      getNotificationColor(),
                      0.7
                    )} 100%)`,
                    boxShadow: `0 6px 16px ${alpha(getNotificationColor(), 0.4)}`
                  }
                }}
              >
                Xem chi tiết
              </Button>
            </Box>
          </Box>

          {/* Progress bar for auto-dismiss */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: 2,
              width: '100%',
              background: alpha(getNotificationColor(), 0.2),
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                height: '100%',
                width: '100%',
                background: getNotificationColor(),
                animation: 'progress 8s linear forwards',
                '@keyframes progress': {
                  '0%': { transform: 'translateX(-100%)' },
                  '100%': { transform: 'translateX(0%)' }
                }
              }}
            />
          </Box>
        </Paper>
      </Fade>
    </Slide>
  );
};

export default SingleNotificationToast;

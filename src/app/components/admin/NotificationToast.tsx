'use client';

import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Avatar, IconButton } from '@mui/material';
import { MdClose, MdShoppingCart, MdWarning, MdComment, MdCircle, MdAutoAwesome, MdLocalOffer } from 'react-icons/md';
import { useRouter } from 'next/navigation';

interface NotificationToastProps {
  notifications: Array<{
    id: string;
    type:
      | 'ORDER_PLACED'
      | 'LOW_STOCK'
      | 'SYSTEM_ALERT'
      | 'COMMENT_RECEIVED'
      | 'PROMOTION_SUGGESTION'
      | 'VOUCHER_SUGGESTION';
    title: string;
    message: string;
    avatar?: string;
    timestamp: Date;
    data?: any;
    isRead?: boolean;
  }>;
  onClose: () => void;
  onNotificationClick: (notification: any) => void;
  duration?: number;
  disableAutoDismiss?: boolean;
  isLoading?: boolean;
}

/**
 * Facebook-style notification panel
 * Features:
 * - Shows list of notifications like Facebook
 * - Each notification can be clicked
 * - Auto-dismiss after duration
 * - Hover to pause
 * - Professional design with green theme
 */
const NotificationToast: React.FC<NotificationToastProps> = ({
  notifications,
  onClose,
  onNotificationClick,
  duration = 8000,
  disableAutoDismiss = false,
  isLoading = false
}) => {
  const router = useRouter();
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  // Progress bar animation
  useEffect(() => {
    if (notifications.length === 0 || isPaused || disableAutoDismiss) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          onClose();
          return 100;
        }
        return prev - 100 / (duration / 100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [notifications.length, duration, onClose, isPaused, disableAutoDismiss]);

  // Reset progress when notifications change
  useEffect(() => {
    if (notifications.length > 0) {
      setProgress(100);
    }
  }, [notifications]);

  // Show UI even when loading or no notifications (for instant UI)
  if (notifications.length === 0 && !isLoading) return null;

  // Get notification type styling
  const getNotificationStyle = (type: string, data?: any) => {
    switch (type) {
      case 'ORDER_PLACED':
        return {
          icon: <MdShoppingCart size={20} />,
          color: '#2563eb',
          bgColor: 'rgba(37, 99, 235, 0.1)'
        };
      case 'LOW_STOCK':
        return {
          icon: <MdWarning size={20} />,
          color: '#ea580c',
          bgColor: 'rgba(234, 88, 12, 0.1)'
        };
      case 'COMMENT_RECEIVED':
        return {
          icon: <MdComment size={20} />,
          color: '#7c3aed',
          bgColor: 'rgba(124, 58, 237, 0.1)'
        };
      case 'PROMOTION_SUGGESTION':
        return {
          icon: <MdLocalOffer size={20} />,
          color: '#dc2626',
          bgColor: 'rgba(220, 38, 38, 0.1)'
        };
      case 'VOUCHER_SUGGESTION':
        return {
          icon: <MdLocalOffer size={20} />,
          color: '#059669',
          bgColor: 'rgba(5, 150, 105, 0.1)'
        };
      case 'SYSTEM_ALERT':
        // Check if it's an AI recommendation
        if (data?.aiRecommendation) {
          return {
            icon: <MdAutoAwesome size={20} />,
            color: '#7c3aed',
            bgColor: 'rgba(124, 58, 237, 0.1)'
          };
        }
        return {
          icon: <MdCircle size={20} />,
          color: '#10b981',
          bgColor: 'rgba(16, 185, 129, 0.1)'
        };
      default:
        return {
          icon: <MdCircle size={20} />,
          color: '#10b981',
          bgColor: 'rgba(16, 185, 129, 0.1)'
        };
    }
  };

  // Format time like Facebook
  const formatTime = (timestamp: Date) => {
    if (!timestamp || !(timestamp instanceof Date)) {
      return 'Vừa xong';
    }

    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút`;
    if (hours < 24) return `${hours} giờ`;
    return `${days} ngày`;
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 70,
        right: 180,
        zIndex: 9999,
        animation: 'slideInRight 0.3s ease-out'
      }}
    >
      <Paper
        elevation={12}
        sx={{
          width: 380,
          maxHeight: 520,
          borderRadius: 3,
          overflow: 'hidden',
          backgroundColor: 'white',
          color: 'text.primary',
          border: '1px solid rgba(0,0,0,0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Progress Bar */}
        <Box
          sx={{
            height: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: 'rgba(255,255,255,0.3)',
              transition: isPaused ? 'none' : 'width 0.1s linear',
              borderRadius: '0 2px 2px 0'
            }}
          />
        </Box>

        {/* Header */}
        <Box
          sx={{
            p: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography variant='h6' fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Thông báo ({notifications.length})
          </Typography>

          <IconButton
            size='small'
            onClick={onClose}
            sx={{
              color: 'rgba(255,255,255,0.8)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white'
              }
            }}
          >
            <MdClose size={18} />
          </IconButton>
        </Box>

        {/* Notification List */}
        <Box sx={{ maxHeight: 400, overflow: 'auto', backgroundColor: '#f8fafc' }}>
          {notifications.slice(0, 10).map((notification, index) => {
            const style = getNotificationStyle(notification.type, notification.data);

            return (
              <Box
                key={notification.id}
                onClick={() => {
                  onNotificationClick(notification);
                  onClose();
                }}
                sx={{
                  p: 2.5,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2,
                  cursor: 'pointer',
                  borderBottom: index < notifications.length - 1 ? '1px solid rgba(0,0,0,0.08)' : 'none',
                  backgroundColor: notification.isRead ? 'white' : style.bgColor,
                  '&:hover': {
                    backgroundColor: '#f1f5f9',
                    transform: 'translateX(4px)'
                  },
                  transition: 'all 0.2s ease',
                  mx: 1,
                  my: 0.5,
                  borderRadius: 2,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                {/* Icon */}
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: style.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0
                  }}
                >
                  {style.icon}
                </Box>

                {/* Content */}
                <Box flex={1} minWidth={0}>
                  <Box display='flex' justifyContent='space-between' alignItems='flex-start' mb={0.5}>
                    <Typography
                      variant='body1'
                      fontWeight={notification.isRead ? 400 : 600}
                      sx={{
                        color: 'text.primary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '200px'
                      }}
                    >
                      {notification.title}
                    </Typography>

                    <Typography
                      variant='caption'
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                        flexShrink: 0,
                        ml: 1
                      }}
                    >
                      {formatTime(notification.timestamp)}
                    </Typography>
                  </Box>

                  <Typography
                    variant='body2'
                    sx={{
                      color: notification.isRead ? 'text.secondary' : 'text.primary',
                      fontWeight: notification.isRead ? 400 : 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.4
                    }}
                  >
                    {notification.message}
                  </Typography>

                  {/* AI Recommendation Badge */}
                  {notification.data?.aiRecommendation && (
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {notification.data.urgency && (
                        <Box
                          sx={{
                            px: 1,
                            py: 0.25,
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            backgroundColor:
                              notification.data.urgency === 'HIGH' || notification.data.urgency === 'CRITICAL'
                                ? '#fee2e2'
                                : notification.data.urgency === 'MEDIUM'
                                ? '#fef3c7'
                                : '#dcfce7',
                            color:
                              notification.data.urgency === 'HIGH' || notification.data.urgency === 'CRITICAL'
                                ? '#dc2626'
                                : notification.data.urgency === 'MEDIUM'
                                ? '#d97706'
                                : '#16a34a'
                          }}
                        >
                          {notification.data.urgency}
                        </Box>
                      )}
                      {notification.data.confidence && (
                        <Box
                          sx={{
                            px: 1,
                            py: 0.25,
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            backgroundColor: '#e0e7ff',
                            color: '#3730a3'
                          }}
                        >
                          {notification.data.confidence}% tin cậy
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#10b981'
                      }}
                    />
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
};

export default NotificationToast;

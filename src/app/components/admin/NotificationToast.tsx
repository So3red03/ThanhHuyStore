'use client';

import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Avatar, IconButton, alpha } from '@mui/material';
import {
  MdClose,
  MdShoppingCart,
  MdWarning,
  MdComment,
  MdCircle,
  MdAutoAwesome,
  MdLocalOffer,
  MdNotifications,
  MdSmartToy,
  MdMarkAsUnread,
  MdDelete,
  MdMessage
} from 'react-icons/md';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

import { truncateText } from '../../../../utils/truncateText';
import AIActionButtons from './AIActionButtons';

interface NotificationToastProps {
  notifications: Array<{
    id: string;
    type:
      | 'ORDER_PLACED' // ✅ Event Notification
      | 'MESSAGE_RECEIVED' // ✅ Event Notification
      | 'COMMENT_RECEIVED' // ✅ Event Notification
      | 'SYSTEM_ALERT' // ✅ Event Notification
      | 'AI_ASSISTANT'; // 🤖 AI Recommendation
    title: string;
    message: string;
    avatar?: string;
    createdAt: string;
    data?: any;
    isRead?: boolean;
    user?: {
      id: string;
      name: string;
      image?: string;
    };
  }>;
  onClose: () => void;
  onNotificationClick: (notification: any) => void;
  duration?: number;
  disableAutoDismiss?: boolean;
  isLoading?: boolean;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notifications,
  onClose,
  onNotificationClick,
  duration = 8000,
  disableAutoDismiss = false,
  isLoading = false
}) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  // Notification configuration - consistent with NotificationTab
  const notificationConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    ORDER_PLACED: { icon: <MdShoppingCart />, color: '#2196F3', label: 'Đơn hàng' },
    MESSAGE_RECEIVED: { icon: <MdMessage />, color: '#4CAF50', label: 'Tin nhắn' },
    COMMENT_RECEIVED: { icon: <MdComment />, color: '#9C27B0', label: 'Bình luận' },
    SYSTEM_ALERT: { icon: <MdWarning />, color: '#607D8B', label: 'Hệ thống' },
    AI_ASSISTANT: { icon: <MdSmartToy />, color: '#3b82f6', label: 'AI Assistant' }
  };
  console.log(notifications);
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

  // Get notification style based on type - consistent with Notific ationTab
  const getNotificationStyle = (type: string) => {
    const config = notificationConfig[type] || notificationConfig.SYSTEM_ALERT;
    return {
      icon: config.icon,
      color: config.color,
      bgColor: alpha(config.color, 0.1)
    };
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 70,
        right: 180,
        zIndex: 9999
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1.5,
                bgcolor: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MdNotifications size={20} />
            </Box>
            <Box>
              <Typography variant='h6' fontWeight={600}>
                Thông báo mới
              </Typography>
              <Typography variant='caption' sx={{ opacity: 0.9 }}>
                {notifications.length} thông báo
              </Typography>
            </Box>
          </Box>

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
            const style = getNotificationStyle(notification.type);

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
                      {notification.createdAt
                        ? formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: vi
                          })
                        : 'Vừa xong'}
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

                  {/* User/Context Info - For event notifications */}
                  {(notification.data?.userName ||
                    notification.data?.customerName ||
                    notification.data?.productName ||
                    notification.data?.articleTitle ||
                    notification.data?.commentContent ||
                    notification.data?.orderAmount) && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: alpha(style.color, 0.05), borderRadius: 1 }}>
                      {(notification.data?.userName || notification.data?.customerName) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <Avatar
                            src={notification.data?.userImage || notification.data?.customerImage || ''}
                            sx={{ width: 16, height: 16, fontSize: '0.6rem' }}
                          >
                            {(notification.data?.userName || notification.data?.customerName || 'U').charAt(0)}
                          </Avatar>
                          <Typography
                            variant='caption'
                            sx={{ color: 'text.primary', fontSize: '0.7rem', fontWeight: 600 }}
                          >
                            {notification.data?.userName || notification.data?.customerName}
                          </Typography>
                        </Box>
                      )}
                      {notification.data?.productName && (
                        <Typography
                          variant='caption'
                          sx={{ color: 'text.primary', fontSize: '0.7rem', fontWeight: 600, display: 'block', mb: 0.5 }}
                        >
                          📦 {truncateText(notification.data.productName, 30)}
                        </Typography>
                      )}
                      {notification.data?.articleTitle && (
                        <Typography
                          variant='caption'
                          sx={{ color: 'text.primary', fontSize: '0.7rem', fontWeight: 600, display: 'block', mb: 0.5 }}
                        >
                          📰 {truncateText(notification.data.articleTitle, 30)}
                        </Typography>
                      )}
                      {notification.data?.commentContent && (
                        <Typography
                          variant='caption'
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.7rem',
                            fontStyle: 'italic',
                            display: 'block',
                            mb: 0.5
                          }}
                        >
                          💬 "{truncateText(notification.data.commentContent, 50)}"
                        </Typography>
                      )}
                      {notification.data?.orderAmount && (
                        <Typography
                          variant='caption'
                          sx={{ color: 'success.main', fontSize: '0.7rem', fontWeight: 600, display: 'block' }}
                        >
                          💰 {notification.data.orderAmount.toLocaleString('vi-VN')}₫
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* AI Recommendation Badge */}
                  {notification.data?.aiAssistant && (
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

                  {notification.data?.aiAssistant && (
                    <AIActionButtons
                      productId={notification.data.productId}
                      productName={notification.data.productName}
                      suggestionType={notification.type as any}
                      suggestedAction={
                        notification.data.eventType === 'INVENTORY_CRITICAL' ? 'RESTOCK' : 'VIEW_PRODUCT'
                      }
                      confidence={notification.data.confidence || 50}
                      onActionTaken={(action, value) => {
                        console.log(`AI Action taken: ${action}`, value);
                        // Track action in analytics if needed
                      }}
                    />
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

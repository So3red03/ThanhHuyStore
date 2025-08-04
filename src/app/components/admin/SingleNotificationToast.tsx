'use client';

import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, Button, Slide, Fade, useTheme, alpha, Avatar } from '@mui/material';
import { MdClose, MdNotifications, MdVisibility, MdSmartToy } from 'react-icons/md';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { truncateText } from '../../utils/truncateText';
import AIActionButtons from './AIActionButtons';

interface SingleNotificationToastProps {
  notification: {
    id: string;
    title: string;
    message: string;
    type: string;
    createdAt: string;
    data?: any; // For AI recommendations and other metadata
    user?: {
      id: string;
      name: string;
      image?: string;
    };
  };
  onClose: () => void;
  onView: () => void;
}

const SingleNotificationToast: React.FC<SingleNotificationToastProps> = ({ notification, onClose, onView }) => {
  const theme = useTheme();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Notification configuration - TẤT CẢ các loại từ Prisma Schema
  const notificationConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    ORDER_PLACED: { icon: <MdNotifications />, color: theme.palette.success.main, label: 'Đơn hàng mới' },
    MESSAGE_RECEIVED: { icon: <MdNotifications />, color: theme.palette.info.main, label: 'Tin nhắn' },
    COMMENT_RECEIVED: { icon: <MdNotifications />, color: theme.palette.warning.main, label: 'Bình luận' },
    LOW_STOCK: { icon: <MdNotifications />, color: theme.palette.warning.main, label: 'Hết hàng' },
    SYSTEM_ALERT: { icon: <MdNotifications />, color: theme.palette.error.main, label: 'Cảnh báo' },
    PROMOTION_SUGGESTION: { icon: <MdNotifications />, color: theme.palette.secondary.main, label: 'Khuyến mãi' },
    VOUCHER_SUGGESTION: { icon: <MdNotifications />, color: theme.palette.secondary.main, label: 'Voucher' },
    AI_ASSISTANT: { icon: <MdSmartToy />, color: theme.palette.primary.main, label: 'AI Assistant' }
  };

  const config = notificationConfig[notification.type] || notificationConfig.SYSTEM_ALERT;

  // Auto-show animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss after 120 seconds (UX best practice)
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 120000);

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
        return <MdSmartToy size={24} />;
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
                    {notification.type === 'AI_ASSISTANT' && notification.data?.aiAssistant ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>Khuyến nghị</Box>
                    ) : (
                      'Thông báo mới'
                    )}
                  </Typography>
                  <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: vi
                    })}
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
            <Box sx={{ mb: 2 }}>
              <Typography variant='body1' fontWeight='medium' sx={{ mb: 1, color: 'text.primary' }}>
                {notification.title}
              </Typography>
              <Typography
                variant='body2'
                sx={{
                  color: 'text.secondary',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  mb: 1
                }}
              >
                {notification.message}
              </Typography>
            </Box>

            {/* Context Details - For relevant notifications */}
            {(notification.data?.userName ||
              notification.data?.customerName ||
              notification.data?.productName ||
              notification.data?.articleTitle ||
              notification.data?.commentContent ||
              notification.data?.orderAmount) && (
              <Box sx={{ mb: 2, p: 1.5, bgcolor: alpha(config.color, 0.05), borderRadius: 1 }}>
                {/* User Info */}
                {(notification.data?.userName || notification.data?.customerName) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Avatar
                      src={notification.data?.userImage || notification.data?.customerImage || ''}
                      sx={{ width: 20, height: 20, fontSize: '0.7rem' }}
                    >
                      {(notification.data?.userName || notification.data?.customerName || 'U').charAt(0)}
                    </Avatar>
                    <Typography variant='body2' sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {notification.data?.userName || notification.data?.customerName}
                    </Typography>
                  </Box>
                )}

                {/* Product/Article Info */}
                {notification.data?.productName && (
                  <Typography variant='body2' sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                    📦 {notification.data.productName}
                  </Typography>
                )}
                {notification.data?.articleTitle && (
                  <Typography variant='body2' sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                    📰 {truncateText(notification.data.articleTitle, 50)}
                  </Typography>
                )}

                {/* Comment Content */}
                {notification.data?.commentContent && (
                  <Typography variant='body2' sx={{ color: 'text.secondary', fontStyle: 'italic', mb: 0.5 }}>
                    💬 {truncateText(notification.data.commentContent, 80)}
                  </Typography>
                )}

                {/* Order Amount */}
                {notification.data?.orderAmount && (
                  <Typography variant='body2' sx={{ color: 'success.main', fontWeight: 600 }}>
                    💰 {notification.data.orderAmount.toLocaleString('vi-VN')}₫
                  </Typography>
                )}
              </Box>
            )}

            {/* AI Action Buttons - Only for AI_ASSISTANT type notifications */}
            {notification.type === 'AI_ASSISTANT' && notification.data?.aiAssistant && (
              <Box sx={{ mb: 2 }}>
                {/* AI Action Buttons */}
                <AIActionButtons
                  productId={notification.data.productId}
                  productName={notification.data.productName}
                  suggestionType={notification.data.eventType as any}
                  suggestedAction={notification.data.eventType === 'INVENTORY_CRITICAL' ? 'RESTOCK' : 'VIEW_PRODUCT'}
                  confidence={85} // Default confidence for AI assistant
                  notificationId={notification.id}
                  eventType={notification.data.eventType}
                  onActionTaken={(action, value) => {
                    console.log(`AI Action taken from toast: ${action}`, value);
                    // Close toast after action
                    handleClose();
                  }}
                />
              </Box>
            )}

            {/* Standard Action Buttons */}
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
                Xem tất cả
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
                animation: 'progress 120s linear forwards',
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

'use client';

import React, { useState, useEffect } from 'react';
import { Snackbar, Avatar, Box, Typography, IconButton, Paper, Slide } from '@mui/material';
import { MdClose, MdCircle } from 'react-icons/md';

interface MessageToastProps {
  messages: Array<{
    id: string;
    senderName: string;
    content: string;
    avatar: string;
    timestamp: Date;
    hasImage: boolean;
    chatroomId: string;
    isRead: boolean;
  }>;
  onClose: () => void;
  onMessageClick: (chatroomId: string) => void;
  duration?: number;
  disableAutoDismiss?: boolean;
  isLoading?: boolean;
}

/**
 * Professional message notification panel with clean design
 * Features:
 * - Clean conversation list design matching NotificationToast
 * - Latest messages appear at top
 * - Online status indicators with green theme
 * - Unread message badges
 * - Smooth hover effects and animations
 * - Click to navigate to specific chat
 * - Light theme with professional styling
 */
const MessageToast: React.FC<MessageToastProps> = ({
  messages,
  onClose,
  onMessageClick,
  duration = 8000,
  disableAutoDismiss = false,
  isLoading = false
}) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  // Progress bar animation
  useEffect(() => {
    if (messages.length === 0 || isPaused || disableAutoDismiss) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          onClose();
          return 0;
        }
        return prev - 100 / (duration / 100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [messages.length, isPaused, duration, onClose, disableAutoDismiss]);

  // Reset progress when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setProgress(100);
    }
  }, [messages]);

  // Show UI even when loading or no messages (for instant UI)
  if (messages.length === 0 && !isLoading) return null;

  const formatTime = (timestamp: Date | string | undefined) => {
    if (!timestamp) return 'Vừa xong';

    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (isNaN(date.getTime())) return 'Vừa xong';

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút`;
    if (hours < 24) return `${hours} giờ`;
    return `${days} ngày`;
  };

  return (
    <Snackbar
      open={true}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      TransitionComponent={Slide}
      sx={{
        mt: 8,
        mr: 2,
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
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.02) translateY(-4px)',
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
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography variant='h6' fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            💬 Tin nhắn
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

        {/* Message List */}
        <Box sx={{ maxHeight: 400, overflow: 'auto', backgroundColor: '#f8fafc' }}>
          {isLoading && messages.length === 0 ? (
            // Loading state - show skeleton
            <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant='body2'>Đang tải tin nhắn...</Typography>
            </Box>
          ) : messages.length === 0 ? (
            // Empty state
            <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant='body2'>Chưa có tin nhắn nào</Typography>
            </Box>
          ) : (
            // Show messages - Facebook style conversation list
            messages.slice(0, 5).map((msg, index) => (
              <Box
                key={msg.id}
                onClick={() => {
                  onMessageClick(msg.chatroomId || msg.id);
                  onClose();
                }}
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  cursor: 'pointer',
                  borderBottom: index < messages.length - 1 ? '1px solid rgba(0,0,0,0.08)' : 'none',
                  backgroundColor: msg.isRead ? 'white' : 'rgba(16, 185, 129, 0.05)',
                  borderLeft: !msg.isRead ? '4px solid #10b981' : 'none',
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
                {/* Avatar with unread badge - ChatList style */}
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={msg.avatar || '/no-avatar-2.jpg'}
                    sx={{
                      width: 52,
                      height: 52,
                      border: '2px solid #10b981'
                    }}
                  />
                  {/* Unread badge */}
                  {!msg.isRead && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        border: '2px solid white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: 'white'
                        }}
                      />
                    </Box>
                  )}
                </Box>

                {/* Message content - ChatList style */}
                <Box flex={1} minWidth={0}>
                  <Box display='flex' justifyContent='space-between' alignItems='flex-start' mb={0.5}>
                    <Typography
                      variant='body1'
                      fontWeight={!msg.isRead ? 600 : 500}
                      sx={{
                        color: !msg.isRead ? '#1f2937' : '#6b7280',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '180px'
                      }}
                    >
                      {msg.senderName || 'Người dùng'}
                    </Typography>

                    <Typography
                      variant='caption'
                      sx={{
                        color: !msg.isRead ? '#10b981' : '#9ca3af',
                        fontSize: '0.75rem',
                        fontWeight: !msg.isRead ? 600 : 400,
                        flexShrink: 0,
                        ml: 1
                      }}
                    >
                      {formatTime(msg.timestamp)}
                    </Typography>
                  </Box>

                  {/* Last message preview - ChatList style */}
                  <Box display='flex' alignItems='center' gap={1}>
                    <Typography
                      variant='body2'
                      sx={{
                        color: !msg.isRead ? '#1f2937' : '#6b7280',
                        fontWeight: !msg.isRead ? 500 : 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '200px',
                        flex: 1
                      }}
                    >
                      {msg.hasImage ? '📷 Hình ảnh' : msg.content || 'Tin nhắn mới'}
                    </Typography>

                    {/* Unread dot indicator - smaller and more subtle */}
                    {!msg.isRead && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#10b981',
                          flexShrink: 0
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Paper>
    </Snackbar>
  );
};

export default MessageToast;

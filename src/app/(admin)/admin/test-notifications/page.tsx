'use client';

import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Grid } from '@mui/material';
import NotificationPanel from '@/app/components/admin/NotificationPanel';
import MessageToast from '@/app/components/admin/MessageToast';

const NotificationTestPage = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  const mockNotifications = [
    {
      id: '1',
      type: 'ORDER_PLACED' as const,
      title: 'Đơn hàng mới',
      message: 'Khách hàng Nguyễn Văn A vừa đặt đơn hàng #12345 với tổng giá trị 2.500.000đ',
      avatar: '/no-avatar-2.jpg',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      data: { orderId: '12345' },
      isRead: false
    },
    {
      id: '2',
      type: 'LOW_STOCK' as const,
      title: 'Cảnh báo tồn kho',
      message: 'Sản phẩm iPhone 15 Pro sắp hết hàng (còn 2 sản phẩm)',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      data: { productId: 'iphone15' },
      isRead: false
    },
    {
      id: '3',
      type: 'COMMENT_RECEIVED' as const,
      title: 'Bình luận mới',
      message: 'Có bình luận mới trên bài viết "Hướng dẫn sử dụng sản phẩm"',
      avatar: '/no-avatar-2.jpg',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      data: { articleId: 'article123' },
      isRead: true
    },
    {
      id: '4',
      type: 'ORDER_PLACED' as const,
      title: 'Đơn hàng mới',
      message: 'Khách hàng Trần Thị B vừa đặt đơn hàng #12346',
      avatar: '/no-avatar-2.jpg',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      data: { orderId: '12346' },
      isRead: true
    }
  ];

  const testNotifications = () => {
    setNotifications(mockNotifications);
  };

  const testMessages = () => {
    const mockMessages = [
      {
        id: '1',
        senderName: 'Duc Tri Nguyen',
        content: 'Chào admin, tôi muốn hỏi về sản phẩm này',
        avatar: '/no-avatar-2.jpg',
        timestamp: new Date(Date.now() - 13 * 60 * 1000), // 13 minutes ago
        hasImage: false,
        chatroomId: 'chat1',
        isRead: false
      },
      {
        id: '2',
        senderName: 'Quỳnh Trang',
        content: 'Mẫu đỏ CD bạn ơi',
        avatar: '/no-avatar-2.jpg',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        hasImage: false,
        chatroomId: 'chat2',
        isRead: false
      },
      {
        id: '3',
        senderName: 'Trần Thị Ngọc Tuyền',
        content: 'Nghe chủ mà điểm kh thấp t chiu...',
        avatar: '/no-avatar-2.jpg',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        hasImage: false,
        chatroomId: 'chat3',
        isRead: true
      },
      {
        id: '4',
        senderName: 'KHI NÀO CAFE?',
        content: 'Bạn: Đi làm r em ơi',
        avatar: '/no-avatar-2.jpg',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        hasImage: true,
        chatroomId: 'chat4',
        isRead: true
      },
      {
        id: '5',
        senderName: 'Anh Thong',
        content: 'Tin nhắn và cuộc gọi được bảo mã...',
        avatar: '/no-avatar-2.jpg',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        hasImage: false,
        chatroomId: 'chat5',
        isRead: true
      }
    ];

    setMessages(mockMessages);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant='h4' gutterBottom>
        🧪 Notification System Test
      </Typography>

      <Typography variant='body1' sx={{ mb: 4, color: 'text.secondary' }}>
        Test hệ thống notification với 2 component chính: NotificationToast và MessageToast
      </Typography>

      <Grid container spacing={3}>
        {/* Notification Tests */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant='h6' gutterBottom>
              📢 Notification Panel Tests
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button variant='contained' color='primary' onClick={testNotifications} sx={{ py: 2 }}>
                Test Notification Panel
              </Button>

              <Button variant='outlined' onClick={() => setNotifications([])}>
                Clear Notifications
              </Button>
            </Box>

            <Typography variant='body2' sx={{ mt: 2, color: 'text.secondary' }}>
              Hiển thị panel notification như Facebook:
              <br />• Danh sách các thông báo
              <br />• Đơn hàng mới (xanh dương)
              <br />• Cảnh báo tồn kho (cam)
              <br />• Bình luận mới (tím)
              <br />• Click vào từng notification để navigate
            </Typography>
          </Paper>
        </Grid>

        {/* Message Tests */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant='h6' gutterBottom>
              💬 Message Toast Tests
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button variant='contained' color='success' onClick={testMessages} sx={{ py: 2 }}>
                Test Message Toast
              </Button>

              <Button variant='outlined' onClick={() => setMessages([])}>
                Clear Messages
              </Button>
            </Box>

            <Typography variant='body2' sx={{ mt: 2, color: 'text.secondary' }}>
              Hiển thị danh sách tin nhắn với design xanh lá:
              <br />• Avatar + online status
              <br />• Tên người gửi + thời gian
              <br />• Preview tin nhắn
              <br />• Unread indicators
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Toast Components */}
      <NotificationPanel
        notifications={notifications}
        onClose={() => setNotifications([])}
        onNotificationClick={notification => {
          console.log('Navigate to:', notification);
          alert(`Navigate to: ${notification.type} - ${notification.title}`);
        }}
        duration={12000} // 12 seconds for testing
      />

      <MessageToast
        messages={messages}
        onClose={() => setMessages([])}
        onMessageClick={chatroomId => {
          console.log('Navigate to chat:', chatroomId);
          alert(`Navigate to chat: ${chatroomId}`);
        }}
        duration={15000} // 15 seconds for testing
      />
    </Box>
  );
};

export default NotificationTestPage;

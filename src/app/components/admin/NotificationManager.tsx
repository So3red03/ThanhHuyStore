'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import SingleNotificationToast from './SingleNotificationToast';
import { pusherClient } from '@/app/libs/pusher';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  userId: string;
  isRead: boolean;
  data?: any; // For AI recommendations and other metadata
}

interface NotificationManagerProps {
  userId: string;
  userRole: 'ADMIN' | 'STAFF' | 'USER';
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ userId, userRole }) => {
  const [activeToast, setActiveToast] = useState<Notification | null>(null);
  const [notificationQueue, setNotificationQueue] = useState<Notification[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Process notification queue (anti-spam logic)
  const processQueue = useCallback(() => {
    if (isProcessingQueue || notificationQueue.length === 0 || activeToast) {
      return;
    }

    setIsProcessingQueue(true);
    const nextNotification = notificationQueue[0];

    // Remove from queue and show toast
    setNotificationQueue(prev => prev.slice(1));
    setActiveToast(nextNotification);

    setTimeout(() => {
      setIsProcessingQueue(false);
    }, 1000); // 1 second delay between toasts
  }, [notificationQueue, activeToast, isProcessingQueue]);

  // Process queue when conditions change
  useEffect(() => {
    processQueue();
  }, [processQueue]);

  // Add notification to queue (anti-spam logic)
  const addNotificationToQueue = useCallback(
    (notification: Notification) => {
      // Skip if notification already exists in queue or is currently showing
      if (activeToast?.id === notification.id || notificationQueue.some(n => n.id === notification.id)) {
        return;
      }

      // Add to queue
      setNotificationQueue(prev => [...prev, notification]);
    },
    [activeToast, notificationQueue]
  );

  // Handle new notifications from Pusher
  useEffect(() => {
    if (!userId || userRole === 'USER') return; // Only for admin/staff

    const channel = pusherClient.subscribe(`user-${userId}`);

    const handleNewNotification = (data: { notification: Notification; type: string }) => {
      console.log('📨 New notification received:', data);

      // Only show toast for important notifications
      const importantTypes = [
        'ORDER_PLACED',
        'SYSTEM_ALERT',
        'COMMENT_RECEIVED',
        'MESSAGE_RECEIVED',
        'PAYMENT_FAILURE_SPIKE',
        'AI_ASSISTANT',
        'LOW_STOCK',
        'PENDING_ORDER',
        'PROMOTION_SUGGESTION',
        'VOUCHER_SUGGESTION'
      ];

      if (importantTypes.includes(data.notification.type)) {
        addNotificationToQueue(data.notification);
      }
    };

    channel.bind('notification', handleNewNotification);

    return () => {
      channel.unbind('notification', handleNewNotification);
      pusherClient.unsubscribe(`user-${userId}`);
    };
  }, [userId, userRole, addNotificationToQueue]);

  // Handle toast close
  const handleToastClose = useCallback(() => {
    setActiveToast(null);

    // Process next notification after a delay
    setTimeout(() => {
      processQueue();
    }, 500);
  }, [processQueue]);

  // Handle view notification
  const handleViewNotification = useCallback(() => {
    // Mark as read
    if (activeToast) {
      fetch(`/api/notifications/${activeToast.id}/read`, {
        method: 'PATCH'
      }).catch(console.error);
    }
  }, [activeToast]);

  // Don't render anything for regular users
  if (userRole === 'USER') {
    return null;
  }

  return (
    <Box>
      {/* Single Toast - Only show one at a time */}
      {activeToast && (
        <SingleNotificationToast
          notification={activeToast}
          onClose={handleToastClose}
          onView={handleViewNotification}
        />
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 170,
            right: 20,
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            p: 1,
            borderRadius: 1,
            fontSize: '12px',
            zIndex: 10000
          }}
        >
          Queue: {notificationQueue.length} | Active: {activeToast ? '1' : '0'}
        </Box>
      )}
    </Box>
  );
};

export default NotificationManager;

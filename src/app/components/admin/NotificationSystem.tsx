'use client';

import React, { useState, useEffect, useRef } from 'react';
import { pusherClient } from '@/app/libs/pusher';
import { SafeUser } from '../../../../types';
import NotificationPanel from './NotificationToast';

interface NotificationSystemProps {
  currentUser: SafeUser | null;
  forceShow?: boolean;
  onClose?: () => void;
}

/**
 * Centralized notification system for admin panel
 * Handles real-time notifications and messages with professional UX
 * Features:
 * - Real-time Pusher integration
 * - Smart notification queuing
 * - Auto-dismiss with hover pause
 * - Professional toast animations
 * - Sound notifications (optional)
 */
const NotificationSystem: React.FC<NotificationSystemProps> = ({ currentUser, forceShow = false, onClose }) => {
  const [notificationQueue, setNotificationQueue] = useState<any[]>([]);
  const [currentNotifications, setCurrentNotifications] = useState<any[]>([]);
  const MAX_NOTIFICATIONS = 10;
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Setup real-time listeners
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      return;
    }

    // Subscribe to admin notifications only
    const adminChannel = pusherClient.subscribe('admin-notifications');

    // Handle new notifications (excluding MESSAGE_RECEIVED - handled by MessageSystem)
    adminChannel.bind('notification', (data: any) => {
      if (data.type === 'new_notification' && data.notification.type !== 'MESSAGE_RECEIVED') {
        const notification = {
          id: data.notification.id,
          type: data.notification.type,
          title: data.notification.title,
          message: data.notification.message,
          avatar: data.notification.fromUser?.image,
          timestamp: new Date(data.notification.createdAt),
          data: data.notification.data
        };

        setNotificationQueue(prev => [...prev, notification]);
      }
    });

    return () => {
      pusherClient.unsubscribe('admin-notifications');

      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, [currentUser]);

  // Process notification queue - collect notifications instead of showing one by one
  useEffect(() => {
    if (notificationQueue.length > 0) {
      // Add new notifications to current list (max 10)
      setCurrentNotifications(prev => {
        const combined = [...prev, ...notificationQueue];
        return combined.slice(-MAX_NOTIFICATIONS); // Keep only latest 10
      });

      // Clear the queue
      setNotificationQueue([]);

      // Auto-dismiss after 8 seconds if there are notifications and not force showing
      if (!forceShow) {
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }

        notificationTimeoutRef.current = setTimeout(() => {
          setCurrentNotifications([]);
        }, 8000);
      }
    }
  }, [notificationQueue]);

  const handleNotificationClose = () => {
    setCurrentNotifications([]);
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    // Call external onClose if provided (for forceShow)
    if (onClose) {
      onClose();
    }
  };

  const handleNotificationClick = (notification: any) => {
    // Navigate based on notification type
    switch (notification.type) {
      case 'ORDER_PLACED':
        window.location.href = '/admin/manage-orders';
        break;
      case 'LOW_STOCK':
        window.location.href = '/admin/manage-products';
        break;
      case 'COMMENT_RECEIVED':
        window.location.href = '/admin/manage-articles';
        break;
      default:
        break;
    }
  };

  // Handle forceShow - fetch existing notifications
  useEffect(() => {
    if (forceShow && currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'STAFF')) {
      const fetchExistingNotifications = async () => {
        try {
          const response = await fetch('/api/notifications');
          const data = await response.json();
          if (data.notifications && Array.isArray(data.notifications)) {
            setCurrentNotifications(data.notifications.slice(0, MAX_NOTIFICATIONS));
          }
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      };
      fetchExistingNotifications();
    } else if (!forceShow && notificationQueue.length === 0) {
      setCurrentNotifications([]);
    }
  }, [forceShow, currentUser, notificationQueue.length]);

  // Don't render if user not authorized
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
    return null;
  }

  // Only show when forceShow is true or there are notifications
  const shouldShowNotifications = forceShow || currentNotifications.length > 0;

  return (
    <>
      {/* Notification Panel - Instant UI */}
      {shouldShowNotifications && (
        <NotificationPanel
          notifications={currentNotifications}
          onClose={handleNotificationClose}
          onNotificationClick={handleNotificationClick}
          duration={8000}
          disableAutoDismiss={forceShow}
          isLoading={forceShow && currentNotifications.length === 0}
        />
      )}

      {/* Message Toast - Handled by MessageSystem */}
    </>
  );
};

export default NotificationSystem;

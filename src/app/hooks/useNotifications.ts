'use client';

import { useEffect, useState } from 'react';
import { pusherClient } from '@/app/libs/pusher';
import { SafeUser } from '../../../types';

export interface Notification {
  id: string;
  userId?: string;
  productId?: string;
  orderId?: string;
  messageId?: string;
  fromUserId?: string;
  type: 'ORDER_PLACED' | 'COMMENT_RECEIVED' | 'MESSAGE_RECEIVED' | 'LOW_STOCK' | 'SYSTEM_ALERT';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
  user?: SafeUser;
  product?: any;
  fromUser?: SafeUser;
}

export const useNotifications = (currentUser: SafeUser | null) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
      });
      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId ? { ...notif, isRead: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
      });
      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Setup Pusher subscription
  useEffect(() => {
    if (!currentUser) return;

    const channel = pusherClient.subscribe(`user-${currentUser.id}`);
    
    channel.bind('notification', (data: any) => {
      if (data.type === 'new_notification') {
        setNotifications(prev => [data.notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      } else if (data.type === 'notification_read') {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === data.notification.id ? data.notification : notif
          )
        );
      } else if (data.type === 'all_notifications_read') {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        setUnreadCount(0);
      }
    });

    // Admin channel for admin users
    let adminChannel: any;
    if (currentUser.role === 'ADMIN') {
      adminChannel = pusherClient.subscribe('admin-notifications');
      adminChannel.bind('notification', (data: any) => {
        if (data.type === 'new_notification') {
          setNotifications(prev => [data.notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      });
    }

    return () => {
      pusherClient.unsubscribe(`user-${currentUser.id}`);
      if (adminChannel) {
        pusherClient.unsubscribe('admin-notifications');
      }
    };
  }, [currentUser]);

  // Initial fetch
  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [currentUser]);

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  };
};

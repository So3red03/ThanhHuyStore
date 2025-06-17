'use client';

import { useEffect } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
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
  const store = useNotificationStore();

  // Update current user in store when it changes
  useEffect(() => {
    store.setCurrentUser(currentUser);
  }, [currentUser, store]);

  // All Pusher subscription and data fetching now handled by Zustand store
  // No additional useEffects needed

  return {
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    isLoading: store.isLoading,
    fetchNotifications: store.fetchNotifications,
    fetchUnreadCount: store.fetchUnreadCount,
    markAsRead: store.markAsRead,
    markAllAsRead: store.markAllAsRead
  };
};

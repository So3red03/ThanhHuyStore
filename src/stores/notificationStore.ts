import { create } from 'zustand';
import { pusherClient } from '@/app/libs/pusher';
import { SafeUser } from '../../types';

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

export interface NotificationStore {
  // State
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  currentUser: SafeUser | null;
  
  // Actions
  setCurrentUser: (user: SafeUser | null) => void;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  
  // Internal actions
  setupPusherSubscription: () => void;
  cleanupPusherSubscription: () => void;
}

// Store pusher channels outside of store to manage cleanup
let userChannel: any = null;
let adminChannel: any = null;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  currentUser: null,

  // Actions
  setCurrentUser: (user: SafeUser | null) => {
    const prevUser = get().currentUser;
    set({ currentUser: user });
    
    // If user changed, cleanup old subscriptions and setup new ones
    if (prevUser?.id !== user?.id) {
      get().cleanupPusherSubscription();
      if (user) {
        get().setupPusherSubscription();
        get().fetchNotifications();
        get().fetchUnreadCount();
      } else {
        set({ notifications: [], unreadCount: 0 });
      }
    }
  },

  fetchNotifications: async () => {
    const { currentUser } = get();
    if (!currentUser) return;
    
    try {
      set({ isLoading: true });
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        set({ notifications: data });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    const { currentUser } = get();
    if (!currentUser) return;
    
    try {
      const response = await fetch('/api/notifications/unread-count');
      if (response.ok) {
        const data = await response.json();
        set({ unreadCount: data.unreadCount });
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
      });
      if (response.ok) {
        set((state) => ({
          notifications: state.notifications.map(notif =>
            notif.id === notificationId ? { ...notif, isRead: true } : notif
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
      });
      if (response.ok) {
        set((state) => ({
          notifications: state.notifications.map(notif => ({ ...notif, isRead: true })),
          unreadCount: 0
        }));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  },

  setupPusherSubscription: () => {
    const { currentUser } = get();
    if (!currentUser) return;

    // Cleanup existing subscriptions first
    get().cleanupPusherSubscription();

    // User-specific channel
    userChannel = pusherClient.subscribe(`user-${currentUser.id}`);
    
    userChannel.bind('notification', (data: any) => {
      if (data.type === 'new_notification') {
        get().addNotification(data.notification);
      } else if (data.type === 'notification_read') {
        set((state) => ({
          notifications: state.notifications.map(notif =>
            notif.id === data.notification.id ? data.notification : notif
          )
        }));
      } else if (data.type === 'all_notifications_read') {
        set((state) => ({
          notifications: state.notifications.map(notif => ({ ...notif, isRead: true })),
          unreadCount: 0
        }));
      }
    });

    // Admin channel for admin users
    if (currentUser.role === 'ADMIN') {
      adminChannel = pusherClient.subscribe('admin-notifications');
      adminChannel.bind('notification', (data: any) => {
        if (data.type === 'new_notification') {
          get().addNotification(data.notification);
        }
      });
    }
  },

  cleanupPusherSubscription: () => {
    if (userChannel) {
      const { currentUser } = get();
      if (currentUser) {
        pusherClient.unsubscribe(`user-${currentUser.id}`);
      }
      userChannel = null;
    }
    
    if (adminChannel) {
      pusherClient.unsubscribe('admin-notifications');
      adminChannel = null;
    }
  },
}));

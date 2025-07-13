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
let currentSubscribedUserId: string | null = null;

// Debounce mechanism to prevent rapid setCurrentUser calls
let setUserTimeout: NodeJS.Timeout | null = null;

// Track if pusher is connected to prevent multiple connections
let isPusherConnected = false;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  currentUser: null,

  // Actions
  setCurrentUser: (user: SafeUser | null) => {
    const state = get();
    const prevUser = state.currentUser;

    // Prevent infinite loops - only update if user actually changed
    if (prevUser?.id === user?.id) {
      return; // No change, exit early
    }

    // Clear any pending timeout
    if (setUserTimeout) {
      clearTimeout(setUserTimeout);
    }

    set({ currentUser: user });

    // Cleanup old subscriptions
    state.cleanupPusherSubscription();

    if (user) {
      // Debounce the setup to prevent rapid calls
      setUserTimeout = setTimeout(() => {
        const currentState = get();
        if (currentState.currentUser?.id === user.id) {
          currentState.setupPusherSubscription();
          currentState.fetchNotifications();
          currentState.fetchUnreadCount();
        }
        setUserTimeout = null;
      }, 100); // 100ms debounce
    } else {
      // Clear notifications when user logs out
      set({ notifications: [], unreadCount: 0 });
    }
  },

  fetchNotifications: async () => {
    const { currentUser, isLoading } = get();
    if (!currentUser || isLoading) return;

    try {
      set({ isLoading: true });
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        // Double check user hasn't changed during fetch
        const currentState = get();
        if (currentState.currentUser?.id === currentUser.id) {
          set({ notifications: data });
        }
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
        // Double check user hasn't changed during fetch
        const currentState = get();
        if (currentState.currentUser?.id === currentUser.id) {
          set({ unreadCount: data.unreadCount });
        }
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT'
      });
      if (response.ok) {
        set(state => ({
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
        method: 'PUT'
      });
      if (response.ok) {
        set(state => ({
          notifications: state.notifications.map(notif => ({ ...notif, isRead: true })),
          unreadCount: 0
        }));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },

  addNotification: (notification: Notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  },

  setupPusherSubscription: async () => {
    const { currentUser } = get();
    if (!currentUser) return;

    // Check if push notifications are enabled in admin settings
    try {
      const response = await fetch('/api/admin/settings/public');
      const settings = await response.json();
      if (!settings.pushNotifications) {
        return;
      }
    } catch (error) {
      console.error('Failed to check push notification settings:', error);
      // Continue with default behavior if settings check fails
    }

    // Prevent duplicate subscriptions for same user
    if (currentSubscribedUserId === currentUser.id && isPusherConnected) {
      return;
    }

    // Cleanup existing subscriptions first
    get().cleanupPusherSubscription();

    try {
      // User-specific channel
      userChannel = pusherClient.subscribe(`user-${currentUser.id}`);
      currentSubscribedUserId = currentUser.id;
      isPusherConnected = true;

      userChannel.bind('notification', (data: any) => {
        if (data.type === 'new_notification') {
          get().addNotification(data.notification);
        } else if (data.type === 'notification_read') {
          set(state => ({
            notifications: state.notifications.map(notif =>
              notif.id === data.notification.id ? data.notification : notif
            )
          }));
        } else if (data.type === 'all_notifications_read') {
          set(state => ({
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
    } catch (error) {
      console.error('Pusher subscription error:', error);
      isPusherConnected = false;
    }
  },

  cleanupPusherSubscription: () => {
    try {
      if (userChannel) {
        if (currentSubscribedUserId) {
          pusherClient.unsubscribe(`user-${currentSubscribedUserId}`);
        }
        userChannel.unbind_all();
        userChannel = null;
      }

      if (adminChannel) {
        pusherClient.unsubscribe('admin-notifications');
        adminChannel.unbind_all();
        adminChannel = null;
      }

      currentSubscribedUserId = null;
      isPusherConnected = false;
    } catch (error) {
      console.error('Pusher cleanup error:', error);
    }
  }
}));

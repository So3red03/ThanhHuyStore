'use client';

import React, { useState, useEffect, useRef } from 'react';
import { pusherClient } from '@/app/libs/pusher';
import { SafeUser } from '../../../types';
import NotificationPanel from '../components/admin/NotificationToast';
// AI Assistant system - event-driven business intelligence

interface useNotificationsProps {
  currentUser: SafeUser | null;
  forceShow?: boolean;
  onClose?: () => void;
}

interface AIAssistantNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'INFO' | 'WARNING' | 'URGENT' | 'CRITICAL';
  timestamp: Date;
  productId?: string;
  productName?: string;
  aiAssistant: boolean;
  eventType?: string;
  businessContext?: any;
  data?: any;
}

/**
 * AI-Powered Business Assistant System
 * Features:
 * - Real-time event-driven monitoring
 * - Persistent AI memory with escalation
 * - Smart business context awareness
 * - Intelligent notification prioritization
 * - Admin action tracking and learning
 * - Proactive business intelligence
 */
const useNotifications: React.FC<useNotificationsProps> = ({ currentUser, forceShow = false, onClose }) => {
  const [notificationQueue, setNotificationQueue] = useState<AIAssistantNotification[]>([]);
  const [currentNotifications, setCurrentNotifications] = useState<AIAssistantNotification[]>([]);
  const [isAIActive, setIsAIActive] = useState(false);
  const MAX_NOTIFICATIONS = 10;
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // REMOVED: Anti-spam logic moved to AIMemoryService for centralized control
  // All throttling and max reminder logic is now handled in the backend
  // This prevents conflicts and ensures consistent behavior

  // Check AI Assistant status
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return;
    }

    // Check AI Assistant status
    const checkAIStatus = async () => {
      try {
        const response = await fetch('/api/ai-assistant/monitor');
        const data = await response.json();
        setIsAIActive(data.success && data.data.isActive);
      } catch (error) {
        console.error('Failed to check AI Assistant status:', error);
        setIsAIActive(false);
      }
    };

    checkAIStatus();

    // Subscribe to real-time notifications
    const adminChannel = pusherClient.subscribe('admin-notifications');

    // Handle all admin notifications (both regular and AI)
    adminChannel.bind('notification', (data: any) => {
      if (data.type === 'new_notification') {
        const notification: AIAssistantNotification = {
          id: data.notification.id,
          type: data.notification.type,
          title: data.notification.title,
          message: data.notification.message,
          priority: data.notification.data?.priority || 'INFO',
          timestamp: data.notification.createdAt ? new Date(data.notification.createdAt) : new Date(),
          productId: data.notification.productId,
          productName: data.notification.data?.productName,
          aiAssistant: data.notification.data?.aiAssistant || false,
          eventType: data.notification.data?.eventType,
          businessContext: data.notification.data?.businessContext,
          data: data.notification.data
        };

        // Simplified: Just add notification to queue (backend handles anti-spam)
        setNotificationQueue(prev => [...prev, notification]);

        console.log(`✅ Notification received: ${notification.title} (${notification.priority})`);
      }
    });

    return () => {
      pusherClient.unsubscribe('admin-notifications');
      // Stop monitoring via API
      fetch('/api/ai-assistant/monitor', { method: 'DELETE' }).catch(console.error);

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

  const handleNotificationClick = (notification: AIAssistantNotification) => {
    // Record admin action for AI Assistant
    if (notification.aiAssistant && notification.data?.eventType) {
      fetch('/api/ai-assistant/monitor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId: `${notification.data.eventType}_${notification.productId || 'SYSTEM'}_${Date.now()}`,
          action: 'clicked'
        })
      }).catch(error => console.error('Failed to record admin action:', error));
    }

    // Smart navigation based on AI context
    if (notification.aiAssistant && notification.productId) {
      window.location.href = `/admin/manage-products?highlight=${notification.productId}&aiContext=${notification.data?.eventType}`;
      return;
    }

    // Traditional navigation
    switch (notification.type) {
      case 'ORDER_PLACED':
        window.location.href = '/admin/manage-orders';
        break;
      case 'LOW_STOCK':
      case 'SYSTEM_ALERT':
        if (notification.productId) {
          window.location.href = `/admin/manage-products?highlight=${notification.productId}`;
        } else {
          window.location.href = '/admin/manage-products';
        }
        break;
      case 'COMMENT_RECEIVED':
        window.location.href = '/admin/manage-articles';
        break;
      default:
        window.location.href = '/admin';
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
      {/* AI Assistant Control Panel - Only for Admin */}
      {currentUser?.role === 'ADMIN' && (
        <div className='fixed bottom-4 right-4 z-50 flex flex-col gap-2'>
          {/* AI Assistant Status - Simplified */}
          <div
            className={`
            px-3 py-2 rounded-lg shadow-lg text-xs font-medium transition-all duration-200
            ${
              isAIActive
                ? 'bg-gradient-to-r from-purple-500 via-pink-400 to-blue-500 text-white'
                : 'bg-gray-400 text-gray-700'
            }
          `}
          >
            🤖 AI Assistant: {isAIActive ? 'ACTIVE' : 'INACTIVE'}
          </div>
        </div>
      )}

      {/* AI Assistant Notification Panel */}
      {shouldShowNotifications && (
        <NotificationPanel
          notifications={currentNotifications.map(notification => ({
            id: notification.id,
            type: notification.type as any,
            title: notification.title,
            message: notification.message,
            createdAt: notification.timestamp ? notification.timestamp.toISOString() : new Date().toISOString(),
            avatar: undefined,
            data: notification.data,
            isRead: false,
            priority: notification.priority,
            aiAssistant: notification.aiAssistant,
            productName: notification.productName
          }))}
          onClose={handleNotificationClose}
          onNotificationClick={handleNotificationClick}
          duration={8000}
          disableAutoDismiss={forceShow}
          isLoading={forceShow && currentNotifications.length === 0}
        />
      )}
    </>
  );
};

export default useNotifications;

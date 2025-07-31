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
  const [aiMemories, setAiMemories] = useState<any[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<Map<string, any>>(new Map());
  const [processedNotificationIds, setProcessedNotificationIds] = useState<Set<string>>(new Set());
  const [debugMode, setDebugMode] = useState(false);
  const MAX_NOTIFICATIONS = 10;
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // REMOVED: Anti-spam logic moved to AIMemoryService for centralized control
  // All throttling and max reminder logic is now handled in the backend
  // This prevents conflicts and ensures consistent behavior

  // Initialize AI Assistant System
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      return;
    }

    // Start AI Assistant monitoring
    const initializeAIAssistant = async () => {
      try {
        // Start monitoring via API
        await fetch('/api/ai-assistant/monitor', { method: 'POST' });
        setIsAIActive(true);

        // Load existing AI memories
        try {
          const memories = await fetch('/api/ai-assistant/monitor').then(res => res.json());
          if (memories.success) {
            setAiMemories(memories.data.memories || []);
          }
        } catch (error) {
          console.error('Failed to load AI memories:', error);
        }

        console.log('🤖 AI Business Assistant initialized');
      } catch (error) {
        console.error('Failed to initialize AI Assistant:', error);
        setIsAIActive(false);
      }
    };

    initializeAIAssistant();

    // Subscribe to real-time notifications
    const adminChannel = pusherClient.subscribe('admin-notifications');

    // Handle AI Assistant notifications with anti-spam
    adminChannel.bind('notification', (data: any) => {
      if (data.type === 'new_notification' && data.notification.type !== 'MESSAGE_RECEIVED') {
        const notification: AIAssistantNotification = {
          id: data.notification.id,
          type: data.notification.type,
          title: data.notification.title,
          message: data.notification.message,
          priority: data.notification.data?.priority || 'INFO',
          timestamp: new Date(data.notification.createdAt),
          productId: data.notification.productId,
          productName: data.notification.data?.productName,
          aiAssistant: data.notification.data?.aiAssistant || false,
          eventType: data.notification.data?.eventType,
          businessContext: data.notification.data?.businessContext,
          data: data.notification.data
        };

        // Check for duplicate notifications by ID first
        if (processedNotificationIds.has(notification.id)) {
          if (debugMode) {
            console.log(`🔄 Duplicate notification blocked: ${notification.id} - ${notification.title}`);
          }
          return;
        }

        // Mark notification as processed
        setProcessedNotificationIds(prev => new Set([...prev, notification.id]));

        // Apply anti-spam logic for AI notifications
        if (notification.aiAssistant && notification.data?.eventType) {
          const alertKey = `${notification.data.eventType}_${notification.productId || 'SYSTEM'}`;

          // SIMPLIFIED: All anti-spam logic is now handled in backend
          // Just show the notification since backend already filtered it
          setNotificationQueue(prev => [...prev, notification]);

          // Update notification history for tracking
          setNotificationHistory(
            prev =>
              new Map(
                prev.set(alertKey, {
                  timestamp: notification.timestamp,
                  count: (prev.get(alertKey)?.count || 0) + 1,
                  priority: notification.priority
                })
              )
          );

          // Only log important notifications or when debug mode is on
          if (debugMode || notification.priority === 'CRITICAL' || notification.priority === 'URGENT') {
            console.log(`✅ AI notification received: ${alertKey} (${notification.priority})`);
          }

          // Record admin action
          fetch('/api/ai-assistant/monitor', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              alertId: alertKey,
              action: 'viewed'
            })
          }).catch(error => console.error('Failed to record admin action:', error));
        } else {
          // Non-AI notifications pass through normally
          setNotificationQueue(prev => [...prev, notification]);
        }
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

  // AI Assistant Status Management
  const toggleAIAssistant = async () => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;

    try {
      if (isAIActive) {
        await fetch('/api/ai-assistant/monitor', { method: 'DELETE' });
        setIsAIActive(false);
        // Clear notification history and processed IDs when deactivating
        setNotificationHistory(new Map());
        setProcessedNotificationIds(new Set());
        console.log('🤖 AI Assistant deactivated');
      } else {
        await fetch('/api/ai-assistant/monitor', { method: 'POST' });
        setIsAIActive(true);
        console.log('🤖 AI Assistant activated');
      }
    } catch (error) {
      console.error('Error toggling AI Assistant:', error);
    }
  };

  // Reset anti-spam history (for admin use)
  const resetAntiSpamHistory = () => {
    setNotificationHistory(new Map());
    setProcessedNotificationIds(new Set());
    console.log('🔄 Anti-spam history and processed IDs reset');
  };

  // Load AI memories for display
  const refreshAIMemories = async () => {
    try {
      const response = await fetch('/api/ai-assistant/monitor');
      const data = await response.json();
      if (data.success) {
        setAiMemories(data.data.memories || []);
      }
    } catch (error) {
      console.error('Error refreshing AI memories:', error);
    }
  };

  // Periodic refresh of AI memories and cleanup
  useEffect(() => {
    if (!isAIActive) return;

    const interval = setInterval(() => {
      refreshAIMemories();

      // Clean up old notification history (older than 24 hours)
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      setNotificationHistory(prev => {
        const cleaned = new Map();
        prev.forEach((value, key) => {
          if (value.timestamp.getTime() > oneDayAgo) {
            cleaned.set(key, value);
          }
        });
        return cleaned;
      });

      // Clean up processed notification IDs (keep only last 1000 to prevent memory leak)
      setProcessedNotificationIds(prev => {
        if (prev.size > 1000) {
          const array = Array.from(prev);
          return new Set(array.slice(-500)); // Keep last 500 IDs
        }
        return prev;
      });
    }, 5 * 60 * 1000); // Every 5 minutes to reduce API calls

    return () => clearInterval(interval);
  }, [isAIActive]);

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
          {/* AI Assistant Status */}
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

          {/* Toggle Button */}
          <button
            onClick={toggleAIAssistant}
            className={`
              px-4 py-2 rounded-lg shadow-lg font-medium text-sm transition-all duration-200
              ${
                isAIActive
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:shadow-xl'
                  : 'bg-gradient-to-r from-purple-500 via-pink-400 to-blue-500 text-white hover:from-purple-600 hover:via-pink-500 hover:to-blue-600 hover:shadow-xl'
              }
            `}
            title={isAIActive ? 'Tắt AI Assistant' : 'Bật AI Assistant'}
          >
            {isAIActive ? '⏹️ Tắt AI' : '▶️ Bật AI'}
          </button>

          {/* AI Memories Count */}
          {isAIActive && aiMemories.length > 0 && (
            <div className='px-3 py-1 bg-gradient-to-r from-purple-500 via-pink-400 to-blue-500 text-white rounded-lg text-xs text-center shadow-lg'>
              {aiMemories.length} vấn đề đang theo dõi
            </div>
          )}

          {/* Anti-Spam Status */}
          {isAIActive && notificationHistory.size > 0 && (
            <button
              onClick={resetAntiSpamHistory}
              className='px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-xs text-center shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-200'
              title='Click to reset anti-spam history'
            >
              🚫 Anti-spam: {notificationHistory.size} tracked
            </button>
          )}

          {/* Debug Mode Toggle */}
          {isAIActive && currentUser?.role === 'ADMIN' && (
            <button
              onClick={() => setDebugMode(!debugMode)}
              className={`px-3 py-1 rounded-lg text-xs text-center shadow-lg transition-all duration-200 ${
                debugMode
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700'
                  : 'bg-gray-400 text-gray-700 hover:bg-gray-500'
              }`}
              title={debugMode ? 'Disable debug logs' : 'Enable debug logs'}
            >
              🐛 Debug: {debugMode ? 'ON' : 'OFF'}
            </button>
          )}
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
            timestamp: notification.timestamp,
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

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { pusherClient } from '@/app/libs/pusher';
import { SafeUser } from '../../../types';
import NotificationPanel from '../components/admin/NotificationToast';

interface useNotificationsProps {
  currentUser: SafeUser | null;
  forceShow?: boolean;
  onClose?: () => void;
}

interface AINotificationData {
  aiRecommendation?: boolean;
  reasoning?: string;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence?: number;
  suggestedAction?: any;
  expectedImpact?: string;
  productId?: string;
  productName?: string;
}

/**
 * Centralized notification system for admin panel
 * Handles real-time notifications and messages with professional UX
 * Features:
 * - Real-time Pusher integration
 * - Smart notification queuing
 * - Auto-dismiss with hover pause
 * - Professional toast animations
 * - AI-powered product recommendations
 * - Sound notifications (optional)
 */
const useNotifications: React.FC<useNotificationsProps> = ({ currentUser, forceShow = false, onClose }) => {
  const [notificationQueue, setNotificationQueue] = useState<any[]>([]);
  const [currentNotifications, setCurrentNotifications] = useState<any[]>([]);
  const [isRunningAI, setIsRunningAI] = useState(false);
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
      case 'PROMOTION_SUGGESTION':
      case 'VOUCHER_SUGGESTION':
        // AI suggestions - navigate to product management with specific product
        if (notification.data?.productId) {
          window.location.href = `/admin/manage-products?highlight=${notification.data.productId}`;
        } else {
          window.location.href = '/admin/manage-products';
        }
        break;
      case 'SYSTEM_ALERT':
        // Check if it's an AI recommendation
        if (notification.data?.aiRecommendation) {
          if (notification.data.productId) {
            window.location.href = `/admin/manage-products?highlight=${notification.data.productId}`;
          } else {
            window.location.href = '/admin/manage-products';
          }
        } else {
          // Regular system alert - go to dashboard
          window.location.href = '/admin';
        }
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

  // Function to run AI analysis manually
  const runAIAnalysis = async () => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      return;
    }

    setIsRunningAI(true);
    try {
      const response = await fetch('/api/ai/analyze-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        // Show success notification
        const successNotification = {
          id: `ai-success-${Date.now()}`,
          type: 'SYSTEM_ALERT',
          title: '🤖 AI Analysis Hoàn thành',
          message: `Đã phân tích ${result.data.productsAnalyzed} sản phẩm, tạo ${result.data.recommendationsGenerated} đề xuất`,
          timestamp: new Date(),
          data: {
            aiAnalysis: true,
            ...result.data
          }
        };

        setNotificationQueue(prev => [...prev, successNotification]);
      } else {
        throw new Error(result.error || 'AI analysis failed');
      }
    } catch (error) {
      console.error('AI Analysis error:', error);

      // Show error notification
      const errorNotification = {
        id: `ai-error-${Date.now()}`,
        type: 'SYSTEM_ALERT',
        title: '❌ AI Analysis Lỗi',
        message: 'Không thể chạy phân tích AI. Vui lòng thử lại sau.',
        timestamp: new Date(),
        data: { aiAnalysis: true, error: true }
      };

      setNotificationQueue(prev => [...prev, errorNotification]);
    } finally {
      setIsRunningAI(false);
    }
  };

  // Auto-run AI analysis every 6 hours for admin users
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;

    const runPeriodicAI = () => {
      const now = new Date();
      const hour = now.getHours();

      // Run at 6:00, 12:00, 18:00, 00:00
      if ([0, 6, 12, 18].includes(hour) && now.getMinutes() < 5) {
        console.log('🤖 Running scheduled AI analysis...');
        runAIAnalysis();
      }
    };

    // Check every 5 minutes
    const interval = setInterval(runPeriodicAI, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentUser]);

  // Don't render if user not authorized
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
    return null;
  }

  // Only show when forceShow is true or there are notifications
  const shouldShowNotifications = forceShow || currentNotifications.length > 0;

  return (
    <>
      {/* AI Analysis Button - Only for Admin */}
      {currentUser?.role === 'ADMIN' && (
        <div className='fixed bottom-4 right-4 z-50'>
          <button
            onClick={runAIAnalysis}
            disabled={isRunningAI}
            className={`
              px-4 py-2 rounded-lg shadow-lg font-medium text-sm transition-all duration-200
              ${
                isRunningAI
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 hover:shadow-xl'
              }
            `}
            title='Chạy phân tích AI để tạo đề xuất thông minh'
          >
            {isRunningAI ? (
              <>
                <span className='animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2'></span>
                Đang phân tích...
              </>
            ) : (
              <>🤖 AI Analysis</>
            )}
          </button>
        </div>
      )}

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

export default useNotifications;

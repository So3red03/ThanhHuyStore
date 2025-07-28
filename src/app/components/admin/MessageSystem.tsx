'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SafeUser } from '../../../../types';
import { pusherClient } from '@/app/libs/pusher';
import MessageToast from './MessageToast';
import axios from 'axios';

interface MessageSystemProps {
  currentUser: SafeUser | null;
  forceShow?: boolean;
  onClose?: () => void;
}

interface Message {
  id: string;
  senderName: string;
  content: string;
  avatar: string;
  timestamp: Date;
  hasImage: boolean;
  chatroomId: string;
  isRead: boolean;
}

const MessageSystem: React.FC<MessageSystemProps> = ({ currentUser, forceShow = false, onClose }) => {
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [messageQueue, setMessageQueue] = useState<Message[]>([]);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Setup Pusher for real-time messages
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      return;
    }

    const messageChannel = pusherClient.subscribe('admin-messages');

    messageChannel.bind('new-message', (data: any) => {
      const newMessage: Message = {
        id: data.message.id,
        senderName: data.message.sender?.name || 'Người dùng',
        content: data.message.content || 'Tin nhắn mới',
        avatar: data.message.sender?.image || '/no-avatar-2.jpg',
        timestamp: new Date(data.message.createdAt),
        hasImage: !!data.message.image,
        chatroomId: data.message.chatroomId || data.message.id,
        isRead: false
      };

      // Update current messages - move conversation to top if exists, or add new
      setCurrentMessages(prev => {
        const existingIndex = prev.findIndex(msg => msg.chatroomId === newMessage.chatroomId);

        if (existingIndex >= 0) {
          // Update existing conversation and move to top
          const updated = [...prev];
          updated[existingIndex] = { ...newMessage };
          return [updated[existingIndex], ...updated.filter((_, i) => i !== existingIndex)];
        } else {
          // Add new conversation at top
          return [newMessage, ...prev.slice(0, 4)]; // Keep max 5
        }
      });

      setMessageQueue(prev => [...prev, newMessage]);
    });

    return () => {
      pusherClient.unsubscribe('admin-messages');
    };
  }, [currentUser]);

  // Process message queue
  useEffect(() => {
    if (messageQueue.length > 0) {
      // Clear existing timeout
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }

      // Add new messages to current list (max 5)
      setCurrentMessages(prev => {
        const combined = [...prev, ...messageQueue];
        return combined.slice(-5); // Keep latest 5
      });

      // Clear the queue
      setMessageQueue([]);

      // Auto-dismiss after 8 seconds
      messageTimeoutRef.current = setTimeout(() => {
        setCurrentMessages([]);
      }, 8000);
    }

    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, [messageQueue]);

  const handleMessageClick = (chatroomId: string) => {
    window.location.href = `/admin/chat/${chatroomId}`;
    // Close the toast
    setCurrentMessages([]);
    if (onClose) {
      onClose();
    }
  };

  const handleClose = () => {
    setCurrentMessages([]);
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    // Call external onClose if provided (for forceShow)
    if (onClose) {
      onClose();
    }
  };

  // Handle forceShow - fetch existing conversations (ChatList style)
  useEffect(() => {
    if (forceShow && currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'STAFF')) {
      const fetchConversations = async () => {
        try {
          // Fetch conversations with latest messages using new API
          const response = await axios.get('/api/conversations?limit=5');
          const data = response.data;

          if (data.conversations && Array.isArray(data.conversations)) {
            // Transform conversations to MessageToast format - exactly like ChatList dashboard mode
            const conversations = data.conversations.map((conv: any) => {
              const latestMessage = conv.messages[0]; // API returns latest message first
              const otherUser = conv.users.find((u: any) => u.id !== currentUser.id);

              // Calculate unread count like ChatList
              const unreadCount = conv.messages.filter(
                (msg: any) => !msg.seenIds?.includes(currentUser.id) && msg.sender?.id !== currentUser.id
              ).length;

              // Format message text like ChatList
              let messageText = 'Tin nhắn mới';
              if (latestMessage) {
                if (latestMessage.image) {
                  messageText = '📷 Hình ảnh';
                } else if (latestMessage.body) {
                  messageText = latestMessage.body;
                }
              }

              return {
                id: conv.id,
                senderName: otherUser?.name || 'Người dùng',
                content: messageText,
                avatar: otherUser?.image || '/no-avatar-2.jpg',
                timestamp: new Date(latestMessage?.createdAt || conv.lastMessageAt),
                hasImage: !!latestMessage?.image,
                chatroomId: conv.id,
                isRead: unreadCount === 0 // Read if no unread messages
              };
            });

            setCurrentMessages(conversations);
          }
        } catch (error) {
          console.error('Error fetching conversations:', error);
          // Fallback to old API if conversations API doesn't exist
          try {
            const response = await axios.get('/api/notifications/messages');
            const data = response.data;
            if (data.notifications && Array.isArray(data.notifications)) {
              const messages = data.notifications.slice(0, 5).map((msg: any) => ({
                id: msg.id,
                senderName: msg.sender?.name || 'Người dùng',
                content: msg.body || msg.content || 'Tin nhắn mới',
                avatar: msg.sender?.image || '/no-avatar-2.jpg',
                timestamp: new Date(msg.createdAt),
                hasImage: !!msg.image,
                chatroomId: msg.chatroomId || msg.id,
                isRead: msg.isRead || false
              }));
              setCurrentMessages(messages);
            }
          } catch (fallbackError) {
            console.error('Error fetching messages fallback:', fallbackError);
          }
        }
      };
      fetchConversations();
    } else if (!forceShow && messageQueue.length === 0) {
      setCurrentMessages([]);
    }
  }, [forceShow, currentUser, messageQueue.length]);

  // Don't render if user not authorized
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
    return null;
  }

  // Show instant UI when forceShow is true, even if no messages yet
  if (!forceShow && currentMessages.length === 0) {
    return null;
  }

  return (
    <MessageToast
      messages={currentMessages}
      onClose={handleClose}
      onMessageClick={handleMessageClick}
      duration={8000}
      disableAutoDismiss={forceShow}
      isLoading={forceShow && currentMessages.length === 0}
    />
  );
};

export default MessageSystem;

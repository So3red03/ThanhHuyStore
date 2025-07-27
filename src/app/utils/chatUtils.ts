import { MessageType } from '../../../types';

/**
 * Calculate unread message count for a conversation
 * @param messages - Array of messages in the conversation
 * @param currentUserId - ID of the current user
 * @returns Number of unread messages
 */
export function calculateUnreadCount(messages: MessageType[], currentUserId: string): number {
  if (!messages || !currentUserId) return 0;
  
  return messages.filter(message => {
    // Don't count own messages as unread
    if (message.senderId === currentUserId) return false;
    
    // Check if current user has seen this message
    return !message.seenIds.includes(currentUserId);
  }).length;
}

/**
 * Get the last message from a conversation
 * @param messages - Array of messages
 * @returns Last message or null
 */
export function getLastMessage(messages: MessageType[]): MessageType | null {
  if (!messages || messages.length === 0) return null;
  return messages[messages.length - 1];
}

/**
 * Format last message text for display
 * @param lastMessage - The last message
 * @param currentUserEmail - Current user's email
 * @returns Formatted message text
 */
export function formatLastMessageText(
  lastMessage: MessageType | null, 
  currentUserEmail: string | null | undefined
): string {
  if (!lastMessage) return 'Chưa có tin nhắn';
  
  const isOwnMessage = lastMessage.sender?.email === currentUserEmail;
  return isOwnMessage ? `Bạn: ${lastMessage.body || ''}` : lastMessage.body || '';
}

/**
 * Check if a message is unread by current user
 * @param message - The message to check
 * @param currentUserId - Current user's ID
 * @returns True if message is unread
 */
export function isMessageUnread(message: MessageType, currentUserId: string): boolean {
  if (message.senderId === currentUserId) return false;
  return !message.seenIds.includes(currentUserId);
}

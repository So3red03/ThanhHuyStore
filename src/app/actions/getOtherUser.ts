import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { User } from '@prisma/client';
import { ChatRoomType } from '../../../types';

export function useOtherUser(conversation: ChatRoomType | { users: User[] }) {
  const { data: session } = useSession();

  const otherUser = useMemo(() => {
    if (!conversation || !conversation.users || conversation.users.length === 0) {
      return null;
    }

    const currentUserEmail = session?.user?.email;

    // Simple logic for 1-1 chat: if we have 2 users, return the one that's not current user
    if (conversation.users.length === 2) {
      if (!currentUserEmail) {
        // If session not loaded yet, return the second user (index 1) instead of first
        return conversation.users[1] || conversation.users[0];
      }

      // Find the user that is NOT the current user
      const otherUser = conversation.users.find(user => user.email !== currentUserEmail);

      if (otherUser) {
        return otherUser;
      }

      // Fallback: if somehow we can't find other user, return the second one
      return conversation.users[1] || conversation.users[0];
    }

    // For group chats (more than 2 users), use original logic
    if (!currentUserEmail) {
      return conversation.users[0]; // Fallback
    }

    const filteredUsers = conversation.users.filter(user => user.email !== currentUserEmail);
    return filteredUsers[0] || conversation.users[0];
  }, [session?.user?.email, conversation]);

  return otherUser;
}

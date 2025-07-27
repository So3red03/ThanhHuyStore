'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import Avatar from './Avatar';
import UnreadBadge from './UnreadBadge';
import { format } from 'date-fns';
import { ChatRoomType } from '../../../../../types';
import { useSession } from 'next-auth/react';
import { useOtherUser } from '@/app/actions/getOtherUser';
import { User } from '@prisma/client';
import { calculateUnreadCount, formatLastMessageText, getLastMessage } from '@/app/utils/chatUtils';

interface ChatBoxProps {
  conversation: ChatRoomType;
  userInSession: User;
  selected?: boolean;
  onClick: () => void;
}
const ChatBox: React.FC<ChatBoxProps> = ({ conversation, selected, userInSession, onClick }) => {
  const [isLoading, setIsLoading] = useState(false);
  // Dùng session phải khai báo provider xử lý bên phía client
  const session = useSession();
  const router = useRouter();
  // Hàm này trả về các user có conversation với currentUser nên có vẻ k cần dùng
  // const otherUser = getOtherUser(conversation);
  const handleClick = useCallback(() => {
    onClick();
    if (conversation) {
      return router.push(`/admin/chat/${conversation?.id}`);
    }
    axios
      .post('/api/conversation', { userId: userInSession?.id })
      .then(response => {
        router.push(`/admin/chat/${response.data.id}`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [conversation, userInSession?.id, router, onClick]);

  const { lastMessage, lastMessageText, unreadCount } = useMemo(() => {
    const messages = conversation?.messages || [];
    const lastMessage = getLastMessage(messages);
    const lastMessageText = formatLastMessageText(lastMessage, session?.data?.user?.email);

    // Calculate unread count for current admin user
    const unreadCount = calculateUnreadCount(messages, userInSession.id);

    return { lastMessage, lastMessageText, unreadCount };
  }, [conversation?.messages, session?.data?.user?.email, userInSession.id]);

  const userEmail = useMemo(() => {
    return session?.data?.user?.email;
  }, [session?.data?.user?.email]);

  const hasSeen = useMemo(() => {
    if (!lastMessage) {
      return false;
    }
    const seenArray = lastMessage.seen || [];

    if (!userEmail) {
      return false;
    }
    return seenArray.filter(user => user.email === userEmail).length !== 0;
  }, [lastMessage, userEmail]);

  return (
    <div
      onClick={handleClick}
      className={`w-full relative flex items-center space-x-3 p-3 px-4 hover:bg-neutral-100 transition-colors cursor-pointer ${
        selected ? 'bg-neutral-100' : 'bg-white'
      } ${unreadCount > 0 ? 'border-l-4 border-blue-500' : ''}`}
    >
      {/* Avatar with Unread Badge */}
      <div className='relative'>
        <Avatar user={userInSession} />
        {unreadCount > 0 && (
          <div className='absolute -top-1 -right-1'>
            <UnreadBadge count={unreadCount} size='sm' />
          </div>
        )}
      </div>

      <div className='flex-1 min-w-0'>
        <div className='focus:outline-none'>
          <div className='flex justify-between items-center mb-1'>
            <p className={`text-sm font-medium truncate ${unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
              {userInSession.name}
            </p>
            {lastMessage?.createdAt && (
              <p
                className={`text-xs font-light ml-2 flex-shrink-0 ${
                  unreadCount > 0 ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                {format(new Date(lastMessage.createdAt), 'p')}
              </p>
            )}
          </div>
          <p
            className={`truncate text-sm ${
              unreadCount > 0 ? 'text-gray-900 font-medium' : hasSeen ? 'text-gray-500' : 'text-gray-500 font-semibold'
            }`}
          >
            {lastMessageText}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;

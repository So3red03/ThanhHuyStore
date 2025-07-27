'use client';

import { User } from '@prisma/client';
import ChatBox from './ChatBox';
import { ChatRoomType } from '../../../../../types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { pusherClient } from '@/app/libs/pusher';
import Link from 'next/link';
import Image from 'next/image';
import moment from 'moment';
import { MdSearch } from 'react-icons/md';

interface ChatListProps {
  conversations: ChatRoomType[];
  userInSession: User[];
  dashboard?: boolean;
}
const ChatList: React.FC<ChatListProps> = ({ conversations, userInSession, dashboard }) => {
  const [users, setUser] = useState(userInSession);
  const [conversation, setConversation] = useState<any>();
  const [isSelectedChatBox, setIsSelectedChatBox] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleChatBoxClick = useCallback((userId: string) => {
    setIsSelectedChatBox(userId);
  }, []);

  const session = useSession();
  const pusherKey = useMemo(() => {
    return session?.data?.user?.email;
  }, [session?.data?.user?.email]);

  useEffect(() => {
    if (!pusherKey) {
      return;
    }
    // Đăng ký kênh Pusher cho phòng trò chuyện và lắng nghe các chatlist mới.
    pusherClient.subscribe(pusherKey);

    // Hàm xử lý khi có chatlist mới.
    const newHandler = (newConversation: ChatRoomType) => {
      // Cập nhật thêm chatbox mới nếu không tìm thấy chatbox này nằm trong chatlist
      setUser((currentConv: any) => {
        if (currentConv.find((c: any) => c?.id === newConversation?.id)) {
          return currentConv;
        }
        return [...currentConv, newConversation];
      });
    };
    // Hàm xử lý khi có cập nhật hội thoại
    const updateHandler = (conversation: ChatRoomType) => {
      // @ts-ignore
      setUser(currentConversation =>
        currentConversation.map((currentConv: any) => {
          if (currentConv?.id === conversation?.id) {
            return {
              ...currentConv,
              messages: conversation?.messages
            };
          }
          return currentConv;
        })
      );
    };

    // Lắng nghe sự kiện messages:new từ Pusher và gọi messageHandler khi có tin nhắn mới.
    pusherClient.bind('conversation:new', newHandler);
    pusherClient.bind('conversation:update', updateHandler);

    // Hàm clean up
    return () => {
      pusherClient.unbind('conversation:new', newHandler);
      pusherClient.unbind('conversation:update', updateHandler);
      pusherClient.unsubscribe(pusherKey);
    };
  }, [pusherKey, users]);

  const { lastMessage, lastMessageText } = useMemo(() => {
    // Lấy tất cả dữ liệu của mess
    const messages = conversation?.messages || [];
    // Lấy mess cuối
    const lastMessage = messages[messages.length - 1];
    let lastMessageText = 'Chưa có tin nhắn';
    if (lastMessage) {
      const isOwnMessage = lastMessage?.sender?.email === session?.data?.user?.email;

      lastMessageText = isOwnMessage ? `Bạn: ${lastMessage.body || ''}` : lastMessage.body || '';
    }

    return { lastMessage, lastMessageText };
  }, [conversation?.messages, session?.data?.user?.email]);

  // Filter users dựa trên search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return users;
    }
    return users.filter(
      user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  // Tìm ra chatroom dựa trên user
  const renderConversations = useMemo(() => {
    return filteredUsers.map(user => {
      const conversation = conversations.find(conv => conv?.users.some(u => u.id === user.id));
      return { user, conversation };
    });
  }, [filteredUsers, conversations]);

  return (
    <>
      {dashboard ? (
        renderConversations.map(({ user, conversation }) => {
          return (
            <Link
              key={user.id}
              className='flex items-center gap-5 py-3 dark:hover:bg-meta-4 hover:bg-neutral-100 rounded-lg w-full px-6'
              href={`/admin/chat/${conversation?.id}`}
            >
              <div className='relative h-[52px] w-[52px] rounded-full'>
                <Image
                  src={user.image || '/no-avatar-2.jpg'}
                  fill
                  sizes='100%'
                  className='rounded-full object-cover'
                  alt={user.name || user.email}
                />
                <span
                  className='absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full border-2 border-white'
                  style={{ backgroundColor: 'rgb(16, 185, 129)' }}
                />
              </div>
              <div className='flex flex-1 items-center justify-between'>
                <div>
                  <h5 className='font-medium'>{user.name}</h5>
                  <p>
                    <span className='text-sm'>{lastMessageText}</span>
                    {lastMessage?.createdAt && (
                      <span className='text-xs ml-3'>{moment(lastMessage.createdAt).fromNow()}</span>
                    )}
                  </p>
                </div>
                {/* {user.unreadCount > 0 && (
								<div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500">
									<span className="text-sm font-medium text-white">{user.unreadCount}</span>
								</div>
							)} */}
              </div>
            </Link>
          );
        })
      ) : (
        <aside className='relative inset-y-0 lg:w-80 md:w-4/12 lg:block overflow-y-auto border-r border-gray-300 block w-full h-full'>
          <div className='flex items-center py-4 pb-[14px] border-b border-b-gray-300 px-3'>
            <div className='relative ml-4 flex-1'>
              <MdSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' size={20} />
              <input
                type='text'
                placeholder='Tìm kiếm trên Messenger...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-10 pr-4 py-2 w-full border rounded-lg transition duration-300 focus:border-blue-500 focus:outline-none bg-white'
              />
            </div>
          </div>
          <div className='overflow-y-auto'>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => {
                const conversation = conversations.find(conv => conv?.users.some(u => u.id === user.id));
                const isSelected = user.id === isSelectedChatBox;

                return (
                  <ChatBox
                    key={user.id}
                    userInSession={user}
                    conversation={conversation}
                    selected={isSelected}
                    onClick={() => handleChatBoxClick(user.id)}
                  />
                );
              })
            ) : (
              <div className='p-4 text-center text-gray-500'>
                <p>Không tìm thấy người dùng nào</p>
                <p className='text-sm'>Thử tìm kiếm với từ khóa khác</p>
              </div>
            )}
          </div>
        </aside>
      )}
    </>
  );
};

export default ChatList;

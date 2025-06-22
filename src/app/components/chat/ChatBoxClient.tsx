'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { MessageType, SafeUser } from '../../../../types';
import axios from 'axios';
import Body from '../admin/chat/Body';
import Image from 'next/image';
import { FaUser, FaVolumeUp } from 'react-icons/fa';
import { FaRobot } from 'react-icons/fa6';
import ChatBaseBot from './ChatbaseBot';

interface ChatBoxClientProps {
  currentUser: SafeUser | null | undefined;
}

const ChatBoxClient: React.FC<ChatBoxClientProps> = ({ currentUser }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isButtonHidden, setIsButtonHidden] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<MessageType[]>();
  const [chatRoomId, setChatRoomId] = useState<string>();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAiChat, setIsAiChat] = useState(true); // Mặc định hiển thị AI chat
  const [chatbotEnabled, setChatbotEnabled] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, setValue } = useForm<FieldValues>();

  const toggleChat = () => {
    if (isChatOpen) {
      setIsChatOpen(false);
      setTimeout(() => {
        setIsButtonHidden(false);
      }, 700); // Thời gian chờ để button hiện lại sau khi chatbox trượt xuống
    } else {
      setIsButtonHidden(true);
      setIsChatOpen(true);
    }
  };

  // Check chatbot settings from admin
  useEffect(() => {
    const checkChatbotSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings/public');
        const settings = await response.json();
        setChatbotEnabled(settings.chatbotSupport ?? false);
      } catch (error) {
        console.error('Failed to check chatbot settings:', error);
        setChatbotEnabled(false);
      }
    };

    checkChatbotSettings();
  }, []);

  useEffect(() => {
    const getChatRoomId = async () => {
      try {
        const response = await axios.post('/api/conversation', { userId: '6672c8928fd20efba9fafee4' });
        const { id: chatRoomId } = response.data;
        localStorage.setItem('chatRoomId', chatRoomId);
        loadMessages(chatRoomId); // Lấy tin nhắn sau khi có chatRoomId
        setChatRoomId(chatRoomId);
      } catch (error) {
        console.error('Error getting or creating chat room:', error);
      }
    };

    const savedChatRoomId = localStorage.getItem('chatRoomId');
    if (savedChatRoomId) {
      loadMessages(savedChatRoomId); // Lấy tin nhắn nếu có sẵn chatRoomId
      setChatRoomId(savedChatRoomId);
    } else {
      getChatRoomId();
    }

    // Listen for custom event to open chat box
    const handleOpenChatBox = (event: CustomEvent) => {
      setIsButtonHidden(true);
      setIsChatOpen(true);
      // Giữ nguyên AI chat mode khi mở từ external event
      // setIsAiChat(false); // Removed - keep default AI chat

      // Set the message if provided (chỉ áp dụng cho admin chat)
      if (event.detail?.message && !isAiChat) {
        setValue('message', event.detail.message);
      }
    };

    window.addEventListener('openChatBox', handleOpenChatBox as EventListener);

    return () => {
      window.removeEventListener('openChatBox', handleOpenChatBox as EventListener);
    };
  }, [setValue]);

  // Hàm để tải tin nhắn
  const loadMessages = async (chatroomId: string) => {
    try {
      const response = await axios.get(`/api/messages/${chatroomId}`);
      bottomRef?.current?.scrollIntoView();
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    setValue('message', '');
    try {
      setIsLoading(true);
      await axios.post('/api/messages', {
        ...data,
        chatRoomId
      });
    } catch (error) {
      console.error('Error posting message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  // Cuộn xuống cuối cùng khi tin nhắn thay đổi
  useEffect(() => {
    //{behavior: ''}
    bottomRef?.current?.scrollIntoView();
  }, [messages]);

  // Don't render if chatbot is disabled
  if (!chatbotEnabled) {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <div
        className={`fixed text-sm bottom-0 right-4 bg-slate-700 text-white px-4 py-1 flex items-center rounded-t-xl cursor-pointer shadow-lg z-20 transition-transform ${
          isButtonHidden ? 'transform translate-y-full' : 'transform translate-y-0'
        }`}
        style={{ width: '320px' }}
        onClick={toggleChat}
      >
        <svg
          className='MuiSvgIcon-root MuiSvgIcon-fontSizeSmall css-1f872uo text-white w-5 h-5'
          focusable='false'
          aria-hidden='true'
          viewBox='0 0 24 24'
          data-testid='ForumIcon'
          fill='currentColor'
        >
          <path d='M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z'></path>
        </svg>
        <span className='ml-2'>Tư vấn AI - Giải đáp mọi thắc mắc</span>
      </div>

      {/* Chat Box */}
      <div
        className={`fixed bottom-0 right-4 bg-white border rounded-xl shadow-lg overflow-hidden z-20 transition-transform duration-300 ${
          isChatOpen ? 'transform translate-y-0 bottom-4' : 'transform translate-y-full'
        }`}
        style={{ width: '320px', height: '450px' }}
      >
        <div className='bg-slate-700 text-white p-4 flex justify-between items-center h-[75px]'>
          <div className='text-sm'>
            <div>ThanhHuy Store</div>
            <div className='font-light text-slate-100'>{isAiChat ? 'Tư vấn với AI' : 'Chat với Admin'}</div>
          </div>
          <div className='flex gap-1'>
            <button
              className='text-white select-none text-2xl w-7 h-7 flex items-center justify-center bg-gray-700 hover:bg-slate-600 rounded-full'
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              &equiv;
            </button>
            {/* Dropdown menu với hiệu ứng CSS */}
            <div
              className={`absolute z-30 right-9 top-14 bg-white shadow-lg rounded-md w-56 transition-all duration-200 ease-in-out
							${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
            >
              <div className='relative'>
                <div className='absolute -top-1 right-5 w-3 h-3 bg-white rotate-45'></div>
                <div className='p-2'>
                  <button
                    onClick={() => {
                      setIsAiChat(true);
                      setIsMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded ${
                      isAiChat ? 'bg-blue-100 text-blue-700' : 'text-black hover:bg-gray-100'
                    }`}
                  >
                    <FaRobot className={isAiChat ? 'text-blue-600' : 'text-gray-600'} />
                    <span>Tư vấn với siêu AI</span>
                    {isAiChat && <span className='ml-auto text-xs'>✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      setIsAiChat(false);
                      setIsMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded ${
                      !isAiChat ? 'bg-blue-100 text-blue-700' : 'text-black hover:bg-gray-100'
                    }`}
                  >
                    <FaUser className={!isAiChat ? 'text-blue-600' : 'text-gray-600'} />
                    <span>Tư vấn với Admin</span>
                    {!isAiChat && <span className='ml-auto text-xs'>✓</span>}
                  </button>
                </div>
              </div>
            </div>
            <button
              className='text-white select-none text-3xl w-7 h-7 flex items-center justify-center bg-gray-700 hover:bg-slate-600 rounded-full'
              onClick={toggleChat}
            >
              &times;
            </button>
          </div>
        </div>
        <div className={`flex-1 overflow-y-auto ${isAiChat ? '!h-[92.2%]' : '!h-[70%]'}`}>
          {isAiChat ? (
            <div className='w-full h-full'>
              <ChatBaseBot />
            </div>
          ) : currentUser ? (
            messages && chatRoomId ? (
              <Body
                Messages={messages}
                currentUser={currentUser}
                chatRoomId={chatRoomId}
                className='w-full h-[310px]'
              />
            ) : (
              <div className='bg-[#F7F6FA] w-full h-full flex justify-center items-center'>
                <Image src='/loader2.svg' alt='Loading' width={37} height={37} />
              </div>
            )
          ) : (
            <div className='text-center'>Bạn cần đăng nhập để trò chuyện</div>
          )}
          {!isAiChat && (
            <div className='absolute bottom-0 left-0 right-0 max-h-[200px] min-h-[63px] h-[63px] !text-black'>
              <textarea
                {...register('message')}
                placeholder='Nhập nội dung...'
                className='w-full h-full p-4 pt-4 outline-none border-t bg-white font-light text-sm'
                onKeyDown={handleKeyDown}
                disabled={currentUser ? false : true}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatBoxClient;

'use client';
import axios from 'axios';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { MdSend } from 'react-icons/md';
import { useState, useCallback, useMemo } from 'react';
import QuickResponsePanel from './QuickResponsePanel';

interface ChatFormProps {
  chatRoomId: string;
}

const ChatForm: React.FC<ChatFormProps> = ({ chatRoomId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isQuickResponseOpen, setIsQuickResponseOpen] = useState(false);
  const { register, handleSubmit, setValue, watch } = useForm<FieldValues>({
    defaultValues: {
      message: ''
    }
  });

  const currentMessage = watch('message');

  const onSubmit: SubmitHandler<FieldValues> = useCallback(
    async data => {
      // Kiểm tra nếu message rỗng thì không gửi
      if (!data.message || data.message.trim() === '') {
        return;
      }

      // Xóa rỗng input sau khi gửi
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
    },
    [chatRoomId, setValue]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
        e.preventDefault();
        handleSubmit(onSubmit)();
      }
      // Close quick response panel when typing
      if (isQuickResponseOpen && e.key !== 'Tab') {
        setIsQuickResponseOpen(false);
      }
    },
    [isLoading, isQuickResponseOpen, handleSubmit, onSubmit]
  );

  const handleQuickResponse = useCallback(
    (message: string) => {
      setValue('message', message);
      setIsQuickResponseOpen(false);
    },
    [setValue]
  );

  return (
    <div className='relative'>
      {/* Quick Response Panel */}
      {isQuickResponseOpen && (
        <div className='absolute bottom-full left-4 right-4 mb-2 z-10'>
          <QuickResponsePanel
            onSelectResponse={handleQuickResponse}
            isOpen={isQuickResponseOpen}
            onToggle={() => setIsQuickResponseOpen(!isQuickResponseOpen)}
          />
        </div>
      )}

      <div className='py-4 px-6 border-t border-gray-200 w-full bg-gradient-to-r from-gray-50 to-blue-50'>
        {/* Quick Response Toggle */}
        <div className='flex items-center justify-between mb-3'>
          <QuickResponsePanel
            onSelectResponse={handleQuickResponse}
            isOpen={false}
            onToggle={() => setIsQuickResponseOpen(!isQuickResponseOpen)}
          />
          <div className='text-xs text-gray-500 bg-white/60 px-2 py-1 rounded-full border border-gray-200'>
            {currentMessage?.length || 0} ký tự
          </div>
        </div>

        {/* Input Area */}
        <div className='flex items-center gap-3'>
          <div className='flex-1 relative'>
            <input
              {...register('message', { required: true })}
              placeholder='Nhập nội dung...'
              disabled={isLoading}
              onKeyDown={handleKeyDown}
              className='border-2 border-white/50 focus:border-blue-400 font-light text-black py-3 px-5 w-full rounded-2xl focus:outline-none transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm placeholder-gray-500'
            />
            {isLoading && (
              <div className='absolute right-4 top-1/2 transform -translate-y-1/2'>
                <div className='w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
              </div>
            )}
          </div>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading || !currentMessage?.trim()}
            className='rounded-2xl p-3 bg-gradient-to-r from-blue-500 to-indigo-600 cursor-pointer hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl group'
            title='Gửi tin nhắn (Enter)'
          >
            <MdSend size={20} className='text-white group-hover:scale-110 transition-transform' />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatForm;

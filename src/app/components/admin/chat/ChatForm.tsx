'use client';
import axios from 'axios';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { MdSend } from 'react-icons/md';
import { useState } from 'react';

interface ChatFormProps {
  chatRoomId: string;
}

const ChatForm: React.FC<ChatFormProps> = ({ chatRoomId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, setValue } = useForm<FieldValues>({
    defaultValues: {
      message: ''
    }
  });

  const onSubmit: SubmitHandler<FieldValues> = async data => {
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
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  return (
    <div className='py-2 px-4 border-t border-gray-300 w-full bg-[#F7F6FA] '>
      <div className='flex items-center gap-2 lg:gap-4'>
        <input
          {...register('message', { required: true })}
          placeholder='Nhập nội dung...'
          disabled={isLoading}
          onKeyDown={handleKeyDown}
          className='border border-slate-300 focus:border-slate-400 font-light text-black py-2 px-4 w-full rounded-full focus:outline-none'
        />
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={isLoading}
          className='rounded-full p-2 bg-[#16b1ff] cursor-pointer hover:bg-sky-600 transition disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <MdSend size={18} className='text-white' />
        </button>
      </div>
    </div>
  );
};

export default ChatForm;

'use client';

import { useOtherUser } from '@/app/actions/getOtherUser';
import { ChatRoom, User } from '@prisma/client';
import Link from 'next/link';
import { MdChevronLeft, MdSearch, MdInfo } from 'react-icons/md';
import Avatar from './Avatar';

interface HeaderProps {
  conversation: ChatRoom & { users: User[] };
  onToggleSearch?: () => void;
  onToggleCustomerInfo?: () => void;
}
const Header: React.FC<HeaderProps> = ({ conversation, onToggleSearch, onToggleCustomerInfo }) => {
  const otherUser = useOtherUser(conversation);
  return (
    <div className='w-full flex border-b-[1px] bg-gradient-to-r from-gray-50 to-blue-50 border-gray-300 sm:px-4 py-3 pt-4 px-4 lg:px-6 justify-between items-center'>
      <div className='flex gap-3 items-center'>
        <Link
          className='lg:hidden block text-sky-500 hover:text-sky-text-sky-600 transition cursor-pointer'
          href='/chat'
        >
          <MdChevronLeft size={32} />
        </Link>
        <Avatar user={otherUser} />
        <div className='flex flex-col'>
          <div className='font-medium text-gray-900'>{otherUser?.name}</div>
          <div className='text-sm font-light text-neutral-500'>Hoạt động</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className='flex items-center gap-1'>
        {onToggleSearch && (
          <button
            onClick={onToggleSearch}
            className='p-2.5 hover:bg-white/80 rounded-lg transition-all duration-200 group'
            title='Tìm kiếm tin nhắn (Ctrl+F)'
          >
            <MdSearch size={20} className='text-gray-600 group-hover:text-blue-600 transition-colors' />
          </button>
        )}

        {onToggleCustomerInfo && (
          <button
            onClick={onToggleCustomerInfo}
            className='p-2.5 hover:bg-white/80 rounded-lg transition-all duration-200 group'
            title='Thông tin khách hàng'
          >
            <MdInfo size={20} className='text-gray-600 group-hover:text-blue-600 transition-colors' />
          </button>
        )}
      </div>
    </div>
  );
};

export default Header;

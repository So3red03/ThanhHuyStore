'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AccountSideBarItem from './AccountSideBarItem';
import { AccountItems } from '../../../../utils/AccountItems';
import Image from 'next/image';
import { CiLogout } from 'react-icons/ci';
import { SafeUser } from '../../../../types';
import React, { useState } from 'react';
import ConfirmDialog from '../ConfirmDialog';

interface AccountSideBarProps {
  currentUser: SafeUser | null | undefined;
}

const AccountSideBar: React.FC<AccountSideBarProps> = ({ currentUser }) => {
  const [isConfirm, setIsConfirm] = useState(false);
  const router = useRouter();
  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };
  const toggleConfirmSignOut = () => {
    setIsConfirm(!isConfirm);
  };

  const handleConfirm = () => {
    toggleConfirmSignOut();
    handleSignOut();
  };
  return (
    <>
      <div className='flex items-center p-4 border-b border-[#CFCFCF]'>
        <Image
          className='rounded-full object-cover'
          src={currentUser?.image ?? '/no-avatar-2.jpg'}
          alt={`${currentUser?.name || 'User'} avatar`}
          width='50'
          height='50'
        />
        <h2 className='ml-4 text-lg font-bold'>{currentUser?.name}</h2>
      </div>
      <ul className='list-none p-4'>
        {AccountItems.map(item => (
          <li key={item.title}>
            <AccountSideBarItem key={item.title} label={item.title} path={item.path} icon={item.icon} />
          </li>
        ))}
        <button
          onClick={() => {
            setIsConfirm(true);
          }}
          className='p-4 w-full flex justify-stretch hover:bg-slate-500 hover:text-white items-center gap-2 my-1 rounded-lg'
        >
          <span className='text-xl rotate-180'>
            <CiLogout />
          </span>{' '}
          <span>Đăng xuất</span>
        </button>
      </ul>
      {isConfirm && (
        <ConfirmDialog isOpen={isConfirm} handleClose={toggleConfirmSignOut} alert={false} onConfirm={handleConfirm}>
          Bạn muốn thoát tài khoản?
        </ConfirmDialog>
      )}
    </>
  );
};

export default AccountSideBar;

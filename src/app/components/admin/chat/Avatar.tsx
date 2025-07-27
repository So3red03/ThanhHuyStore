'use client';

import Image from 'next/image';

interface AvatarProps {
  user?: any;
  small?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ user, small }) => {
  // Sử dụng avatar của user nếu có, nếu không thì dùng avatar mặc định
  const avatarSrc = user?.image || '/no-avatar-2.jpg';

  return (
    <div className='relative'>
      <div
        className={`relative inline-block rounded-full overflow-hidden ${
          small ? 'h-8 w-8' : 'h-9 w-9 md:h-11 md:w-11'
        }`}
      >
        <Image alt='Avatar' src={avatarSrc} fill sizes='100%' className='object-cover' />
      </div>
      <span
        className={`absolute block rounded-full bg-green-500 ring-2 ring-white top-0 right-0 ${
          small ? 'h-2 w-2' : 'h-2 w-2 md:h-3 md:w-3'
        }`}
      ></span>
    </div>
  );
};

export default Avatar;

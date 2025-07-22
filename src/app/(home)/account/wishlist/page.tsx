import { getCurrentUser } from '@/app/actions/getCurrentUser';
import WishlistClient from './WishlistClient';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

const WishlistPage = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold mb-2'>Vui lòng đăng nhập</h2>
          <p className='text-gray-600'>Bạn cần đăng nhập để xem danh sách yêu thích</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      }
    >
      <WishlistClient currentUser={currentUser} />
    </Suspense>
  );
};

export default WishlistPage;

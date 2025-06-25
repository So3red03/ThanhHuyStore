import { Suspense } from 'react';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import NullData from '@/app/components/NullData';
import ReturnsClient from './ReturnsClient';

export const dynamic = 'force-dynamic';

const Returns = async () => {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    return <NullData title='Bạn chưa đăng nhập' />;
  }

  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      }
    >
      <ReturnsClient currentUser={currentUser} />
    </Suspense>
  );
};

export default Returns;

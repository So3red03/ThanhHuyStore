import { getCurrentUser } from '@/app/actions/getCurrentUser';
import ReturnsClient from './ReturnsClient';
import NullData from '@/app/components/NullData';
import { Suspense } from 'react';
import { ReturnRequestProvider } from '@/app/contexts/ReturnRequestContext';
export const dynamic = 'force-dynamic';

const ReturnsPage = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return <NullData title='Bạn chưa đăng nhập' />;
  }

  return (
    <ReturnRequestProvider>
      <Suspense
        fallback={
          <div className='flex items-center justify-center h-64'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
          </div>
        }
      >
        <ReturnsClient currentUser={currentUser} />
      </Suspense>
    </ReturnRequestProvider>
  );
};

export default ReturnsPage;

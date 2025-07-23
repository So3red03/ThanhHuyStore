import { Suspense } from 'react';
import UserViewedClient from './UserViewedClient';
export const dynamic = 'force-dynamic';

const Viewed = async () => {
  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      }
    >
      <UserViewedClient />
    </Suspense>
  );
};

export default Viewed;

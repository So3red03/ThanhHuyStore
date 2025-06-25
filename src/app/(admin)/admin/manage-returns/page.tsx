import { Suspense } from 'react';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { redirect } from 'next/navigation';
import ManageReturnsClient from './ManageReturnsClient';

export const dynamic = 'force-dynamic';

const ManageReturns = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <div className="p-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }
      >
        <ManageReturnsClient />
      </Suspense>
    </div>
  );
};

export default ManageReturns;

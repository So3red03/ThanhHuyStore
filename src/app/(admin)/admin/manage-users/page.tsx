import Container from '@/app/components/Container';
import ManageUserClient from './ManageUserClient';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { getUsers } from '@/app/actions/getUsers';
import { Suspense } from 'react';

// Keep force-dynamic due to analytics tracking
export const dynamic = 'force-dynamic';

const ManageUsers = async () => {
  const currentUser = await getCurrentUser();
  const users = await getUsers();
  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      }
    >
      <Container custom='!p-0'>
        <ManageUserClient users={users} currentUser={currentUser} />
      </Container>
    </Suspense>
  );
};

export default ManageUsers;

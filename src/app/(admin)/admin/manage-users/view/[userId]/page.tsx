import Container from '@/app/components/Container';
import { Suspense } from 'react';
import UserDetailsClient from './UserDetailsClient';
import { getUserById, IParams } from '@/app/actions/getUserById';

const UserDetails = async ({ params }: { params: IParams }) => {
  const userId = params.userId;

  if (!userId) {
    throw new Error('ID người dùng không tìm thấy');
  }

  const user = await getUserById({ userId });

  if (!user) {
    throw new Error('Người dùng không tìm thấy');
  }
  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      }
    >
      <Container custom='!p-0'>
        <UserDetailsClient user={user} />
      </Container>
    </Suspense>
  );
};

export default UserDetails;

import { Suspense } from 'react';
import Container from '@/app/components/Container';
import PasswordResetClient from './PasswordResetClient';

export const dynamic = 'force-dynamic';

interface IParams {
  token: string;
}

const PasswordRecovery = async ({ params }: { params: IParams }) => {
  const { token } = params;

  if (!token) {
    throw new Error('Token không hợp lệ');
  }

  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      }
    >
      <Container>
        <PasswordResetClient token={token} />
      </Container>
    </Suspense>
  );
};

export default PasswordRecovery;

import { getCurrentUser } from '@/app/actions/getCurrentUser';
import LoginForm from './LoginForm';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

const Login = async () => {
  const currentUser = await getCurrentUser();

  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      }
    >
      <LoginForm currentUser={currentUser} />
    </Suspense>
  );
};

export default Login;

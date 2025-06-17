import { Suspense } from 'react';
import CheckoutClient from './CheckoutClient';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
export const dynamic = 'force-dynamic';
const Checkout = async () => {
  const currentUser = await getCurrentUser();
  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      }
    >
      <CheckoutClient currentUser={currentUser} />
    </Suspense>
  );
};

export default Checkout;

import { Suspense } from 'react';
import CartInfoClient from './CartInfoClient';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
export const dynamic = 'force-dynamic';
const CartInfo = async () => {
  const currentUser = await getCurrentUser();
  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      }
    >
      <CartInfoClient currentUser={currentUser} />
    </Suspense>
  );
};

export default CartInfo;

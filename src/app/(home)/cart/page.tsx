import { getCurrentUser } from '@/app/actions/getCurrentUser';
import CartBuyClient from './CartBuyClient';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

const Cart = async () => {
  const currentUser = await getCurrentUser();
  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      }
    >
      <CartBuyClient currentUser={currentUser} />
    </Suspense>
  );
};

export default Cart;

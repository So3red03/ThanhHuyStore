import { Suspense } from 'react';
import OrderConfirmationClient from './OrderConfirmationClient';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { getOrderByPaymentId } from '@/app/actions/getOrderByPaymentId';
import { useCart } from '@/app/hooks/useCart';

export const dynamic = 'force-dynamic';
const OrderConfirmation = async () => {
  const currentUser = await getCurrentUser();
  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      }
    >
      <OrderConfirmationClient currentUser={currentUser} />
    </Suspense>
  );
};

export default OrderConfirmation;

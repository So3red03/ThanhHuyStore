import { Suspense } from 'react';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import OrdersClient from './OrdersClient';
import { getOrdersById } from '@/app/actions/getOrdersById';
import NullData from '@/app/components/NullData';
import { ReturnRequestProvider } from '@/app/providers/ReturnRequestContext';

export const dynamic = 'force-dynamic';

const Orders = async () => {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return <NullData title='Bạn chưa đăng nhập' />;
  }
  const orders = await getOrdersById(currentUser?.id);

  return (
    <ReturnRequestProvider>
      <Suspense
        fallback={
          <div className='flex items-center justify-center h-64'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
          </div>
        }
      >
        <OrdersClient orders={orders} currentUser={currentUser} />
      </Suspense>
    </ReturnRequestProvider>
  );
};

export default Orders;

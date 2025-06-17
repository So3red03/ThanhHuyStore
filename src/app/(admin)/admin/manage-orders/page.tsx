import Container from '@/app/components/Container';
import ManageOrdersClient from './ManageOrdersClient';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { getOrders } from '@/app/actions/getOrders';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

const ManageOrders = async () => {
  const orders = await getOrders();
  const currentUser = await getCurrentUser();
  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      }
    >
      <Container custom='!p-0'>
        <ManageOrdersClient orders={orders} currentUser={currentUser} />
      </Container>
    </Suspense>
  );
};

export default ManageOrders;

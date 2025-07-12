import Container from '@/app/components/Container';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { getOrders } from '@/app/actions/getOrders';
import { getUsers } from '@/app/actions/getUsers';
import { getAllProducts } from '@/app/actions/getAllProducts';
import { Suspense } from 'react';
import KanbanOrdersClient from './KanbanOrdersClient';

export const dynamic = 'force-dynamic';

const KanbanOrders = async () => {
  const [orders, currentUser, users, products] = await Promise.all([
    getOrders(),
    getCurrentUser(),
    getUsers(),
    getAllProducts()
  ]);

  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      }
    >
      <Container custom='!p-0'>
        <KanbanOrdersClient orders={orders} currentUser={currentUser} users={users || []} products={products || []} />
      </Container>
    </Suspense>
  );
};

export default KanbanOrders;

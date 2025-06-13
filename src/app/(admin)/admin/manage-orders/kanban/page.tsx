import Container from '@/app/components/Container';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { getOrders } from '@/app/actions/getOrders';
import { Suspense } from 'react';
import KanbanOrdersClient from './KanbanOrdersClient';

export const dynamic = 'force-dynamic';

const KanbanOrders = async () => {
  const orders = await getOrders();
  const currentUser = await getCurrentUser();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Container custom='!p-0'>
        <KanbanOrdersClient orders={orders} currentUser={currentUser} />
      </Container>
    </Suspense>
  );
};

export default KanbanOrders;

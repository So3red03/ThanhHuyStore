import Container from '@/app/components/Container';
import ManageProductsClient from './ManageProductsClient';
import { getProducts } from '@/app/actions/getProducts';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { Suspense } from 'react';
import { getProductCategories, getSubCategories } from '@/app/actions/getProductCategories';
import { getOrders } from '@/app/actions/getOrders';

// Keep force-dynamic due to analytics tracking
export const dynamic = 'force-dynamic';

const ManageProducts = async () => {
  const products = await getProducts({ category: null });
  const currentUser = await getCurrentUser();
  const parentCategories = await getProductCategories();
  const subCategories = await getSubCategories();
  const orders = await getOrders();
  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      }
    >
      <Container custom='!p-0'>
        <ManageProductsClient
          products={products || []}
          currentUser={currentUser}
          subCategories={subCategories}
          parentCategories={parentCategories}
          orders={orders || []}
        />
      </Container>
    </Suspense>
  );
};

export default ManageProducts;

import Container from '@/app/components/Container';
import ManageCategoriesClient from './ManageCategoriesClient';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { getProductCategories } from '@/app/actions/getProductCategories';

// Keep force-dynamic due to analytics tracking
export const dynamic = 'force-dynamic';

const ManageCategories = async () => {
  const currentUser = await getCurrentUser();
  const categories = await getProductCategories();
  return (
    <Container custom='!p-0'>
      <ManageCategoriesClient currentUser={currentUser} categories={categories} />
    </Container>
  );
};

export default ManageCategories;

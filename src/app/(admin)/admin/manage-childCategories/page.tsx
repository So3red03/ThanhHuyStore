import Container from '@/app/components/Container';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { getProductCategories, getSubCategories } from '@/app/actions/getProductCategories';
import ManageChildCategoriesClient from './ManageChildCategoriesClient';

// Keep force-dynamic due to analytics tracking
export const dynamic = 'force-dynamic';

const ManageChildCategories = async () => {
  const currentUser = await getCurrentUser();
  const parentCategories = await getProductCategories();
  const subCategories = await getSubCategories();
  return (
    <Container custom='!p-0'>
      <ManageChildCategoriesClient
        currentUser={currentUser}
        parentCategories={parentCategories}
        subCategories={subCategories}
      />
    </Container>
  );
};

export default ManageChildCategories;

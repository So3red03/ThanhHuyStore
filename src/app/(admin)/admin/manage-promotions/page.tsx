import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { getPromotions } from '@/app/actions/getPromotions';
import { getProducts } from '@/app/actions/getProducts';
import { getProductCategories } from '@/app/actions/getProductCategories';
import ManagePromotionsClient from './ManagePromotionsClient';
import NullData from '@/app/components/NullData';

const ManagePromotions = async () => {
  const currentUser = await getCurrentUser();
  const promotions = await getPromotions();
  const products = await getProducts({});
  const categories = await getProductCategories();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return <NullData title='Oops! Access denied' />;
  }

  return (
    <div className='pt-8'>
      <ManagePromotionsClient
        promotions={promotions}
        products={products || []}
        categories={categories || []}
        currentUser={currentUser}
      />
    </div>
  );
};

export default ManagePromotions;

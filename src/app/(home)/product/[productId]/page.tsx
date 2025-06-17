import Container from '@/app/components/Container';
import ProductDetails from './ProductDetails';
import ListRating from './ListRating';
import NullData from '@/app/components/NullData';
import { getProductById, IParams } from '@/app/actions/getProductById';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { Suspense } from 'react';
import NotFound from '../../404';
import ProductDetailsSkeletonLoader from '@/app/components/products/ProductDetailsSkeletonLoader';

// Optimized caching: Product details change occasionally, cache for 1 hour
export const revalidate = 3600; // 1 hour

export async function generateMetadata({ params }: { params: IParams }) {
  const productId = params.productId.split('-').pop(); // Lấy phần ID từ cuối chuỗi

  if (!productId) {
    throw new Error('Sản phẩm không tìm thấy');
  }

  const product = await getProductById({ productId });

  return {
    title: product?.name
  };
}

const Product = async ({ params }: { params: IParams }) => {
  const productId = params.productId.split('-').pop(); // lấy phần ID từ cuối chuỗi

  if (!productId) {
    throw new Error('Sản phẩm không tìm thấy');
  }
  const user = await getCurrentUser();
  const product = await getProductById({ productId });

  if (!product) {
    return <NotFound />;
  }

  return (
    <Suspense
      fallback={
        <Container>
          <ProductDetailsSkeletonLoader />
        </Container>
      }
    >
      <div className='p-8'>
        <Container>
          <ProductDetails product={product} />
          <div className='flex flex-col justify-center mt-32 gap-4'>
            <ListRating product={product} user={user} />
          </div>
        </Container>
      </div>
    </Suspense>
  );
};

export default Product;

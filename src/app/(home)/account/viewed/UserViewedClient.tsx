'use client';
import Button from '@/app/components/Button';
import Heading from '@/app/components/Heading';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { truncateText } from '../../../utils/truncateText';
import { formatPrice } from '../../../utils/formatPrice';
import { Product } from '@prisma/client';
import NotFound from '@/app/components/NotFound';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { slugConvert } from '../../../utils/Slug';

const UserViewedClient = () => {
  const [viewedProducts, setViewedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Helper function to get product image (handles both simple and variant products)
  const getProductImage = (product: any) => {
    // For simple products, use thumbnail or first gallery image
    if (product.productType === 'SIMPLE') {
      if (product.thumbnail) return product.thumbnail;
      if (product.galleryImages && product.galleryImages.length > 0) return product.galleryImages[0];
    }

    // For variant products, try to get image from first active variant
    if (product.productType === 'VARIANT' && product.variants && product.variants.length > 0) {
      const firstVariant = product.variants[0];
      if (firstVariant.thumbnail) return firstVariant.thumbnail;
      if (firstVariant.galleryImages && firstVariant.galleryImages.length > 0) return firstVariant.galleryImages[0];
    }

    // Fallback to product-level images
    if (product.thumbnail) return product.thumbnail;
    if (product.galleryImages && product.galleryImages.length > 0) return product.galleryImages[0];

    // Final fallback
    return '/noavatar.png';
  };

  useEffect(() => {
    const getViewedProducts = async () => {
      try {
        // Lấy analytics data từ API
        const analyticsResponse = await fetch('/api/user/analytics');
        if (!analyticsResponse.ok) {
          setViewedProducts([]);
          return;
        }

        const analyticsData = await analyticsResponse.json();
        const viewHistory = analyticsData.viewHistory || [];

        if (viewHistory.length === 0) {
          setViewedProducts([]);
          return;
        }

        // Lấy danh sách products để match với analytics
        const productsResponse = await fetch('/api/product');
        if (!productsResponse.ok) {
          setViewedProducts([]);
          return;
        }

        const productData = await productsResponse.json();
        const allProducts = productData.products || productData;

        // Lấy các sản phẩm đã xem
        const recentProductIds = viewHistory
          .sort((a: any, b: any) => b.viewedAt - a.viewedAt)
          .map((item: any) => item.productId);

        const recentProducts = allProducts.filter(
          (product: Product) =>
            recentProductIds.includes(product.id) && (product.inStock ?? 0) > 0 && !product.isDeleted
        );

        // Sắp xếp theo thứ tự trong viewHistory
        const sortedProducts = recentProductIds
          .map((id: string) => recentProducts.find((product: Product) => product.id === id))
          .filter(Boolean);

        setViewedProducts(sortedProducts);
      } catch (error) {
        console.error('Error fetching viewed products:', error);
        setViewedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    getViewedProducts();
  }, []);

  if (loading) {
    return (
      <div className='px-6'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 rounded w-64 mb-6'></div>
          <div className='grid grid-cols-2 sm:grid-cols-3 xl:!grid-cols-4 gap-8 mt-8'>
            {[...Array(8)].map((_, index) => (
              <div key={index} className='bg-gray-200 h-64 rounded'></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='px-6'>
      {viewedProducts.length > 0 ? (
        <>
          <Heading title='SẢN PHẨM ĐÃ XEM'>
            <></>
          </Heading>
          <div className='grid grid-cols-2 sm:grid-cols-3 xl:!grid-cols-4 gap-8 mt-8'>
            {viewedProducts.map((data: any) => (
              <Link
                href={`/product/${slugConvert(data.name)}-${data.id}`}
                key={data.id}
                className='col-span-1 cursor-pointer border-[1.2px] border-none bg-white rounded-sm p-2 transition hover:scale-105 text-center text-sm'
              >
                <div className='flex flex-col items-center gap-1 w-full'>
                  <div className='aspect-square overflow-hidden relative w-full'>
                    <Image
                      src={getProductImage(data)}
                      alt={data.name}
                      fill
                      sizes='100%'
                      className='w-full h-full object-cover'
                      loading='lazy'
                      onError={e => {
                        e.currentTarget.src = '/noavatar.png';
                      }}
                    />
                  </div>
                  <div className='mt-4 text-base h-11'>{truncateText(data.name)}</div>
                  <div className='font-semibold text-lg mt-2'>{formatPrice(data.price)}</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <>
          <Heading title='SẢN PHẨM ĐÃ XEM'>
            <></>
          </Heading>
          <div className='mt-8'>
            <NotFound />
            <p className='text-center font-semibold text-lg my-5'>Quý khách chưa xem sản phẩm nào</p>
            <Button
              label='Tiếp tục mua hàng'
              onClick={() => {
                router.push('/');
              }}
              custom='!max-w-[200px] !mx-auto'
            />
          </div>
        </>
      )}
    </div>
  );
};

export default UserViewedClient;

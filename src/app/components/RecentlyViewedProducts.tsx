'use client';

import { useEffect, useState } from 'react';
import { Product } from '@prisma/client';
import Container from './Container';
import ProductCard from './products/ProductCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

interface RecentlyViewedProductsProps {
  allProducts: Product[];
  maxProducts?: number; // Số lượng sản phẩm tối đa hiển thị
  showContainer?: boolean; // Có wrap trong Container không
  compact?: boolean; // Chế độ compact cho ArticleDetails
}

interface ViewHistory {
  productId: string;
  category: string;
  brand: string;
  viewedAt: number;
}

const RecentlyViewedProducts: React.FC<RecentlyViewedProductsProps> = ({
  allProducts,
  maxProducts = 5,
  showContainer = true,
  compact = false
}) => {
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRecentlyViewedProducts = async () => {
      try {
        // Lấy lịch sử xem từ database analytics
        const analyticsResponse = await fetch('/api/user/analytics');
        const analyticsData = analyticsResponse.ok ? await analyticsResponse.json() : { viewHistory: [] };
        const viewHistory: ViewHistory[] = analyticsData.viewHistory || [];

        if (viewHistory.length === 0) {
          setRecentlyViewedProducts([]);
          setLoading(false);
          return;
        }

        // Lấy các sản phẩm đã xem gần nhất
        const recentProductIds = viewHistory
          .sort((a, b) => b.viewedAt - a.viewedAt) // Sắp xếp theo thời gian xem mới nhất
          .slice(0, maxProducts) // Lấy số lượng tối đa
          .map(item => item.productId);

        // Lọc sản phẩm từ allProducts
        const recentProducts = allProducts.filter(
          product => recentProductIds.includes(product.id) && (product.inStock ?? 0) > 0
        );

        // Sắp xếp theo thứ tự trong viewHistory
        const sortedProducts = recentProductIds
          .map(id => recentProducts.find(product => product.id === id))
          .filter(Boolean) as Product[];

        setRecentlyViewedProducts(sortedProducts);
      } catch (error) {
        console.error('Error getting recently viewed products:', error);
        setRecentlyViewedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    // Gọi async function
    getRecentlyViewedProducts();
  }, [allProducts, maxProducts]);

  if (loading) {
    const skeletonContent = (
      <div className='animate-pulse'>
        <div className='h-8 bg-gray-200 rounded w-64 mb-6'></div>
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-8'>
          {[...Array(maxProducts)].map((_, index) => (
            <div key={index} className='bg-gray-200 h-64 rounded'></div>
          ))}
        </div>
      </div>
    );

    if (showContainer) {
      return (
        <Container>
          <div className='xl:px-[50px]'>{skeletonContent}</div>
        </Container>
      );
    }
    return <div className='px-4'>{skeletonContent}</div>;
  }

  if (recentlyViewedProducts.length === 0) {
    return null;
  }

  const content = (
    <div
      className={`relative rounded-lg overflow-hidden bg-gradient-to-r from-white via-cyan-300 to-orange-200 ${
        compact ? 'mt-6' : 'mt-12'
      }`}
      style={{ minHeight: compact ? '300px' : '400px' }}
    >
      {/* Overlay để làm nền tối hơn */}
      <div className='absolute inset-0 bg-gradient-to-r from-blue-200/40 via-purple-200/40 to-pink-200/40 z-[1]'></div>

      {/* Content */}
      <div className={`relative z-10 ${compact ? 'p-4' : 'p-6'}`}>
        {/* Header với icon gradient */}
        <div className={compact ? 'mb-4' : 'mb-6'}>
          <h2 className={`flex items-center pb-3 font-bold text-[rgb(4,41,122)] ${compact ? 'text-lg' : 'text-2xl'}`}>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='40'
              height='40'
              viewBox='0 0 1080 1080'
              fill='none'
              className='mr-3'
            >
              <path
                d='M515.09 725.824L472.006 824.503C455.444 862.434 402.954 862.434 386.393 824.503L343.308 725.824C304.966 638.006 235.953 568.104 149.868 529.892L31.2779 477.251C-6.42601 460.515 -6.42594 405.665 31.2779 388.929L146.164 337.932C234.463 298.737 304.714 226.244 342.401 135.431L386.044 30.2693C402.239 -8.75637 456.159 -8.75646 472.355 30.2692L515.998 135.432C553.685 226.244 623.935 298.737 712.234 337.932L827.121 388.929C864.825 405.665 864.825 460.515 827.121 477.251L708.53 529.892C622.446 568.104 553.433 638.006 515.09 725.824Z'
                fill='url(#paint0_radial_2525_777)'
              />
              <path
                d='M915.485 1036.98L903.367 1064.75C894.499 1085.08 866.349 1085.08 857.481 1064.75L845.364 1036.98C823.765 987.465 784.862 948.042 736.318 926.475L698.987 909.889C678.802 900.921 678.802 871.578 698.987 862.61L734.231 846.951C784.023 824.829 823.623 783.947 844.851 732.75L857.294 702.741C865.966 681.826 894.882 681.826 903.554 702.741L915.997 732.75C937.225 783.947 976.826 824.829 1026.62 846.951L1061.86 862.61C1082.05 871.578 1082.05 900.921 1061.86 909.889L1024.53 926.475C975.987 948.042 937.083 987.465 915.485 1036.98Z'
                fill='url(#paint1_radial_2525_777)'
              />
              <defs>
                <radialGradient
                  id='paint0_radial_2525_777'
                  cx='0'
                  cy='0'
                  r='1'
                  gradientUnits='userSpaceOnUse'
                  gradientTransform='translate(670.447 474.006) rotate(78.858) scale(665.5 665.824)'
                >
                  <stop stopColor='#1BA1E3' />
                  <stop offset='0.0001' stopColor='#1BA1E3' />
                  <stop offset='0.300221' stopColor='#5489D6' />
                  <stop offset='0.545524' stopColor='#9B72CB' />
                  <stop offset='0.825372' stopColor='#D96570' />
                  <stop offset='1' stopColor='#F49C46' />
                </radialGradient>
                <radialGradient
                  id='paint1_radial_2525_777'
                  cx='0'
                  cy='0'
                  r='1'
                  gradientUnits='userSpaceOnUse'
                  gradientTransform='translate(670.447 474.006) rotate(78.858) scale(665.5 665.824)'
                >
                  <stop stopColor='#1BA1E3' />
                  <stop offset='0.0001' stopColor='#1BA1E3' />
                  <stop offset='0.300221' stopColor='#5489D6' />
                  <stop offset='0.545524' stopColor='#9B72CB' />
                  <stop offset='0.825372' stopColor='#D96570' />
                  <stop offset='1' stopColor='#F49C46' />
                </radialGradient>
              </defs>
            </svg>
            SẢN PHẨM ĐÃ XEM
          </h2>
        </div>

        {/* Product Swiper */}
        <div className='product-list-swiper'>
          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={10}
            slidesPerView={maxProducts}
            navigation={{
              nextEl: '.swiper-button-next-viewed',
              prevEl: '.swiper-button-prev-viewed'
            }}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false
            }}
            loop={recentlyViewedProducts.length > maxProducts}
            breakpoints={{
              320: {
                slidesPerView: 1,
                spaceBetween: 10
              },
              640: {
                slidesPerView: 2,
                spaceBetween: 10
              },
              768: {
                slidesPerView: 3,
                spaceBetween: 10
              },
              1024: {
                slidesPerView: Math.min(4, maxProducts),
                spaceBetween: 10
              },
              1280: {
                slidesPerView: Math.min(5, maxProducts),
                spaceBetween: 10
              }
            }}
            className='w-full'
          >
            {recentlyViewedProducts.map(product => (
              <SwiperSlide key={product.id} className='transition-transform duration-300 hover:-translate-y-1'>
                <ProductCard data={product} className='rounded-lg shadow-sm' />
              </SwiperSlide>
            ))}

            {/* Navigation buttons */}
            <div className='swiper-button-prev-viewed swiper-button-prev !text-white !w-10 !h-10 !mt-[-20px] after:!text-lg after:!font-bold !bg-white/20 !backdrop-blur-md !rounded-full !transition-all !duration-300 hover:!bg-white/30 hover:!scale-110'></div>
            <div className='swiper-button-next-viewed swiper-button-next !text-white !w-10 !h-10 !mt-[-20px] after:!text-lg after:!font-bold !bg-white/20 !backdrop-blur-md !rounded-full !transition-all !duration-300 hover:!bg-white/30 hover:!scale-110'></div>
          </Swiper>
        </div>
      </div>
    </div>
  );

  if (showContainer) {
    return (
      <Container>
        <div className='xl:px-[50px]'>{content}</div>
      </Container>
    );
  }

  return <div className='px-4'>{content}</div>;
};

export default RecentlyViewedProducts;

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
    const getRecentlyViewedProducts = () => {
      try {
        // Lấy lịch sử xem từ localStorage
        const viewHistory: ViewHistory[] = JSON.parse(localStorage.getItem('productViewHistory') || '[]');

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
          product => recentProductIds.includes(product.id) && product.inStock > 0
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
      className={`relative rounded-lg overflow-hidden bg-gradient-to-r from-pink-100 via-purple-100 to-blue-300 ${
        compact ? 'mt-6' : 'mt-12'
      }`}
      style={{ minHeight: compact ? '300px' : '400px' }}
    >
      {/* Overlay để làm nền tối hơn */}
      <div className='absolute inset-0 bg-gradient-to-r from-pink-200/40 via-purple-200/40 to-blue-200/40 z-[1]'></div>

      {/* Content */}
      <div className={`relative z-10 ${compact ? 'p-4' : 'p-6'}`}>
        {/* Header với icon gradient */}
        <div className={compact ? 'mb-4' : 'mb-6'}>
          <h2 className={`flex items-center pb-3 font-bold text-[rgb(4,41,122)] ${compact ? 'text-lg' : 'text-2xl'}`}>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width={compact ? '32' : '40'}
              height={compact ? '32' : '40'}
              viewBox='0 0 24 24'
              fill='none'
              className='mr-3'
            >
              <path
                d='M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z'
                fill='url(#paint0_radial_viewed)'
              />
              <defs>
                <radialGradient
                  id='paint0_radial_viewed'
                  cx='0'
                  cy='0'
                  r='1'
                  gradientUnits='userSpaceOnUse'
                  gradientTransform='translate(12 12) scale(12)'
                >
                  <stop stopColor='#ec4899' />
                  <stop offset='0.3' stopColor='#db2777' />
                  <stop offset='0.6' stopColor='#be185d' />
                  <stop offset='1' stopColor='#9d174d' />
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

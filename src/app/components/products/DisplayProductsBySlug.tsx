'use client';

import { useEffect, useState } from 'react';
import SkeletonLoader from './SkeletonLoader';
import ProductCard from './ProductCard';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

interface DisplayProductsBySlugProps {
  data: any;
}

const DisplayProductsBySlug: React.FC<DisplayProductsBySlugProps> = ({ data }) => {
  const [products, setProducts] = useState<[]>(data.products);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (data.products && data.products.length > 0) {
      // Sort products by priority (highest first), then by creation date (newest first)
      const sortedProducts = [...data.products].sort((a: any, b: any) => {
        // First sort by priority (higher priority first)
        const priorityA = a.priority || 0;
        const priorityB = b.priority || 0;

        if (priorityA !== priorityB) {
          return priorityB - priorityA; // Higher priority first
        }

        // If priority is the same, sort by creation date (newer first)
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      setProducts(sortedProducts as []);
      setLoading(false);
    }
  }, [data]);
  return (
    <>
      <Link
        href={`/${data.parentCategory.slug}`}
        className='mt-12 w-full text-center mb-[20px] block select-none text-xl font-[600] sm:text-2xl'
      >
        {data.parentCategory.name}
      </Link>
      {/* <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:!grid-cols-5 3xl:!grid-cols-6 gap-7">
				{loading
					? Array.from({ length: 5 }).map((_, index) => <SkeletonLoader key={index} />)
					: products.map((product: any) => <ProductCard key={product.id} data={product} />)}

			</div> */}
      <Swiper
        modules={[Navigation]}
        spaceBetween={28}
        slidesPerView={5}
        loop={false}
        className='w-full'
        breakpoints={{
          320: {
            slidesPerView: 1,
            spaceBetween: 10
          },
          640: {
            slidesPerView: 2,
            spaceBetween: 15
          },
          768: {
            slidesPerView: 3,
            spaceBetween: 20
          },
          1024: {
            slidesPerView: 4,
            spaceBetween: 25
          },
          1280: {
            slidesPerView: 5,
            spaceBetween: 28
          }
        }}
      >
        {loading
          ? Array.from({ length: 5 }).map((_, index) => (
              <SwiperSlide key={index} className='w-full'>
                <SkeletonLoader />
              </SwiperSlide>
            ))
          : products.map((product: any) => (
              <SwiperSlide key={product.id} className='w-full'>
                <ProductCard data={product} />
              </SwiperSlide>
            ))}
      </Swiper>
    </>
  );
};

export default DisplayProductsBySlug;

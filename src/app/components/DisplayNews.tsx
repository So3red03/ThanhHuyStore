'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import Link from 'next/link';
import { slugConvert } from '../../../utils/Slug';
import { format } from 'date-fns';
import { useSearchParams } from 'next/navigation';

interface DisplayNewsProsp {
  articles: any;
}

const DisplayNews: React.FC<DisplayNewsProsp> = ({ articles }) => {
  const searchParams = useSearchParams();
  const category = searchParams?.get('category');
  const searchTerm = searchParams?.get('searchTerm');

  if (category || searchTerm) {
    return null;
  }
  return (
    <section className='relative my-[30px] w-full'>
      <h2 className='mt-[0px] w-full text-center mb-[20px] block select-none text-xl font-[600] sm:text-2xl'>
        TIN CÔNG NGHỆ
      </h2>
      <Swiper
        modules={[Navigation, Autoplay]}
        spaceBetween={20}
        slidesPerView={4}
        navigation
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        loop={true}
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
            spaceBetween: 18
          },
          1024: {
            slidesPerView: 4,
            spaceBetween: 20
          }
        }}
      >
        {articles.map((article: any, index: any) => (
          <SwiperSlide key={index} className='w-full'>
            <div className='w-full overflow-hidden'>
              <Link
                className='relative block aspect-16/9 w-full flex-shrink-0 overflow-hidden rounded-[5px]'
                href={`/article/${slugConvert(article.title)}-${article.id}`}
              >
                <img
                  alt={article.title}
                  title={article.title}
                  loading='lazy'
                  width={200}
                  height={200}
                  decoding='async'
                  data-nimg={1}
                  className='h-full w-full object-cover '
                  src={article.image}
                  style={{ color: 'transparent' }}
                />
              </Link>
              <div className='mt-[8px]'>
                <Link
                  href={`/article/${slugConvert(article.title)}-${article.id}`}
                  className='line-clamp-2 text-[#212B36] text-sm font-medium hover:text-blue-500'
                >
                  <h3>{article.title}</h3>
                </Link>
                <div className='mt-[5px] flex items-center gap-[3px] text-blue-500'>
                  <svg
                    stroke='currentColor'
                    fill='currentColor'
                    strokeWidth={0}
                    viewBox='0 0 256 256'
                    height={17}
                    width={17}
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path d='M128,26A102,102,0,1,0,230,128,102.12,102.12,0,0,0,128,26ZM71.44,198a66,66,0,0,1,113.12,0,89.8,89.8,0,0,1-113.12,0ZM94,120a34,34,0,1,1,34,34A34,34,0,0,1,94,120Zm99.51,69.64a77.53,77.53,0,0,0-40-31.38,46,46,0,1,0-51,0,77.53,77.53,0,0,0-40,31.38,90,90,0,1,1,131,0Z' />
                  </svg>
                  <span className='text-xs'>Admin</span>
                </div>
                <span className='mt-[5px] flex items-center gap-[3px] text-[#637381]'>
                  <svg
                    stroke='currentColor'
                    fill='currentColor'
                    strokeWidth='0'
                    viewBox='0 0 24 24'
                    height='12'
                    width='12'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path d='M12.5 7.25a.75.75 0 0 0-1.5 0v5.5c0 .27.144.518.378.651l3.5 2a.75.75 0 0 0 .744-1.302L12.5 12.315V7.25Z'></path>
                    <path d='M12 1c6.075 0 11 4.925 11 11s-4.925 11-11 11S1 18.075 1 12 5.925 1 12 1ZM2.5 12a9.5 9.5 0 0 0 9.5 9.5 9.5 9.5 0 0 0 9.5-9.5A9.5 9.5 0 0 0 12 2.5 9.5 9.5 0 0 0 2.5 12Z'></path>
                  </svg>
                  <span className='text-xs'>{format(new Date(article.createdAt), 'dd/MM/yyyy')}</span>
                </span>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default DisplayNews;

'use client';
import Button from '@/app/components/Button';
import Heading from '@/app/components/Heading';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { truncateText } from '../../../../../utils/truncateText';
import { formatPrice } from '../../../../../utils/formatPrice';
import { Product } from '@prisma/client';
import NotFound from '@/app/components/NotFound';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { slugConvert } from '../../../../../utils/Slug';

const UserViewedClient = () => {
  const [viewedProducts, setViewedProducts] = useState<[]>([]);
  const router = useRouter();
  useEffect(() => {
    const storedViewed = localStorage.getItem('viewedProducts');
    if (storedViewed) {
      setViewedProducts(JSON.parse(storedViewed));
    }
  }, []);

  return (
    <div className='px-6'>
      {viewedProducts ? (
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
                    {/* Use new thumbnail + galleryImages structure */}
                    {data.thumbnail || (data.galleryImages && data.galleryImages.length > 0) ? (
                      <Image
                        src={data.thumbnail || data.galleryImages[0]}
                        alt={data.name}
                        fill
                        sizes='100%'
                        className='w-full h-full object-cover'
                        loading='lazy'
                        onError={e => {
                          e.currentTarget.src = '/noavatar.png';
                        }}
                      />
                    ) : (
                      /* Fallback to old images structure */
                      data.images &&
                      data.images.length > 0 &&
                      data.images[0].images &&
                      data.images[0].images.length > 0 && (
                        <Image
                          src={data.images[0].images[0]}
                          alt={data.name}
                          fill
                          sizes='100%'
                          className='w-full h-full object-cover'
                          loading='lazy'
                          onError={e => {
                            e.currentTarget.src = '/noavatar.png';
                          }}
                        />
                      )
                    )}
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

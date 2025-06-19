'use client';

import Rating from '@mui/material/Rating/Rating';
import { format } from 'date-fns';
import Link from 'next/link';
import { SafeUser } from '../../../../../types';
import { useEffect, useState } from 'react';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import CommentList from '@/app/components/news/CommentList';
import axios from 'axios';
import toast from 'react-hot-toast';
import RecentlyViewedProducts from '@/app/components/RecentlyViewedProducts';
import { Product } from '@prisma/client';
interface ArticleDetailsProps {
  article: any;
  allProducts: Product[];
  currentUser: SafeUser | null | undefined;
}

const ArticleDetails: React.FC<ArticleDetailsProps> = ({ article, currentUser, allProducts }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(0);

  const handleClick = (event: any, ratingValue: any) => {
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để đánh giá');
      return;
    }
    const payload: any = {
      userId: currentUser?.id,
      articleId: article.id,
      rating: ratingValue
    };
    axios
      .post('/api/articleComment', payload)
      .then(res => {
        setSelectedValue(ratingValue);
      })
      .catch(error => {
        toast.error('Đánh giá không thành công');
      });
  };
  const router = useRouter();

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleConfirm = () => {
    router.push('/login');
    toggleOpen();
  };

  // Kiểm tra xem bài viết này đã được currentUser đánh giá chưa
  const hasRated = article.reviews.some((review: any) => {
    return review.parentId === null && review.comment === null && review.userId === currentUser?.id;
  });

  //Lọc rating
  const filteredReviews = article.reviews.filter((review: any) => {
    return review.rating !== undefined && review.comment === null && review.parentId === null;
  });

  // Tính toán trung bình rating
  const averageRating =
    filteredReviews.reduce((total: any, review: any) => {
      return total + review.rating!;
    }, 0) / filteredReviews.length;

  const formattedRating = filteredReviews.length > 0 ? averageRating.toFixed(1) : '0.0';

  return (
    <>
      <div className='my-4 mx-3'>
        <div className='mb-[10px] w-full overflow-hidden bg-white py-[5px]'>
          <div className='hidden-scroll flex w-full items-center gap-[5px] overflow-y-auto'>
            <Link
              className='flex shrink-0 group hover:border-blue-700 items-center gap-[3px] rounded-[15px] border-[1px] border-[#e7e7e7] bg-[#f5f5f5] px-[10px] py-[2px] text-sm font-[500] text-[#676767] transition-all hover:border-cps hover:bg-hoverCps hover:text-cps'
              href='/news'
            >
              <svg
                stroke='currentColor'
                fill='currentColor'
                strokeWidth='0'
                viewBox='0 0 512 512'
                className='text-slate-700 group-hover:text-blue-500'
                height='15'
                width='15'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path d='M258.5 104.1c-1.5-1.2-3.5-1.2-5 0l-156 124.8c-.9.8-1.5 1.9-1.5 3.1v230c0 1.1.9 2 2 2h108c1.1 0 2-.9 2-2V322c0-1.1.9-2 2-2h92c1.1 0 2 .9 2 2v140c0 1.1.9 2 2 2h108c1.1 0 2-.9 2-2V232c0-1.2-.6-2.4-1.5-3.1l-156-124.8z'></path>
                <path d='M458.7 204.2l-189-151.4C265.9 49.7 261 48 256 48s-9.9 1.7-13.7 4.8L160 119.7V77.5c0-1.1-.9-2-2-2H98c-1.1 0-2 .9-2 2v92.2l-42.7 35.1c-3.1 2.5-5.1 6.2-5.3 10.2-.2 4 1.3 7.9 4.1 10.7 2.6 2.6 6.1 4.1 9.9 4.1 3.2 0 6.3-1.1 8.8-3.1l183.9-148c.5-.4.9-.4 1.3-.4s.8.1 1.3.4l183.9 147.4c2.5 2 5.6 3.1 8.8 3.1 3.7 0 7.2-1.4 9.9-4.1 2.9-2.8 4.4-6.7 4.2-10.7-.3-4-2.2-7.7-5.4-10.2z'></path>
              </svg>
              <span className='group-hover:text-blue-500'>Trang chủ</span>
            </Link>
            <svg
              stroke='currentColor'
              fill='currentColor'
              strokeWidth='0'
              viewBox='0 0 24 24'
              className='shrink-0 text-[#676767]'
              height='14'
              width='14'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path fill='none' d='M0 0h24v24H0z'></path>
              <path d='M6.41 6L5 7.41 9.58 12 5 16.59 6.41 18l6-6z'></path>
              <path d='M13 6l-1.41 1.41L16.17 12l-4.58 4.59L13 18l6-6z'></path>
            </svg>
            <Link
              className='block shrink-0 rounded-[15px] border-[1px] border-[#e7e7e7] hover:border-blue-700 hover:text-blue-500 bg-[#f5f5f5] px-[10px] py-[2px] text-sm font-[500] text-[#676767] transition-all hover:border-cps hover:bg-hoverCps hover:text-cps'
              href={`/news/${article.category.slug}`}
            >
              {article.category.name}
            </Link>
            <svg
              stroke='currentColor'
              fill='currentColor'
              strokeWidth='0'
              viewBox='0 0 24 24'
              className='shrink-0 text-[#676767]'
              height='14'
              width='14'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path fill='none' d='M0 0h24v24H0z'></path>
              <path d='M6.41 6L5 7.41 9.58 12 5 16.59 6.41 18l6-6z'></path>
              <path d='M13 6l-1.41 1.41L16.17 12l-4.58 4.59L13 18l6-6z'></path>
            </svg>
            <div className='line-clamp-1 min-w-[100px] flex-1 select-none text-ellipsis rounded-[8px] py-[1px] text-sm font-[500] text-[#676767]'>
              {article.title}
            </div>
          </div>
        </div>
      </div>

      <div className='relative aspect-[16/9] w-full sm:aspect-[12/5]'>
        <img
          alt='Apple đã mang đến những tính năng gì mới cho bản cập nhật iOS 18.1 beta 6?'
          title='Apple đã mang đến những tính năng gì mới cho bản cập nhật iOS 18.1 beta 6?'
          loading='eager'
          decoding='async'
          className='w-full rounded-lg object-cover sm:rounded-xl brightness-100'
          style={{ position: 'absolute', height: '100%', width: '100%', inset: 0, color: 'transparent' }}
          src={article.image}
        />
        {/* Khi responsive */}
        <div className='absolute bottom-[20px] left-0 w-full p-[5px] sm:hidden'>
          <div className='mb-[10px] flex w-full gap-[10px] '>
            <Link
              className='flex h-fit w-fit items-center gap-[5px] rounded-[5px] bg-slate-600 px-[8px] py-[5px] text-white sm:px-[12px]'
              href={`/news/${article.category.slug}`}
            >
              <span className='text-sm font-semibold sm:text-base'>{article.category.name}</span>
            </Link>
          </div>
          <p className='m-[0px] text-lg font-bold text-white'>{article.title}</p>
        </div>
      </div>
      <div className='relative m-auto !mt-[-20px] mb-[10px] w-full sm:!mt-[-30px] sm:max-w-[95%] md:max-w-[90%] lg:!mt-[-80px]'>
        <div className='w-full rounded-[10px] border border-gray-200 bg-white p-[5px] sm:rounded-[15px] sm:p-[10px] md:p-[15px] lg:p-[25px]'>
          <div className='mb-[10px]  hidden w-full gap-[10px] sm:flex '>
            <Link
              className='flex h-fit w-fit items-center gap-[5px] rounded-[5px] bg-slate-600 px-[8px] py-[5px] text-white sm:px-[12px]'
              href={`/news/${article.category.slug}`}
            >
              <span className='text-sm font-semibold sm:text-base text-white'>{article.category.name}</span>
            </Link>
          </div>
          <h1 className='m-0 hidden py-2 text-xl font-bold sm:inline-block sm:text-2xl lg:text-3xl'>{article.title}</h1>
          <div className='flex w-full flex-wrap items-center justify-between gap-2 py-2'>
            <div className='flex items-center gap-2'>
              <div className='h-9 w-9 rounded-full sm:h-10 sm:w-10'>
                <div className='relative h-full w-full rounded-full'>
                  <Image
                    className='rounded-full object-cover'
                    src={currentUser?.image ?? '/no-avatar-2.jpg'}
                    alt='admin'
                    width='80'
                    height='80'
                  />
                </div>
              </div>
              <div className='flex flex-col gap-1'>
                <a className='text-sm font-semibold text-red-600 sm:text-base' href='/sforum/author/trannghia'>
                  Admin
                </a>
                <div className='flex gap-1 text-xs font-light text-gray-600 sm:text-sm'>
                  <span className='flex items-center gap-1'>
                    <svg
                      stroke='currentColor'
                      fill='currentColor'
                      strokeWidth='0'
                      viewBox='0 0 24 24'
                      className='text-blue-500'
                      height='15'
                      width='15'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <path fill='none' d='M0 0h24v24H0V0z'></path>
                      <path d='M7 11h2v2H7v-2zm14-5v14c0 1.1-.9 2-2 2H5a2 2 0 01-2-2l.01-14c0-1.1.88-2 1.99-2h1V2h2v2h8V2h2v2h1c1.1 0 2 .9 2 2zM5 8h14V6H5v2zm14 12V10H5v10h14zm-4-7h2v-2h-2v2zm-4 0h2v-2h-2v2z'></path>
                    </svg>
                    <span className='text-xs text-gray-500'>
                      Ngày đăng: {format(new Date(article.createdAt), 'dd/MM/yyyy')}
                    </span>
                    <span>-</span>
                    <span className='text-xs text-gray-500'>
                      Cập nhật: {format(new Date(article.updatedAt), 'dd/MM/yyyy')}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className='relative mt-[10px] w-full pb-[20px]'>
            <div className='sm:mt-[10px]'>
              <div
                dangerouslySetInnerHTML={{
                  __html: article.content
                }}
              />
              {/* Sản phẩm đã xem 3 sản phẩm - compact mode */}
              <RecentlyViewedProducts
                allProducts={allProducts || []}
                maxProducts={3}
                showContainer={false}
                compact={true}
              />

              <div className='flex flex-col items-end'>
                <div className='pr-[3px]'>
                  {hasRated ? (
                    // Hiển thị thông báo khi user đã đánh giá
                    <p className='pr-[3px] text-base text-[#196f18] text-right'>Bạn đã đánh giá bài viết này rồi!</p>
                  ) : (
                    // Hiển thị ảnh nếu chưa đánh giá
                    selectedValue === 0 && (
                      <div className='pr-[15px]'>
                        <img
                          alt='danh-gia-bai-viet'
                          title='danh-gia-bai-viet'
                          loading='lazy'
                          width='100'
                          height='62'
                          decoding='async'
                          data-nimg='1'
                          src='https://cdn-static.sforum.vn/sforum/_next/static/media/danh-gia-bai-viet.98c2189c.png'
                        />
                      </div>
                    )
                  )}
                  {selectedValue > 0 && !hasRated && (
                    <div className='my-[5px] flex w-full justify-end'>
                      <div className='rounded border-[1px] border-[#10bd00] bg-[#4caf5030] px-[10px] py-[3px] text-sm font-[400] text-textGray'>
                        Cảm ơn bạn đã đánh giá <span className='text-lg'>🥰</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className='py-[5px]'>
                  {/* Ẩn Rating nếu user đã đánh giá */}
                  {!hasRated && <Rating onChange={handleClick} value={selectedValue} precision={0.5} size='large' />}
                </div>
                <div className='py-[3px]'>
                  ( {filteredReviews.length} lượt đánh giá - {formattedRating}/5)
                </div>
              </div>
            </div>
          </div>
        </div>
        <CommentList currentUser={currentUser} article={article} />
      </div>
      {isOpen && (
        <ConfirmDialog isOpen={isOpen} handleClose={toggleOpen} alert={true} onConfirm={handleConfirm}>
          Vui lòng đăng nhập tài khoản để gửi bình luận
        </ConfirmDialog>
      )}
    </>
  );
};

export default ArticleDetails;

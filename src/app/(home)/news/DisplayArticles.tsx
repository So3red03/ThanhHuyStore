'use client';
import { format } from 'date-fns';
import Link from 'next/link';
import { slugConvert } from '../../../../utils/Slug';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { getSummary } from '../../../../utils/Articles';
import { useAnalyticsTracker } from '@/app/hooks/useAnalytics';

interface DisplayArticlesProps {
  initialArticles: any;
  ArticlesListRightSide: any;
}

const DisplayArticles: React.FC<DisplayArticlesProps> = ({ initialArticles, ArticlesListRightSide }) => {
  const [articles, setArticles] = useState(initialArticles);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true); // Trạng thái hiển thị nút "Xem thêm"
  const [isLoading, setIsLoading] = useState(false);
  const [randomArticles, setRandomArticles] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Analytics tracker
  const { trackArticleView } = useAnalyticsTracker();

  // Fix hydration mismatch - chỉ chạy random trên client
  useEffect(() => {
    setIsClient(true);
    // Tạo random articles chỉ trên client để tránh hydration mismatch
    const shuffledArticles = [...articles].sort(() => Math.random() - 0.5);
    setRandomArticles(shuffledArticles.slice(0, 3));
  }, [articles]);

  const loadMore = async () => {
    setIsLoading(true);
    try {
      const skip = articles.length;

      const { data: newArticles } = await axios.get(`/api/articlePagination/${skip}/4`);

      setArticles((prev: any) => [...prev, ...newArticles]);

      if (newArticles.length < 4) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Lỗi khi tải thêm bài viết:', error);
    } finally {
      setIsLoading(false); // Tắt trạng thái loading
    }
  };

  // Fallback cho server-side rendering - sử dụng 3 articles đầu tiên
  const getDisplayArticles = () => {
    if (!isClient) {
      return articles.slice(0, 3); // Server-side: luôn trả về 3 articles đầu
    }
    return randomArticles; // Client-side: sử dụng random articles
  };

  const handleArticleClick = async (articleId: string, articleTitle?: string) => {
    try {
      // 🎯 Track analytics event for article click
      await trackArticleView(articleId, {
        articleTitle: articleTitle || 'Unknown',
        clickSource: 'DisplayArticles',
        interactionType: 'click'
      });

      // Lấy viewCount từ localStorage
      const viewCounts = JSON.parse(localStorage.getItem('articleViewCounts') || '{}');

      // Tăng số lần xem cho bài viết
      viewCounts[articleId] = (viewCounts[articleId] || 0) + 1;

      // Lưu lại vào localStorage
      localStorage.setItem('articleViewCounts', JSON.stringify(viewCounts));

      // Vẫn giữ nguyên API call để update trên server
      await axios.post(`/api/articleViewCount/${articleId}`);
    } catch (error) {
      console.error('Có lỗi xảy ra khi tăng viewCount hoặc track analytics:', error);
    }
  };

  return (
    <div className='py-8 px-4'>
      <div className='max-w-[1050px] mx-auto'>
        {/* Bài viết nổi bật */}
        <div className='flex w-full flex-col gap-[15px] sm:gap-[20px] md:flex-row md:items-stretch md:gap-[20px]'>
          <div className='flex-1'>
            <div className='relative block aspect-16/9 md:h-full h-[360px] w-full overflow-hidden rounded-[5px] '>
              <div className='relative h-full w-full'>
                <img
                  alt={`${articles[0].title}`}
                  title={`${articles[0].title}`}
                  loading='eager'
                  decoding='async'
                  data-nimg='fill'
                  className='h-full w-full object-cover'
                  src={`${articles[0].image}`}
                  style={{
                    position: 'absolute',
                    height: '100%',
                    width: '100%',
                    inset: 0,
                    color: 'transparent'
                  }}
                />
              </div>
              <div className='overlay-post absolute bottom-0 left-0 flex h-full w-full flex-col justify-between p-[10px] sm:p-[15px]'>
                <Link
                  className='mb-[10px] flex w-fit items-center gap-[6px] rounded-[5px] bg-slate-600 px-[10px] py-[2px] text-white'
                  href={`/news/${articles[0].category.slug}`}
                >
                  <span className='text-base font-[400] '>{articles[0].category.name}</span>
                </Link>
                <div className='flex w-full flex-col gap-[10px] '>
                  <Link
                    className='m-[0px] line-clamp-3 text-ellipsis text-base font-[500] text-white sm:text-lg'
                    href={`/article/${slugConvert(articles[0].title)}-${articles[0].id}`}
                  >
                    <h3 className='m-[0px]'>{articles[0].title}</h3>
                  </Link>
                  <div className='hidden w-full sm:block'>
                    <p className='line-clamp-2 text-ellipsis text-xs font-[300] text-white'>
                      {getSummary(articles[0].content)}
                    </p>
                  </div>
                  <div className='flex w-full items-center gap-[10px]'>
                    <div className='flex flex-wrap items-center gap-[10px] text-[#cfcfcf]'>
                      <div className='flex items-center gap-[2px] text-xs font-[500] sm:text-sm'>
                        <svg
                          stroke='currentColor'
                          fill='currentColor'
                          strokeWidth={0}
                          viewBox='0 0 256 256'
                          height={22}
                          width={22}
                          xmlns='http://www.w3.org/2000/svg'
                        >
                          <path d='M128,20A108,108,0,1,0,236,128,108.12,108.12,0,0,0,128,20ZM79.57,196.57a60,60,0,0,1,96.86,0,83.72,83.72,0,0,1-96.86,0ZM100,120a28,28,0,1,1,28,28A28,28,0,0,1,100,120ZM194,179.94a83.48,83.48,0,0,0-29-23.42,52,52,0,1,0-74,0,83.48,83.48,0,0,0-29,23.42,84,84,0,1,1,131.9,0Z' />
                        </svg>
                        <span>Admin</span>
                      </div>
                      <span className='flex items-center gap-[2px] text-xs font-[400] sm:text-sm'>
                        <svg
                          stroke='currentColor'
                          fill='currentColor'
                          strokeWidth={0}
                          viewBox='0 0 256 256'
                          height={19}
                          width={19}
                          xmlns='http://www.w3.org/2000/svg'
                        >
                          <path d='M236,137A108.13,108.13,0,1,1,119,20,12,12,0,0,1,121,44,84.12,84.12,0,1,0,212,135,12,12,0,1,1,236,137ZM116,76v52a12,12,0,0,0,12,12h52a12,12,0,0,0,0-24H140V76a12,12,0,0,0-24,0Zm92,20a16,16,0,1,0-16-16A16,16,0,0,0,208,96ZM176,64a16,16,0,1,0-16-16A16,16,0,0,0,176,64Z' />
                        </svg>
                        <span>
                          {articles[0].createdAt
                            ? format(new Date(articles[0].createdAt), 'dd/MM/yyyy')
                            : 'Không xác định'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className=' grid flex-1 grid-cols-1 grid-rows-3 gap-[15px] sm:gap-[20px] '>
            {getDisplayArticles().map((article: any) => (
              <div className='relative flex cursor-pointer items-start gap-[10px]' key={article.id}>
                <Link
                  className='relative block aspect-16/10 h-full w-[140px] flex-shrink-0 xs:w-[160px]'
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
                    className='h-full w-full rounded-[5px] object-cover'
                    src={article.image}
                    style={{ color: 'transparent' }}
                  />
                </Link>
                <div className='max-h-[60px] flex-1 '>
                  <Link
                    className='line-clamp-2 text-ellipsis text-sm font-[500] text-[#212B36] hover:text-blue-500 sm:text-base'
                    href={`/article/${slugConvert(article.title)}-${article.id}`}
                  >
                    <h3 className='m-[0px]'>{article.title}</h3>
                  </Link>
                  <div className='mt-[5px] flex flex-wrap items-center gap-[4px]  font-[500] text-[#637381] text-xs lg:mt-[8px] lg:gap-[8px]'>
                    <div className='flex items-center gap-[2px] text-blue-500'>
                      <svg
                        stroke='currentColor'
                        fill='currentColor'
                        strokeWidth={0}
                        viewBox='0 0 256 256'
                        height={18}
                        width={18}
                        xmlns='http://www.w3.org/2000/svg'
                      >
                        <path d='M128,20A108,108,0,1,0,236,128,108.12,108.12,0,0,0,128,20ZM79.57,196.57a60,60,0,0,1,96.86,0,83.72,83.72,0,0,1-96.86,0ZM100,120a28,28,0,1,1,28,28A28,28,0,0,1,100,120ZM194,179.94a83.48,83.48,0,0,0-29-23.42,52,52,0,1,0-74,0,83.48,83.48,0,0,0-29,23.42,84,84,0,1,1,131.9,0Z' />
                      </svg>
                      <span className='mt-[2px]'>Admin</span>
                    </div>
                    <span className='flex items-center gap-[2px]'>
                      <svg
                        stroke='currentColor'
                        fill='currentColor'
                        strokeWidth={0}
                        viewBox='0 0 256 256'
                        height={16}
                        width={16}
                        xmlns='http://www.w3.org/2000/svg'
                      >
                        <path d='M236,137A108.13,108.13,0,1,1,119,20,12,12,0,0,1,121,44,84.12,84.12,0,1,0,212,135,12,12,0,1,1,236,137ZM116,76v52a12,12,0,0,0,12,12h52a12,12,0,0,0,0-24H140V76a12,12,0,0,0-24,0Zm92,20a16,16,0,1,0-16-16A16,16,0,0,0,208,96ZM176,64a16,16,0,1,0-16-16A16,16,0,0,0,176,64Z' />
                      </svg>
                      <span className='mt-[2px]'>
                        {article.createdAt ? format(new Date(article.createdAt), 'dd/MM/yyyy') : 'Không xác định'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <section className='relative my-[30px] w-full'>
          <h2 className='mt-[0px] mb-[15px] block w-fit select-none text-xl font-[600] sm:text-2xl'>
            XEM NHIỀU TUẦN QUA
            <span className='mt-[5px] block w-[70%] border-b-[3px] border-slate-300'></span>
          </h2>
          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={10}
            slidesPerView={4}
            navigation
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            loop={true}
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
                slidesPerView: 4,
                spaceBetween: 10
              },
              1280: {
                slidesPerView: 4,
                spaceBetween: 20
              }
            }}
            className='w-full'
          >
            {articles.map((article: any) => (
              <SwiperSlide key={article.id} className='w-full'>
                <div className='w-full overflow-hidden'>
                  <Link
                    className='relative block aspect-16/9 w-full flex-shrink-0 overflow-hidden rounded-[5px]'
                    href={`/article/${slugConvert(article.title)}-${article.id}`}
                    onClick={() => handleArticleClick(article.id, article.title)}
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
                      <span className='text-xs'>
                        {article.createdAt ? format(new Date(article.createdAt), 'dd/MM/yyyy') : 'Không xác định'}
                      </span>
                    </span>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>

        <section className='mt-[30px] w-full items-start md:flex md:gap-[30px]'>
          {/* Bài viết bên trái */}
          <div className='w-full flex-shrink-0 md:w-[calc(100%-250px)] lg:w-[calc(100%-300px)] '>
            <div className='w-full'>
              <h2 className='mt-[0px] mb-[15px] block w-fit select-none text-xl font-[600]  sm:text-2xl'>
                TIN TỨC MỚI NHẤT
                <span className='mt-[5px] block w-[70%] border-b-[3px] border-slate-300'></span>
              </h2>
              <div className='w-full'>
                <div className='flex w-full flex-col gap-[10px] md:gap-[25px]'>
                  {articles?.map((article: any) => (
                    <div
                      key={article.id}
                      className='relative flex items-start justify-between gap-[10px] transition-all lg:gap-[15px] '
                    >
                      <Link
                        className='relative mt-[4px] block aspect-16/9 w-[140px] flex-shrink-0 overflow-hidden rounded-[5px] sm:w-[180px] md:w-[150px] lg:w-[240px]'
                        href={`/article/${slugConvert(article.title)}-${article.id}`}
                      >
                        <img
                          title={article.title}
                          alt={article.title}
                          loading='lazy'
                          width={300}
                          height={300}
                          decoding='async'
                          data-nimg={1}
                          className='block h-full w-full object-cover transition-all hover:scale-[1.05] '
                          src={article.image}
                          style={{ color: 'transparent' }}
                        />
                      </Link>
                      <div className='flex flex-1 flex-col gap-[9px]'>
                        <div className='w-full'>
                          <Link
                            className='block w-full text-[#212B36]  hover:text-blue-500'
                            href={`/article/${slugConvert(article.title)}-${article.id}`}
                          >
                            <h3 className='m-[0px] line-clamp-2 text-ellipsis text-sm font-[500] sm:text-[19px] sm:font-[600]'>
                              {article.title}
                            </h3>
                          </Link>
                        </div>
                        <div className='hidden w-full sm:block '>
                          {article.content ? (
                            <p className='line-clamp-2 text-[13.65px] text-ellipsis text-justify sm:text-xs text-sm font-[400]'>
                              {getSummary(article.content)}
                            </p>
                          ) : null}
                        </div>
                        <div className='flex w-full justify-between gap-[15px] text-[#637381]'>
                          <div className='flex flex-wrap items-center gap-[10px] mt-1'>
                            <div className='flex items-center gap-[3px] text-blue-500 text-xs sm:text-[13.65px]'>
                              <svg
                                stroke='currentColor'
                                fill='currentColor'
                                strokeWidth={0}
                                viewBox='0 0 256 256'
                                height={18}
                                width={18}
                                xmlns='http://www.w3.org/2000/svg'
                              >
                                <path d='M128,26A102,102,0,1,0,230,128,102.12,102.12,0,0,0,128,26ZM71.44,198a66,66,0,0,1,113.12,0,89.8,89.8,0,0,1-113.12,0ZM94,120a34,34,0,1,1,34,34A34,34,0,0,1,94,120Zm99.51,69.64a77.53,77.53,0,0,0-40-31.38,46,46,0,1,0-51,0,77.53,77.53,0,0,0-40,31.38,90,90,0,1,1,131,0Z' />
                              </svg>
                              <span>Admin</span>
                            </div>
                            <span className='flex items-center gap-[3px] font-[300] text-xs sm:text-[13.65px]'>
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
                              <span>
                                {article.createdAt
                                  ? format(new Date(article.createdAt), 'dd/MM/yyyy')
                                  : 'Không xác định'}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Nút "Xem thêm" */}
                {hasMore && (
                  <div className='mt-[20px] flex w-full justify-center'>
                    {isLoading ? (
                      <p>Đang tải</p>
                    ) : (
                      <button
                        type='button'
                        onClick={loadMore}
                        className='flex h-[35px] items-center gap-[3px] text-base font-[500] hover:text-blue-500'
                      >
                        <span className='underline'>Xem thêm</span>
                        <svg
                          stroke='currentColor'
                          fill='currentColor'
                          strokeWidth={0}
                          viewBox='0 0 512 512'
                          height={18}
                          width={18}
                          xmlns='http://www.w3.org/2000/svg'
                        >
                          <path d='M256 294.1L383 167c9.4-9.4 24.6-9.4 33.9 0s9.3 24.6 0 34L273 345c-9.1 9.1-23.7 9.3-33.1.7L95 201.1c-4.7-4.7-7-10.9-7-17s2.3-12.3 7-17c9.4-9.4 24.6-9.4 33.9 0l127.1 127z' />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className='mt-[30px] grid w-full grid-cols-1 gap-[30px] md:mt-[0px] md:w-[220px] lg:w-[270px]'>
            <div className='w-full max-w-[800px]'>
              <h2 className='relative text-[15px] uppercase font-semibold mb-4 inline-flex items-center p-3 pt-4 pr-16 bg-slate-700 text-white rounded-[16px] rounded-b-none'>
                <Link href='#' className='flex items-center'>
                  Xem nhanh
                </Link>
                <span className='absolute right-[-5px] bottom-[-5px]'>
                  <img
                    src='https://file.hstatic.net/200000636033/file/icon-blog-2_b45434d35b2c41b38931556be9e6dd2f.png'
                    alt='Icon'
                    className='h-[65px]'
                  />
                </span>
              </h2>
              <div className='mb-[10px] flex w-full flex-col gap-[15px] sm:mb-[15px] sm:gap-[20px] '>
                {articles?.map((article: any) => (
                  <Link
                    className='relative flex cursor-pointer items-start justify-between gap-[10px]'
                    href={`/article/${slugConvert(article.title)}-${article.id}`}
                    key={article.id}
                  >
                    <img
                      title={article.title}
                      alt={article.title}
                      loading='lazy'
                      width={240}
                      height={100}
                      decoding='async'
                      data-nimg={1}
                      className='block max-w-[40%] flex-1 shrink-0 rounded-[3px] object-cover sm:max-w-[80px]'
                      src={article.image}
                      style={{ color: 'transparent' }}
                    />
                    <div className='max-h-[60px] flex-1 text-[#212B36]  hover:text-blue-500'>
                      <h3
                        className='shadow-black  m-[0px] line-clamp-3 text-ellipsis text-xs font-[500] sm:font-[600] '
                        style={{ containerType: 'inline-size' }}
                      >
                        {article.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
              {/* <div className="flex w-full justify-end">
								<a
									className="flex h-[35px] items-center gap-[3px] text-sm font-[500]  hover:text-blue-500"
									href="/sforum/tag/snews-cuoi-tuan"
								>
									<span className="underline">Xem thêm</span>
									<svg
										stroke="currentColor"
										fill="currentColor"
										strokeWidth={0}
										viewBox="0 0 512 512"
										className="rotate-[-90deg]"
										height={18}
										width={18}
										xmlns="http://www.w3.org/2000/svg"
									>
										<path d="M256 294.1L383 167c9.4-9.4 24.6-9.4 33.9 0s9.3 24.6 0 34L273 345c-9.1 9.1-23.7 9.3-33.1.7L95 201.1c-4.7-4.7-7-10.9-7-17s2.3-12.3 7-17c9.4-9.4 24.6-9.4 33.9 0l127.1 127z" />
									</svg>
								</a>
							</div> */}
            </div>
            <div className='w-full max-w-[800px]'>
              <h2 className='relative text-[15px] uppercase font-semibold mb-4 inline-flex items-center p-3 pt-4 pr-16 bg-slate-700 text-white rounded-[16px] rounded-b-none'>
                <Link href='/news/thu-thuat-hoi-dap' className='flex items-center'>
                  Thủ Thuật
                </Link>
                <span className='absolute right-[-25px] bottom-[-5px]'>
                  <img
                    src='https://file.hstatic.net/200000636033/file/icon-blog-3_82fd4b19be0347638526eb1b3592996d.png'
                    alt='Icon'
                    className='h-[80px]'
                  />
                </span>
              </h2>
              <div className='mb-[10px] flex w-full flex-col gap-[15px] sm:mb-[15px] sm:gap-[20px] '>
                {ArticlesListRightSide?.map((article: any) => (
                  <Link
                    className='relative flex cursor-pointer items-start justify-between gap-[10px]'
                    href={`/article/${slugConvert(article.title)}-${article.id}`}
                    key={article.id}
                  >
                    <img
                      title={article.title}
                      alt={article.title}
                      loading='lazy'
                      width={240}
                      height={100}
                      decoding='async'
                      data-nimg={1}
                      className='block max-w-[40%] flex-1 shrink-0 rounded-[3px] object-cover sm:max-w-[80px]'
                      src={article.image}
                      style={{ color: 'transparent' }}
                    />
                    <div className='max-h-[60px] flex-1 text-[#212B36]  hover:text-blue-500'>
                      <h3
                        className='shadow-black  m-[0px] line-clamp-3 text-ellipsis text-xs font-[500] sm:font-[600] '
                        style={{ containerType: 'inline-size' }}
                      >
                        {article.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
              {/* <div className="flex w-full justify-end">
								<a
									className="flex h-[35px] items-center gap-[3px] text-sm font-[500]  hover:text-blue-500"
									href="/sforum/tag/snews-cuoi-tuan"
								>
									<span className="underline">Xem thêm</span>
									<svg
										stroke="currentColor"
										fill="currentColor"
										strokeWidth={0}
										viewBox="0 0 512 512"
										className="rotate-[-90deg]"
										height={18}
										width={18}
										xmlns="http://www.w3.org/2000/svg"
									>
										<path d="M256 294.1L383 167c9.4-9.4 24.6-9.4 33.9 0s9.3 24.6 0 34L273 345c-9.1 9.1-23.7 9.3-33.1.7L95 201.1c-4.7-4.7-7-10.9-7-17s2.3-12.3 7-17c9.4-9.4 24.6-9.4 33.9 0l127.1 127z" />
									</svg>
								</a>
							</div> */}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DisplayArticles;

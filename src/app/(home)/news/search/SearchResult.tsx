'use client';

import { format } from 'date-fns';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { slugConvert } from '../../../utils/Slug';
import { getSummary } from '../../../utils/Articles';
import Heading from '@/app/components/Heading';
import NotFound from '@/app/components/NotFound';

interface SearchResultProps {
  articles: any;
  initialArticles: any;
}
const SearchResult: React.FC<SearchResultProps> = ({ articles, initialArticles }) => {
  const [initialArticlesState, setInitialArticlesState] = useState(initialArticles);
  const [filteredArticles, setFilteredArticles] = useState<[]>([]);
  const searchParams = useSearchParams();
  const searchTerm = searchParams?.get('searchTerm'); // Lấy từ khóa từ URL

  useEffect(() => {
    if (searchTerm) {
      // Lọc bài viết theo từ khóa
      setFilteredArticles(
        articles.filter((article: any) => article.title.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
  }, [searchTerm, articles]);

  return (
    <div className='w-full'>
      <main className='w-full'>
        <div className='w-full'>
          <div className='mb-[10px] w-full overflow-hidden bg-white py-[5px]'>
            <div className='hidden-scroll flex w-full items-center gap-[5px] overflow-y-auto'>
              <a
                className='flex shrink-0 items-center gap-[3px] rounded-[15px] border-[1px] border-[#e7e7e7] bg-[#f5f5f5] px-[10px] py-[2px] text-sm font-[500] text-[#676767] transition-all hover:border-cps hover:bg-hoverCps hover:text-blue-500'
                href='/news'
              >
                <svg
                  stroke='currentColor'
                  fill='currentColor'
                  strokeWidth={0}
                  viewBox='0 0 512 512'
                  className='text-cps'
                  height={15}
                  width={15}
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path d='M258.5 104.1c-1.5-1.2-3.5-1.2-5 0l-156 124.8c-.9.8-1.5 1.9-1.5 3.1v230c0 1.1.9 2 2 2h108c1.1 0 2-.9 2-2V322c0-1.1.9-2 2-2h92c1.1 0 2 .9 2 2v140c0 1.1.9 2 2 2h108c1.1 0 2-.9 2-2V232c0-1.2-.6-2.4-1.5-3.1l-156-124.8z' />
                  <path d='M458.7 204.2l-189-151.4C265.9 49.7 261 48 256 48s-9.9 1.7-13.7 4.8L160 119.7V77.5c0-1.1-.9-2-2-2H98c-1.1 0-2 .9-2 2v92.2l-42.7 35.1c-3.1 2.5-5.1 6.2-5.3 10.2-.2 4 1.3 7.9 4.1 10.7 2.6 2.6 6.1 4.1 9.9 4.1 3.2 0 6.3-1.1 8.8-3.1l183.9-148c.5-.4.9-.4 1.3-.4s.8.1 1.3.4l183.9 147.4c2.5 2 5.6 3.1 8.8 3.1 3.7 0 7.2-1.4 9.9-4.1 2.9-2.8 4.4-6.7 4.2-10.7-.3-4-2.2-7.7-5.4-10.2z' />
                </svg>
                <span>Trang chủ</span>
              </a>
              <svg
                stroke='currentColor'
                fill='currentColor'
                strokeWidth={0}
                viewBox='0 0 24 24'
                className='shrink-0 text-[#676767]'
                height={14}
                width={14}
                xmlns='http://www.w3.org/2000/svg'
              >
                <path fill='none' d='M0 0h24v24H0z' />
                <path d='M6.41 6L5 7.41 9.58 12 5 16.59 6.41 18l6-6z' />
                <path d='M13 6l-1.41 1.41L16.17 12l-4.58 4.59L13 18l6-6z' />
              </svg>
              <div className='line-clamp-1 min-w-[100px] flex-1 select-none text-ellipsis rounded-[8px] py-[1px] text-sm font-[500] text-[#676767]'>
                Tìm kiếm : {searchTerm}
              </div>
            </div>
          </div>
          <h1 className='my-[20px] text-lg font-[500] sm:text-xl'>
            Bạn đang tìm kiếm: <strong>{searchTerm}</strong>
          </h1>

          <div className='flex flex-col md:flex-row md:gap-[30px]'>
            {searchTerm && filteredArticles.length === 0 ? (
              <div className='w-full flex-shrink-0 md:w-[calc(100%-250px)] lg:w-[calc(100%-300px)]'>
                <div className='flex w-full flex-col gap-[10px] md:gap-[25px]'>
                  <div className='flex justify-center flex-col items-center gap-8 mt-8'>
                    <NotFound />
                    <div className='flex justify-center flex-col items-center gap-3'>
                      <p className='text-md font-semibold'>Không có kết quả bạn cần tìm</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className='w-full flex-shrink-0 md:w-[calc(100%-250px)] lg:w-[calc(100%-300px)]'>
                <div className='flex w-full flex-col gap-[10px] md:gap-[25px]'>
                  {articles?.map((article: any, index: any) => (
                    <div
                      key={index}
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
                <div className='mt-[20px] flex w-full justify-center' />
              </div>
            )}
            <div className='mt-[30px] grid w-full grid-cols-1 gap-[30px] md:mt-[0px] md:w-[220px] lg:w-[270px]'>
              <div className='w-full'>
                <div className='w-full max-w-[800px]'>
                  <h2 className='mt-[0px] mb-[15px] block w-fit select-none text-xl font-[600] sm:text-2xl'>
                    BÀI VIẾT MỚI NHẤT
                    <span className='mt-[5px] block w-[70%] border-b-[3px] border-slate-300'></span>
                  </h2>
                  <Link
                    className='relative mb-[10px] block w-full overflow-hidden rounded-[5px] sm:mb-[15px]'
                    href={`/article/${slugConvert(initialArticlesState[0].title)}-${initialArticlesState[0].id}`}
                  >
                    <img
                      alt={initialArticlesState[0].title}
                      title={initialArticlesState[0].title}
                      loading='lazy'
                      width={640}
                      height={360}
                      decoding='async'
                      data-nimg={1}
                      className='block aspect-16/9 w-full object-cover '
                      src={initialArticlesState[0].image}
                      style={{ color: 'transparent' }}
                    />
                    <div className='overlay-post absolute bottom-0 left-0 flex h-full w-full flex-col justify-end px-[5px] py-[10px]'>
                      <div className='w-full'>
                        <h3 className='m-[0px] line-clamp-3 text-ellipsis text-justify text-sm font-[500] text-white'>
                          {initialArticlesState[0].title}
                        </h3>
                      </div>
                    </div>
                  </Link>
                  {initialArticlesState.slice(1).map((article: any, index: any) => (
                    <div
                      key={article.id}
                      className='mb-[10px] flex w-full flex-col gap-[15px] sm:mb-[15px] sm:gap-[20px] '
                    >
                      <Link
                        className='relative flex cursor-pointer items-start justify-between gap-[10px]'
                        href={`/article/${slugConvert(article.title)}-${article.id}`}
                      >
                        <div className='max-h-[60px] flex-1 hover:text-blue-500'>
                          <h3
                            className='shadow-black m-[0px] line-clamp-3 text-ellipsis text-sm font-[500] sm:font-[600]'
                            style={{ containerType: 'inline-size' }}
                          >
                            {article.title}
                          </h3>
                        </div>
                        <img
                          alt={article.title}
                          title={article.title}
                          loading='lazy'
                          width={320}
                          height={180}
                          decoding='async'
                          data-nimg={1}
                          className='block aspect-16/9 max-w-[40%] flex-1 shrink-0 rounded-[3px] object-cover sm:max-w-[120px]'
                          src={article.image}
                          style={{ color: 'transparent' }}
                        />
                      </Link>
                    </div>
                  ))}
                  <div className='flex w-full justify-end' />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SearchResult;

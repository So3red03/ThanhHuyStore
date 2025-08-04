'use client';
import { FaCalendarAlt } from 'react-icons/fa';
import { format } from 'date-fns';
import Link from 'next/link';
import { slugConvert } from '../../../utils/Slug';
import { truncateTextArticle } from '../../../utils/truncateText';
import { Article } from '@prisma/client';
import { useEffect, useState } from 'react';
interface ArticleListProps {
  articles: any[] | undefined;
}

const ArticleList = ({ articles }: ArticleListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredArticles, setFilteredArticles] = useState<any[]>([]);

  useEffect(() => {
    if (articles) {
      setFilteredArticles(articles);
    }
  }, [articles]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (articles) {
      const filtered = articles.filter(article => article.title.toLowerCase().includes(searchQuery.toLowerCase()));
      setFilteredArticles(filtered);
    }
  };

  if (articles)
    return (
      <div className='mt-3'>
        <div className='my-4'>
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
              <div className='line-clamp-1 min-w-[100px] flex-1 select-none text-ellipsis rounded-[8px] py-[1px] text-sm font-[500] text-[#676767]'>
                {articles[0]?.category?.name}
              </div>
            </div>
          </div>
        </div>
        <div>
          {/* Thanh tìm kiếm */}
          <div className='relative select-none w-[270px] lg:w-[415px] my-4'>
            <form onSubmit={handleSearch} className='relative select-none w-[270px] lg:w-[415px] my-4'>
              <input
                type='text'
                autoComplete='off'
                placeholder='Tìm kiếm'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-4 pr-10 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 w-full'
              />
              <button type='submit' className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600'>
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 10-13 0 6.5 6.5 0 0013 0z'
                  ></path>
                </svg>
              </button>
            </form>
          </div>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4'>
          {filteredArticles.map((article: any) => (
            <Link
              href={`/article/${slugConvert(article.title)}-${article.id}`}
              key={article.id}
              className='rounded-lg overflow-hidden cursor-pointer'
            >
              <img src={article.image} alt={article.title} loading='lazy' className='w-full h-40 object-cover' />
              <div className='p-4 bg-gray-100'>
                <h2 className='font-bold hover:text-blue-500'>{truncateTextArticle(article.title)}</h2>
                <div className='flex items-center justify-start text-sm text-gray-500 mt-2'>
                  <FaCalendarAlt className='mr-1' />
                  <span>{format(new Date(article.createdAt), 'dd/MM/yyyy')}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
};

export default ArticleList;

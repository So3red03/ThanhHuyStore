import React from 'react';
import NewsMenu from '@/app/components/news/Menu';
import { getArticlesCategory } from '@/app/actions/getArticlesCategory';

export default async function NewsLayout({ children }: { children: React.ReactNode }) {
  // Use direct database action instead of axios to avoid dynamic server usage
  const articeCategory = await getArticlesCategory();
  return (
    <div className='max-w-[1280px] mx-auto flex flex-col lg:flex-row pb-10 lg:mt-5 mt-2 relative'>
      <div className='lg:w-[20%] lg:pr-9 px-4 lg:px-0'>
        <NewsMenu newsMenu={articeCategory} />
      </div>
      <div className='lg:w-[80%]'>{children}</div>
    </div>
  );
}

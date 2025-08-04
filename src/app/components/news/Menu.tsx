'use client';
import { usePathname, useRouter } from 'next/navigation';
import { slugConvert } from '../../utils/Slug';
import Link from 'next/link';
import { ArticleCategory } from '@prisma/client';
import * as SlIcons from 'react-icons/sl';
import * as AiIcons from 'react-icons/ai';
import * as TbIcons from 'react-icons/tb';
import * as MdIcons from 'react-icons/md';

interface NewsMenuProps {
  newsMenu: ArticleCategory[];
}
const NewsMenu: React.FC<NewsMenuProps> = ({ newsMenu }) => {
  const pathName = usePathname();
  const router = useRouter();

  // Icons mapping
  const Icons = { ...SlIcons, ...AiIcons, ...MdIcons, ...TbIcons };

  return (
    <ul className='group pb-1 lg:pb-0 lg:mb-0 mt-0 lg:mt-3 flex flex-row lg:flex-col justify-center gap-y-1 lg:sticky lg:top-[135px] overflow-y-auto scrollbar-none hover:scrollbar-thin hover:scrollbar-thumb-[#c0c0c0] hover:scrollbar-track-transparent'>
      {newsMenu.map(item => {
        const itemUrl = `/news/${item.slug}`;
        const isHomeSelected = item.name === 'Trang chủ' && pathName === '/news';
        const isSelected = pathName === itemUrl;
        if (pathName === '/news/trang-chu') {
          router.push('/news');
        }

        return (
          <Link
            key={item.id}
            href={itemUrl}
            className={`border-transparent hover:text-blue-500 group hover:bg-gray-100 text-slate-700 border-b-2 text-base font-semibold ml-0 lg:ml-4 p-3 px-3 rounded-md cursor-pointer flex flex-col lg:flex-row items-center whitespace-nowrap lg:whitespace-normal gap-x-2 ${
              (isSelected || isHomeSelected) && '!text-blue-500 bg-gray-100'
            }`}
          >
            {item.icon
              ? (() => {
                  const IconComponent = Icons[item.icon as keyof typeof Icons];
                  return IconComponent ? <IconComponent size={20} /> : null;
                })()
              : null}
            <span className='text-xs lg:text-base'>{item.name}</span>
          </Link>
        );
      })}
    </ul>
  );
};

export default NewsMenu;

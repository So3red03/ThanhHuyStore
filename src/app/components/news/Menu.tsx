'use client';
import { usePathname, useRouter } from 'next/navigation';
import { slugConvert } from '../../../../utils/Slug';
import Link from 'next/link';
import { ArticleCategory } from '@prisma/client';

interface NewsMenuProps {
	newsMenu: ArticleCategory[];
}
const NewsMenu: React.FC<NewsMenuProps> = ({ newsMenu }) => {
	const pathName = usePathname();
	const router = useRouter();
	const menuItems = [
		{
			id: 1,
			label: 'Trang chủ',
			slug: 'trang-chu',
			icon: (
				<svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M9.02 2.84001L3.63 7.04001C2.73 7.74001 2 9.23001 2 10.36V17.77C2 20.09 3.89 21.99 6.21 21.99H17.79C20.11 21.99 22 20.09 22 17.78V10.5C22 9.29001 21.19 7.74001 20.2 7.05001L14.02 2.72001C12.62 1.74001 10.37 1.79001 9.02 2.84001Z"
						stroke="currentColor"
						strokeWidth="1.5"
					/>
					<path d="M12 17.99V14.99" stroke="currentColor" strokeWidth="1.5" />
				</svg>
			),
		},
		{
			id: 2,
			label: 'Tin tức Apple',
			slug: 'tin-tuc-apple',
			icon: (
				<svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z"
						stroke="currentColor"
						strokeWidth="1.5"
					/>
					<path
						d="M15.5 2V9.85999C15.5 10.3 14.98 10.52 14.66 10.23L12.34 8.09003C12.15 7.91003 11.85 7.91003 11.66 8.09003L9.34003 10.23C9.02003 10.52 8.5 10.3 8.5 9.85999V2H15.5Z"
						stroke="currentColor"
						strokeWidth="1.5"
					/>
					<path d="M13.25 14H17.5" stroke="currentColor" strokeWidth="1.5" />
					<path d="M9 18H17.5" stroke="currentColor" strokeWidth="1.5" />
				</svg>
			),
		},
		{
			id: 3,
			label: 'Khám phá',
			slug: 'kham-pha',
			icon: (
				<svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22"
						stroke="currentColor"
						strokeWidth="1.5"
					/>
					<path
						d="M8.0001 3H9.0001C7.0501 8.84 7.0501 15.16 9.0001 21H8.0001"
						stroke="currentColor"
						strokeWidth="1.5"
					/>
					<path d="M15 3C15.97 5.92 16.46 8.96 16.46 12" stroke="currentColor" strokeWidth="1.5" />
					<path d="M3 16V15C5.92 15.97 8.96 16.46 12 16.46" stroke="currentColor" strokeWidth="1.5" />
					<path
						d="M3 8.99998C8.84 7.04998 15.16 7.04998 21 8.99998"
						stroke="currentColor"
						strokeWidth="1.5"
					/>
					<path
						d="M18.2 21.4C19.9673 21.4 21.4 19.9673 21.4 18.2C21.4 16.4327 19.9673 15 18.2 15C16.4327 15 15 16.4327 15 18.2C15 19.9673 16.4327 21.4 18.2 21.4Z"
						stroke="currentColor"
						strokeWidth="1.5"
					/>
					<path d="M22 22L21 21" stroke="currentColor" strokeWidth="1.5" />
				</svg>
			),
		},
		{
			id: 4,
			label: 'Đánh giá',
			slug: 'danh-gia',
			icon: (
				<svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M4.91992 20.28L6.68993 21.65C6.91993 21.88 7.42992 21.99 7.77992 21.99H9.94992C10.6399 21.99 11.3799 21.48 11.5499 20.79L12.9199 16.62C13.2099 15.82 12.6899 15.13 11.8299 15.13H9.53992C9.19992 15.13 8.90992 14.8399 8.96992 14.4399L9.25993 12.61C9.36993 12.1 9.02992 11.52 8.51992 11.35C8.05992 11.18 7.48993 11.41 7.25993 11.75L4.91992 15.24"
						stroke="currentColor"
						strokeWidth="1.5"
					></path>
					<path
						d="M2 20.28V14.6801C2 13.8801 2.34 13.59 3.14 13.59H3.71C4.51 13.59 4.85 13.8801 4.85 14.6801V20.28C4.85 21.08 4.51 21.37 3.71 21.37H3.14C2.34 21.37 2 21.09 2 20.28Z"
						stroke="currentColor"
						strokeWidth="1.5"
					></path>
					<path
						d="M19.0801 3.71997L17.3101 2.34998C17.0801 2.11998 16.5701 2.01001 16.2201 2.01001H14.0501C13.3601 2.01001 12.6201 2.51996 12.4501 3.20996L11.0801 7.38C10.7901 8.18 11.3101 8.87 12.1701 8.87H14.4601C14.8001 8.87 15.0901 9.16006 15.0301 9.56006L14.7401 11.39C14.6301 11.9 14.9701 12.48 15.4801 12.65C15.9401 12.82 16.5101 12.59 16.7401 12.25L19.0801 8.76001"
						stroke="currentColor"
						strokeWidth="1.5"
					></path>
					<path
						d="M22.0001 3.71997V9.31995C22.0001 10.1199 21.6601 10.41 20.8601 10.41H20.2901C19.4901 10.41 19.1501 10.1199 19.1501 9.31995V3.71997C19.1501 2.91997 19.4901 2.63 20.2901 2.63H20.8601C21.6601 2.63 22.0001 2.90997 22.0001 3.71997Z"
						stroke="currentColor"
						strokeWidth="1.5"
					></path>
				</svg>
			),
		},
		{
			id: 5,
			label: 'Thủ thuật - Hỏi đáp',
			slug: 'thu-thuat-hoi-dap',
			icon: (
				<svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M20 12.2V13.9C20 17.05 18.2 18.4 15.5 18.4H6.5C3.8 18.4 2 17.05 2 13.9V8.5C2 5.35 3.8 4 6.5 4H9.2C9.07 4.38 9 4.8 9 5.25V9.15002C9 10.12 9.32 10.94 9.89 11.51C10.46 12.08 11.28 12.4 12.25 12.4V13.79C12.25 14.3 12.83 14.61 13.26 14.33L16.15 12.4H18.75C19.2 12.4 19.62 12.33 20 12.2Z"
						stroke="currentColor"
						strokeWidth="1.5"
					></path>
					<path
						d="M22 5.25V9.15002C22 10.64 21.24 11.76 20 12.2C19.62 12.33 19.2 12.4 18.75 12.4H16.15L13.26 14.33C12.83 14.61 12.25 14.3 12.25 13.79V12.4C11.28 12.4 10.46 12.08 9.89 11.51C9.32 10.94 9 10.12 9 9.15002V5.25C9 4.8 9.07 4.38 9.2 4C9.64 2.76 10.76 2 12.25 2H18.75C20.7 2 22 3.3 22 5.25Z"
						stroke="currentColor"
						strokeWidth="1.5"
					></path>
					<path d="M7.3999 22H14.5999" stroke="currentColor" strokeWidth="1.5"></path>
					<path d="M11 18.4V22" stroke="currentColor" strokeWidth="1.5"></path>
					<path d="M18.4955 7.25H18.5045" stroke="currentColor" strokeWidth="1.5"></path>
					<path d="M15.6957 7.25H15.7047" stroke="currentColor" strokeWidth="1.5"></path>
					<path d="M12.8954 7.25H12.9044" stroke="currentColor" strokeWidth="1.5"></path>
				</svg>
			),
		},
		{
			id: 6,
			label: 'Khuyến mãi',
			slug: 'khuyen-mai',
			icon: (
				<svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M8.9889 19.6604L7.46891 18.1404C6.84891 17.5204 6.84891 16.5004 7.46891 15.8804L8.9889 14.3604C9.2489 14.1004 9.4589 13.5904 9.4589 13.2304V11.0804C9.4589 10.2004 10.1789 9.48038 11.0589 9.48038H13.2089C13.5689 9.48038 14.0789 9.27041 14.3389 9.01041L15.8589 7.49039C16.4789 6.87039 17.4989 6.87039 18.1189 7.49039L19.6389 9.01041C19.8989 9.27041 20.4089 9.48038 20.7689 9.48038H22.9189C23.7989 9.48038 24.5189 10.2004 24.5189 11.0804V13.2304C24.5189 13.5904 24.7289 14.1004 24.9889 14.3604L26.5089 15.8804C27.1289 16.5004 27.1289 17.5204 26.5089 18.1404L24.9889 19.6604C24.7289 19.9204 24.5189 20.4304 24.5189 20.7904V22.9403C24.5189 23.8203 23.7989 24.5404 22.9189 24.5404H20.7689C20.4089 24.5404 19.8989 24.7504 19.6389 25.0104L18.1189 26.5304C17.4989 27.1504 16.4789 27.1504 15.8589 26.5304L14.3389 25.0104C14.0789 24.7504 13.5689 24.5404 13.2089 24.5404H11.0589C10.1789 24.5404 9.4589 23.8203 9.4589 22.9403V20.7904C9.4589 20.4204 9.2489 19.9104 8.9889 19.6604Z"
						stroke="currentColor"
						strokeWidth="1.5"
					></path>
					<path d="M14 20L20 14" stroke="currentColor" strokeWidth="1.5"></path>
					<path d="M19.4945 19.5H19.5035" stroke="currentColor" strokeWidth="2"></path>
					<path d="M14.4945 14.5H14.5035" stroke="currentColor" strokeWidth="2"></path>
				</svg>
			),
		},
	];
	return (
		<ul className="group pb-1 lg:pb-0 lg:mb-0 mt-0 lg:mt-3 flex flex-row lg:flex-col justify-center gap-y-1 lg:sticky lg:top-[135px] overflow-y-auto scrollbar-none hover:scrollbar-thin hover:scrollbar-thumb-[#c0c0c0] hover:scrollbar-track-transparent">
			{menuItems.map((item) => {
				const itemUrl = `/news/${item.slug}`;
				const isHomeSelected = item.label === 'Trang chủ' && pathName === '/news';
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
						{item.icon}
						<span className="text-xs lg:text-base">{item.label}</span>
					</Link>
				);
			})}
		</ul>
	);
};

export default NewsMenu;

'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { categories } from '../../../../utils/Categories';
import Container from '../Container';
import { useEffect, useState } from 'react';
import Category from './Category';
import Link from 'next/link';
import { BiNews } from 'react-icons/bi';
import { LiaApple } from 'react-icons/lia';

interface CategoriesProps {
	categories: any;
}
const Categories: React.FC<CategoriesProps> = ({categories}) => {
	const [selectedCategory, setSelectedCategory] = useState<string | null | undefined>('All');
	const pathName = usePathname();

	// Hàm xử lý khi nhấn vào category
	const handleCategoryClick = (value: string) => {
		setSelectedCategory(value);
	};

	// useEffect(() => {
	// 	if (pathName === '/') {
	// 		setSelectedCategory('All');
	// 	} else if (pathName === '/news') {
	// 		setSelectedCategory('News');
	// 	} else if (pathName === '/comparison') {
	// 		setSelectedCategory('Comparison');
	// 	} else {
	// 		setSelectedCategory(category);
	// 	}
	// }, [pathName]);
	const selectedNews = pathName === '/news';
	const selectedComparison = pathName === '/comparison';
	if (pathName?.startsWith('/admin')) return null;
	return (
		<div className="bg-white hidden lg:block">
			<Container>
				<div className="pt-4 flex flex-row items-center justify-evenly">
					{categories.map((item: any) => {
						return (
							<Category
								key={item.id}
								label={item.name}
								category={item.slug}
								icon={item.icon}
								subItems={item.subcategories}
								subItemsImg={item.image}
								selected={selectedCategory === item.slug} // So sánh với state để kích hoạt selected
								onClick={() => handleCategoryClick(item.slug)}
							/>
						);
					})}
					<Link
						href={'/news'}
						className={`select-none whitespace-nowrap flex items-center justify-center text-center gap-1 p-2 border-b-2 hover:text-slate-800 hover:border-b-slate-700 cursor-pointer ${
							selectedNews ? 'border-b-slate-700 text-slate-800' : 'border-transparent text-slate-500'
						}`}
					>
						<BiNews size={20} />
						<div className="font-medium text-sm">Tin tức</div>
					</Link>
					<Link
						href={'/comparison'}
						className={`select-none whitespace-nowrap flex items-center justify-center text-center gap-1 p-2 border-b-2 hover:text-slate-800 hover:border-b-slate-700 cursor-pointer ${
							selectedComparison ? 'border-b-slate-700 text-slate-800' : 'border-transparent text-slate-500'
						}`}
					>
						<LiaApple size={20} />
						<div className="font-medium text-sm">Tìm hiểu thêm về Iphone</div>
					</Link>
				</div>
			</Container>
		</div>
	);
};

export default Categories;

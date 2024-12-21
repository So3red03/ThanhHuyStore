'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { categories } from '../../../../utils/Categories';
import Container from '../Container';
import Category from './Category';
import { useEffect, useState } from 'react';

const Categories = () => {
	const [selectedCategory, setSelectedCategory] = useState<string | null | undefined>('All');
	const params = useSearchParams();
	// Lấy giá trị của category trong URL
	const category = params?.get('category');
	const pathName = usePathname();

	// Hàm xử lý khi nhấn vào category
	const handleCategoryClick = (value: string) => {
		setSelectedCategory(value);
	};

	useEffect(() => {
		if (!category && pathName === '/') {
			setSelectedCategory('All');
		} else if (!category && pathName === '/news') {
			setSelectedCategory('News');
		} else if (!category && pathName === '/comparison') {
			setSelectedCategory('Comparison');
		} else {
			setSelectedCategory(category);
		}
	}, [pathName, category]);

	if (pathName?.startsWith('/admin')) return null;
	return (
		<div className="bg-white hidden lg:block">
			<Container>
				<div className="pt-4 flex flex-row items-center justify-evenly">
					{categories.map((item): any => {
						return (
							<Category
								key={item.label}
								label={item.label}
								category={item.value}
								icon={item.icon}
								subItems={item.subItems}
								subItemsImg={item.subItemsImg}
								selected={selectedCategory === item.value} // So sánh với state để kích hoạt selected
								onClick={() => handleCategoryClick(item.value)}
							/>
						);
					})}
				</div>
			</Container>
		</div>
	);
};

export default Categories;

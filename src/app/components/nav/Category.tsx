'use client';
import { LinkAuthenticationElement } from '@stripe/react-stripe-js';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import queryString from 'query-string';
import { useCallback, useState } from 'react';
import { IconType } from 'react-icons';
import { slugConvert } from '../../../../utils/Slug';

interface CategoryProps {
	label: string;
	category: string;
	subItemsImg: string | undefined;
	subItems: string[] | undefined;
	icon: IconType;
	selected?: boolean;
	onClick: () => void;
}

const Category: React.FC<CategoryProps> = ({
	label,
	category,
	subItems,
	subItemsImg,
	icon: Icon,
	selected,
	onClick,
}) => {
	const [isHovered, setIsHovered] = useState(false);
	const pathName = usePathname();
	let href = '/';
	if (category === 'News') {
		href = '/news';
	} else if (category === 'Comparison') {
		href = '/comparison';
	} else if (category !== 'All') {
		href = queryString.stringifyUrl(
			{
				url: '/',
				query: {
					category: category,
				},
			},
			{ skipNull: true }
		);
	}
	return (
		<div className="relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
			<Link
				href={href}
				className={`select-none whitespace-nowrap flex items-center justify-center text-center gap-1 p-2 border-b-2 hover:text-slate-800 hover:border-b-slate-700 cursor-pointer ${
					selected ? 'border-b-slate-700 text-slate-800' : 'border-transparent text-slate-500'
				}`}
				onClick={onClick}
			>
				<Icon size={20} />
				<div className="font-medium text-sm">{label}</div>
			</Link>
			{/* Dropdown */}
			<div
				className={`absolute mt-[2px] bg-white border whitespace-nowrap border-gray-200 shadow-md w-auto py-5 px-9 left-[-190%] top-[95%] 
		transition-all duration-200 ease-out transform ${
			isHovered && subItems ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-1 invisible'
		}`}
			>
				<div className="flex flex-nowrap items-start justify-start mx-auto min-h-[100px] max-h-[600px]">
					<div className="mr-[20px]">
						<img src={subItemsImg} alt="" className="max-w-[200px] max-h-[500px]" />
					</div>
					<div className="flex flex-col items-start justify-center">
						{subItems?.map((item, index) => (
							<Link
								key={index}
								href={`/${slugConvert(category)}/${slugConvert(item)}`}
								className="border-transparent text-slate-500 p-1 border-b-2 hover:text-slate-800 hover:border-b-slate-700 cursor-pointer"
							>
								{item}
							</Link>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Category;

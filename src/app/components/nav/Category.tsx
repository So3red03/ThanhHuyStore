'use client';
import Link from 'next/link';
import { useState } from 'react';
import * as SlIcons  from 'react-icons/sl';
import * as AiIcons  from 'react-icons/ai';
import * as TbIcons  from 'react-icons/tb';
import * as MdIcons  from 'react-icons/md';

interface CategoryProps {
	label: string;
	category: string;
	subItemsImg: string | undefined;
	subItems: any;
	icon: string;
	selected?: boolean;
	onClick: () => void;
}

const Category: React.FC<CategoryProps> = ({
	label,
	category,
	subItems,
	subItemsImg,
	icon,
	selected,
	onClick,
}) => {
	const [isHovered, setIsHovered] = useState(false);
	const Icons = { ...SlIcons, ...AiIcons, ...MdIcons, ...TbIcons};
	// Kiểm tra biểu tượng
	const IconComponent = Icons[icon as keyof typeof Icons] || null;
	return (
		<div className="relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
			<Link
				href={`/${category}`}
				className={`select-none whitespace-nowrap flex items-center justify-center text-center gap-1 p-2 border-b-2 hover:text-slate-800 hover:border-b-slate-700 cursor-pointer ${
					selected ? 'border-b-slate-700 text-slate-800' : 'border-transparent text-slate-500'
				}`}
				onClick={onClick}
			>
				<IconComponent size={20} />
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
						{subItems?.map((item: any) => (
							<Link
								key={item.id}
								href={`/${category}/${item.slug}`}
								className="border-transparent text-slate-500 p-1 border-b-2 hover:text-slate-800 hover:border-b-slate-700 cursor-pointer"
							>
								{item.name}
							</Link>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Category;

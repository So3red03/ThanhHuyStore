'use client';
import { useState } from 'react';
import { MdClose } from 'react-icons/md';
import { categories } from '../../../../utils/Categories';
import { AiOutlineDown, AiOutlineUp } from 'react-icons/ai';
import Link from 'next/link';
import { Redressed } from 'next/font/google';

const redressed = Redressed({ subsets: ['latin'], weight: ['400'] });

interface MobileMenuProps {
	onClose: () => void;
}
const MobileMenu: React.FC<MobileMenuProps> = ({ onClose }) => {
	const [expandedCategory, setExpandedCategory] = useState(null);

	const handleCategoryClick = (category: any) => {
		setExpandedCategory(expandedCategory === category ? null : category);
	};

	return (
		<div
			className={`fixed top-0 left-0 w-[80%] h-full bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out${
				expandedCategory ? '-translate-x-full' : 'translate-x-0'
			}`}
		>
			<div className="flex bg-slate-200 items-center justify-between p-4 pb-[20px] border-b-[1px] shadow-sm">
				<Link href="/" className={`${redressed.className} whitespace-nowrap font-bold text-xl lg:text-3xl`}>
					ThanhHuy Store
				</Link>
				<MdClose className="cursor-pointer" onClick={onClose} />
			</div>
			<div className="p-4 flex flex-col gap-2">
				{categories.map((item) => (
					<div key={item.label}>
						<div
							className="flex justify-between items-center cursor-pointer"
							onClick={() => handleCategoryClick(item.value)}
						>
							<span className="font-semibold">{item.label}</span>
							{item.subItems && (
								<span>{expandedCategory === item.value ? <AiOutlineUp /> : <AiOutlineDown />}</span>
							)}
						</div>
						{item.subItems && item.subItems.length > 0 && expandedCategory === item.value && (
							<ul
								className="pl-4 font-semibold transition-all duration-300 ease-in-out max-h-0 overflow-hidden"
								style={{ maxHeight: expandedCategory === item.value ? '1000px' : '0' }} // Sử dụng expandedCategory trực tiếp
							>
								{item.subItems.map((subItem) => (
									<li key={subItem} className="py-1">
										{subItem}
									</li>
								))}
							</ul>
						)}
					</div>
				))}
			</div>
		</div>
	);
};

export default MobileMenu;

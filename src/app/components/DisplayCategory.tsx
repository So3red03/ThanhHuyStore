'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
const categories = [
	{
		name: 'Mac',
		slug: 'Mac',
		img: 'store-card-13-mac-nav-202410.png',
	},
	{
		name: 'iPhone',
		slug: 'iphone',
		img: 'store-card-13-iphone-nav-202409.png',
	},
	{
		name: 'iPad',
		slug: 'ipad',
		img: 'ipad-edited.png',
	},
	{
		name: 'Watch',
		slug: 'watch',
		img: 'watch-edited2.png',
	},
	{
		name: 'AirPods',
		slug: 'airpods',
		img: 'airpods-edited.png',
	},
	{
		name: 'Phụ Kiện',
		slug: 'accessories',
		img: 'accessories-edited.png',
	},
];

const DisplayCategory = () => {
	const searchParams = useSearchParams(); // Hook để lấy query params
	const searchTerm = searchParams?.get('searchTerm'); // Lấy giá trị của 'searchTerm'
	const category = searchParams?.get('category');
	if (searchTerm || category) {
		return null;
	}
	return (
		<div className="py-4 lg:py-8">
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 max-w-7xl mx-auto px-4">
				{categories.map((category, index) => (
					<Link
						href={`/${category.slug.toLowerCase()}`}
						key={index}
						className="flex flex-col items-center rounded-full p-2"
					>
						<div className="w-[90px] lg:w-[130px] bg-slate-200 h-[90px] lg:h-[130px] rounded-full flex flex-col items-center justify-center overflow-hidden">
							<img
								src={category.img}
								alt={category.name}
								className="w-[80%] h-[80%] object-contain"
							/>
						</div>
							<p className="text-xs lg:text-[13px] font-semibold mt-[6px]">{category.name}</p>
					</Link>
					))}
			</div>
		</div>
	);
};

export default DisplayCategory;

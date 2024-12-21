'use client';

import React, { useEffect, useState } from 'react';
import ProductCard from '../components/products/ProductCard';
import { useRouter, useSearchParams } from 'next/navigation';
import SkeletonLoader from '../components/products/SkeletonLoader';
import NullData from '../components/NullData';
import Heading from '../components/Heading';
import NotFound from '../components/NotFound';

interface DisplayProductsProps {
	data: any[];
}

const DisplayProducts: React.FC<DisplayProductsProps> = ({ data }) => {
	const [allProducts, setAllProducts] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const router = useRouter();
	const searchParams = useSearchParams();
	const category = searchParams?.get('category');
	const searchTerm = searchParams?.get('searchTerm');

	useEffect(() => {
		if (data && data.length > 0) {
			setAllProducts(data);
			setLoading(false);
		}
	}, [data, router]);

	// Lọc sản phẩm theo từ khóa tìm kiếm
	const filteredProducts = searchTerm
		? allProducts.filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
		: allProducts;

	// Lọc sản phẩm theo category
	const filteredByCategory = category
		? allProducts.filter((product) => product.category.toLowerCase() === category.toLowerCase())
		: allProducts;

	// Nếu không có sản phẩm khớp với từ khóa tìm kiếm, hiển thị thông báo NotFound
	if (filteredProducts.length === 0 && searchTerm) {
		return (
			<div className="flex justify-center flex-col items-center gap-8 mt-8">
				<Heading title="TÌM KIẾM">
					<></>
				</Heading>
				<NotFound />
				<div className="flex justify-center flex-col items-center gap-3">
					<p className="text-md font-semibold">
						Rất tiếc, chúng tôi không tìm thấy kết quả cho từ khóa của bạn
					</p>
				</div>
			</div>
		);
	}

	return (
		<>
			{category === null && searchTerm === null && (
				<>
					<h2 className="mt-12 w-full text-center mb-[20px] block select-none text-xl font-[600] sm:text-2xl">
						TẤT CẢ SẢN PHẨM
					</h2>
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:!grid-cols-5 3xl:!grid-cols-6 gap-7">
						{loading
							? Array.from({ length: 5 }).map((_, index) => <SkeletonLoader key={index} />)
							: allProducts.map((product) => <ProductCard key={product.id} data={product} />)}
					</div>
				</>
			)}

			{searchTerm && filteredProducts.length > 0 && (
				<>
					<h2 className="mt-12 w-full text-center mb-[20px] block select-none text-xl font-[600] sm:text-2xl">
						KẾT QUẢ TÌM KIẾM ({filteredProducts.length})
					</h2>
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:!grid-cols-5 3xl:!grid-cols-6 gap-7">
						{filteredProducts.map((product) => (
							<ProductCard key={product.id} data={product} />
						))}
					</div>
				</>
			)}

			{category && filteredByCategory.length > 0 && !searchTerm && (
				<>
					<h2 className="mt-12 w-full text-center mb-[20px] block select-none text-xl font-[600] sm:text-2xl">
						{category}
					</h2>
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:!grid-cols-5 3xl:!grid-cols-6 gap-7">
						{filteredByCategory.map((product) => (
							<ProductCard key={product.id} data={product} />
						))}
					</div>
				</>
			)}
		</>
	);
};

export default DisplayProducts;

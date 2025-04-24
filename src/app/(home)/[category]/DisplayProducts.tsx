'use client';

import React, { useEffect, useState } from 'react';
import { Menu, MenuItem, Button } from '@mui/material';
import Container from '@/app/components/Container';
import ProductCard from '@/app/components/products/ProductCard';
import { useRouter } from 'next/navigation';
import NotFound from '@/app/components/NotFound';

interface DisplayProductsProps {
	products: any;
}
const DisplayProducts: React.FC<DisplayProductsProps> = ({ products }) => {
	const [anchorEl, setAnchorEl] = useState(null);
	const [selectedSort, setSelectedSort] = useState('Giá tăng dần');
	const router = useRouter(); // Điều hướng
	const open = Boolean(anchorEl);

	const handleClick = (event: any) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = (option: any) => {
		setSelectedSort(option);
		setAnchorEl(null);
		// Cập nhật URL
		router.push(`?sort=${option}`);
	};

	const sortOptions = ['Giá tăng dần', 'Giá giảm dần', 'Hàng mới'];

	const sortedProducts = [...products].sort((a, b) => {
		if (selectedSort === 'Giá tăng dần') return a.price - b.price;
		if (selectedSort === 'Giá giảm dần') return b.price - a.price;
		if (selectedSort === 'Hàng mới') return new Date(b.date).getTime() - new Date(a.date).getTime();
		return 0;
	});

	return (
		<Container>
			<div className="xl:px-[100px]">
				<div className="flex justify-between items-center mt-12 mb-[20px]">
					<h2 className="block select-none text-xl font-[600] sm:text-2xl">
						Tất cả sản phẩm ({products.length})
					</h2>
					<div>
						<Button
							className="flex items-center gap-2 text-black hover:bg-gray-200 py-2 border border-gray-300 rounded-md"
							onClick={handleClick}
						>
							Sắp xếp: {selectedSort}
						</Button>
						<Menu
							anchorEl={anchorEl}
							open={open}
							onClose={() => handleClose(selectedSort)}
							MenuListProps={{ onMouseLeave: () => setAnchorEl(null) }}
							classes={{
								paper: 'mt-2 border border-gray-300 rounded-md shadow-md'
							}}
							anchorOrigin={{
								vertical: 'bottom',
								horizontal: 'right'
							}}
							transformOrigin={{
								vertical: 'top',
								horizontal: 'right'
							}}
						>
							{sortOptions.map((option, index) => (
								<MenuItem
									key={index}
									onClick={() => handleClose(option)}
									className={option === selectedSort ? 'text-blue-500' : ''}
								>
									{option}
								</MenuItem>
							))}
						</Menu>
					</div>
				</div>
				{products.length > 0 ? (
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:!grid-cols-5 3xl:!grid-cols-6 gap-7">
						{sortedProducts.map((product: any) => (
							<ProductCard key={product.id} data={product} />
						))}
					</div>
				) : (
					<div className="flex justify-center flex-col items-center gap-8 mt-8">
						<NotFound />
						<div className="flex justify-center flex-col items-center gap-3">
							<p className="text-md font-semibold">Sản phẩm đang được cập nhật</p>
						</div>
					</div>
				)}
			</div>
		</Container>
	);
};

export default DisplayProducts;

'use client';

import React, { useEffect, useState } from 'react';
import { Menu, MenuItem, Button } from '@mui/material';
import Container from '@/app/components/Container';
import ProductCard from '@/app/components/products/ProductCard';
import { useRouter, useSearchParams } from 'next/navigation';
import NotFound from '@/app/components/NotFound';
import Link from 'next/link';
import { slugConvert } from '../../../../utils/Slug';

interface SearchResultProps {
	products: any;
	articles: any;
}
const SearchResult: React.FC<SearchResultProps> = ({ products, articles }) => {
	const [anchorEl, setAnchorEl] = useState(null);
	const [selectedSort, setSelectedSort] = useState('Giá tăng dần');
    const searchParams = useSearchParams(); // Lấy tham số trên URL
	const router = useRouter(); // Điều hướng
	const open = Boolean(anchorEl);

	const handleClick = (event: any) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = (option: any) => {
		setSelectedSort(option);
		setAnchorEl(null);
        // Cập nhật URL
		const currentSearch = searchParams?.get('searchTerm') || '';
		router.push(`/search?searchTerm=${currentSearch}&sort=${option}`);
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
			<>
				<div className='flex items-start gap-x-10 mt-12'>
					<div>
						<div className="flex justify-between items-center mb-[20px]">
							<h2 className="block select-none text-xl font-[600] sm:text-2xl">
								Kết quả tìm kiếm ({products.length})
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
						{products.length > 0 ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:!grid-cols-5 3xl:!grid-cols-6 gap-7">
							{sortedProducts.map((product: any) => (
								<ProductCard key={product.id} data={product} />
							))}
						</div> 
						: 
						<div className="flex justify-center flex-col items-center gap-8 mt-8">
							<NotFound />
							<div className="flex justify-center flex-col items-center gap-3">
								<p className="text-md font-semibold">
									Rất tiếc, chúng tôi không tìm thấy kết quả cho từ khóa của bạn
								</p>
							</div>
						</div>
						}

					</div>
					{articles && articles.length > 0 && 
						<div className= "grid w-full grid-cols-1 gap-[30px] md:mt-[0px] md:w-[220px] lg:w-[270px]">
							<div className="w-full">
								<div className="w-full max-w-[800px]">
									<h2 className="block select-none text-xl font-[600] sm:text-2xl mb-[20px]">
										Bài viết liên quan
									</h2>

								{articles.map((article: any, index: any) => (
									<Link
										key={article.id}
										className="relative mb-[10px] block w-full overflow-hidden rounded-[5px] sm:mb-[15px]"
										href={`/article/${slugConvert(article.title)}-${article.id}`}
									>
									<img
										alt={article.title}
										title={article.title}
										loading="lazy"
										width={640}
										height={360}
										decoding="async"
										data-nimg={1}
										className="block aspect-16/9 w-full object-cover "
										src={article.image}
										style={{ color: 'transparent' }}
									/>
									<div className="overlay-post absolute bottom-0 left-0 flex h-full w-full flex-col justify-end px-[5px] py-[10px]">
										<div className="w-full">
											<h3 className="m-[0px] line-clamp-3 text-ellipsis text-justify text-sm font-[500] text-white">
												{article.title}
											</h3>
										</div>
									</div>
								</Link>
								))}
								<div className="flex w-full justify-end" />
							</div>
						</div>
					</div>}
				</div>
			
			</>
		</Container>
	);
};

export default SearchResult;

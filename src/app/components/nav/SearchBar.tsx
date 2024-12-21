'use client';

import { Product } from '@prisma/client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import queryString from 'query-string';
import { useEffect, useState } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { formatPrice } from '../../../../utils/formatPrice';
import Image from 'next/image';
import ProductCard from '../products/ProductCard';
import { slugConvert } from '../../../../utils/Slug';

interface SearchBarProps {
	products: any[];
}

const SearchBar: React.FC<SearchBarProps> = ({ products }) => {
	const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
	const [searchTerm, setSearchTerm] = useState('');
	const router = useRouter();
	const { register, handleSubmit, reset, setValue } = useForm<FieldValues>();

	const onSubmit: SubmitHandler<FieldValues> = data => {
		if (!data.searchTerm) return router.push('/');
		const url = queryString.stringifyUrl(
			{
				url: '/',
				query: {
					searchTerm: data.searchTerm
				}
			},
			{ skipNull: true }
		);
		router.push(url);
		setSearchTerm('');
		setFilteredProducts([]);
		setValue('searchTerm', '');
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault(); // Ngăn hành vi mặc định
			handleSubmit(onSubmit)();
		}
	};

	// Khi người dùng gõ ký tự vào ô tìm kiếm
	const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
		setTimeout(() => {
			const searchValue = e.target.value;
			setSearchTerm(searchValue);

			if (searchValue.trim() === '') {
				setFilteredProducts([]);
				return;
			}

			const filtered = products.filter(product => product.name.toLowerCase().includes(searchValue.toLowerCase()));
			setFilteredProducts(filtered);
		}, 150);
	};

	return (
		<div className="select-none relative w-[150px] sm:w-[220px] md:w-[270px] lg:w-[415px] float-end">
			<input
				type="text"
				autoComplete="off"
				{...register('searchTerm', { required: true })}
				placeholder="Bạn cần tìm gì?"
				className="pl-4 pr-10 py-[6px] lg:py-3 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 w-full"
				onKeyDown={handleKeyDown}
				onChange={handleSearch}
			/>
			<button
				className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
				onClick={() => handleSubmit(onSubmit)()}
			>
				<svg
					className="w-5 h-5"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 10-13 0 6.5 6.5 0 0013 0z"
					/>
				</svg>
			</button>
			<div
				className={`absolute mt-1 text-sm z-20 bg-white w-full shadow-md rounded-md max-h-60 overflow-y-auto px-4 transition-all duration-500 ease-in-out ${
					filteredProducts.length > 0
						? 'opacity-100 translate-y-0'
						: 'opacity-0 translate-y-[-8px] pointer-events-none'
				}`}
			>
				{filteredProducts.map(product => (
					<div
						key={product.id}
						className="px-2 py-3 flex justify-between items-center border-b border-gray-300"
					>
						<div>
							<Link
								href={`/product/${slugConvert(product.name)}-${product.id}`}
								className="text-[#111111] hover:text-slate-400 transition-colors duration-150 cursor-pointer"
							>
								{product.name}
							</Link>
							<p className="text-[#d43232] text-xs font-bold">{formatPrice(product.price)}</p>
						</div>
						<div>
							<Image src={product.images[0].images[0]} alt={product.name} width={40} height={40} />
						</div>
					</div>
				))}
			</div>

			{searchTerm.trim() !== '' && filteredProducts.length === 0 && (
				<div
					className={`absolute z-20 mt-1 text-sm bg-white w-full shadow-md rounded-md max-h-60 overflow-y-auto text-center p-4 transition-all duration-500 ease-in-out opacity-100 ${
						filteredProducts.length === 0
							? 'opacity-100 translate-y-0'
							: 'opacity-0 translate-y-[-8px] pointer-events-none'
					}`}
				>
					Không có sản phẩm nào...
				</div>
			)}
		</div>
	);
};

export default SearchBar;

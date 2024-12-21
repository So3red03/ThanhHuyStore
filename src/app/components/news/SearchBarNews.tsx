'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import queryString from 'query-string';
import { useEffect, useState } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
interface SearchBarNewsProps {
	articles: any;
}
const SearchBarNews: React.FC<SearchBarNewsProps> = ({ articles }) => {
	const router = useRouter();
	const [searchTerm, setSearchTerm] = useState('');
	const { register, handleSubmit, reset, setValue } = useForm<FieldValues>();

	const onSubmit: SubmitHandler<FieldValues> = data => {
		if (!data.searchTerm) return router.push('/news');
		const url = queryString.stringifyUrl(
			{
				url: '/news/search',
				query: {
					searchTerm: data.searchTerm
				}
			},
			{ skipNull: true }
		);
		router.push(url);
		setSearchTerm('');
		setValue('searchTerm', '');
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault(); // Ngăn hành vi mặc định
			handleSubmit(onSubmit)();
		}
	};
	return (
		<div className="select-none relative w-[150px] sm:w-[220px] md:w-[270px] lg:w-[415px] float-end">
			<input
				type="text"
				autoComplete="off"
				{...register('searchTerm', { required: true })}
				placeholder="Tìm kiếm"
				className="pl-4 pr-10 py-[6px] lg:py-3 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 w-full"
				onKeyDown={handleKeyDown}
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
		</div>
	);
};

export default SearchBarNews;

'use client';
import Heading from '@/app/components/Heading';
import { Box, Rating, styled, Tab, Tabs } from '@mui/material';
import moment from 'moment';
import 'moment/locale/vi';
import { useEffect, useState } from 'react';
import { SafeUser } from '../../../../../types';
import { Order, Product, Review } from '@prisma/client';
import AddRating from './AddRating';
import Image from 'next/image';
import { formatDateNoTime } from '../../account/orders/OrdersClient';

interface ListRatingProps {
	product: Product & { reviews: Review[] }; // Reviews có thể không có, để TypeScript biết đây là optional
	user: (SafeUser & { orders: Order[] }) | undefined | null;
}

const ListRating: React.FC<ListRatingProps> = ({ product, user }) => {
	// Giá trị hiển thị để chuyển đổi các tab
	const [value, setValue] = useState(0);

	useEffect(() => {
		const hash = window.location.hash;
		if (hash) {
			// Chuyển sang tab 3 (tab có phần nhận xét)
			setValue(2);
			setTimeout(() => {
				const element = document.querySelector(hash);
				if (element) {
					element.scrollIntoView({
						behavior: 'smooth',
						block: 'center', //scroll đến giữa màn hình
					});
				}
			}, 1500);
		}
	}, []);

	// Tính tổng số lượng đánh giá cho từng mức sao
	const ratings = [0, 0, 0, 0, 0]; // Mảng để lưu số lượng đánh giá theo vị trí 1 sao đến 5 sao

	product.reviews.forEach((review: any) => {
		if (review.rating >= 1 && review.rating <= 5) {
			ratings[review.rating - 1] += 1;
		}
	});
	const reversedRatings = ratings.reverse();

	const totalReviews = product.reviews.length;

	const averageRating =
		product.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / totalReviews || 0;

	const handleChange = (event: React.SyntheticEvent, newValue: number) => {
		setValue(newValue);
	};

	const AntTabs = styled(Tabs)({
		'& .MuiTabs-indicator': {
			display: 'none',
		},
	});

	const tabStyles = {
		border: '1px solid',
		borderRadius: '8px',
		paddingTop: '0px',
		paddingBottom: '0px',
		textTransform: 'none',
		minWidth: '150px',
		minHeight: '40px',
		mx: 1,
		position: 'relative',
		'&.Mui-selected': {
			color: 'primary.main',
			borderColor: 'primary.main',
		},
		color: 'text.primary',
		borderColor: '#D2D2D7',
	};

	return (
		<>
			<div className="w-100 overflow-auto">
				<Box sx={{ overflowX: 'auto' }}>
					<AntTabs value={value} onChange={handleChange} centered>
						<Tab label="Mô tả sản phẩm" sx={tabStyles} />
						<Tab label="Thông số kĩ thuật" sx={tabStyles} />
						<Tab label="Hỏi đáp" sx={tabStyles} />
					</AntTabs>
				</Box>
			</div>
			{value === 0 && (
				<div className="flex justify-center">
					<Image
						src="https://static.id.gtech.asia/prod/100035/20230803/CB34FC452CB99F165C3ED19764589387.jpeg"
						alt="ThanhHuyStore"
						width={1440}
						height={7789}
					/>
				</div>
			)}
			{value === 1 && (
				<>
					{product.description ? (
						<div dangerouslySetInnerHTML={{ __html: product.description }} />
					) : (
						<Heading title="Không có dữ liệu nào" center>
							<></>
						</Heading>
					)}
				</>
			)}
			{value === 2 && (
				<>
					<Heading title="Đánh giá & Nhận xét" center>
						{product.name}
					</Heading>
					<div className="w-full mt-2 px-2 md:px-32 lg:px-72 pb-6 mx-auto bg-white border-b border-gray-300">
						<div className="flex flex-col lg:flex-row items-center gap-3 lg:gap-14">
							<div className="flex flex-col justify-center items-center mb-0 lg:mb-4">
								<span className="text-red-500 text-4xl font-bold">{averageRating}/5</span>
								{/* Hiển thị các ngôi sao vàng */}
								<span className="text-yellow-500 text-xl mt-2">{'⭐'.repeat(averageRating)}</span>
								<span className="text-sm text-gray-600 mt-1 whitespace-nowrap">
									<span className="font-bold">({totalReviews})</span> đánh giá & nhận xét
								</span>
							</div>
							<div className="w-full">
								{/* Tạo các hàng cho từng mức đánh giá */}
								{reversedRatings.map((count: number, index: number) => (
									<div key={index} className="flex items-center mb-0 lg:mb-4">
										<span className="w-8 text-sm text-gray-700">{5 - index} ⭐</span>
										<div className="flex-1 h-3 bg-gray-200 mx-2 rounded-full">
											<div
												className={`h-full ${count > 0 ? 'bg-green-500' : ''} rounded-full`}
												style={{ width: `${(count / totalReviews) * 100}%` }}
											></div>
										</div>
										<span className="lg:ml-4 ml-0 text-sm text-gray-700 w-[17%] whitespace-nowrap">
											{count} đánh giá
										</span>
									</div>
								))}
							</div>
						</div>
					</div>
					<div className="text-sm mt-2">
						{product.reviews.length !== 0 ? (
							product.reviews.map((review: any) => {
								return (
									<div key={review.id} id={`comment-${review.id}`} className="max-w-[750px] mb-4">
										<div className="flex gap-2 items-center">
											<div className="font-semibold">{review.user.name}</div>
											<div className="font-light text-gray-400">
												{formatDateNoTime(review.createdDate)}
											</div>
										</div>
										<div className="lg:my-3 mb-3 mt-1 static lg:flex gap-x-0 lg:gap-x-20">
											<Rating value={review.rating} readOnly size="small" />
											<div className="flex flex-col lg:gap-y-4 gap-y-1">
												<div>{review.comment}</div>
												{/* Phần phản hồi bình luận */}
												{review.reply && (
													<div className="bg-gray-100 p-3 rounded-md">
														<div className="font-semibold text-red-600">Admin</div>
														<div className="font-light text-gray-400">
															{formatDateNoTime(review?.updatedAt)}
														</div>
														<div className="mt-2">{review.reply}</div>
													</div>
												)}
											</div>
										</div>

										<hr className="my-4" />
									</div>
								);
							})
						) : (
							<Heading title="Chưa có đánh giá">
								<></>
							</Heading>
						)}
					</div>
					{/* Form bình luận sản phẩm */}
					<AddRating product={product} user={user} />
				</>
			)}
		</>
	);
};

export default ListRating;

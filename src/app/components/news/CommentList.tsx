'use client';

import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useState } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import Image from 'next/image';
import ConfirmDialog from '../ConfirmDialog';
import { SafeUser } from '../../../../types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale/vi';
import axios from 'axios';
import toast from 'react-hot-toast';
import Button from '../Button';

export type Replies = {
	id: string;
	comment: string;
	createdDate: Date;
	user: {
		id: string;
		name: string;
		image: string;
	};
};
export type CommentType = {
	id: string;
	articleId: string;
	comment: string;
	createdDate: Date;
	parentId: string | null;
	rating: number | null;
	replies: Replies[];
	user: {
		id: string;
		name: string;
		image: string;
	};
};
export type Article = {
	id: string;
	title: string;
	content: string;
	createdAt: string;
	image: string;
	reviews: CommentType[];
};

interface CommentListProps {
	currentUser: SafeUser | null | undefined;
	article: Article;
}
const CommentList: React.FC<CommentListProps> = ({ currentUser, article }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isReplyLoading, setIsReplyLoading] = useState(false);
	const [replyTo, setReplyTo] = useState<{ id: string | null; parentCommentId: string | null }>({
		id: null,
		parentCommentId: null,
	});
	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<FieldValues>();
	const router = useRouter();

	const toggleOpen = () => {
		setIsOpen(!isOpen);
	};

	const handleConfirm = () => {
		router.push('/login');
		toggleOpen();
	};

	const formatDate = (date: any) => {
		return format(date, "dd'/'M'/'yyyy ' ' HH:mm", { locale: vi });
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(onSubmit)();
		}
	};

	const onSubmit: SubmitHandler<FieldValues> = (data) => {
		const isReply = replyTo.parentCommentId;
		isReply ? setIsReplyLoading(true) : setIsLoading(true);
		const payload: any = {
			userId: currentUser?.id,
			articleId: article.id,
			comment: data.comment,
			parentId: replyTo.parentCommentId || null,
		};
		axios
			.post('/api/articleComment', payload)
			.then((res) => {
				setValue('comment', '');
				setReplyTo({ id: null, parentCommentId: null });
				router.refresh();
			})
			.catch((error) => {
				toast.error('Dữ liệu không hợp lệ');
			})
			.finally(() => {
				isReply ? setIsReplyLoading(false) : setIsLoading(false);
			});
	};

	const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false);
	const [comments, setComments] = useState<CommentType[]>(article.reviews);
	const [skip, setSkip] = useState(0);
	// Hàm gọi API để tải thêm bình luận
	// const loadComments = async (offset: number) => {
	// 	setIsLoadMoreLoading(true);
	// 	try {
	// 		const response = await axios.get(`/api/article/${article.id}?offset=${offset}`);
	// 		setComments((prevComments) => [...prevComments, ...response.data.reviews]);
	// 	} catch (error) {
	// 		console.error('Lỗi:', error);
	// 	} finally {
	// 		setIsLoadMoreLoading(false);
	// 	}
	// };

	// useEffect(() => {
	// 	loadComments(2); // Mặc định lấy 2 bình luận đầu tiên
	// }, [article.id]);

	// const loadMore = () => {
	// 	setSkip((prev) => prev + 2); // Tăng số bình luận bỏ qua khi load thêm
	// };
	return (
		<>
			<div className="my-[30px]">
				<h2 className="mt-[0px] mb-[15px] block w-fit select-none text-xl font-[600] md:text-2xl">
					Bình luận (
					{article.reviews
						.filter((comment) => !comment.rating && !comment.parentId) // Lọc bình luận gốc và rating
						.reduce((acc, comment) => {
							acc += 1; // Đếm bình luận gốc
							acc += comment.replies.length; // Đếm số phản hồi của bình luận gốc
							return acc;
						}, 0)}
					)<span className="mt-[5px] block w-[70%] border-b-[3px] border-slate-300"></span>
				</h2>

				<div className="flex w-full items-start justify-start gap-[16px]">
					<Image
						className="rounded-full object-cover"
						src={currentUser?.image ?? '/no-avatar-2.jpg'}
						alt="admin"
						width="49"
						height="49"
					/>
					<div className="relative w-full">
						<textarea
							{...register('comment', { required: true })}
							className={`w-full rounded-[6px] border h-[110px] border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 px-[10px] py-[6px] text-[16px] outline-none focus:border-[1px]  ${
								errors.comment ? 'border-red-500' : ''
							}`}
							placeholder="Nhập bình luận của bạn..."
							onKeyDown={handleKeyDown}
							onFocus={(e) => {
								if (!currentUser) {
									setIsOpen(true);
									e.target.blur();
								}
							}}
						></textarea>
						<Button
							label="Gửi"
							onClick={handleSubmit(onSubmit)}
							isLoading={isLoading}
							custom="!py-1 !px-9 !rounded-lg !font-normal !absolute !right-3 !bottom-3 !w-fit"
						/>
					</div>
				</div>
				<div className="w-full">
					{article.reviews
						.filter((comment) => !comment.parentId && comment?.rating === null) // Lọc chỉ những bình luận không có parentId
						.map((comment) => {
							return (
								<Fragment key={comment.id}>
									<div className=" relative pt-[20px]">
										{comment.replies.length > 0 && (
											<div className="absolute left-[20px] top-[30px] h-full w-[2px] bg-gray-200 sm:left-[25px] sm:top-[40px]" />
										)}

										<div className="flex items-start justify-start gap-[10px] sm:gap-[16px]">
											{/* <div
											className="z-10 flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-[#fff0f0] sm:h-[50px] sm:w-[50px]"
											style={{
												background:
													'linear-gradient(225deg, rgb(26, 188, 156) 0%, rgb(22, 160, 133) 50%, rgb(46, 204, 113) 100%)',
												boxShadow: 'rgba(255, 255, 255, 0.05) -5px -5px 15px inset',
											}}
										>
											<p className="text-base font-bold text-white sm:text-xl">HH</p>
										</div> */}
											<div className="z-10 flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-[#fff0f0] sm:h-[50px] sm:w-[50px]">
												<Image
													className="rounded-full object-cover"
													src={currentUser?.image ?? '/no-avatar-2.jpg'}
													alt={currentUser?.name ?? 'Ẩn danh'}
													width="50"
													height="50"
												/>
											</div>
											<div className="grow">
												<p className="text-sm font-[600] text-textGray sm:text-base">
													{comment.user.name}
												</p>
												<p className="text-xs sm:text-sm">{comment.comment}</p>
												<div className="flex w-full items-center justify-start gap-[4px] pt-[6px] sm:gap-[8px]">
													<span className="text-xs text-gray-400 sm:text-sm">
														{formatDate(comment.createdDate)}
													</span>
													<svg
														stroke="currentColor"
														fill="currentColor"
														strokeWidth={0}
														viewBox="0 0 16 16"
														className="text-gray-400"
														height={16}
														width={16}
														xmlns="http://www.w3.org/2000/svg"
													>
														<path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
													</svg>
													<div className="flex cursor-pointer select-none items-center gap-[4px] text-gray-400">
														{/* <svg
														stroke="currentColor"
														fill="currentColor"
														strokeWidth={0}
														viewBox="0 0 1024 1024"
														height={14}
														width={14}
														xmlns="http://www.w3.org/2000/svg"
													>
														<path d="M885.9 533.7c16.8-22.2 26.1-49.4 26.1-77.7 0-44.9-25.1-87.4-65.5-111.1a67.67 67.67 0 0 0-34.3-9.3H572.4l6-122.9c1.4-29.7-9.1-57.9-29.5-79.4A106.62 106.62 0 0 0 471 99.9c-52 0-98 35-111.8 85.1l-85.9 311H144c-17.7 0-32 14.3-32 32v364c0 17.7 14.3 32 32 32h601.3c9.2 0 18.2-1.8 26.5-5.4 47.6-20.3 78.3-66.8 78.3-118.4 0-12.6-1.8-25-5.4-37 16.8-22.2 26.1-49.4 26.1-77.7 0-12.6-1.8-25-5.4-37 16.8-22.2 26.1-49.4 26.1-77.7-.2-12.6-2-25.1-5.6-37.1zM184 852V568h81v284h-81zm636.4-353l-21.9 19 13.9 25.4a56.2 56.2 0 0 1 6.9 27.3c0 16.5-7.2 32.2-19.6 43l-21.9 19 13.9 25.4a56.2 56.2 0 0 1 6.9 27.3c0 16.5-7.2 32.2-19.6 43l-21.9 19 13.9 25.4a56.2 56.2 0 0 1 6.9 27.3c0 22.4-13.2 42.6-33.6 51.8H329V564.8l99.5-360.5a44.1 44.1 0 0 1 42.2-32.3c7.6 0 15.1 2.2 21.1 6.7 9.9 7.4 15.2 18.6 14.6 30.5l-9.6 198.4h314.4C829 418.5 840 436.9 840 456c0 16.5-7.2 32.1-19.6 43z" />
													</svg> */}
														{/* <span className="text-xs sm:text-sm">Thích </span> */}
													</div>
													<svg
														stroke="currentColor"
														fill="currentColor"
														strokeWidth={0}
														viewBox="0 0 16 16"
														className="text-gray-400"
														height={16}
														width={16}
														xmlns="http://www.w3.org/2000/svg"
													>
														<path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
													</svg>
													<span
														onClick={() => {
															{
																!currentUser
																	? setIsOpen(true)
																	: setReplyTo({
																			id: comment.id,
																			parentCommentId: comment.id,
																	  });
															}
														}}
														className="cursor-pointer select-none text-xs text-[#1A6DB4] sm:text-sm"
													>
														Trả lời
													</span>
												</div>
											</div>
										</div>
									</div>

									{/* Danh sách phản hồi */}
									{comment.replies.length > 0 &&
										comment.replies.map((reply, index) => (
											<div key={reply.id} className="pl-[55px] sm:pl-[65px] relative pt-[20px]">
												<div
													className={`absolute left-[20px] top-[30px] w-[2px] bg-gray-200 sm:left-[25px] sm:top-[40px] ${
														index === comment.replies.length - 1 ? 'hidden' : 'h-full'
													}`}
												/>
												<div className="absolute left-[20px] top-[20px] h-[20px] w-[30px] rounded-bl-[10px] border-b-[2px] border-l-[2px] border-gray-200 sm:left-[25px] sm:top-[30px]" />
												<div className="flex items-start justify-start gap-[10px] sm:gap-[16px]">
													{/* <div
													className="z-10 flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-[#fff0f0] sm:h-[50px] sm:w-[50px]"
													style={{
														background:
															'linear-gradient(225deg, rgb(0, 123, 255) 0%, rgb(30, 144, 255) 50%, rgb(0, 191, 255) 100%)',
														boxShadow: 'rgba(255, 255, 255, 0.05) -5px -5px 15px inset',
													}}
												>
													<p className="text-base font-bold text-white sm:text-xl">S</p>
												</div> */}
													<div className="z-10 flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-[#fff0f0] sm:h-[50px] sm:w-[50px]">
														<Image
															className="rounded-full object-cover"
															src={currentUser?.image ?? '/no-avatar-2.jpg'}
															alt={currentUser?.name ?? 'Ẩn danh'}
															width="50"
															height="50"
														/>
													</div>
													<div className="grow">
														<p className="text-sm font-[600] text-textGray sm:text-base">
															{reply.user.name}
														</p>
														<p className="text-xs sm:text-sm">{reply.comment}</p>
														<div className="flex w-full items-center justify-start gap-[4px] pt-[6px] sm:gap-[8px]">
															<span className="text-xs text-gray-400 sm:text-sm">
																{formatDate(reply.createdDate)}
															</span>
															<svg
																stroke="currentColor"
																fill="currentColor"
																strokeWidth={0}
																viewBox="0 0 16 16"
																className="text-gray-400"
																height={16}
																width={16}
																xmlns="http://www.w3.org/2000/svg"
															>
																<path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
															</svg>
															<div className="flex cursor-pointer select-none items-center gap-[4px] text-gray-400">
																<div></div>
															</div>
															<svg
																stroke="currentColor"
																fill="currentColor"
																strokeWidth={0}
																viewBox="0 0 16 16"
																className="text-gray-400"
																height={16}
																width={16}
																xmlns="http://www.w3.org/2000/svg"
															>
																<path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
															</svg>
															<span
																onClick={() => {
																	{
																		!currentUser
																			? setIsOpen(true)
																			: setReplyTo({
																					id: reply.id,
																					parentCommentId: comment.id,
																			  });
																	}
																}}
																className="cursor-pointer select-none text-xs text-[#1A6DB4] sm:text-sm"
															>
																Trả lời
															</span>
														</div>
													</div>
												</div>
											</div>
										))}
									{/* Hiển thị form trả lời bình luận */}
									{replyTo.id === comment.id && (
										<div className="mt-[20px] pl-[40px] sm:pl-[60px]">
											<div className="flex w-full items-start justify-start gap-[16px] mt-2">
												<Image
													className="rounded-full object-cover"
													src={currentUser?.image ?? '/no-avatar-2.jpg'}
													alt="admin"
													width="49"
													height="49"
												/>
												<div className="relative w-full">
													<textarea
														{...register('comment', { required: true })}
														className={`w-full rounded-[6px] border h-[110px] border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 px-[10px] py-[6px] text-[16px] outline-none focus:border-[1px] ${
															errors.comment ? 'border-red-500' : ''
														}`}
														placeholder="Nhập bình luận của bạn..."
														onKeyDown={handleKeyDown}
													></textarea>
													<div className="absolute right-3 bottom-3 flex gap-2">
														<Button
															label="Gửi"
															onClick={handleSubmit(onSubmit)}
															isLoading={isReplyLoading}
															custom="!py-1 !px-9 !rounded-lg !font-normal"
														/>
														<button
															onClick={() => {
																setReplyTo({ id: null, parentCommentId: null });
															}}
															className=" py-1 px-9  border border-slate-600 bg-white rounded-lg hover:opacity-80"
														>
															Hủy
														</button>
													</div>
												</div>
											</div>
										</div>
									)}

									{/* Hiển thị form trả lời cho phản hồi bình luận */}
									{comment.replies.some((reply) => reply.id === replyTo.id) && (
										<div className="mt-[20px] pl-[40px] sm:pl-[60px]">
											<div className="flex w-full items-start justify-start gap-[16px] mt-2">
												<Image
													className="rounded-full object-cover"
													src={currentUser?.image ?? '/no-avatar-2.jpg'}
													alt="admin"
													width="49"
													height="49"
												/>
												<div className="relative w-full">
													<textarea
														{...register('comment', { required: true })}
														className={`w-full rounded-[6px] border h-[110px] border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 px-[10px] py-[6px] text-[16px] outline-none focus:border-[1px] ${
															errors.comment ? 'border-red-500' : ''
														}`}
														placeholder="Nhập bình luận của bạn..."
														onKeyDown={handleKeyDown}
													></textarea>
													<div className="absolute right-3 bottom-3 flex gap-2">
														<Button
															label="Gửi"
															onClick={handleSubmit(onSubmit)}
															isLoading={isReplyLoading}
															custom="!py-1 !px-9 !rounded-lg !font-normal"
														/>
														<button
															onClick={() => {
																setReplyTo({ id: null, parentCommentId: null });
															}}
															className=" py-1 px-9  border border-slate-600 bg-white rounded-lg hover:opacity-80"
														>
															Hủy
														</button>
													</div>
												</div>
											</div>
										</div>
									)}
									{/* Xem thêm danh sách phản hồi bình luận */}
									{/* {comment.replies.length > 2 && (
										<div className="mt-[10px] flex w-full justify-start pl-[45px] sm:pl-[60px]">
											<button
												type="button"
												className="flex h-[35px] items-center gap-[3px] text-base font-[500] hover:text-blue-500"
											>
												<span className="underline decoration-1">Xem thêm 1 bình luận</span>
												<svg
													stroke="currentColor"
													fill="currentColor"
													strokeWidth={0}
													viewBox="0 0 512 512"
													height={18}
													width={18}
													xmlns="http://www.w3.org/2000/svg"
												>
													<path d="M256 294.1L383 167c9.4-9.4 24.6-9.4 33.9 0s9.3 24.6 0 34L273 345c-9.1 9.1-23.7 9.3-33.1.7L95 201.1c-4.7-4.7-7-10.9-7-17s2.3-12.3 7-17c9.4-9.4 24.6-9.4 33.9 0l127.1 127z" />
												</svg>
											</button>
										</div>
									)} */}
								</Fragment>
							);
						})}
					{/* Xem thêm bình luận */}
					{/* <div className="mt-[25px] flex w-full justify-center">
						{isLoadMoreLoading ? (
							<div className="flex items-center justify-center">
								<Image
									src="/loader2.svg"
									alt="Loading"
									width={37}
									height={37}
									className="animate-spin"
								/>
							</div>
						) : (
							<button
								onClick={loadMore}
								disabled={isLoadMoreLoading}
								type="button"
								className="flex h-[35px] items-center gap-[3px] text-base font-[500] hover:text-blue-500"
							>
								<span className="underline decoration-1">Xem thêm</span>
								<svg
									stroke="currentColor"
									fill="currentColor"
									strokeWidth={0}
									viewBox="0 0 512 512"
									height={18}
									width={18}
									xmlns="http://www.w3.org/2000/svg"
								>
									<path d="M256 294.1L383 167c9.4-9.4 24.6-9.4 33.9 0s9.3 24.6 0 34L273 345c-9.1 9.1-23.7 9.3-33.1.7L95 201.1c-4.7-4.7-7-10.9-7-17s2.3-12.3 7-17c9.4-9.4 24.6-9.4 33.9 0l127.1 127z" />
								</svg>
							</button>
						)}
					</div> */}
				</div>
			</div>
			{isOpen && (
				<ConfirmDialog isOpen={isOpen} handleClose={toggleOpen} alert={true} onConfirm={handleConfirm}>
					Vui lòng đăng nhập tài khoản để gửi bình luận
				</ConfirmDialog>
			)}
		</>
	);
};

export default CommentList;

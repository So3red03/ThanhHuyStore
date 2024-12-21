'use client';

import { FaFileInvoiceDollar, FaSackDollar, FaUsers } from 'react-icons/fa6';
import { formatPrice } from '../../../../utils/formatPrice';
import { CartProductType, Order, User } from '@prisma/client';
import Status from '@/app/components/Status';
import { MdAccessTimeFilled, MdDone } from 'react-icons/md';
import 'moment/locale/vi';
import BestsSellingProductForm from './BestSellingProductsForm';
import { Line, Pie, Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import Link from 'next/link';
import { ChatRoomType, SafeUser } from '../../../../types';
import { useRouter } from 'next/navigation';
import NullData from '@/app/components/NullData';
import { truncateText } from '../../../../utils/truncateText';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDate } from '@/app/(home)/account/orders/OrdersClient';
import AdminModal from '@/app/components/admin/AdminModal';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import Heading from '@/app/components/Heading';
import { Editor } from 'primereact/editor';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import Button from '@/app/components/Button';
import ChatList from '@/app/components/admin/chat/ChatList';

type Review = {
	id: any;
	userId: any;
	productId: any;
	rating: number;
	comment: any;
	reply: any;
	createdDate: any;
	product: {
		id: any;
		name: any;
		description: any;
		price: any;
		brand: any;
		category: any;
		inStock: any;
		images: any[];
	};
	user: {
		id: any;
		name: any;
		email: any;
		emailVerified: any;
		image: any;
		hashedPassword: any;
		createAt: any;
		updateAt: any;
		role: any;
	};
};

interface AdminDashBoardFormProps {
	orders: (Order & { products: CartProductType[] })[];
	users: User[];
	totalRevenue: number;
	columnData: any[];
	currentUser: SafeUser | null | undefined;
	reviews: Review[];
	conversations: ChatRoomType[];
	userInSession: User[];
}

const AdminDashBoardForm: React.FC<AdminDashBoardFormProps> = ({
	orders,
	users,
	totalRevenue,
	columnData,
	currentUser,
	reviews,
	userInSession,
	conversations,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isUpdateOpen, setisUpdateOpen] = useState(false);
	const [isDelete, setIsDelete] = useState(false);
	const [selectedReview, setselectedReview] = useState<Review | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const toggleOpen = () => {
		setIsOpen(!isOpen);
	};

	const toggleUpdateOpen = () => {
		setisUpdateOpen(!isUpdateOpen);
	};

	const toggleDelete = () => {
		setIsDelete(!isDelete);
	};

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
	} = useForm<FieldValues>();

	const onSubmit: SubmitHandler<FieldValues> = (data) => {
		// Kiểm tra nếu bình luận đã được phản hồi
		if (selectedReview?.reply) {
			toast.error('Bình luận này đã được phản hồi');
			setValue('reply', '');
			return;
		}
		setIsLoading(true);
		axios
			.put('/api/commentReply', {
				id: selectedReview?.id,
				reply: data,
			})
			.then(() => {
				toast.success('Phản hồi thành công');
				setValue('reply', '');
			})
			.catch((error) => {
				console.error(error);
				toast.error('Có lỗi khi phản hồi');
			})
			.finally(() => {
				setIsLoading(false);
			});
	};

	// Xác nhận xóa
	const handleConfirmDelete = () => {
		if (selectedReview) {
			handleDeleteReviews(selectedReview.id);
			console.log('xoa thanh cong');
		}
		toggleDelete();
	};

	// call API xóa đánh giá
	const handleDeleteReviews = (id: any) => {
		axios
			.delete(`/api/reviews/${id}`)
			.then((res) => {
				toast.success('Xóa đánh giá thành công');
				router.refresh();
			})
			.catch((error) => {
				toast.error('Có lỗi xảy ra khi xóa');
			});
	};
	// Tránh các đơn hàng bị trùng
	const uniqueProducts = orders?.reduce((acc: CartProductType[], order) => {
		return acc.concat(order.products?.filter((product) => !acc.some((p) => p.id === product.id)));
	}, []);

	const filteredClient = users?.filter((user) => user.role === 'USER');
	const router = useRouter();
	const [hoveredReviewId, setHoveredReviewId] = useState(null);
	const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

	const labels = columnData?.map((label) => label.day);
	const amounts = columnData?.map((amount) => amount.totalAmount);
	const salesWeeklyData = {
		labels: days,
		datasets: [
			{
				label: 'Sản phẩm',
				data: [65, 40, 75, 55, 62, 120],
				// data: amounts,
				backgroundColor: [
					'rgba(255, 99, 132, 0.2)',
					'rgba(255, 159, 64, 0.2)',
					'rgba(255, 205, 86, 0.2)',
					'rgba(75, 192, 192, 0.2)',
					'rgba(54, 162, 235, 0.2)',
					'rgba(153, 102, 255, 0.2)',
				],
				borderColor: [
					'rgb(255, 99, 132)',
					'rgb(255, 159, 64)',
					'rgb(255, 205, 86)',
					'rgb(75, 192, 192)',
					'rgb(54, 162, 235)',
					'rgb(153, 102, 255)',
				],
				borderWidth: 1,
			},
		],
	};
	const successOrder = orders?.filter((order) => order.status === 'completed');
	const cancelledOrders = orders?.filter((order) => order.status !== 'completed');
	const orderPieData = {
		labels: ['Đơn hàng thành công', 'Đơn hàng bị huỷ'],
		datasets: [
			{
				data: [successOrder?.length, cancelledOrders?.length],
				backgroundColor: ['#5dc2a7', '#ff6384'],
			},
		],
	};

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return (
			<>
				<NullData title="Từ chối đăng nhập" />
				{router.push('/login')}
			</>
		);
	}
	const usersChat = [
		{
			id: 1,
			name: 'Devid Heilo',
			message: 'How are you?',
			time: '12 min',
			imgUrl: 'https://react-demo.tailadmin.com/assets/user-01-b007ff3f.png',
			statusColor: 'rgb(16, 185, 129)',
			unreadCount: 3,
		},
		{
			id: 2,
			name: 'Henry Fisher',
			message: 'Waiting for you!',
			time: '12 min',
			imgUrl: 'https://react-demo.tailadmin.com/assets/user-01-b007ff3f.png',
			statusColor: 'rgb(220, 53, 69)',
			unreadCount: 0,
		},
		{
			id: 3,
			name: 'Jhon Doe',
			message: "What's up?",
			time: '32 min',
			imgUrl: 'https://react-demo.tailadmin.com/assets/user-01-b007ff3f.png',
			statusColor: 'rgb(16, 185, 129)',
			unreadCount: 0,
		},
		{
			id: 4,
			name: 'Jane Doe',
			message: 'Great',
			time: '32 min',
			imgUrl: 'https://react-demo.tailadmin.com/assets/user-01-b007ff3f.png',
			statusColor: 'rgb(255, 186, 0)',
			unreadCount: 2,
		},
		{
			id: 5,
			name: 'Jhon Doe',
			message: 'How are you?',
			time: '32 min',
			imgUrl: 'https://react-demo.tailadmin.com/assets/user-01-b007ff3f.png',
			statusColor: 'rgb(16, 185, 129)',
			unreadCount: 0,
		},
	];

	return (
		<>
			<div className="p-5 lg:p-2 flex flex-col lg:flex-row justify-around gap-6 lg:mt-6 mt-16">
				<div className="w-full lg:w-2/3">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6 gap-x-4 gap-y-4 lg:gap-y-0">
						<div className="bg-white p-6 rounded-lg border border-gray-200">
							<div className="flex justify-between items-center">
								<h3 className="text-gray-500 text-sm 3xl:text-base">Đơn hàng</h3>
								<Link
									href={'/admin/manage-orders'}
									className="hover:underline text-sm text-blue-600 3xl:text-base"
								>
									View All
								</Link>
							</div>
							<div className="flex justify-center items-center mt-4">
								<div className="p-4 bg-slate-200 rounded-full">
									<FaFileInvoiceDollar className="text-3xl text-blue-600" />
								</div>
								<div className="flex items-center flex-col">
									<div className="text-2xl font-bold text-blue-600">{orders.length}</div>
									<div className="ml-4 text-green-600">
										<span className="text-sm">12% increase</span>
									</div>
								</div>
							</div>
						</div>
						<div className="bg-white p-6 rounded-lg border border-gray-200">
							<h3 className="text-gray-500 text-sm 3xl:text-base">Doanh Thu</h3>
							<div className="flex justify-center items-center mt-4 gap-4">
								<div className="p-4 bg-[#e0f8e9] rounded-full">
									<FaSackDollar className="text-3xl text-green-600" />
								</div>
								<div className="flex items-center flex-col">
									<div className="text-2xl font-bold text-green-600">{formatPrice(totalRevenue)}</div>
									<div className="ml-4 text-green-600">
										<span className="text-sm">12% increase</span>
									</div>
								</div>
							</div>
						</div>
						<div className="bg-white p-6 rounded-lg border border-gray-200 md:col-span-2 lg:col-span-1">
							<div className="flex justify-between items-center">
								<h3 className="text-gray-500 text-sm 3xl:text-base">Khách hàng</h3>
								<Link
									href={'/admin/manage-users'}
									className="hover:underline text-orange-600 text-sm 3xl:text-base"
								>
									View All
								</Link>
							</div>
							<div className="flex justify-center items-center mt-4">
								<div className="p-4 bg-[#ffecdf] rounded-full">
									<FaUsers className="text-3xl text-orange-600" />
								</div>
								<div className="flex items-center flex-col">
									<div className="text-2xl font-bold text-orange-600">{filteredClient.length}</div>
									<div className="ml-4 text-red-600">
										<span className="text-sm">12% increase</span>
									</div>
								</div>
							</div>
						</div>
					</div>
					{/* charts  */}
					<div className="grid grid-cols-1 mt-5">
						<div className="relative border border-gray-200 rounded-lg p-6">
							<h2 className="text-center font-bold text-lg text-gray-500">Doanh số hằng tuần</h2>
							<div className="w-full h-auto block mx-auto">
								<Bar
									data={salesWeeklyData}
									options={{
										scales: {
											y: {
												beginAtZero: true,
											},
										},
										responsive: true,
										maintainAspectRatio: true, //Cho phép chart tự động scale theo width
									}}
								/>
							</div>
						</div>
					</div>
					<div className="bg-white p-6 pb-7 rounded-lg border border-gray-200 mt-5">
						<h2 className="text-gray-500 mb-4 font-semibold text-lg">Sản phẩm bán chạy</h2>
						<div className="overflow-y-auto">
							<table className="w-full h-full text-left">
								<thead>
									<tr>
										<th className="py-2">Sản phẩm</th>
										<th className="py-2 px-3">SL</th>
										<th className="py-2">Doanh thu</th>
									</tr>
								</thead>
								<tbody>
									{uniqueProducts.map((item: any) => (
										<BestsSellingProductForm key={item.id} item={item} />
									))}
								</tbody>
							</table>
						</div>
					</div>
					<div className="bg-white pb-7 mt-5 mb-1 rounded-lg border border-gray-200">
						<div className="flex justify-between items-center p-4">
							<h2 className="text-gray-500 font-semibold text-lg">Danh sách đơn hàng</h2>
							<input
								type="text"
								name=""
								id=""
								className="px-4 py-[10px] border focus:border-blue-500 rounded-lg focus:outline-blue-500"
								placeholder="Tìm kiếm"
							/>
						</div>
						<div className="h-[43vh] overflow-y-auto">
							<table className="w-full text-left">
								<thead className="bg-[#F7F9FC]">
									<tr>
										<th className="p-4">Mã #</th>
										<th className="p-4">Khách hàng</th>
										<th className="p-4">Thời gian</th>
										<th className="p-4">Trạng thái</th>
									</tr>
								</thead>
								<tbody>
									{orders.map((order: any) => (
										<tr className="border-t" key={order.id}>
											<td className="py-2 px-4 text-blue-500">{truncateText(order.id)}</td>
											<td className="py-2 px-4">{order.user.name}</td>
											<td className="py-2 px-4">{formatDate(order.createDate)}</td>
											<td className="py-2 px-4">
												<span className={`flex justify-center items-center h-full`}>
													{order.status === 'completed' ? (
														<Status
															text="Thành công"
															icon={MdDone}
															bg="bg-green-300"
															color="text-gray-700"
														/>
													) : (
														<Status
															text="Đang chờ"
															icon={MdAccessTimeFilled}
															bg="bg-slate-200"
															color="text-slate-700"
														/>
													)}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>

				<div className="w-full lg:w-1/3 flex flex-col">
					<div className="mb-4 rounded-lg border border-gray-200 w-full px-3 py-6 pb-1">
						<h2 className="text-center font-bold text-lg text-gray-500">Doanh số tổng đơn</h2>
						<div className="w-[40vw] max-w-full h-[25vh] max-h-[500px] block mx-auto">
							<Pie
								data={orderPieData}
								options={{
									maintainAspectRatio: false,
									responsive: true,
								}}
							/>
						</div>
					</div>
					<div className="mb-4 rounded-lg border border-gray-200 w-full py-6 flex-1">
						<h2 className="mb-3 text-gray-500 px-6 font-semibold text-lg">Tin nhắn</h2>
						<ChatList conversations={conversations} userInSession={userInSession} dashboard={true} />
					</div>
					{/* Đánh giá sản phẩm */}
					<div className="rounded-lg border border-gray-200 w-full p-6 pr-0 pb-2 flex-1">
						<h2 className="text-gray-500 mb-4 font-semibold text-lg">Đánh giá sản phẩm gần đây</h2>
						<div className="h-[65vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#c0c0c0] scrollbar-track-transparent">
							{reviews?.map((review) => (
								<div
									key={review.id}
									className="flex flex-col items-start my-6 mr-3"
									onMouseEnter={() => setHoveredReviewId(review.id)}
									onMouseLeave={() => setHoveredReviewId(null)}
								>
									<div className="flex items-start gap-3">
										<div
											className={`relative inline-block rounded-full overflow-hidden 
												h-11 w-11`}
										>
											<Image alt="Avatar" src="/no-avatar-2.jpg" fill sizes="100%" />
										</div>
										<div>
											<Link href={`/product/${review.product.id}`}>
												<span className="text-sm">Đánh giá </span>
												<span className="font-semibold text-blue-500 text-sm hover:underline">
													{review.product.name}
												</span>
											</Link>
											<div className="flex items-center gap-2 my-2">
												<span className="text-blue-500 text-sm">{review.user.name}</span>
												<span className="text-gray-400 text-xs">
													{formatDate(review.createdDate)}
												</span>
											</div>
										</div>
									</div>
									<div className="w-full">
										<div className="flex items-center justify-between">
											<p className="text-sm mt-1">{review.comment}</p>
											{review.reply ? (
												<p className="text-xs text-gray-500">(Đã đánh giá)</p>
											) : (
												<p className="text-xs text-gray-500">(Chưa đánh giá)</p>
											)}
										</div>
										{/* Tính năng khi hover*/}
										<div
											className={`text-blue-500 text-xs mt-1 transition-opacity duration-150 ${
												hoveredReviewId === review.id ? 'opacity-100' : 'opacity-0'
											}`}
										>
											<a
												className="hover:underline cursor-pointer"
												onClick={() => {
													setselectedReview(review);
													toggleOpen();
												}}
											>
												Phản hồi{' '}
											</a>
											|
											<a
												className="hover:underline ml-1 cursor-pointer"
												onClick={() => {
													setselectedReview(review);
													toggleUpdateOpen();
												}}
											>
												Sửa{' '}
											</a>
											|
											<a
												className="hover:underline text-red-600 ml-1 cursor-pointer"
												onClick={() => {
													setselectedReview(review);
													toggleDelete();
												}}
											>
												Xóa{' '}
											</a>
											|
											<a
												href={`/product/${review.product.id}#comment-${review.id}`}
												className="hover:underline ml-1"
											>
												Xem{' '}
											</a>
										</div>
									</div>
									{/* Phản hồi bình luận  */}
									<div
										className={`transition-transform duration-300 ease-in-out w-full ${
											isOpen ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
										}`}
									>
										{isOpen && selectedReview?.id === review.id && (
											<div className="mt-2 p-2 border rounded">
												<p className="font-semibold text-sm py-1">Phản hồi bình luận</p>
												<textarea
													{...register('reply', { required: true })}
													className={`w-full h-24 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 rounded-md p-2 text-sm ${
														errors.reply ? 'border-red-500' : ''
													}`}
													placeholder="Nhập phản hồi của bạn..."
												></textarea>
												<div className="flex justify-start mt-2">
													<Button
														label="Lưu"
														small
														custom="!px-4 !py-1 !text-sm !mr-2 !rounded-md !w-fit "
														onClick={handleSubmit(onSubmit)}
														isLoading={isLoading}
													/>
													<button
														className="bg-gray-300 text-gray-700 px-4 py-1 text-sm rounded-md hover:opacity-80"
														onClick={() => {
															setIsOpen(false);
															setselectedReview(null);
														}}
													>
														Hủy
													</button>
												</div>
											</div>
										)}
									</div>
									{/* Sửa bình luận đã phản hồi  */}
									<div
										className={`transition-transform duration-300 ease-in-out w-full ${
											isUpdateOpen ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
										}`}
									>
										{isUpdateOpen && selectedReview?.id === review.id && (
											<div className="mt-2 p-2 border rounded">
												<p className="font-semibold text-sm py-1">Sửa phản hồi</p>
												<textarea
													{...register('edit', { required: true })}
													defaultValue={selectedReview?.reply}
													className={`w-full h-24 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 rounded-md p-2 text-sm ${
														errors.reply ? 'border-red-500' : ''
													}`}
													placeholder="Nhập phản hồi của bạn..."
												></textarea>
												<div className="flex justify-start mt-2">
													<Button
														label="Lưu"
														small
														custom="!px-4 !py-1 !text-sm !mr-2 !rounded-md !w-fit "
														onClick={handleSubmit(onSubmit)}
														isLoading={isLoading}
													/>
													<button
														className="bg-gray-300 text-gray-700 px-4 py-1 text-sm rounded-md hover:opacity-80"
														onClick={() => {
															setisUpdateOpen(false);
															setselectedReview(null);
														}}
													>
														Hủy
													</button>
												</div>
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
			{isDelete && <ConfirmDialog isOpen={isDelete} handleClose={toggleDelete} onConfirm={handleConfirmDelete} />}
		</>
	);
};

export default AdminDashBoardForm;

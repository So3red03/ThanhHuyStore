'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatRoomType, SafeUser } from '../../../../types';
import NullData from '@/app/components/NullData';
import ChatList from '@/app/components/admin/chat/ChatList';

import DashboardStats from '@/app/components/admin/DashboardStats';
import DashboardCharts from '@/app/components/admin/DashboardCharts';
import BestSellingProducts from '@/app/components/admin/BestSellingProducts';
import OrdersTable from '@/app/components/admin/OrdersTable';
import ReviewsSection from '@/app/components/admin/ReviewsSection';

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
	orders: (any & { products: any[] })[];
	users: any[];
	totalRevenue: number;
	columnData: any[];
	currentUser: SafeUser | null | undefined;
	reviews: any;
	conversations: ChatRoomType[];
	userInSession: any[];
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
	const router = useRouter();

	// Tránh các đơn hàng bị trùng
	const uniqueProducts = orders?.reduce((acc: any[], order) => {
		return acc.concat(order.products?.filter((product: any) => !acc.some((p) => p.id === product.id)));
	}, []);

	const filteredClient = users?.filter((user) => user.role === 'USER');
	const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

	const salesWeeklyData = {
		labels: days,
		datasets: [
			{
				label: 'Sản phẩm',
				data: [65, 40, 75, 55, 62, 120],
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

	const successOrder = orders?.filter((order) => order.status === 'completed' && order.deliveryStatus === 'delivered');
	const cancelledOrders = orders?.filter((order) => order.status === 'canceled');
	const orderPieData = {
		labels: ['Đơn hàng thành công', 'Đơn hàng bị huỷ'],
		datasets: [
			{
				data: [successOrder?.length, cancelledOrders?.length],
				backgroundColor: ['#5dc2a7', '#ff6384'],
			},
		],
	};

	useEffect(() => {
		if (!currentUser || currentUser.role !== 'ADMIN') {
			router.push('/login');
		}
	}, [currentUser, router]);

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return <NullData title="Từ chối đăng nhập" />;
	}

	return (
		<>
			<div className="flex flex-col lg:flex-row justify-around gap-3 mt-6">
				<div className="w-full lg:w-2/3">
					<DashboardStats
						ordersCount={orders.length}
						totalRevenue={totalRevenue}
						clientsCount={filteredClient.length}
					/>
					<div className="grid grid-cols-1 mt-5">
						<div className="relative border border-gray-200 rounded-lg p-6">
							<h2 className="text-center font-bold text-lg text-gray-500">Doanh số hằng tuần</h2>
							<div className="w-full h-auto block mx-auto">
								<DashboardCharts
									salesWeeklyData={salesWeeklyData}
									type="bar"
								/>
							</div>
						</div>
					</div>

					<BestSellingProducts uniqueProducts={uniqueProducts} />
					<OrdersTable orders={orders} />
				</div>

				<div className="w-full lg:w-1/3 flex flex-col">
					<div className="mb-4 rounded-lg border border-gray-200 w-full px-3 py-6 pb-1">
						<h2 className="text-center font-bold text-lg text-gray-500">Doanh số tổng đơn</h2>
						<div className="w-[40vw] max-w-full h-[25vh] max-h-[500px] block mx-auto">
							<DashboardCharts
								orderPieData={orderPieData}
								type="pie"
							/>
						</div>
					</div>
					<ReviewsSection reviews={reviews} />
					<div className="rounded-lg border border-gray-200 w-full py-6 flex-1">
						<h2 className="mb-3 text-gray-500 px-6 font-semibold text-lg">Tin nhắn</h2>
						<ChatList conversations={conversations} userInSession={userInSession} dashboard={true} />
					</div>
				</div>
			</div>

		</>
	);
};

export default AdminDashBoardForm;

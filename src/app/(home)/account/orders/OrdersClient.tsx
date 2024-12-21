'use client';

import { CartProductType, Order } from '@prisma/client';
import Status from '@/app/components/Status';
import { MdAccessTimeFilled, MdDeliveryDining, MdDone } from 'react-icons/md';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useState } from 'react';
import AdminModal from '@/app/components/admin/AdminModal';
import { SafeUser } from '../../../../../types';
import { formatPrice } from '../../../../../utils/formatPrice';
import NullData from '@/app/components/NullData';
import Button from '@/app/components/Button';
import NotFound from '@/app/components/NotFound';
import { Box, Rating, styled, Tab, Tabs } from '@mui/material';
import moment from 'moment';
import 'moment/locale/vi';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export const formatDate = (date: any) => {
	return format(date, "dd 'tháng' M yyyy '|' HH:mm:ss", { locale: vi });
};

export const formatDateNoTime = (date: any) => {
	return format(date, "dd 'tháng' M yyyy", { locale: vi });
};

interface OrdersClientProps {
	orders: (Order & { products: CartProductType[] })[];
	currentUser: SafeUser | null | undefined;
}

const OrdersClient: React.FC<OrdersClientProps> = ({ orders, currentUser }) => {
	const [isOpen, setIsOpen] = useState(false);
	// Giá trị hiển thị để chuyển đổi các tab
	const [value, setValue] = useState(0);
	const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
	const router = useRouter();
	const toggleOpen = () => {
		setIsOpen(!isOpen);
	};
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
			<div className="max-w-4xl mx-auto p-6 py-0">
				{orders.length > 0 ? (
					<>
						<div className={`flex justify-between items-center mb-4`}>
							<h1 className="text-2xl font-bold">ĐƠN HÀNG CỦA TÔI</h1>
							<span className="text-sm text-gray-600">({orders.length} đơn hàng)</span>
						</div>
						<div className="w-100 overflow-auto">
				<Box sx={{ overflowX: 'auto' }}>
					<AntTabs value={value} onChange={handleChange} centered>
						<Tab label="Mô tả sản phẩm" sx={tabStyles} />
						<Tab label="Thông số kĩ thuật" sx={tabStyles} />
						<Tab label="Hỏi đáp" sx={tabStyles} />
					</AntTabs>
				</Box>
			</div>

						{orders.map((order) => (
							<div key={order.id} className="my-4 border border-gray-300 rounded-lg">
								<div className="p-4 bg-gray-50">
									<div className="flex justify-between items-center mb-2">
										<span className="text-lg font-semibold text-gray-700">{order.id}</span>
									</div>

									<p className="text-sm text-gray-500">{formatDate(order.createDate)}</p>
									<div className="text-sm text-gray-600 flex items-center gap-2">
										Tình trạng đặt hàng:{' '}
										<span className="font-medium">
											{order.deliveryStatus === 'pending' ? (
												<Status
													text="Đang chờ"
													icon={MdAccessTimeFilled}
													bg="bg-slate-200"
													color="text-slate-700 !py-0 !px-1"
												/>
											) : order.deliveryStatus === 'dispatched' ? (
												<Status
													text="Đang giao hàng"
													icon={MdDeliveryDining}
													bg="bg-purple-200"
													color="text-purple-700 !py-0 !px-1"
												/>
											) : order.deliveryStatus === 'delivered' ? (
												<Status
													text="Giao thành công"
													icon={MdDone}
													bg="bg-green-200"
													color="text-green-700 !py-0 !px-1"
												/>
											) : (
												<></>
											)}
										</span>
									</div>
									<div className="text-sm text-gray-600 flex items-center gap-2">
										Trạng thái thanh toán:{' '}
										<span className="font-medium">
											{order.status === 'pending' ? (
												<Status
													text="Đang chờ"
													icon={MdAccessTimeFilled}
													bg="bg-slate-200"
													color="text-slate-700 !py-0 !px-1"
												/>
											) : (
												<Status
													text="Thành công"
													icon={MdDone}
													bg="bg-green-200"
													color="text-green-700 !py-0 !px-1"
												/>
											)}
										</span>
									</div>
								</div>

								<div className="border-t p-4 border-gray-300 flex justify-between items-center">
									<button
										onClick={() => {
											setSelectedOrder(order);
											toggleOpen();
										}}
										className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-slate-600 hover:text-white hover:boder-slate-600"
									>
										Thông tin đơn hàng
									</button>
									<span className="text-md font-semibold">{formatPrice(order.amount)}</span>
								</div>
							</div>
						))}
					</>
				) : (
					<div className="mt-8">
						<NotFound />
						<p className="text-center font-semibold text-lg my-5">Quý khách chưa có đơn hàng nào</p>
						<Button
							label="Tiếp tục mua hàng"
							onClick={() => {
								router.push('/');
							}}
							custom="!max-w-[200px] !mx-auto"
						/>
					</div>
				)}
			</div>
			{isOpen && (
				<AdminModal isOpen={isOpen} handleClose={toggleOpen}>
					<div className="max-w-4xl mx-auto p-3">
						{/* Header */}
						<h1 className="text-2xl font-semibold mb-4">Chi tiết đơn hàng</h1>
						<p className="text-gray-700 mb-6">Xin chào, {currentUser?.name}</p>
						<p className="text-gray-700 mb-8">
							{selectedOrder?.status === 'pending'
								? 'Đơn hàng chưa được thanh toán'
								: 'Đơn hàng thanh toán thành công'}
						</p>

						{/* Order Info */}
						<div className="grid grid-cols-4 gap-4 border-b pb-4 mb-8">
							<div className="border-r border-gray-300">
								<h2 className="font-semibold">Đơn hàng đã đặt</h2>
								<p>{formatDate(selectedOrder?.createDate)}</p>
							</div>
							<div className="border-r border-gray-300">
								<h2 className="font-semibold">Tình trạng đặt hàng</h2>
								<p>{selectedOrder?.deliveryStatus}</p>
							</div>
							<div className="border-r border-gray-300">
								<h2 className="font-semibold">Trạng thái thanh toán</h2>
								<p>{selectedOrder?.status}</p>
							</div>
							<div>
								<h2 className="font-semibold">Phương thức thanh toán</h2>
								<p>
									{selectedOrder?.paymentMethod === 'momo' ? (
										<Image src="/momo.png" alt="momo" width={24} height={24} />
									) : selectedOrder?.paymentMethod === 'stripe' ? (
										<Image src="/stripe-v2-svgrepo-com.svg" alt="stripe" width={24} height={24} />
									) : (
										<div className="flex items-center gap-2">
											<Image
												src="https://file.hstatic.net/200000636033/file/pay_2d752907ae604f08ad89868b2a5554da.png"
												alt="cod"
												width={24}
												height={24}
											/>
											<span className="text-[16px]">(COD)</span>
										</div>
									)}
								</p>
							</div>
						</div>

						{/* Products List */}
						{selectedOrder?.products.map((item: any) => {
							return (
								<div className="flex items-center justify-between mb-5" key={item.id}>
									<div className="flex items-center space-x-4">
										<Image
											src={item.selectedImg.images[0]}
											width={80}
											height={80}
											alt={item.name}
										/>
										<div>
											<h3 className="font-semibold">{item.name}</h3>
											<p className="text-gray-500">{item.selectedImg.color}</p>
										</div>
									</div>
									<p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
								</div>
							);
						})}

						{/* Order Summary */}
						<div className="border-t pt-4 mt-8">
							<div className="flex justify-between">
								<p>Tạm tính ({selectedOrder?.products.length} sản phẩm)</p>
								<p>{formatPrice(selectedOrder?.amount)}</p>
							</div>
							<div className="flex justify-between">
								<p>Phí ship</p>
								<p>{formatPrice(0)}</p>
							</div>
							<div className="flex justify-between">
								<p>Thuế</p>
								<p>{formatPrice(0)}</p>
							</div>
							<div className="flex justify-between">
								<p>Giảm giá</p>
								<p>{formatPrice(0)}</p>
							</div>
							<div className="flex justify-between font-semibold text-lg mt-4">
								<p>Tổng</p>
								<p>{formatPrice(selectedOrder?.amount)}</p>
							</div>
						</div>

						{/* Shipping Address */}
						<div className="border-t py-4 mt-8">
							<h2 className="font-semibold mb-2">Địa chỉ giao hàng</h2>
							<p className="text-gray-700">Số điện thoại: {selectedOrder?.phoneNumber}</p>
							<p className="text-gray-700">
								Địa chỉ:{' '}
								{`${selectedOrder?.address?.line1 || ''} ${selectedOrder?.address?.city || ''}`}
							</p>
						</div>
					</div>
				</AdminModal>
			)}
		</>
	);
};

export default OrdersClient;

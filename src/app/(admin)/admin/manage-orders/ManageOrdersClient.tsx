'use client';

import Status from '@/app/components/Status';
import ActionBtn from '@/app/components/ActionBtn';
import axios from 'axios';
import toast from 'react-hot-toast';
import moment from 'moment';
import OrderItem from '@/app/components/admin/OrderItem';
import AdminModal from '@/app/components/admin/AdminModal';
import { MdAccessTimeFilled, MdDeliveryDining, MdDone, MdRemoveRedEye } from 'react-icons/md';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Order } from '@prisma/client';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { formatPrice } from '../../../../../utils/formatPrice';
import 'moment/locale/vi';
import { SafeUser } from '../../../../../types';
import NullData from '@/app/components/NullData';
import { formatDate } from '@/app/(home)/account/orders/OrdersClient';
import { FaCartShopping, FaRegFaceAngry, FaRegFaceFrown } from 'react-icons/fa6';
import { FaCheckDouble, FaRegCalendarAlt } from 'react-icons/fa';

interface ManageOrdersClientProps {
	orders: Order[];
	currentUser: SafeUser | null | undefined;
}

const ManageOrdersClient: React.FC<ManageOrdersClientProps> = ({ orders, currentUser }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
	const router = useRouter();

	const toggleOpen = () => {
		setIsOpen(!isOpen);
	};

	// @ts-ignore
	const { customerName, date, customerEmail } = selectedOrder || {};

	let rows: any = [];
	if (orders) {
		rows = orders.map((order: any) => {
			return {
				id: order.id,
				customerName: order.user.name,
				customerEmail: order.user.email,
				amount: formatPrice(order.amount),
				paymentStatus: order.status,
				// date: moment(order.createDate).fromNow(),
				date: formatDate(order.createDate),
				deliveryStatus: order.deliveryStatus,
				products: order.products,
			};
		});
	}

	const columns: GridColDef[] = [
		{ field: 'customerName', headerName: 'Tên khách hàng', width: 150 },
		{ field: 'customerEmail', headerName: 'Email', width: 230 },
		{
			field: 'amount',
			headerName: 'Giá đơn',
			width: 125,
			renderCell: (params) => {
				return <div className="font-bold text-slate-800">{params.row.amount}</div>;
			},
		},
		{
			field: 'paymentStatus',
			headerName: 'Thanh toán',
			width: 110,
			renderCell: (params) => {
				return (
					<div className="flex justify-center items-center h-full">
						{params.row.paymentStatus === 'pending' ? (
							<Status
								text="Đang chờ"
								icon={MdAccessTimeFilled}
								bg="bg-slate-200"
								color="text-slate-700"
							/>
						) : (
							<Status text="Thành công" icon={MdDone} bg="bg-green-200" color="text-green-700" />
						)}
					</div>
				);
			},
		},
		{
			field: 'deliveryStatus',
			headerName: 'Giao hàng',
			width: 118,
			renderCell: (params) => {
				return (
					<div className="flex justify-center items-center h-full">
						{params.row.deliveryStatus === 'pending' ? (
							<Status
								text="Đang chờ"
								icon={MdAccessTimeFilled}
								bg="bg-slate-200"
								color="text-slate-700"
							/>
						) : params.row.deliveryStatus === 'dispatched' ? (
							<Status
								text="Đang giao hàng"
								icon={MdDeliveryDining}
								bg="bg-purple-200"
								color="text-purple-700"
							/>
						) : params.row.deliveryStatus === 'delivered' ? (
							<Status text="Giao thành công" icon={MdDone} bg="bg-green-200" color="text-green-700" />
						) : (
							<></>
						)}
					</div>
				);
			},
		},
		{ field: 'date', headerName: 'Thời gian', width: 200 },
		{
			field: 'action',
			headerName: '',
			width: 180,
			renderCell: (params) => {
				return (
					<div className="flex items-center justify-center gap-4 h-full">
						<ActionBtn
							icon={MdDeliveryDining}
							onClick={() => {
								handleDispatch(params.row.id);
							}}
						/>
						<ActionBtn
							icon={MdDone}
							onClick={() => {
								handleDeliver(params.row.id);
							}}
						/>
						<ActionBtn
							icon={MdRemoveRedEye}
							onClick={() => {
								setSelectedOrder(params.row);
								toggleOpen();
							}}
						/>
					</div>
				);
			},
		},
	];

	const handleDispatch = (id: string) => {
		axios
			.put('/api/order', {
				id,
				deliveryStatus: 'dispatched',
			})
			.then((res) => {
				toast.success('Đơn hàng đã được gửi đi');
				router.refresh();
			})
			.catch((error) => {
				toast.error('Có lỗi xảy ra khi gửi đơn hàng');
				console.error(error);
			});
	};

	const handleDeliver = (id: string) => {
		axios
			.put('/api/order', {
				id,
				deliveryStatus: 'delivered',
			})
			.then((res) => {
				toast.success('Giao hàng thành công');
				router.refresh();
			})
			.catch((error) => {
				toast.error('Có lỗi xảy ra khi gửi đơn hàng');
				console.error(error);
			});
	};

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return (
			<>
				<NullData title="Từ chối đăng nhập" />
				{router.push('/login')}
			</>
		);
	}
	const successOrders = orders?.filter((order) => order.status === 'completed').length;
	const pendingOrders = orders?.filter((order) => order.status !== 'completed').length;
	const stats = [
		{
			count: `${pendingOrders}`,
			description: 'Thanh toán đang chờ',
			icon: <FaRegCalendarAlt className="text-2xl text-gray-600" />,
		},
		{
			count: `${successOrders}`,
			description: 'Hoàn thành',
			icon: <FaCheckDouble className="text-2xl text-gray-600" />,
		},
		{
			count: '0',
			description: 'Hoàn trả',
			icon: <FaRegFaceAngry className="text-2xl text-gray-600" />,
		},
		{
			count: '0',
			description: 'Thất bại',
			icon: <FaRegFaceFrown className="text-2xl text-gray-600" />,
		},
	];
	return (
		<>
			<div className="w-[78.5vw] m-auto text-xl mt-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-3 pr-0 border border-r-0 border-gray-200 rounded-lg">
					{stats.map((stat, index) => (
						<div
							key={index}
							className="bg-white p-4 border-r border-r-gray-200 border-b border-b-gray-200 md:border-b-0"
						>
							<div className="flex justify-between">
								<div className="flex flex-col gap-y-2">
									<div className="text-2xl">{stat.count}</div>
									<p className="text-gray-500 text-[15px]">{stat.description}</p>
								</div>
								<div className="flex items-center justify-center h-12 w-12 rounded-md bg-gray-100 text-slate-700">
									{stat.icon}
								</div>
							</div>
						</div>
					))}
				</div>
				<div className="mb-4 mt-5"></div>
				<div className="h-[600px] w-full">
					<DataGrid
						rows={rows}
						columns={columns}
						className="py-5"
						initialState={{
							pagination: {
								paginationModel: { page: 0, pageSize: 10 },
							},
						}}
						slots={{ toolbar: GridToolbar }}
						slotProps={{
							toolbar: {
								showQuickFilter: true,
								quickFilterProps: { debounceMs: 500 },
							},
						}}
						pageSizeOptions={[10, 20, 30]}
						checkboxSelection
						disableRowSelectionOnClick
						disableColumnFilter
						disableDensitySelector
						disableColumnSelector
						sx={{
							'& .MuiDataGrid-toolbarContainer': {
								flexDirection: 'row-reverse',
								padding: '15px',
							},
							'& .css-yrdy0g-MuiDataGrid-columnHeaderRow': {
								backgroundColor: '#F6F7FB !important',
							},
						}}
					/>
				</div>
			</div>
			{isOpen && (
				<AdminModal isOpen={isOpen} handleClose={toggleOpen}>
					<div className="w-full">
						<div className="bg-white rounded-lg shadow-md">
							<div className="px-6 py-5 bg-gray-100 rounded-t-lg">
								<h5 className="text-gray-600 mb-0">
									Đơn hàng của KH, <span className="text-pink-600">{customerName}</span>!
								</h5>
								<h5 className="text-gray-600 mb-0">
									Email, <span className="text-pink-600">{customerEmail}</span>!
								</h5>
							</div>
							<div className="p-6">
								<div className="flex justify-between items-center mb-4">
									<p className="text-pink-600 font-semibold mb-0">Biên lai</p>
									<p className="text-sm text-gray-500 mb-0">
										Biên lai Voucher: chưa làm chức năng này
									</p>
								</div>
								{selectedOrder?.products.map((item: any) => {
									return <OrderItem key={item.id} item={item} />;
								})}
								<div className="flex justify-between pt-2">
									<p className="font-semibold text-slate-700">Chi tiết đơn hàng</p>
									<p className="text-gray-500">
										<span className="font-semibold mr-4 !text-slate-700">Tổng</span>
										{selectedOrder?.amount}
									</p>
								</div>
								<div className="flex justify-between pt-2">
									<p className="text-gray-500 ">Số hóa đơn: {selectedOrder?.id}</p>
									<p className="text-gray-500 ">
										<span className="font-semibold mr-4">Giảm giá</span>$0
									</p>
								</div>
								<div className="flex justify-between">
									<p className="text-gray-500 ">Ngày lập hóa đơn: {date}</p>
									<p className="text-gray-500 ">
										<span className="font-semibold mr-4">VAT 18%</span>$0
									</p>
								</div>
								<div className="flex justify-between mb-5">
									<p className="text-gray-500 ">Biên lai Voucher: chưa làm chức năng này</p>
									<p className="text-gray-500 ">
										<span className="font-semibold mr-4">Tiền ship</span>Free
									</p>
								</div>
							</div>
							<div className="px-6 py-5 bg-slate-200 rounded-b-lg">
								<h5 className="flex items-center justify-end text-slate-700 text-2xl font-bold uppercase mb-0">
									Tổng tiền: {selectedOrder?.amount}
								</h5>
							</div>
						</div>
					</div>
				</AdminModal>
			)}
		</>
	);
};

export default ManageOrdersClient;

'use client';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { CartProductType, DeliveryStatus, Order, OrderStatus, Review, User } from '@prisma/client';
import { formatPrice } from '../../../../../../../utils/formatPrice';
import Status from '@/app/components/Status';
import { MdAccessTimeFilled, MdDelete, MdDeliveryDining, MdDone, MdRemoveRedEye } from 'react-icons/md';
import ActionBtn from '@/app/components/ActionBtn';
import { FaChartBar, FaDollarSign } from 'react-icons/fa';
import { FaCartShopping } from 'react-icons/fa6';
import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import AdminModal from '@/app/components/admin/AdminModal';
import FormWarp from '@/app/components/FormWrap';
import Input from '@/app/components/inputs/Input';
import Button from '@/app/components/Button';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import Heading from '@/app/components/Heading';
import Image from 'next/image';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const formatDate = (date: any) => {
	return format(date, "dd 'tháng' M yyyy '|' HH:mm:ss", { locale: vi });
};

interface UserDetailsClientProps {
	user: User & {
		orders: Order[];
		reviews?: Review[];
	};
}
const UserDetailsClient: React.FC<UserDetailsClientProps> = ({ user }) => {
	const total = user.orders.filter((order) => order.status === OrderStatus.completed && order.deliveryStatus === DeliveryStatus.delivered)
		.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0);
	const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
	let rows: any = [];
	if (user.orders) {
		rows = user.orders.map((invoice: any) => {
			return {
				id: invoice.id,
				name: invoice.name,
				status: invoice.status,
				amount: formatPrice(invoice.amount),
				paymentStatus: invoice.status,
				deliveryStatus: invoice.deliveryStatus,
				products: invoice.products,
				address: invoice.address,
				phoneNumber: invoice.phoneNumber,
				createDate: formatDate(invoice.createDate),
			};
		});
	}

	const columns: GridColDef[] = [
		{
			field: 'id',
			headerName: 'Hóa đơn',
			width: 100,
		},
		{
			field: 'amount',
			headerName: 'Tổng tiền',
			width: 110,
		},
		{
			field: 'paymentStatus',
			headerName: 'Thanh toán',
			width: 150,
			renderCell: (params) => {
				return (
				<div className="flex justify-center items-center h-full">
					<select
					value={params.row.paymentStatus}
					onChange={(event) =>
						handleUpdateOrderStatus(params.row.id, event.target.value)
					}
					className="border rounded-md px-2 py-1 text-sm bg-white shadow-sm"
					>
						<option value={OrderStatus.pending}>Chờ thanh toán</option>
						<option value={OrderStatus.confirmed}>Đã thanh toán</option>
						<option value={OrderStatus.completed}>Hoàn thành</option>
						<option value={OrderStatus.canceled}>Đã hủy</option>
					</select>
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
						{params.row.deliveryStatus === DeliveryStatus.not_shipped ? (
							<Status
								text="Đang chờ"
								icon={MdAccessTimeFilled}
								bg="bg-slate-200"
								color="text-slate-700"
							/>
						) : params.row.deliveryStatus === DeliveryStatus.in_transit ? (
							<Status
								text="Đang giao hàng"
								icon={MdDeliveryDining}
								bg="bg-purple-200"
								color="text-purple-700"
							/>
						) : params.row.deliveryStatus === DeliveryStatus.delivered ? (
							<Status text="Giao thành công" icon={MdDone} bg="bg-green-200" color="text-green-700" />
						) : (
							<></>
						)}
					</div>
				);
			},
		},
		{ field: 'createDate', headerName: 'Ngày tạo', width: 200 },
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
	const handleUpdateOrderStatus = (id: string, newStatus: any) => {
		axios
			.put(`/api/order/${id}`, { status: newStatus })
			.then(() => {
				toast.success('Cập nhật đơn hàng thành công');
				router.refresh(); // Làm mới dữ liệu trong bảng
			})
			.catch((error) => {
				toast.error('Có lỗi xảy ra khi cập nhật đơn hàng');
				console.error(error);
			});
	};
	const handleDispatch = (id: string) => {
		axios
			.put('/api/order', {
				id,
				deliveryStatus: DeliveryStatus.in_transit,
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

	const handleDeliver = async (id: string) => {
		try {
			await Promise.all([
			axios.put(`/api/order/${id}`, { status: OrderStatus.completed}),
			axios.put('/api/order', { id, deliveryStatus: DeliveryStatus.delivered }),
			]);

			toast.success('Cập nhật và giao hàng thành công');
			router.refresh(); // Làm mới dữ liệu trong bảng
		} catch (error) {
			toast.error('Có lỗi xảy ra khi cập nhật đơn hàng hoặc giao hàng');
			console.error(error);
		}
	};
	const router = useRouter();
	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<FieldValues>();
	const [isOpen, setIsOpen] = useState(false);
	const [isUpdatedModalOpen, setIsUpdateModalOpen] = useState(false);
	const [isDelete, setIsDelete] = useState(false);
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const toggleUpdateModalOpen = () => {
		setIsUpdateModalOpen(!isUpdatedModalOpen);
	};

	const toggleOpen = () => {
		setIsOpen(!isOpen);
	};

	const toggleDelete = () => {
		setIsDelete(!isDelete);
	};

	// Hàm cập nhật giá trị id, value: label
	const setCustomValue = (id: string, value: any) => {
		setValue(id, value, {
			shouldValidate: true,
			shouldDirty: true,
			shouldTouch: true,
		});
	};

	const handleOpenUpdateModal = (user: any) => {
		setSelectedUser(user);
		// Cập nhật giá trị lên defaultValues
		const fieldsToSet = ['name', 'email', 'role'];
		fieldsToSet.forEach((field) => setCustomValue(field, user[field]));

		toggleUpdateModalOpen();
	};

	// Xác nhận xóa
	const handleConfirmDelete = async () => {
		if (selectedUser) {
			await handleDelete(selectedUser.id);
		}
		toggleDelete();
	};

	const handleDelete = async (id: string) => {
		await toast('Đang xóa tài khoản, xin chờ...');

		axios
			.delete(`/api/user/${id}`)
			.then((res) => {
				toast.success('Xóa tài khoản thành công');
				router.push('/admin/manage-users');
			})
			.catch((error) => {
				toast.error('Có lỗi xảy ra khi xóa');
				console.error(error);
			});
	};

	const onSubmit: SubmitHandler<FieldValues> = async (data) => {
		setIsLoading(true);
		console.log(data);

		axios
			.put(`/api/user/${data.id}`, {
				name: data.name,
				email: data.email,
				newPassword: data.newPassword,
				role: data.role,
			})
			.then((res) => {
				toggleOpen();
				toast.success('Lưu thông tin thành công');
				router.refresh();
			})
			.catch((error) => {
				toast.error('Có lỗi xảy ra khi cập nhật thông tin');
				setIsLoading(false);
				console.error(error);
			})
			.finally(() => {
				setIsLoading(false);
				toggleOpen();
				setValue('newPassword', '');
			});
	};

	return (
		<>
			<div className="flex justify-between items-center flex-wrap gap-y-4 mb-6 mt-6 px-6 lg:px-0">
				<div>
					<h4 className="text-2xl"> ID tài khoản {user.id}</h4>
					<p className="text-gray-500 mb-0">{formatDate(user.createAt)}</p>
				</div>
				<button
					type="button"
					className="border border-[#ff4c51] rounded-lg px-[18px] py-2 hover:bg-red-100"
					onClick={() => {
						setSelectedUser(user);
						toggleDelete();
					}}
				>
					<span className="whitespace-nowrap text-[#ff4c51] text-base font-semibold">Xóa tài khoản </span>
				</button>
			</div>
			<div className="w-full flex md:flex-row flex-col justify-center gap-6 mt-3 px-6 lg:px-0">
				<div className="md:w-1/3 w-full">
					<div className="flex flex-col items-center">
						<div className="bg-white p-6 w-full border border-neutral-200 rounded">
							<div className="text-center pt-12 pb-6">
								<div className="w-28 h-w-28 rounded-lg overflow-hidden mx-auto">
									<img
										className="w-full h-full object-cover"
										src="/dog-meme.png"
										alt="User Avatar"
										loading="lazy"
									/>
								</div>
								<h5 className="text-xl font-medium mt-4 mb-3">{user.name}</h5>
								{user.role === 'ADMIN' ? (
									<span className="bg-red-200 text-rose-500 text-xs font-semibold px-2 py-1 rounded-full mt-4">
										ADMIN
									</span>
								) : (
									<span className="bg-green-200 text-green-500 text-xs font-semibold px-2 py-1 rounded-full mt-4">
										USER
									</span>
								)}
							</div>
							<div className="flex lg:justify-center justify-stretch flex-wrap gap-6 pb-6">
								<div className="flex items-center 4xl:me-8">
									{/* <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center mr-4">
										<i className="ri-check-line text-2xl"  />
									</div> */}
									<div className="bg-blue-100 text-blue-600 rounded-md w-11 h-11 flex items-center justify-center mr-4">
										<FaCartShopping className="text-2xl text-blue-500" />
									</div>
									<div>
										<h6 className="text-lg">{user.orders.length}</h6>
										<span>Đơn hàng</span>
									</div>
								</div>
								<div className="flex items-center 5xl:me-4">
									<div className="bg-blue-100 text-blue-600 rounded-md w-11 h-11 flex items-center justify-center mr-4">
										<FaDollarSign className="text-2xl text-blue-500" />
									</div>
									<div>
										<h6 className="text-lg">{formatPrice(total)}</h6>
										<span>Đã chi</span>
									</div>
								</div>
							</div>
							<div className="pb-6">
								<h5 className="text-lg">Chi tiết</h5>
								<hr className="my-4" />
								<div className="space-y-2">
									<div className="flex justify-between">
										<span className="font-medium">Tài khoản:</span>
										<span className="text-gray-700">{user.email}</span>
									</div>
									<div className="flex justify-between">
										<span className="font-medium">Email:</span>
										<span className="text-gray-700">{user.email}</span>
									</div>
									<div className="flex justify-between">
										<span className="font-medium">Trạng thái:</span>
										<span className="bg-green-200 text-green-500 font-semibold  text-xs px-2 py-1 rounded-full">
											Hoạt động
										</span>
									</div>

									<div className="flex justify-between">
										<span className="font-medium">Liên hệ:</span>
										<span className="text-gray-700">{user.phoneNumber || 'Chưa có'}</span>
									</div>

									<div className="flex justify-between">
										<span className="font-medium">Quốc tịch:</span>
										<span className="text-gray-700">Việt Nam</span>
									</div>
								</div>
							</div>
							<button
								className="bg-[#16B1FF] text-white font-semibold py-1 px-3 w-full rounded mr-4 hover:opacity-80"
								onClick={() => {
									handleOpenUpdateModal(user);
								}}
							>
								Cập nhật
							</button>
						</div>
					</div>
				</div>
				<div className="md:w-2/3 w-full">
					<div className="bg-white p-6 pb-10 rounded border border-neutral-200">
						{/* Header */}
						<div className="flex items-center mb-4 gap-x-3">
							<FaChartBar className="text-2xl" />
							<h2 className="text-lg font-semibold">Lịch sử hoạt động</h2>
						</div>

						{/* Timeline Items */}
						<div className="space-y-6">
							{/* Item 1 */}
							<div className="relative">
								<div className="absolute left-[7px] top-5 h-full border-l-2 border-neutral-200"></div>
								<div className="flex items-start mb-2">
									<div className="w-[17.5px] h-[17.5px] bg-[#E3F6FF] rounded-full flex items-center justify-center mr-4">
										<div className="w-3 h-3 bg-[#16B1FF] rounded-full"></div>
									</div>
									<div className="w-full">
										<div className="flex justify-between items-center mb-1">
											<h3 className="font-medium">12 hóa đơn đã được thanh toán</h3>
											<span className="text-gray-400 text-sm">12 phút trước</span>
										</div>
										{/* <p className="text-gray-500 mb-2">Invoices have been paid to the company.</p> */}
										<div className="flex items-center w-fit bg-neutral-200 p-1 px-3 rounded-md">
											<img
												src="https://demos.themeselection.com/materio-vuetify-vuejs-laravel-admin-template/demo-1/build/assets/pdf-tnlsS08R.png"
												alt="invoice"
												className="w-5 h-5 mr-2"
											/>
											<a href="#" className="text-blue-500">
												invoice.pdf
											</a>
										</div>
									</div>
								</div>
							</div>

							{/* Item 2 */}
							<div className="relative">
								<div className="absolute left-[7px] top-5 h-full border-l-2 border-neutral-200"></div>
								<div className="flex items-start mb-2">
									<div className="w-[17.5px] h-[17.5px] bg-[#EAF9E0] rounded-full flex items-center justify-center mr-4">
										<div className="w-3 h-3 bg-[#56CA00] rounded-full"></div>
									</div>
									<div className="w-full">
										<div className="flex justify-between items-center mb-1">
											<h3 className="font-medium">Bình luận</h3>
											<span className="text-gray-400 text-sm">45 phút trước</span>
										</div>
										<p className="text-gray-500 mb-2">Tài khoản vừa bình luận ở sản phẩm ABC</p>
										<div className="flex items-center mb-2">
											<img
												src="/dog-meme.png"
												alt="Lester McCarthy"
												className="w-8 h-8 rounded-full mr-3"
											/>
											<div>
												<p className="text-sm font-medium">{user.name}</p>
												{/* <p className="text-sm text-gray-500">Tài khoản đặt 2 sản phẩm ABC</p> */}
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* Item 3 */}
							<div className="relative">
								<div className="absolute left-[7px] top-5 h-full border-l-2 border-neutral-200"></div>
								<div className="flex items-start">
									<div className="w-[17.5px] h-[17.5px] bg-[#E3F6FF] rounded-full flex items-center justify-center mr-4">
										<div className="w-3 h-3 bg-[#16B1FF] rounded-full"></div>
									</div>
									<div className="w-full">
										<div className="flex justify-between items-center mb-1">
											<h3 className="font-medium">Đơn hàng được tạo</h3>
											<span className="text-gray-400 text-sm">1 ngày trước</span>
										</div>
										<p className="text-gray-500 mb-2">Tài khoản này vừa đặt hàng ABC</p>
										<div className="flex">
											<img
												src="/productImg/ipads/ipad-air-5-wifi-startlight-650x650-1.png"
												alt="Avatar 1"
												className="w-10 h-10 rounded-full"
											/>
											<img
												src="/productImg/ipads/ipad-gen-9-grey-650x650-1.png"
												alt="Avatar 2"
												className="w-10 h-10 rounded-full"
											/>
											<img
												src="/productImg/ipads/ipad-pro-m1-11-inch-cellular-wifi-silver-650x650-1.png"
												alt="Avatar 3"
												className="w-10 h-10 rounded-full"
											/>
											{/* <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 text-black">
												+3
											</div> */}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="h-[600px] mt-5">
						<DataGrid
							rows={rows}
							columns={columns}
							className="py-5"
							initialState={{
								pagination: {
									paginationModel: { page: 0, pageSize: 10 },
								},
							}}
							slots={{ toolbar: CustomToolbar }}
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
			</div>
			{selectedUser && (
				<AdminModal isOpen={isUpdatedModalOpen} handleClose={toggleUpdateModalOpen}>
					<FormWarp custom="!pt-8">
						<Heading title="Cập nhật thông tin" center>
							<></>
						</Heading>
						<Input
							id="name"
							label="Tên người dùng"
							disabled={isLoading}
							register={register}
							errors={errors}
							defaultValue={selectedUser?.name}
							required
						/>
						<Input
							id="email"
							label="Email người dùng"
							disabled={isLoading}
							register={register}
							errors={errors}
							defaultValue={selectedUser?.email}
							required
						/>
						<Input
							id="newPassword"
							label="Mật khẩu mới"
							disabled={isLoading}
							register={register}
							errors={errors}
							required
						/>
						<Input
							id="role"
							label="Role"
							disabled={isLoading}
							type="combobox"
							register={register}
							errors={errors}
							defaultValue={selectedUser?.role}
							options={['ADMIN', 'USER']}
							required
						/>

						<Button label="Lưu thông tin" onClick={handleSubmit(onSubmit)} isLoading={isLoading} />
					</FormWarp>
				</AdminModal>
			)}
			{isDelete && <ConfirmDialog isOpen={isDelete} handleClose={toggleDelete} onConfirm={handleConfirmDelete} />}
			{isOpen && (
				<AdminModal isOpen={isOpen} handleClose={toggleOpen}>
					<div className="max-w-4xl mx-auto p-3">
						{/* Header */}
						<h1 className="text-2xl font-semibold mb-4">Chi tiết đơn hàng</h1>
						<p className="text-gray-700 mb-6">Xin chào, {user.name}</p>
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
								<p>{selectedOrder?.deliveryStatus === 'not_shipped' ? (
									'Đang chờ'
									) : selectedOrder?.deliveryStatus === 'in_transit' ? (
										'Đang vận chuyển'
									) : selectedOrder?.deliveryStatus === 'delivered' ? (
										'Đã giao'
									) : (
										'Đã hoàn trả'
									)}
								</p>
							</div>
							<div className="border-r border-gray-300">
								<h2 className="font-semibold">Trạng thái thanh toán</h2>
								<p>{selectedOrder?.status === 'pending' ? (
									'Chưa thanh toán'
									) : selectedOrder?.status === 'confirmed' ? (
										'Đã thanh toán'
									) : selectedOrder?.status === 'canceled' ? (
										'Đã hủy'
									) : (
										'Đã thanh toán'
									)}
								</p>
							</div>
							<div>
								<h2 className="font-semibold">Phương thức thanh toán</h2>
								<p>
									{selectedOrder?.paymentMethod === 'momo' ? (
										<Image src="/momo.png" alt="momo" width={24} height={24} />
									) : (
										<Image src="/stripe-v2-svgrepo-com.svg" alt="stripe" width={24} height={24} />
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
								<p>{selectedOrder?.amount}</p>
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
								<p>{selectedOrder?.amount}</p>
							</div>
						</div>

						{/* Shipping Address */}
						<div className="border-t py-4 mt-8">
							<h2 className="font-semibold mb-2">Địa chỉ giao hàng</h2>
							<p className="text-gray-700">Số điện thoại: {selectedOrder?.phoneNumber}</p>
							<p className="text-gray-700">
								Địa chỉ: {`${selectedOrder?.address?.line1} ${selectedOrder?.address?.city}`}
							</p>
						</div>
					</div>
				</AdminModal>
			)}
		</>
	);
};
function CustomToolbar(props: any) {
	return (
		<div className="flex flex-col justify-stretch items-center w-full">
			<h2 className="text-lg font-semibold w-full px-[15px] text-slate-700">Đơn hàng đã đặt</h2>
			<div className="w-full">
				<GridToolbar {...props} />
			</div>
		</div>
	);
}
export default UserDetailsClient;

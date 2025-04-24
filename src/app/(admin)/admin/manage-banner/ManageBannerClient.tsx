'use client';

import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { Banner } from '@prisma/client';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { MdDelete, MdEdit } from 'react-icons/md';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteObject, getStorage, ref } from 'firebase/storage';
import { SafeUser } from '../../../../../types';
import ActionBtn from '@/app/components/ActionBtn';
import axios from 'axios';
import toast from 'react-hot-toast';
import Status from '@/app/components/Status';
import firebase from '../../../libs/firebase';
import AdminModal from '@/app/components/admin/AdminModal';
import FormWarp from '@/app/components/FormWrap';
import Heading from '@/app/components/Heading';
import Input from '@/app/components/inputs/Input';
import Button from '@/app/components/Button';
import 'moment/locale/vi';
import NullData from '@/app/components/NullData';
import Image from 'next/image';
import { formatDateNoTime } from '@/app/(home)/account/orders/OrdersClient';
import ConfirmDialog from '@/app/components/ConfirmDialog';

const formatDateToInput = (date: Date | string) => {
	const d = new Date(date);
	const day = `0${d.getDate()}`.slice(-2);
	const month = `0${d.getMonth() + 1}`.slice(-2);
	const year = d.getFullYear();
	return `${year}-${month}-${day}`; // Định dạng yyyy-MM-dd để set giá trị cho input
};

interface ManageBannerProps {
	currentUser: SafeUser | null | undefined;
	bannerData: any;
}

const ManageBanner: React.FC<ManageBannerProps> = ({ currentUser, bannerData }) => {
	const router = useRouter();
	const storage = getStorage(firebase);
	const [isOpen, setIsOpen] = useState(false);
	const [isDelete, setIsDelete] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedBanner, setselectedBanner] = useState<Banner | null>(null);
	const [bannerImage, setBannerImage] = useState<File | string | null>(null);
	const [bannerResImage, setBannerResImage] = useState<File | string | null>(null);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<FieldValues>({
		defaultValues: {
			id: '',
			name: '',
			description: '',
			image: '',
			imageResponsive: '',
			status: '',
			startDate: '',
			endDate: '',
		},
	});

	// Hàm cập nhật giá trị id, value: label
	const setCustomValue = (id: string, value: any) => {
		setValue(id, value, {
			shouldValidate: true,
			shouldDirty: true,
			shouldTouch: true,
		});
	};

	const toggleOpen = () => {
		setIsOpen(!isOpen);
	};

	const toggleDelete = () => {
		setIsDelete(!isDelete);
	};

	const handleOpenModal = (product: any) => {
		setselectedBanner(product);
		const fieldsToSet = ['id', 'name', 'description', 'status', 'image', 'imageResponsive'];
		fieldsToSet.forEach((field) => setCustomValue(field, product[field]));
		toggleOpen();
	};

	useEffect(() => {
		if (selectedBanner) {
			setCustomValue('startDate', formatDateToInput(selectedBanner.startDate));
			setCustomValue('endDate', formatDateToInput(selectedBanner.endDate));
		}
	}, [selectedBanner]);

	let rows: any = [];
	if (bannerData) {
		rows = bannerData.map((banner: any) => {
			return {
				id: banner.id,
				name: banner.name,
				description: banner.description,
				image: banner.image,
				imageResponsive: banner.imageResponsive,
				status: banner.status,
				startDate: banner.startDate,
				endDate: banner.endDate,
			};
		});
	}

	const columns: GridColDef[] = [
		{ field: 'name', headerName: 'Tên sản phẩm', width: 130 },
		{ field: 'description', headerName: 'Mô tả', width: 150 },
		{
			field: 'image',
			headerName: 'Ảnh quảng cáo',
			width: 110,
			renderCell: (params) => (
				<div style={{ width: '100%', height: '100%', position: 'relative' }}>
					<Image alt="Ảnh sản phẩm" src={params.row.image} layout="fill" objectFit="contain" />
				</div>
			),
		},
		{
			field: 'imageResponsive',
			headerName: 'Ảnh thu nhỏ',
			width: 110,
			renderCell: (params) => (
				<div style={{ width: '100%', height: '95%', position: 'relative' }}>
					<Image alt="Ảnh sản phẩm" src={params.row.imageResponsive} layout="fill" objectFit="contain" />
				</div>
			),
		},
		{
			field: 'startDate',
			headerName: 'Từ ngày',
			width: 170,
			renderCell: (params) => {
				return <div>{formatDateNoTime(params.row.startDate)}</div>;
			},
		},
		{
			field: 'endDate',
			headerName: 'Đến ngày',
			width: 170,
			renderCell: (params) => {
				return <div>{formatDateNoTime(params.row.endDate)}</div>;
			},
		},
		{
			field: 'status',
			headerName: 'Trạng thái',
			width: 100,
			renderCell: (params) => {
				return (
					<div className="flex justify-center items-center h-full">
						{params.row.status === 'Hoạt động' ? (
							<Status text={params.row.status} bg="bg-green-200" color="text-green-700" />
						) : (
							<Status text={params.row.status} bg="bg-rose-200" color="text-rose-700" />
						)}
					</div>
				);
			},
		},
		{
			field: 'action',
			headerName: '',
			width: 200,
			renderCell: (params) => {
				return (
					<div className="flex items-center justify-center gap-4 h-full">
						<ActionBtn
							icon={MdEdit}
							onClick={() => {
								handleOpenModal(params.row);
								setBannerImage(params.row.image);
								setBannerResImage(params.row.imageResponsive);
							}}
						/>
						<ActionBtn
							icon={MdDelete}
							onClick={() => {
								setselectedBanner(params.row);
								toggleDelete();
							}}
						/>
					</div>
				);
			},
		},
	];

	// Xác nhận xóa
	const handleConfirmDelete = async () => {
		if (selectedBanner) {
			const images = [selectedBanner.imageResponsive, selectedBanner.image];
			await handleDelete(selectedBanner.id, images);
		}
		toggleDelete();
	};

	const handleDelete = async (id: string, images: any[]) => {
		toast('Đang xóa sản phẩm, xin chờ...');
		const handleImageDelete = async () => {
			try {
				for (const image of images) {
					if (image) {
						const imageRef = ref(storage, image);
						await deleteObject(imageRef);
					}
				}
			} catch (error) {
				return console.log('Xóa ảnh thất bại');
			}
		};
		await handleImageDelete();

		await axios
			.delete(`/api/banner/${id}`)
			.then((res) => {
				toast.success('Xóa banner thành công');
				router.refresh();
			})
			.catch((error) => {
				toast.error('Có lỗi xảy ra khi xóa banner bên phía client');
				console.error(error);
			});
	};

	const onSubmit: SubmitHandler<FieldValues> = async (data) => {
		setIsLoading(true);
		await axios
			.put(`/api/banner/${data.id}`, {
				name: data.name,
				description: data.description,
				status: data.staus,
			})
			.then((res) => {
				toast.success('Lưu thông tin thành công');
				router.refresh();
			})
			.catch((error) => {
				toast.error('Có lỗi xảy ra khi lưu thông tin');
			})
			.finally(() => {
				setIsLoading(false);
				toggleOpen();
			});
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
			<div className="w-[78.5vw] m-auto text-xl">
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
			{/* Modal cập nhật sản phẩm  */}
			{isOpen && (
				<AdminModal isOpen={isOpen} handleClose={toggleOpen}>
					<FormWarp custom="!pt-8">
						<Heading title="Cập nhật Banner" center>
							<></>
						</Heading>
						<Input
							id="name"
							label="Tên sản phẩm"
							disabled={isLoading}
							register={register}
							errors={errors}
							defaultValue={selectedBanner?.name}
							required
						/>
						<Input
							id="description"
							label="Mô tả"
							disabled={isLoading}
							register={register}
							errors={errors}
							defaultValue={selectedBanner?.description}
							required
						/>
						<Input
							id="startDate"
							label="Từ ngày"
							type="date"
							disabled={isLoading}
							register={register}
							errors={errors}
							defaultValue={watch('startDate') || ' '}
							required
						/>
						<Input
							id="endDate"
							label="Tới ngày"
							type="date"
							disabled={isLoading}
							register={register}
							errors={errors}
							defaultValue={watch('endDate') || ' '}
							required
						/>
						<div className="relative w-full p-3 pt-7 outline-none bg-white font-light border-2 rounded-md transition border-slate-300 focus:border-slate-500">
							<label className="absolute top-[-0.02rem] text-[16.5px] scale-75 text-slate-400">
								Ảnh banner
							</label>
							<div className="flex items-center">
								<span className="mr-3 text-sm text-gray-500">
									{bannerImage ? (
										<div className="mt-2">
											{/* Kiểm tra nếu bannerImage là đối tượng File */}
											{bannerImage instanceof File ? (
												<img
													src={URL.createObjectURL(bannerImage)}
													alt="Banner preview"
													className="mt-2 rounded-md"
													style={{ maxWidth: '80px', maxHeight: '80px' }}
												/>
											) : (
												<img
													src={bannerImage} // Nếu bannerImage là URL thì sử dụng trực tiếp
													alt="Banner preview"
													className="mt-2 rounded-md"
													style={{ maxWidth: '80px', maxHeight: '80px' }}
												/>
											)}
										</div>
									) : (
										'Chưa có file nào được chọn'
									)}
								</span>
								<label
									htmlFor="image"
									className="cursor-pointer bg-slate-600 text-white px-4 py-1 rounded-md shadow-sm hover:bg-slate-700 transition"
								>
									{bannerImage ? 'Đổi hình ảnh' : 'Chọn hình ảnh'}
								</label>

								<input
									id="image"
									type="file"
									autoComplete="off"
									disabled={isLoading}
									{...register('image')}
									onChange={(e: any) => setBannerImage(e.target.files?.[0] || null)}
									className="hidden"
								/>
							</div>
						</div>
						<div className="relative w-full p-3 pt-7 outline-none bg-white font-light border-2 rounded-md transition border-slate-300 focus:border-slate-500">
							<label className="absolute top-[-0.02rem] text-[16.5px] scale-75 text-slate-400">
								Ảnh banner Res
							</label>
							<div className="flex items-center">
								<span className="mr-3 text-sm text-gray-500">
									{bannerResImage ? (
										<div className="mt-2">
											{/* Kiểm tra nếu bannerResImage là đối tượng File */}
											{bannerResImage instanceof File ? (
												<img
													src={URL.createObjectURL(bannerResImage)}
													alt="Banner preview"
													className="mt-2 rounded-md"
													style={{ maxWidth: '80px', maxHeight: '80px' }}
												/>
											) : (
												<img
													src={bannerResImage} // Nếu bannerResImage là URL thì sử dụng trực tiếp
													alt="Banner preview"
													className="mt-2 rounded-md"
													style={{ maxWidth: '80px', maxHeight: '80px' }}
												/>
											)}
										</div>
									) : (
										'Chưa có file nào được chọn'
									)}
								</span>
								<label
									htmlFor="image"
									className="cursor-pointer bg-slate-600 text-white px-4 py-1 rounded-md shadow-sm hover:bg-slate-700 transition"
								>
									{bannerResImage ? 'Đổi hình ảnh' : 'Chọn hình ảnh'}
								</label>

								<input
									id="image"
									type="file"
									autoComplete="off"
									disabled={isLoading}
									{...register('image')}
									onChange={(e: any) => setBannerResImage(e.target.files?.[0] || null)}
									className="hidden"
								/>
							</div>
						</div>
						<Button label="Lưu banner" onClick={handleSubmit(onSubmit)} isLoading={isLoading} />
					</FormWarp>
				</AdminModal>
			)}
			{isDelete && <ConfirmDialog isOpen={isDelete} handleClose={toggleDelete} onConfirm={handleConfirmDelete} />}
		</>
	);
};

export default ManageBanner;

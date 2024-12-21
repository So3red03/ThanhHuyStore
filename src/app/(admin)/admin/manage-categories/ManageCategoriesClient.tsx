// 'use client';

// import { useRouter } from 'next/navigation';
// import { SafeUser } from '../../../../../types';
// import NullData from '@/app/components/NullData';
// import Heading from '@/app/components/Heading';
// import FormWarp from '@/app/components/FormWrap';
// import AdminModal from '@/app/components/admin/AdminModal';
// import Input from '@/app/components/inputs/Input';
// import Button from '@/app/components/Button';
// import ConfirmDialog from '@/app/components/ConfirmDialog';
// import TextArea from '@/app/components/inputs/TextArea';
// import { useState } from 'react';
// import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
// import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
// import ActionBtn from '@/app/components/ActionBtn';
// import { MdDelete, MdEdit } from 'react-icons/md';
// import axios from 'axios';
// import toast from 'react-hot-toast';

// interface ManageCategoriesClientProps {
// 	categories: any[];
// 	currentUser: SafeUser | null | undefined;
// }

// const ManageCategoriesClient: React.FC<ManageCategoriesClientProps> = ({ categories, currentUser }) => {
// 	const router = useRouter();
// 	const [isOpen, setIsOpen] = useState(false);
// 	const [isDelete, setIsDelete] = useState(false);
// 	const [isLoading, setIsLoading] = useState(false);
// 	const [selectedCategory, setSelectedCategory] = useState(false);
// 	if (!currentUser || currentUser.role !== 'ADMIN') {
// 		return (
// 			<>
// 				<NullData title="Từ chối đăng nhập" />
// 				{router.push('/login')}
// 			</>
// 		);
// 	}

// 	const {
// 		register,
// 		handleSubmit,
// 		setValue,
// 		watch,
// 		formState: { errors },
// 	} = useForm<FieldValues>({
// 		defaultValues: {
// 			id: '',
// 			name: '',
// 			price: '',
// 			description: '',
// 			inStock: '',
// 			category: '',
// 		},
// 	});

// 	// Hàm cập nhật giá trị id, value: label
// 	const setCustomValue = (id: string, value: any) => {
// 		setValue(id, value, {
// 			shouldValidate: true,
// 			shouldDirty: true,
// 			shouldTouch: true,
// 		});
// 	};

// 	const toggleOpen = () => {
// 		setIsOpen(!isOpen);
// 	};

// 	const toggleDelete = () => {
// 		setIsDelete(!isDelete);
// 	};

// 	const handleOpenModal = (product: any) => {
// 		setSelectedCategory(product);
// 		const fieldsToSet = ['id', 'name', 'price', 'description', 'inStock', 'category', 'images'];
// 		fieldsToSet.forEach((field) => setCustomValue(field, product[field]));
// 		toggleOpen();
// 	};

// 	const category = watch('category');

// 	let rows: any = [];
// 	if (categories) {
// 		rows = categories.map((product: any) => {
// 			return {
// 				id: product.id,
// 				image: product.images[0].image,
// 				name: product.name,
// 				price: product.price,
// 				category: product.category,
// 				description: product.description,
// 				inStock: product.inStock,
// 				images: product.images,
// 			};
// 		});
// 	}

// 	const columns: GridColDef[] = [
// 		// { field: 'id', headerName: 'ID', width: 150 },

// 		{ field: 'name', headerName: 'Tên sản phẩm', width: 230 },
// 		{ field: 'category', headerName: 'Danh mục', width: 130 },
// 		{ field: 'description', headerName: 'Mô tả', width: 150 },
// 		{
// 			field: 'action',
// 			headerName: '',
// 			width: 200,
// 			renderCell: (params) => {
// 				return (
// 					<div className="flex items-center justify-center gap-4 h-full">
// 						<ActionBtn
// 							icon={MdEdit}
// 							onClick={() => {
// 								handleOpenModal(params.row);
// 							}}
// 						/>
// 						<ActionBtn
// 							icon={MdDelete}
// 							onClick={() => {
// 								setSelectedCategory(params.row);
// 								toggleDelete();
// 							}}
// 						/>
// 					</div>
// 				);
// 			},
// 		},
// 	];

// 	const onSubmit: SubmitHandler<FieldValues> = async (data) => {
// 		setIsLoading(true);
// 		console.log(data);

// 		// axios
// 		// 	.put(`/api/product/${data.id}`, {
// 		// 		name: data.name,
// 		// 		description: data.description,
// 		// 		price: Number(data.price),
// 		// 		inStock: Number(data.inStock),
// 		// 	})
// 		// 	.then((res) => {
// 		// 		toast.success('Lưu thông tin thành công');
// 		// 		router.refresh();
// 		// 	})
// 		// 	.catch((error) => {
// 		// 		toast.error('Có lỗi xảy ra khi lưu thông tin');
// 		// 	})
// 		// 	.finally(() => {
// 		// 		setIsLoading(false);
// 		// 		toggleOpen();
// 		// 	});
// 	};

// 	if (!currentUser || currentUser.role !== 'ADMIN') {
// 		return (
// 			<>
// 				<NullData title="Từ chối đăng nhập" />
// 				{router.push('/login')}
// 			</>
// 		);
// 	}
// 	return (
// 		<>
// 			<div className="w-[78.5vw] m-auto text-xl">
// 				<div className="mb-4 mt-5"></div>
// 				<div className="h-[600px] w-full">
// 					<DataGrid
// 						rows={rows}
// 						columns={columns}
// 						className="p-5"
// 						initialState={{
// 							pagination: {
// 								paginationModel: { page: 0, pageSize: 10 },
// 							},
// 						}}
// 						slots={{ toolbar: GridToolbar }}
// 						slotProps={{
// 							toolbar: {
// 								showQuickFilter: true,
// 								quickFilterProps: { debounceMs: 500 },
// 							},
// 						}}
// 						pageSizeOptions={[10, 20, 30]}
// 						checkboxSelection
// 						disableRowSelectionOnClick
// 						disableColumnFilter
// 						disableDensitySelector
// 						disableColumnSelector
// 						sx={{
// 							'& .MuiDataGrid-toolbarContainer': {
// 								flexDirection: 'row-reverse',
// 							},
// '& .css-yrdy0g-MuiDataGrid-columnHeaderRow': {
// 									backgroundColor: '#F6F7FB !important',
// 								},

// 						}}
// 					/>
// 				</div>
// 			</div>
// 			{/* Modal cập nhật sản phẩm  */}
// 			{isOpen && (
// 				<AdminModal isOpen={isOpen} handleClose={toggleOpen}>
// 					<FormWarp custom="!pt-8">
// 						<Heading title="Cập nhật thông tin sản phẩm" center>
// 							<></>
// 						</Heading>
// 						<Input
// 							id="price"
// 							label="Giá bán"
// 							type="number"
// 							disabled={isLoading}
// 							register={register}
// 							errors={errors}
// 							// defaultValue={String(selectedProduct?.price)}
// 							required
// 						/>
// 						<Input
// 							id="inStock"
// 							label="Tồn kho"
// 							type="number"
// 							disabled={isLoading}
// 							register={register}
// 							errors={errors}
// 							// defaultValue={String(selectedProduct?.inStock)}
// 							required
// 						/>
// 						<TextArea
// 							id="description"
// 							label="Mô tả sản phẩm"
// 							disabled={isLoading}
// 							register={register}
// 							errors={errors}
// 							// defaultValue={selectedProduct?.description}
// 							required
// 						/>

// 						<Button label="Lưu sản phẩm" onClick={handleSubmit(onSubmit)} isLoading={isLoading} />
// 					</FormWarp>
// 				</AdminModal>
// 			)}
// 			{/* {isDelete && <ConfirmDialog isOpen={isDelete} handleClose={toggleDelete} onConfirm={handleConfirmDelete} />} */}
// 		</>
// 	);
// };

// export default ManageCategoriesClient;

const ManageCategoriesClient = () => {
	return <div>category</div>;
};

export default ManageCategoriesClient;

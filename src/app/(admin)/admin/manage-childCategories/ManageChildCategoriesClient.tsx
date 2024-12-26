'use client';

import { useRouter } from 'next/navigation';
import { SafeUser } from '../../../../../types';
import NullData from '@/app/components/NullData';
import Heading from '@/app/components/Heading';
import FormWarp from '@/app/components/FormWrap';
import AdminModal from '@/app/components/admin/AdminModal';
import Input from '@/app/components/inputs/Input';
import Button from '@/app/components/Button';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import { useEffect, useState } from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import ActionBtn from '@/app/components/ActionBtn';
import { MdDelete, MdEdit } from 'react-icons/md';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Category } from '@prisma/client';
import { generateSlug } from '../../../../../utils/Articles';
import { formatDate } from '@/app/(home)/account/orders/OrdersClient';

interface ManageChildCategoriesClientProps {
	parentCategories: any;
	currentUser: SafeUser | null | undefined;
	subCategories: any;
}

const ManageChildCategoriesClient: React.FC<ManageChildCategoriesClientProps> = ({ parentCategories, currentUser, subCategories }) => {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const [isDelete, setIsDelete] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors }
	} = useForm<FieldValues>();

	// Hàm cập nhật giá trị id, value: label
	const setCustomValue = (id: string, value: any) => {
		setValue(id, value, {
			shouldValidate: true,
			shouldDirty: true,
			shouldTouch: true
		});
	};

	const toggleOpen = () => {
		setIsOpen(!isOpen);
	};

	const toggleDelete = () => {
		setIsDelete(!isDelete);
	};

	const handleOpenModal = (category: any) => {
		setSelectedCategory(category);
		const fieldsToSet = ['id', 'name', 'slug', 'parentId'];
		fieldsToSet.forEach(field => setCustomValue(field, category[field]));
		toggleOpen();
	};

	const cateOptions = parentCategories.map((cate: any) => ({
		label: cate.name,
		value: cate.id,
	}));

	let rows: any = [];
	if (subCategories) {
		rows = subCategories.map((category: any) => {	
		// Tìm tên danh mục cha dựa vào parentId
		const parentCategory = parentCategories.find(
		(parent: any) => parent.id === category.parentId)?.name || "Không có"; 
			return {
				id: category.id,
				name: category.name,
				slug: category.slug,
				parentCategory,
				parentId: category.parentId,
				createdAt: formatDate(category.createdAt)
			};
		});
	}

	const columns: GridColDef[] = [
		{ field: 'name', headerName: 'Tên danh mục', width: 190 },
		{ field: 'slug', headerName: 'Slug', width: 190 },
		{ field: 'parentCategory', headerName: 'Danh mục cha', width: 150 },
		{ field: 'createdAt', headerName: 'Ngày tạo', width: 230 },
		{
			field: 'action',
			headerName: '',
			width: 200,
			renderCell: params => {
				return (
					<div className="flex items-center justify-center gap-4 h-full">
						<ActionBtn
							icon={MdEdit}
							onClick={() => {
								handleOpenModal(params.row);
							}}
						/>
						<ActionBtn
							icon={MdDelete}
							onClick={() => {
								setSelectedCategory(params.row);
								toggleDelete();
							}}
						/>
					</div>
				);
			}
		}
	];

	// Xác nhận xóa
	const handleConfirmDelete = async () => {
		if (selectedCategory) {
			await handleDelete(selectedCategory.id);
		}
		toggleDelete();
	};

	const handleDelete = async (id: string) => {
		toast('Đang xóa danh mục, xin chờ...');
		await axios
			.delete(`/api/category/${id}`)
			.then((res) => {
				toast.success('Xóa danh mục thành công');
				router.refresh();
			})
			.catch((error) => {
				toast.error('Có lỗi xảy ra khi xóa danh mục');
				console.error(error);
			});
	};

	const onSubmit: SubmitHandler<FieldValues> = (data) => {
		console.log(data);
		setIsLoading(true);
		 axios
			.put(`/api/category/${data.id}`, {
				name: data.name,
				parentId: data.parentId,
				slug: data.slug,
			})
			.then(() => {
				toast.success('Cập nhật thành công');
				router.refresh();
			})
			.catch((error) => {
				toast.error('Có lỗi khi cập nhật');
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
						<Heading title="Cập nhật danh mục" center>
							<></>
						</Heading>
						<Input
							id="name"
							label="Tên danh mục con"
							disabled={isLoading}
							register={register}
							errors={errors}
							defaultValue={selectedCategory?.name}
							required
						/>
						<Input
							id="slug"
							label="Slug"
							disabled={isLoading}
							register={register}
							errors={errors}
							defaultValue={selectedCategory?.slug}
							required
						/>
						<Input
							id="parentId"
							label="Danh mục cha"
							disabled={isLoading}
							type="combobox"
							register={register}
							errors={errors}
							defaultValue={selectedCategory?.parentId} // Truyền label (hoặc name) của danh mục
							options={cateOptions} // Danh sách các danh mục
							required
						/>
						<Button label="Lưu bài viết" onClick={handleSubmit(onSubmit)} isLoading={isLoading} />
					</FormWarp>
				</AdminModal>
			)}
			{isDelete && <ConfirmDialog isOpen={isDelete} handleClose={toggleDelete} onConfirm={handleConfirmDelete} />}
		</>
	);
};

export default ManageChildCategoriesClient;

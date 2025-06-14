'use client';

import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { categories } from '../../../../../utils/Categories';
import { colors } from '../../../../../utils/Color';
import { Product } from '@prisma/client';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { formatPrice } from '../../../../../utils/formatPrice';
import { MdCached, MdClose, MdDelete, MdDone, MdEdit } from 'react-icons/md';
import { useCallback, useEffect, useState } from 'react';
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
import SelectColor from '@/app/components/inputs/SelectColor';
import TextArea from '@/app/components/inputs/TextArea';
import CheckBox from '@/app/components/inputs/CheckBox';
import CategoryInput from '@/app/components/inputs/CategoryInput';
import 'moment/locale/vi';
import NullData from '@/app/components/NullData';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import SendNewProductEmail from '@/app/components/admin/SendNewProductEmail';
import Image from 'next/image';
import { Editor } from 'primereact/editor';
import { ImageType } from './AddProductModal';
import { Rating } from '@mui/material';
import { FaDollarSign, FaRegBuilding, FaRegEnvelope, FaRegListAlt, FaRegWindowMaximize } from 'react-icons/fa';
import * as SlIcons  from 'react-icons/sl';
import * as AiIcons  from 'react-icons/ai';
import * as TbIcons  from 'react-icons/tb';
import * as MdIcons  from 'react-icons/md';

interface ManageProductsClientProps {
	products: any;
	currentUser: SafeUser | null | undefined;
	subCategories: any
	parentCategories: any
}

const ManageProductsClient: React.FC<ManageProductsClientProps> = ({ products, currentUser, subCategories, parentCategories }) => {
	const router = useRouter();
	const storage = getStorage(firebase);
	const [isOpen, setIsOpen] = useState(false);
	const [isDelete, setIsDelete] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<Product>();
	const Icons = { ...SlIcons, ...AiIcons, ...MdIcons, ...TbIcons};
	const [selectedParentCategoryId, setSelectedParentCategoryId] = useState<string | null>(null);

	const [text, setText] = useState('');
	// const [images, setImages] = useState<any[] | null>(products.images);

	const {
		register,
		handleSubmit,
		setValue,
		reset,
		watch,
		formState: { errors },
	} = useForm<FieldValues>();

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

	const onTextChange = (e: any) => {
		const newText = e.htmlValue;
		setText(newText);
		setCustomValue('description', newText); // Cập nhật giá trị description trong form
	};

	const handleOpenModal = (product: any) => {
		setSelectedProduct(product);
		// Cập nhật giá trị danh mục cha và con vào form
		setValue('parentCategories', product.parentId);
		setSelectedParentCategoryId(product.parentId); // Để lọc danh mục con dựa vào danh mục cha
		setValue('categoryId', product.categoryId);

		// Các trường khác của sản phẩm
		const fieldsToSet = ['id', 'name', 'price', 'description', 'inStock', 'images'];
		fieldsToSet.forEach((field) => setCustomValue(field, product[field]));

		toggleOpen();
	};

	// Lọc danh mục con dựa trên ID danh mục cha
	const filteredSubCategories = selectedParentCategoryId
		? subCategories.filter((subCategory: any) => subCategory.parentId === selectedParentCategoryId) : [];

	const category = watch('category');

	let rows: any = [];
	if (products) {
		rows = products.map((product: any) => {
			// Tính điểm đánh giá của mỗi sản phẩm
			const productRating =
				product.reviews.reduce((acc: number, item: any) => item.rating + acc, 0) / product.reviews.length;
			// Tìm tên danh mục cha dựa vào parentId
			const subCategory = subCategories.find((sub: any) => sub.id === product.categoryId)?.name;
			const parentCategory = subCategories.find((sub: any) => sub.id === product.categoryId)?.parentId;
			return {
				id: product.id,
				images: product.images,
				name: product.name,
				price: product.price,
				categoryId: product.categoryId,
				parentId: parentCategory,
				subCategory: subCategory,
				rating: productRating,
				description: product.description,
				inStock: product.inStock,
			};
		});
	}

	const columns: GridColDef[] = [
		{
			field: 'images',
			headerName: 'Ảnh SP',
			width: 80,
			renderCell: (params) => (
				<Image src={params.row.images[0].images[0]} alt="Ảnh sản phẩm" width={50} height={50} />
			),
		},
		{ field: 'name', headerName: 'Tên sản phẩm', width: 210 },
		{
			field: 'price',
			headerName: 'Giá bán',
			width: 110,
			renderCell: (params) => {
				return <div className="font-bold text-slate-800">{formatPrice(params.row.price)}</div>;
			},
		},
		{ field: 'subCategory', headerName: 'Danh mục', width: 140 },
		{
			field: 'rating',
			headerName: 'Đánh giá',
			width: 130,
			renderCell: (params) => {
				return (
					<div className="flex items-center justify-center w-full h-full">
						<Rating value={params.row.rating} readOnly precision={0.5} />
					</div>
				);
			},
		},
		{ field: 'description', headerName: 'Mô tả', width: 170 },
		{
			field: 'inStock',
			headerName: 'Tồn kho',
			width: 80,
			renderCell: (params) => {
				return (
					<div className="flex justify-center items-center h-full">
						{params.row.inStock > 0 ? (
							<Status text={params.row.inStock} bg="bg-teal-200" color="text-teal-700" />
						) : (
							<Status text="Hết hàng" icon={MdClose} bg="bg-rose-200" color="text-rose-700" />
						)}
					</div>
				);
			},
		},
		{
			field: 'action',
			headerName: '',
			width: 170,
			renderCell: (params) => {
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
								setSelectedProduct(params.row);
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
		if (selectedProduct) {
			await handleDelete(selectedProduct.id, selectedProduct.images);
		}
		toggleDelete();
	};

	const handleDelete = async (id: string, images: { color: string; colorCode: string; images: string[] }[]) => {
		// Kiểm tra xem images có phải là mảng hợp lệ không
		if (!Array.isArray(images)) {
			throw new Error("Dữ liệu 'images' không hợp lệ.");
		}
		// Tạo một mảng tất cả các URL ảnh cần xóa
		const allImages = images.reduce((acc: string[], item) => {
			return acc.concat(item.images);
		}, []);

		console.log(`Tổng số hình ảnh cần xóa: ${allImages.length}`);

		// Tạo các promise để xóa ảnh từ Firebase Storage
		const deletePromises = allImages.map(async (imageUrl) => {
			const storageRef = ref(storage, imageUrl);
			console.log(`Đang xóa hình ảnh: ${imageUrl}`); // In ra đường dẫn hình ảnh
			try {
				await deleteObject(storageRef); // Trả về promise để xóa ảnh
			} catch (error) {
				console.error(`Lỗi khi xóa hình ảnh ${imageUrl}:`, error);
			}
		});
		// Chờ tất cả các promise xóa ảnh hoàn thành
		await Promise.all(deletePromises);
		await axios.delete(`/api/product/${id}`);
		toast.success('Xóa sản phẩm thành công');
		router.refresh();
	};

	const onSubmit: SubmitHandler<FieldValues> = async (data) => {
		console.log(data);
		setIsLoading(true);
		axios
			.put(`/api/product/${data.id}`, {
				name: data.name,
				description: data.description,
				price: Number(data.price),
				inStock: Number(data.inStock),
				categoryId: data.categoryId
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
	const stats = [
		{
			title: 'Sản phẩm hiện có',
			count: products.length,
			icon: <FaRegListAlt className="text-2xl text-gray-600" />,
			changeColor: 'text-green-500',
			bgColor: 'bg-green-100',
		},
		// {
		// 	title: 'Doanh thu trực tiếp',
		// 	count: formatPrice(21.459),
		// 	change: '+29%',
		// 	description: '5k đơn',
		// 	icon: <FaRegBuilding className="text-2xl text-gray-600" />,
		// 	changeColor: 'text-green-500',
		// 	bgColor: 'bg-green-100',
		// },
		{
			title: 'Doanh thu trên website',
			count: 0,
			change: '0%',
			description: '0 đơn',
			icon: <FaRegWindowMaximize className="text-2xl text-gray-600" />,
			changeColor: 'text-green-500',
			bgColor: 'bg-green-100',
		},
		{
			title: 'Khuyến mãi',
			count: 0,
			change: '-0%',
			description: '0 đơn',
			icon: <FaRegEnvelope className="text-2xl text-gray-600" />,
			changeColor: 'text-rose-500',
			bgColor: 'bg-red-100',
		},
	];
	// const [images, setImages] = useState<ImageType[]>([]);
	// const [isProductCreated, setIsProductCreated] = useState(false);
	// useEffect(() => {
	// 	if (isProductCreated) {
	// 		reset();
	// 		setImages([]);
	// 		setText('');
	// 		setIsProductCreated(false);
	// 	}
	// }, [isProductCreated, reset, toggleOpen]);


	// useEffect(() => {
	// 	setCustomValue('images', images);
	// }, [images, setCustomValue]);

	// const addImageToState = useCallback((value: ImageType) => {
	// 	setImages((prev) => {
	// 		if (!prev) return [value];

	// 		// Kiểm tra xem màu sắc đã tồn tại trong mảng chưa
	// 		const existingImageIndex = prev.findIndex((item) => item.color === value.color);
	// 		if (existingImageIndex !== -1) {
	// 			// Cập nhật hình ảnh cho màu sắc đã tồn tại
	// 			const updatedImages = [...prev];
	// 			updatedImages[existingImageIndex] = {
	// 				...updatedImages[existingImageIndex],
	// 				image: [...(updatedImages[existingImageIndex].image || []), ...(value.image || [])],
	// 			};
	// 			return updatedImages;
	// 		} else {
	// 			// Thêm phần tử mới nếu màu sắc chưa tồn tại
	// 			return [...prev, value];
	// 		}
	// 	});
	// }, []);

	// const removeImageToState = useCallback((value: ImageType) => {
	// 	setImages((prev) => {
	// 		if (!prev) return [];

	// 		const existingImageIndex = prev.findIndex((item) => item.color === value.color);
	// 		if (existingImageIndex !== -1) {
	// 			const updatedImages = [...prev];
	// 			const remainingImages =
	// 				updatedImages[existingImageIndex].image?.filter((image) => !value.image?.includes(image)) || [];

	// 			// Nếu không còn hình ảnh nào cho màu sắc đó, xóa phần tử
	// 			if (remainingImages.length === 0) {
	// 				return updatedImages.filter((_, i) => i !== existingImageIndex);
	// 			} else {
	// 				updatedImages[existingImageIndex] = {
	// 					...updatedImages[existingImageIndex],
	// 					image: remainingImages,
	// 				};
	// 				return updatedImages;
	// 			}
	// 		}
	// 		return prev;
	// 	});
	// }, []);

	return (
		<>
			<div className="w-[78.5vw] m-auto text-xl mt-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-3 pr-0 border border-r-0 border-gray-200 rounded-lg">
					{stats.map((stat, index) => (
						<div
							key={index}
							className="bg-white p-4 border-r border-r-gray-200 border-b border-b-gray-200 md:border-b-0"
						>
							<div className="flex justify-between">
								<div className="flex flex-col gap-y-2">
									<h5 className="text-gray-500 text-sm">{stat.title}</h5>
									<div className="text-2xl">{stat.count}</div>
									<p className="text-gray-400 text-sm">
										{stat.description || ''}
										{stat.change && (
											<span
												className={`ml-2 text-base font-semibold px-2 py-1 ${stat.bgColor} rounded-full ${stat.changeColor}`}
											>
												{stat.change}
											</span>
										)}
									</p>
								</div>
								<div className="flex items-center justify-center h-12 w-12 rounded-md bg-gray-100 text-slate-700">
									{stat.icon}
								</div>
							</div>
						</div>
					))}
				</div>
				<div className="mb-4 mt-5">
					<SendNewProductEmail products={products} />
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
			{/* Modal cập nhật sản phẩm  */}
			{isOpen && (
				<AdminModal isOpen={isOpen} handleClose={toggleOpen}>
					<FormWarp custom="!pt-8">
						<Heading title="Cập nhật thông tin sản phẩm" center>
							<></>
						</Heading>
						<Input
							id="name"
							label="Tên sản phẩm"
							disabled={isLoading}
							register={register}
							errors={errors}
							defaultValue={selectedProduct?.name}
							required
						/>
						<Input
							id="price"
							label="Giá bán"
							type="number"
							disabled={isLoading}
							register={register}
							errors={errors}
							defaultValue={String(selectedProduct?.price)}
							required
						/>
						<Input
							id="inStock"
							label="Tồn kho"
							type="number"
							disabled={isLoading}
							register={register}
							errors={errors}
							defaultValue={String(selectedProduct?.inStock)}
							required
						/>
						<Editor
							{...register('description')}
							value={selectedProduct?.description}
							onTextChange={onTextChange}
							style={{ height: '320px' }}
							className="bg-white !border !outline-none peer !border-slate-300 rounded-md focus:!border-slate-500"
							disabled={isLoading}
							required
						/>
						<div className="w-full font-medium">
							<div className="mb-2 font-semibold">Chọn danh mục sản phẩm</div>
							<div className="grid !grid-cols-1 sm:!grid-cols-2 md:!grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto">
								{parentCategories.map((item: any) => {
									return (
										<div key={item.id}>
											<CategoryInput
												onClick={() => {
													setSelectedParentCategoryId(item.id); // Cập nhật ID danh mục cha đã chọn
													setValue("parentCategories", item.id); // Lưu vào form
												}}
												selected={selectedParentCategoryId === item.id} // So sánh với danh mục cha hiện tại
												label={item.name}
												icon={Icons[item.icon as keyof typeof Icons]} // Truyền icon
											/>
										</div>
									);
								})}
							</div>
						</div>
						<Input
							id="categoryId"
							label="Danh mục con"
							disabled={isLoading}
							type="combobox"
							register={register}
							errors={errors}
							defaultValue={selectedProduct?.categoryId || ""}
							options={filteredSubCategories.map((subCategory: any) => ({
								label: subCategory.name,
								value: subCategory.id,
							}))} // Hiển thị danh mục con đã lọc
							required
						/>
						{/* <div className="w-full flex flex-col flex-wrap gap-4">
							<div>
								<div className="font-bold">Chọn màu và hình ảnh của sản phẩm</div>
								<div className="text-sm">
									Cần có hình ảnh thích hợp dựa trên màu đã chọn nếu không lựa chọn không hợp lệ
								</div>
							</div>
							<div className="grid grid-cols-2 gap-3">
								{colors.map((item) => {
									return (
										<SelectColor
											key={item.color}
											item={item}
											addImageToState={addImageToState}
											removeImageToState={removeImageToState}
											isProductCreated={isProductCreated}
										/>
									);
								})}
							</div>
						</div> */}
						<Button label="Lưu sản phẩm" onClick={handleSubmit(onSubmit)} isLoading={isLoading} />
					</FormWarp>
				</AdminModal>
			)}
			{isDelete && <ConfirmDialog isOpen={isDelete} handleClose={toggleDelete} onConfirm={handleConfirmDelete} />}
		</>
	);
};

export default ManageProductsClient;

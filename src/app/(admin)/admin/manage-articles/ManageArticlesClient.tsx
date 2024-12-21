'use client';

import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { MdDelete, MdEdit } from 'react-icons/md';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SafeUser } from '../../../../../types';
import ActionBtn from '@/app/components/ActionBtn';
import axios from 'axios';
import toast from 'react-hot-toast';
import firebase from '../../../libs/firebase';
import AdminModal from '@/app/components/admin/AdminModal';
import FormWarp from '@/app/components/FormWrap';
import Heading from '@/app/components/Heading';
import Input from '@/app/components/inputs/Input';
import Button from '@/app/components/Button';
import 'moment/locale/vi';
import NullData from '@/app/components/NullData';
import Image from 'next/image';
import { formatDate } from '@/app/(home)/account/orders/OrdersClient';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import { Editor } from 'primereact/editor';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';

type Article = {
	id: string;
	userId: string;
	title: string;
	image: string;
	content: string;
	viewCount: number;
	createdAt: Date;
	updatedAt: Date;
	categoryId: string | null; // Cập nhật với categoryId
	categoryName: string | null;
};

interface ManageArticlesClientProps {
	currentUser: SafeUser | null | undefined;
	articleData: any;
}

const ManageArticlesClient: React.FC<ManageArticlesClientProps> = ({ currentUser, articleData }) => {
	const router = useRouter();
	const storage = getStorage(firebase);
	const [text, setText] = useState('');
	const [isOpen, setIsOpen] = useState(false);
	const [isDelete, setIsDelete] = useState(false);
	const [articleImage, setArticleImage] = useState<File | string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedArticle, setselectedArticle] = useState<Article | null>(null);

	const {
		register,
		handleSubmit,
		setValue,
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

	const handleOpenModal = (article: any) => {
		setselectedArticle(article);
		// Tìm danh mục đã chọn dựa trên categoryId
		const selectedCategory = cateOptions.find((category: any) => category.label === article.category);
		// Cập nhật giá trị cho các trường trong form
		const fieldsToSet = ['id', 'title', 'content', 'image'];
		fieldsToSet.forEach((field) => setCustomValue(field, article[field]));

		// Đảm bảo rằng categoryId và categoryName được cập nhật đúng
		if (selectedCategory) {
			setCustomValue('categoryId', selectedCategory.value);
			setCustomValue('categoryName', selectedCategory.label);
		}

		toggleOpen();
	};

	const onTextChange = (e: any) => {
		const newText = e.htmlValue;
		setText(newText);
		setCustomValue('description', newText); // Cập nhật giá trị description trong form
	};

	let rows: any = [];
	if (articleData) {
		rows = articleData.map((article: any) => {
			return {
				id: article.id,
				title: article.title,
				content: article.content,
				category: article.category?.name || 'Chưa có danh mục',
				image: article.image,
				createdAt: article.createdAt,
				updatedAt: article.updatedAt,
			};
		});
	}

	const columns: GridColDef[] = [
		{
			field: 'image',
			headerName: 'Ảnh bài viết',
			width: 120,
			renderCell: (params) => (
				<div style={{ width: '100%', height: '100%', position: 'relative' }}>
					<Image alt="Ảnh sản phẩm" src={params.row.image} layout="fill" objectFit="contain" />
				</div>
			),
		},
		{ field: 'title', headerName: 'Tên bài viết', width: 300 },
		{
			field: 'category',
			headerName: 'Danh mục',
			width: 140,
			renderCell: (params) => {
				return <div>{params.row.category}</div>;
			},
		},
		{
			field: 'createdAt',
			headerName: 'Ngày tạo',
			width: 200,
			renderCell: (params) => {
				return <div>{formatDate(params.row.createdAt)}</div>;
			},
		},
		{
			field: 'updatedAt',
			headerName: 'Ngày sửa',
			width: 200,
			renderCell: (params) => {
				return <div>{formatDate(params.row.updatedAt)}</div>;
			},
		},
		{
			field: 'action',
			headerName: '',
			width: 160,
			renderCell: (params) => {
				return (
					<div className="flex items-center justify-center gap-4 h-full">
						<ActionBtn
							icon={MdEdit}
							onClick={() => {
								handleOpenModal(params.row);
								setArticleImage(params.row.image);
							}}
						/>
						<ActionBtn
							icon={MdDelete}
							onClick={() => {
								setselectedArticle(params.row);
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
		if (selectedArticle) {
			await handleDelete(selectedArticle.id, selectedArticle.image);
		}
		toggleDelete();
	};

	const handleDelete = async (id: string, image: any) => {
		toast('Đang xóa sản phẩm, xin chờ...');
		const handleImageDelete = async () => {
			try {
				if (image) {
					const imageRef = ref(storage, image);
					await deleteObject(imageRef);
				}
			} catch (error) {
				return console.log('Xóa ảnh thất bại');
			}
		};
		await handleImageDelete();

		await axios
			.delete(`/api/article/${id}`)
			.then((res) => {
				toast.success('Xóa bài viết thành công');
				router.refresh();
			})
			.catch((error) => {
				toast.error('Có lỗi xảy ra khi xóa bài viết');
				console.error(error);
			});
	};

	const onSubmit: SubmitHandler<FieldValues> = async (data) => {
		setIsLoading(true);

		try {
			let newImageUrl = articleImage || data.image; // Sử dụng ảnh mới từ form hoặc từ ảnh đã chọn

			// Kiểm tra và xử lý ảnh nếu có ảnh mới
			if (newImageUrl && newImageUrl !== data.image) {
				// Nếu có ảnh cũ, xóa ảnh cũ
				if (data.image) {
					await deleteOldImageFromFirebase(data.image); // Xóa ảnh cũ trong Firebase
				}

				// Tải ảnh mới lên Firebase
				newImageUrl = await uploadNewImageToFirebase(newImageUrl);

				console.log('Ảnh đã được tải lên thành công:', newImageUrl);
			}

			// Gọi API để cập nhật bài viết sau khi ảnh mới đã được xử lý
			await updateArticle(data, newImageUrl);

			toast.success('Bài viết cập nhật thành công!');
			router.refresh();
		} catch (error) {
			toast.error('Có lỗi xảy ra khi xử lý ảnh hoặc cập nhật bài viết.');
			console.error(error);
		} finally {
			setIsLoading(false);
			toggleOpen();
		}
	};

	const deleteOldImageFromFirebase = async (imageUrl: string) => {
		try {
			const storage = getStorage(firebase);
			const imageRef = ref(storage, imageUrl);

			// Xóa ảnh khỏi Firebase Storage
			await deleteObject(imageRef);
			console.log('Đã xóa ảnh cũ khỏi Firebase.');
		} catch (error) {
			console.error('Lỗi khi xóa ảnh cũ khỏi Firebase:', error);
			throw error;
		}
	};

	const uploadNewImageToFirebase: any = async (imageFile: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const storage = getStorage(firebase);
			const fileName = new Date().getTime() + '-' + imageFile.name;
			const storageRef = ref(storage, `articles/${fileName}`);
			const uploadTask = uploadBytesResumable(storageRef, imageFile);

			uploadTask.on(
				'state_changed',
				(snapshot) => {
					const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
					console.log(`Upload is ${progress}% done`);
				},
				(error) => {
					console.error('Lỗi khi tải ảnh lên Firebase:', error);
					reject(error);
				},
				() => {
					getDownloadURL(uploadTask.snapshot.ref)
						.then((downloadURL) => {
							console.log('Tải ảnh thành công: ', downloadURL);
							resolve(downloadURL);
						})
						.catch((error) => {
							console.error('Lỗi khi lấy download URL:', error);
							reject(error);
						});
				}
			);
		});
	};
	//call API
	const updateArticle = async (data: FieldValues, newImageUrl: string) => {
		try {
			await axios.put(`/api/article/${data.id}`, {
				title: data.title,
				description: data.description,
				content: data.content,
				categoryId: data.categoryId,
				image: newImageUrl, // Sử dụng URL ảnh mới
			});
		} catch (error) {
			toast.error('Có lỗi khi lưu bài viết');
			throw error;
		}
	};

	const cateOptions = Array.from(new Set(articleData.map((cate: any) => cate.categoryId))).map((id) => {
		const category = articleData.find((cate: any) => cate.categoryId === id);
		return { label: category.category.name, value: category.categoryId };
	});

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
						<Heading title="Cập nhật bài viết" center>
							<></>
						</Heading>
						<Input
							id="title"
							label="Tên bài viết"
							disabled={isLoading}
							register={register}
							errors={errors}
							defaultValue={selectedArticle?.title}
							required
						/>
						<Editor
							{...register('content')}
							value={selectedArticle?.content}
							onTextChange={onTextChange}
							style={{ height: '320px' }}
							className="bg-white !border !outline-none peer !border-slate-300 rounded-md focus:!border-slate-500"
							disabled={isLoading}
							required
						/>
						<Input
							id="categoryId"
							label="Danh mục"
							disabled={isLoading}
							type="combobox"
							register={register}
							errors={errors}
							defaultValue={selectedArticle?.categoryId} // Truyền label (hoặc name) của danh mục
							options={cateOptions} // Danh sách các danh mục
							required
						/>

						<div className="relative w-full p-3 pt-7 outline-none bg-white font-light border-2 rounded-md transition border-slate-300 focus:border-slate-500">
							<label className="absolute top-[-0.02rem] text-[16.5px] scale-75 text-slate-400">
								Ảnh bài viết
							</label>
							<div className="flex items-center">
								<span className="mr-3 text-sm text-gray-500">
									{articleImage ? (
										<div className="mt-2">
											{/* Kiểm tra nếu articleImage là đối tượng File */}
											{articleImage instanceof File ? (
												<img
													src={URL.createObjectURL(articleImage)}
													alt="Banner preview"
													className="mt-2 rounded-md"
													style={{ maxWidth: '80px', maxHeight: '80px' }}
												/>
											) : (
												<img
													src={articleImage} // Nếu articleImage là URL thì sử dụng trực tiếp
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
									{articleImage ? 'Đổi hình ảnh' : 'Chọn hình ảnh'}
								</label>

								<input
									id="image"
									type="file"
									autoComplete="off"
									disabled={isLoading}
									{...register('image')}
									onChange={(e: any) => setArticleImage(e.target.files?.[0] || null)}
									className="hidden"
								/>
							</div>
						</div>

						<Button label="Lưu bài viết" onClick={handleSubmit(onSubmit)} isLoading={isLoading} />
					</FormWarp>
				</AdminModal>
			)}
			{isDelete && <ConfirmDialog isOpen={isDelete} handleClose={toggleDelete} onConfirm={handleConfirmDelete} />}
		</>
	);
};

export default ManageArticlesClient;

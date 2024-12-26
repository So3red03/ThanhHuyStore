'use client';
import toast from 'react-hot-toast';
import axios from 'axios';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { useCallback, useEffect, useState } from 'react';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import firebase from '@/app/libs/firebase';
import AdminModal from '@/app/components/admin/AdminModal';
import Button from '@/app/components/Button';
import Input from '@/app/components/inputs/Input';
import Heading from '@/app/components/Heading';
import FormWarp from '@/app/components/FormWrap';
import { Editor } from 'primereact/editor';
import { useRouter } from 'next/navigation';
import { MdAdd } from 'react-icons/md';
import { generateSlug } from '../../../../../utils/Articles';

interface AddProductCateModalProps {
	isOpen: boolean;
	toggleOpen: () => void;
}

const AddProductCateModal: React.FC<AddProductCateModalProps> = ({ isOpen, toggleOpen }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [image, setImage] = useState<File | null>(null);
	const [isCategoryCreated, setIsCategoryCreated] = useState(false);
	const router = useRouter();
	const {
		register,
		handleSubmit,
		setValue,
		watch,
		getValues,
		reset,
		formState: { errors }
	} = useForm<FieldValues>();

	const handleOpenModal = () => {
		toggleOpen();
	};

	// Clear lại sau khi tạo danh mục thành công
	useEffect(() => {
		if (isCategoryCreated) {
			reset();
			setIsCategoryCreated(false);
			setImage(null);
		}
	}, [isCategoryCreated, reset]);

	const handleCategoryImageUpload = async (image: File | null) => {
		try {
			if (image) {
			// Tạo tên file để tránh trùng lặp
			const fileName = new Date().getTime() + '-' + image.name;

			// Lấy đối tượng storage
			const storage = getStorage();

			// Tạo tham chiếu đến vị trí lưu trữ trên Firebase
			const storageRef = ref(storage, `category/${fileName}`);

			const uploadTask = uploadBytesResumable(storageRef, image);

			return new Promise<string>((resolve, reject) => {
				uploadTask.on(
				'state_changed',
				(snapshot) => {
					const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
					console.log('Upload is ' + progress + '% done');
				},
				(error) => {
					console.log('Lỗi upload ảnh', error);
					reject(error);
				},
				() => {
					// Upload thành công, lấy URL download
					getDownloadURL(uploadTask.snapshot.ref)
					.then((downloadURL) => {
						resolve(downloadURL); // Trả về URL ảnh
					})
					.catch((error) => {
						console.log('Lỗi lấy download URL', error);
						reject(error);
					});
				}
				);
			});
			}
		} catch (error) {
			console.error(error);
		}
	};

	const onSubmit: SubmitHandler<FieldValues> = async (data) => {
		setIsLoading(true);
		toast('Đang thêm danh mục, xin chờ...');

		try {
			// Kiểm tra và upload ảnh danh mục
			const categoryImageUrl = await handleCategoryImageUpload(image);

			// Cập nhật dữ liệu để gửi lên API
			const categoryData = {
			...data,
			image: categoryImageUrl, // Đường dẫn ảnh từ Firebase
			};

			// Gửi yêu cầu API để lưu danh mục vào database
			await axios.post('/api/category', categoryData);

			toast.success('Thêm danh mục thành công');
			setIsCategoryCreated(true);
			router.refresh();
		} catch (error) {
			toast.error('Có lỗi khi lưu danh mục');
		} finally {
			setIsLoading(false);
			toggleOpen();
		}
	};
	
	const handleSlugUpdate = () => {
		const nameValue = getValues('name'); // Lấy giá trị của input "name"
		if (nameValue) {
			const generatedSlug = generateSlug(nameValue);
			setValue("slug", generatedSlug); // Cập nhật giá trị trong form
		}
	};

	return (
		<>
			<AdminModal isOpen={isOpen} handleClose={toggleOpen}>
				<FormWarp custom="!pt-1">
					<Heading title="Thêm danh mục" center>
						<></>
					</Heading>
					<Input
						id="name"
						label="Tên danh mục"
						disabled={isLoading}
						register={register}
						errors={errors}
						defaultValue={watch('name')}
						required
					/>
					<div className="flex justify-center items-center w-full gap-2">
						<Input
							id="slug"
							label="Slug"
							disabled={isLoading}
							register={register}
							errors={errors}
							defaultValue={watch('slug')}
							required
						/>
						<Button
							label="Đổi"
							small
							custom="!gap-1 !w-auto !h-full !text-xs lg:!text-base"
							icon={MdAdd}
							onClick={() => handleSlugUpdate()}
							/>
					</div>
					<Input
						id="icon"
						label="Icon"
						disabled={isLoading}
						register={register}
						errors={errors}
						defaultValue={watch('icon')}
						required
					/>
					<Input
						id="description"
						label="Mô tả"
						disabled={isLoading}
						register={register}
						errors={errors}
						defaultValue={watch('description')}
						required
					/>
					<div className="relative w-full p-3 pt-7 outline-none bg-white font-light border-2 rounded-md transition border-slate-300 focus:border-slate-500">
						<label className="absolute top-[-0.02rem] text-[16.5px] scale-75 text-slate-400">
							Ảnh danh mục
						</label>
						<div className="flex items-center">
							<span className="mr-3 text-sm text-gray-500">
								{image ? (
									<div className="mt-2">
										<img
											src={URL.createObjectURL(image)}
											alt="Banner preview"
											className="mt-2 rounded-md"
											style={{ maxWidth: '80px', maxHeight: '80px' }}
										/>
									</div>
								) : (
									'Chưa có file nào được chọn'
								)}
							</span>
							<label
								htmlFor="image"
								className=" cursor-pointer bg-slate-600 text-white px-4 py-1 rounded-md shadow-sm hover:bg-slate-700 transition"
							>
								{image ? 'Đổi hình ảnh' : 'Chọn hình ảnh'}
							</label>

							<input
								id="image"
								type="file"
								autoComplete="off"
								disabled={isLoading}
								{...register('image', { required: true })} 
								onChange={(e: any) => setImage(e.target.files?.[0] || null)}
								className="hidden"
							/>
						</div>
					</div>
					<Button label="Tạo danh mục" isLoading={isLoading} onClick={handleSubmit(onSubmit)} />
				</FormWarp>
			</AdminModal>
		</>
	);
};

export default AddProductCateModal;

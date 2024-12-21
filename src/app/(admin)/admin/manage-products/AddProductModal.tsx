'use client';
import { useState, useEffect, useCallback } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Editor } from 'primereact/editor';
import AdminModal from '@/app/components/admin/AdminModal';
import Button from '@/app/components/Button';
import { colors } from '../../../../../utils/Color';
import SelectColor from '@/app/components/inputs/SelectColor';
import FormWarp from '@/app/components/FormWrap';
import CategoryInput from '@/app/components/inputs/CategoryInput';
import { categories } from '../../../../../utils/Categories';
import CheckBox from '@/app/components/inputs/CheckBox';
import Input from '@/app/components/inputs/Input';
import Heading from '@/app/components/Heading';
import axios from 'axios';
import firebase from '@/app/libs/firebase';

export type ImageType = {
	color: string;
	colorCode: string;
	image: File[] | null;
};

interface AddProductModalProps {
	isOpen: boolean;
	toggleOpen: () => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, toggleOpen }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [text, setText] = useState('');
	const [images, setImages] = useState<ImageType[]>([]);
	const [isProductCreated, setIsProductCreated] = useState(false);
	const [isCheckCalender, setIsCheckCalender] = useState(false);
	const router = useRouter();

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { errors },
	} = useForm<FieldValues>({
		defaultValues: {
			name: '',
			description: '',
			brand: 'Apple',
			category: '',
			inStock: '',
			images: [],
			price: '',
			promotionalPrice: '',
			promotionStart: '',
			promotionEnd: '',
		},
	});

	const setCustomValue = useCallback(
		(id: string, value: any) => {
			setValue(id, value, {
				shouldValidate: true,
				shouldDirty: true,
				shouldTouch: true,
			});
		},
		[setValue]
	);

	useEffect(() => {
		if (isProductCreated) {
			reset();
			setImages([]);
			setText('');
			setIsProductCreated(false);
		}
	}, [isProductCreated, reset, toggleOpen]);

	const category = watch('category');

	useEffect(() => {
		setCustomValue('images', images);
	}, [images, setCustomValue]);

	const addImageToState = useCallback((value: ImageType) => {
		setImages((prev) => {
			if (!prev) return [value];

			// Kiểm tra xem màu sắc đã tồn tại trong mảng chưa
			const existingImageIndex = prev.findIndex((item) => item.color === value.color);
			if (existingImageIndex !== -1) {
				// Cập nhật hình ảnh cho màu sắc đã tồn tại
				const updatedImages = [...prev];
				updatedImages[existingImageIndex] = {
					...updatedImages[existingImageIndex],
					image: [...(updatedImages[existingImageIndex].image || []), ...(value.image || [])],
				};
				return updatedImages;
			} else {
				// Thêm phần tử mới nếu màu sắc chưa tồn tại
				return [...prev, value];
			}
		});
	}, []);

	const removeImageToState = useCallback((value: ImageType) => {
		setImages((prev) => {
			if (!prev) return [];

			const existingImageIndex = prev.findIndex((item) => item.color === value.color);
			if (existingImageIndex !== -1) {
				const updatedImages = [...prev];
				const remainingImages =
					updatedImages[existingImageIndex].image?.filter((image) => !value.image?.includes(image)) || [];

				// Nếu không còn hình ảnh nào cho màu sắc đó, xóa phần tử
				if (remainingImages.length === 0) {
					return updatedImages.filter((_, i) => i !== existingImageIndex);
				} else {
					updatedImages[existingImageIndex] = {
						...updatedImages[existingImageIndex],
						image: remainingImages,
					};
					return updatedImages;
				}
			}
			return prev;
		});
	}, []);

	const onSubmit: SubmitHandler<FieldValues> = async (data) => {
		console.log(data);

		setIsLoading(true);
		const { promotionStart, promotionEnd, promotionalPrice, price } = data;
		const currentDate = new Date();
		const startDate = new Date(promotionStart);
		const endDate = new Date(promotionEnd);

		if (Number(promotionalPrice) > Number(price)) {
			toast.error('Giá khuyến mãi không thể lớn hơn giá bán');
			setIsLoading(false);
			return;
		}

		if (promotionStart && startDate < currentDate) {
			toast.error('Ngày bắt đầu không được nhỏ hơn ngày hiện tại!');
			setIsLoading(false);
			return;
		}

		if (promotionEnd && endDate < startDate) {
			toast.error('Ngày kết thúc không được nhỏ hơn ngày bắt đầu!');
			setIsLoading(false);
			return;
		}

		if (!data.category) {
			toast.error('Danh mục chưa được chọn');
			setIsLoading(false);
			return;
		}

		if (!data.images || data.images.length === 0) {
			toast.error('Chưa có hình ảnh cho sản phẩm');
			setIsLoading(false);
			return;
		}

		const uploadedImages: Array<{ color: string; colorCode: string; images: string[] }> = [];
		// Hàm xử lý upload ảnh lên firebase
		const handleImageUploads = async () => {
			toast('Đang thêm sản phẩm, xin chờ...');

			try {
				// Duyệt qua từng item trong danh sách images
				for (const item of data.images) {
					const imageUrls: string[] = [];

					if (item.image && Array.isArray(item.image)) {
						for (const file of item.image) {
							const fileName = new Date().getTime() + '-' + file.name;
							const storage = getStorage(firebase);
							const storageRef = ref(storage, `productImages/${fileName}`);
							const uploadTask = uploadBytesResumable(storageRef, file);

							await new Promise<void>((resolve, reject) => {
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
										getDownloadURL(uploadTask.snapshot.ref)
											.then((downloadURL: string) => {
												imageUrls.push(downloadURL); // Lưu URL vào mảng imageUrls
												resolve();
											})
											.catch((error) => {
												console.log('Lỗi download URL', error);
												reject(error);
											});
									}
								);
							});
						}
					}

					uploadedImages.push({ color: item.color, colorCode: item.colorCode, images: imageUrls });
				}
			} catch (error: any) {
				setIsLoading(false);
				return toast.error('Lỗi upload ảnh');
			}
		};

		// Gọi hàm upload ảnh
		await handleImageUploads();
		const productData = {
			...data,
			images: uploadedImages, // Sử dụng uploadedImages ở đây
			promotionalPrice: data.promotionalPrice,
			promotionStart: new Date(data.promotionStart),
			promotionEnd: new Date(data.promotionEnd),
		};
		// Gọi api
		axios
			.post('/api/product', productData)
			.then(() => {
				toast.success('Thêm sản phẩm thành công');
				setIsProductCreated(true);
				router.refresh();
			})
			.catch((error) => {
				toast.error('Có lỗi khi lưu product vào db');
			})
			.finally(() => {
				setIsLoading(false);
				toggleOpen();
			});
	};

	return (
		<AdminModal isOpen={isOpen} handleClose={toggleOpen}>
			<FormWarp custom="!pt-1">
				<Heading title="Thêm sản phẩm" center>
					<></>
				</Heading>
				<Input
					id="name"
					label="Tên sản phẩm"
					disabled={isLoading}
					register={register}
					errors={errors}
					defaultValue={watch('name')}
					required
				/>
				<Input
					id="price"
					label="Giá bán"
					type="number"
					disabled={isLoading}
					register={register}
					errors={errors}
					defaultValue={watch('price')}
					required
				/>
				<Input
					id="inStock"
					label="Tồn kho"
					type="number"
					disabled={isLoading}
					register={register}
					errors={errors}
					defaultValue={watch('inStock')}
					required
				/>
				<div className="flex justify-center items-center w-full gap-2">
					<Input
						id="promotionalPrice"
						label="Giá khuyến mãi"
						type="number"
						disabled={isLoading}
						register={register}
						errors={errors}
						defaultValue={watch('promotionalPrice')}
					/>
					<span
						className="hover:text-blue-500 text-gray-500 underline hover:cursor-pointer text-xs"
						onClick={() => {
							setIsCheckCalender(!isCheckCalender);
						}}
					>
						{!isCheckCalender ? 'Schedule' : 'Cancel'}
					</span>
				</div>
				{isCheckCalender && (
					<>
						<Input
							id="promotionStart"
							label="Từ ngày"
							type="date"
							disabled={isLoading}
							register={register}
							errors={errors}
							defaultValue={watch('promotionStart') || ' '}
						/>
						<Input
							id="promotionEnd"
							label="Tới ngày"
							type="date"
							disabled={isLoading}
							register={register}
							errors={errors}
							defaultValue={watch('promotionEnd') || ' '}
						/>
					</>
				)}
				<Editor
					{...register('description')}
					value={text}
					onTextChange={(e: any) => setText(e.htmlValue)}
					style={{ height: '320px' }}
					className="bg-white border outline-none peer border-slate-300 rounded-md focus:border-slate-500"
				/>
				<div className="w-full font-medium">
					<div className="mb-2 font-semibold">Chọn danh mục sản phẩm</div>
					<div className="grid !grid-cols-1 sm:!grid-cols-2 md:!grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto">
						{categories.map((item) => {
							if (item.value === 'All') {
								return null;
							}
							if (item.value === 'News') {
								return null;
							}
							if (item.value === 'Comparison') {
								return null;
							}
							return (
								<div key={item.label}>
									<CategoryInput
										onClick={(categoryParams) => setCustomValue('category', categoryParams)}
										selected={category === item.label}
										label={item.label}
										icon={item.icon}
									/>
								</div>
							);
						})}
					</div>
				</div>
				<div className="w-full flex flex-col flex-wrap gap-4">
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
				</div>
				<Button label="Lưu sản phẩm" isLoading={isLoading} onClick={handleSubmit(onSubmit)} />
			</FormWarp>
		</AdminModal>
	);
};

export default AddProductModal;

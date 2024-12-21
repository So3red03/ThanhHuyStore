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
import { useRouter } from 'next/navigation';

export type UploadedBannerType = {
	image: string;
};

interface AddBannerModalProps {
	isOpen: boolean;
	toggleOpen: () => void;
}

const AddBannerModal: React.FC<AddBannerModalProps> = ({ isOpen, toggleOpen }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [isBannerCreated, setIsBannerCreated] = useState(false);
	const [bannerImage, setBannerImage] = useState<File | null>(null);
	const [bannerResImage, setBannerResImage] = useState<File | null>(null);
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
			image: null,
			imageResponsive: null,
			startDate: '',
			endDate: '',
			status: 'active',
		},
	});

	const handleOpenModal = () => {
		toggleOpen();
	};

	// Clear lại sau khi tạo banner thành công
	useEffect(() => {
		if (isBannerCreated) {
			reset();
			setBannerImage(null);
			setBannerResImage(null);
			setIsBannerCreated(false);
		}
	}, [isBannerCreated, reset]);

	const onSubmit: SubmitHandler<FieldValues> = async (data) => {
		setIsLoading(true);
		const { startDate, endDate } = data;

		const currentDate = new Date();
		const start = new Date(startDate);
		const end = new Date(endDate);

		// Kiểm tra ngày
		if (start < currentDate) {
			toast.error('Ngày bắt đầu không được nhỏ hơn ngày hiện tại!');
			setIsLoading(false);
			return;
		}

		if (end < start) {
			toast.error('Ngày kết thúc không được nhỏ hơn ngày bắt đầu!');
			setIsLoading(false);
			return;
		}

		const handleBannerImageUploads = async () => {
			toast('Đang thêm banner, xin chờ...');
			try {
				const bannerImages = [bannerImage, bannerResImage];
				let downloadURLBanner = '';
				let downloadURLBannerRes = '';

				for (const [index, image] of bannerImages.entries()) {
					if (image) {
						// Tạo tên file để tránh trùng lặp
						const fileName = new Date().getTime() + '-' + image.name;
						// Lấy đối tượng storage
						const storage = getStorage(firebase);
						// Tạo tham chiếu đến vị trí lưu trữ
						const storageRef = ref(storage, `banner/${fileName}`);
						const uploadTask = uploadBytesResumable(storageRef, image);

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
									// Upload thành công, lấy URL download
									getDownloadURL(uploadTask.snapshot.ref)
										.then((downloadURL: any) => {
											if (index === 0) {
												downloadURLBanner = downloadURL;
											} else {
												downloadURLBannerRes = downloadURL;
											}
											resolve();
										})
										.catch((error: any) => {
											console.log('Lỗi lấy download URL', error);
											reject(error);
										});
								}
							);
						});
					}
				}

				return { downloadURLBanner, downloadURLBannerRes }; // Trả về URL sau khi upload thành công
			} catch (error: any) {
				setIsLoading(false);
				toast.error('Lỗi upload ảnh banner');
				return null;
			}
		};

		const uploadResult = await handleBannerImageUploads();

		if (!uploadResult) {
			setIsLoading(false);
			return;
		}

		const { downloadURLBanner, downloadURLBannerRes } = uploadResult;

		const bannerData = {
			...data,
			image: downloadURLBanner, // Đường dẫn ảnh từ Firebase
			imageResponsive: downloadURLBannerRes, // Đường dẫn ảnh responsive từ Firebase
			startDate: new Date(startDate),
			endDate: new Date(endDate),
		};

		// Gửi yêu cầu API để lưu banner vào database
		axios
			.post('/api/banner', bannerData)
			.then(() => {
				toast.success('Thêm banner thành công');
				setIsBannerCreated(true);
				router.refresh();
			})
			.catch((error) => {
				toast.error('Có lỗi khi lưu banner vào db');
			})
			.finally(() => {
				setIsLoading(false);
				toggleOpen();
			});
	};

	return (
		<>
			<AdminModal isOpen={isOpen} handleClose={toggleOpen}>
				<FormWarp custom="!pt-1">
					<Heading title="Thêm banner" center>
						<></>
					</Heading>
					<Input
						id="name"
						label="Tên banner"
						disabled={isLoading}
						register={register}
						errors={errors}
						defaultValue={watch('name')}
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
					<Input
						id="status"
						label="Trạng thái"
						disabled={isLoading}
						type="combobox"
						register={register}
						errors={errors}
						defaultValue={watch('status')}
						options={['Hoạt động', 'Tạm dừng']}
						required
					/>
					<div className="relative w-full p-3 pt-7 outline-none bg-white font-light border-2 rounded-md transition border-slate-300 focus:border-slate-500">
						<label className="absolute top-[-0.02rem] text-[16.5px] scale-75 text-slate-400">
							Ảnh banner
						</label>
						<div className="flex items-center">
							<label
								htmlFor="image"
								className=" cursor-pointer bg-slate-600 text-white px-4 py-1 rounded-md shadow-sm hover:bg-slate-700 transition"
							>
								{bannerImage ? 'Đổi hình ảnh' : 'Chọn hình ảnh'}
							</label>
							<span className="ml-3 text-sm text-gray-500">
								{bannerImage ? (
									<div className="mt-2">
										<img
											src={URL.createObjectURL(bannerImage)}
											alt="Banner preview"
											className="mt-2 rounded-md"
											style={{ maxWidth: '80px', maxHeight: '80px' }}
										/>
									</div>
								) : (
									'Chưa có file nào được chọn'
								)}
							</span>
						</div>
						<input
							id="image"
							type="file"
							autoComplete="off"
							// accept=".png, .jpeg, .jpg"
							disabled={isLoading}
							{...register('image')}
							onChange={(e: any) => setBannerImage(e.target.files?.[0] || null)}
							className="hidden"
						/>
					</div>
					<div className="relative w-full p-3 pt-7 outline-none bg-white font-light border-2 rounded-md transition border-slate-300 focus:border-slate-500">
						<label className="absolute top-[-0.02rem] text-[16.5px] scale-75 text-slate-400">
							Ảnh banner Res
						</label>
						<div className="flex items-center">
							<label
								htmlFor="imageResponsive"
								className=" cursor-pointer bg-slate-600 text-white px-4 py-1 rounded-md shadow-sm hover:bg-slate-700 transition"
							>
								{bannerResImage ? 'Đổi hình ảnh' : 'Chọn hình ảnh'}
							</label>
							<span className="ml-3 text-sm text-gray-500">
								{bannerResImage ? (
									<div className="mt-2">
										<img
											src={URL.createObjectURL(bannerResImage)}
											alt="Banner preview"
											className="mt-2 rounded-md"
											style={{ maxWidth: '80px', maxHeight: '80px' }}
										/>
									</div>
								) : (
									'Chưa có file nào được chọn'
								)}
							</span>
						</div>
						<input
							id="imageResponsive"
							type="file"
							autoComplete="off"
							// accept=".png, .jpeg, .jpg"
							disabled={isLoading}
							{...register('imageResponsive')}
							onChange={(e: any) => setBannerResImage(e.target.files?.[0] || null)}
							className="hidden"
						/>
					</div>

					<Button label="Tạo banner" isLoading={isLoading} onClick={handleSubmit(onSubmit)} />
				</FormWarp>
			</AdminModal>
		</>
	);
};

export default AddBannerModal;

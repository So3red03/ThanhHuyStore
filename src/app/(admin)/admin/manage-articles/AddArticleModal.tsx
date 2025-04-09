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
import { Editor } from 'primereact/editor';
import { ArticleCategory } from '@prisma/client';

export type UploadedBannerType = {
	image: string;
};

interface AddArticleModalProps {
	isOpen: boolean;
	toggleOpen: () => void;
	articleCategory: ArticleCategory[];
}

const AddArticleModal: React.FC<AddArticleModalProps> = ({ isOpen, toggleOpen, articleCategory }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [isArticleCreated, setIsArticleCreated] = useState(false);
	const [articleImage, setArticleImage] = useState<File | null>(null);
	const [text, setText] = useState('');
	const router = useRouter();
	const {
		register,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { errors },
	} = useForm<FieldValues>();

	const handleOpenModal = () => {
		toggleOpen();
	};

	// Clear lại sau khi tạo bài viết thành công
	useEffect(() => {
		if (isArticleCreated) {
			reset();
			setArticleImage(null);
			setText('');
			setIsArticleCreated(false);
		}
	}, [isArticleCreated, reset]);

	const onSubmit: SubmitHandler<FieldValues> = async (data) => {
		setIsLoading(true);
		const handleArticleImageUpload = async () => {
			if (!articleImage) {
				toast.error('Chưa chọn ảnh bài viết');
				return null;
			}

			toast('Đang thêm bài viết, xin chờ...');
			try {
				// Tạo tên file để tránh trùng lặp
				const fileName = new Date().getTime() + '-' + articleImage.name;
				// Lấy đối tượng storage
				const storage = getStorage(firebase);
				// Tạo tham chiếu đến vị trí lưu trữ
				const storageRef = ref(storage, `articles/${fileName}`);
				const uploadTask = uploadBytesResumable(storageRef, articleImage);

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
								.then((downloadURL: string) => {
									resolve(downloadURL);
								})
								.catch((error: any) => {
									console.log('Lỗi lấy download URL', error);
									reject(error);
								});
						}
					);
				});
			} catch (error) {
				setIsLoading(false);
				toast.error('Lỗi upload ảnh bài viết');
				return null;
			}
		};

		const downloadURLImgArticle = await handleArticleImageUpload();

		if (!downloadURLImgArticle) {
			setIsLoading(false);
			return;
		}

		const articleData = {
			...data,
			image: downloadURLImgArticle,
			content: text,
		};
		axios
			.post('/api/article', articleData)
			.then(() => {
				toast.success('Thêm bài viết thành công');
				setIsArticleCreated(true);
				router.refresh();
			})
			.catch((error) => {
				toast.error('Có lỗi khi lưu bài viết');
			})
			.finally(() => {
				setIsLoading(false);
				toggleOpen();
			});
	};
	const cateOptions = articleCategory
		.map((cate) => {
			if (cate.name === 'Trang chủ') {
				return null; // Nếu cate.name là "Trang chủ", trả về null
			}
			return {
				label: cate.name, // Hiển thị tên trong combobox
				value: cate.id, // Gửi id khi chọn
			};
		})
		.filter((option) => option !== null); // Loại bỏ giá trị null

	return (
		<>
			<AdminModal isOpen={isOpen} handleClose={toggleOpen}>
				<FormWarp custom="!pt-1">
					<Heading title="Thêm bài viết" center>
						<></>
					</Heading>
					<Input
						id="title"
						label="Tên bài viết"
						disabled={isLoading}
						register={register}
						errors={errors}
						defaultValue={watch('title')}
						required
					/>
					<Editor
						id="content"
						value={text}
						onTextChange={(e: any) => setText(e.htmlValue)}
						style={{ height: '320px' }}
						className="bg-white border outline-none peer border-slate-300 rounded-md focus:border-slate-500"
					/>
					<Input
						id="categoryId"
						label="Danh mục"
						disabled={isLoading}
						type="combobox"
						register={register}
						errors={errors}
						defaultValue={watch('categoryId')}
						options={cateOptions}
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
										<img
											src={URL.createObjectURL(articleImage)}
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
					<Button label="Tạo bài viết" isLoading={isLoading} onClick={handleSubmit(onSubmit)} />
				</FormWarp>
			</AdminModal>
		</>
	);
};

export default AddArticleModal;

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

interface AddArticleCateModalProps {
	isOpen: boolean;
	toggleOpen: () => void;
}

const AddArticleCateModal: React.FC<AddArticleCateModalProps> = ({ isOpen, toggleOpen }) => {
	const [isLoading, setIsLoading] = useState(false);
	const [isCategoryCreated, setIsCategoryCreated] = useState(false);
	const router = useRouter();
	const {
		register,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { errors }
	} = useForm<FieldValues>();

	const handleOpenModal = () => {
		toggleOpen();
	};

	// Clear lại sau khi tạo bài viết thành công
	useEffect(() => {
		if (isCategoryCreated) {
			reset();
			setIsCategoryCreated(false);
		}
	}, [isCategoryCreated, reset]);

	const onSubmit: SubmitHandler<FieldValues> = async data => {
		const formattedData = {
			...data,
			isActive: data.isActive === 'true'
		};
		console.log(formattedData);
		setIsLoading(true);
		toast('Đang thêm danh mục, xin chờ...');
		axios
			.post('/api/articleCategory', formattedData)
			.then(() => {
				toast.success('Thêm danh mục thành công');
				setIsCategoryCreated(true);
				router.refresh();
			})
			.catch(error => {
				toast.error('Có lỗi khi lưu danh mục');
			})
			.finally(() => {
				setIsLoading(false);
				toggleOpen();
			});
	};

	const cateOptions = [{ label: 'Hoạt động', value: true }, { label: 'Tạm dừng', value: false }];

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
					<Input
						id="slug"
						label="Slug"
						disabled={isLoading}
						register={register}
						errors={errors}
						defaultValue={watch('slug')}
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
						id="isActive"
						label="Trạng thái"
						disabled={isLoading}
						type="combobox"
						register={register}
						errors={errors}
						defaultValue={watch('isActive')}
						options={cateOptions}
						required
					/>
					<Button label="Tạo danh mục" isLoading={isLoading} onClick={handleSubmit(onSubmit)} />
				</FormWarp>
			</AdminModal>
		</>
	);
};

export default AddArticleCateModal;

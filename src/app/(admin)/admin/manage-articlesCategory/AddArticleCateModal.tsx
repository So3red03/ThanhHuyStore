'use client';
import toast from 'react-hot-toast';
import axios from 'axios';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import firebase from '@/app/libs/firebase';
import AdminModal from '@/app/components/admin/AdminModal';
import Button from '@/app/components/Button';
import Input from '@/app/components/inputs/Input';
import Heading from '@/app/components/Heading';
import FormWarp from '@/app/components/FormWrap';
import { useRouter } from 'next/navigation';
import { MdAdd } from 'react-icons/md';
import { generateSlug } from '../../../../../utils/Articles';

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
		getValues,
		reset,
		formState: { errors },
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

	const onSubmit: SubmitHandler<FieldValues> = async (data) => {
		const formattedData = {
			...data,
			isActive: data.isActive === 'true',
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
			.catch((error) => {
				toast.error('Có lỗi khi lưu danh mục');
			})
			.finally(() => {
				setIsLoading(false);
				toggleOpen();
			});
	};

	const cateOptions = [
		{ label: 'Hoạt động', value: true },
		{ label: 'Tạm dừng', value: false },
	];

	const handleSlugUpdate = () => {
		const nameValue = getValues('name'); // Lấy giá trị của input "name"
		if (nameValue) {
			const generatedSlug = generateSlug(nameValue);
			setValue('slug', generatedSlug); // Cập nhật giá trị trong form
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

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
import { Category } from '@prisma/client';

interface AddProductChildCateProps {
	isOpen: boolean;
	toggleOpen: () => void;
	parentCategory: Category[];
}

const AddProductChildCate: React.FC<AddProductChildCateProps> = ({ isOpen, toggleOpen, parentCategory }) => {
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
		}
	}, [isCategoryCreated, reset]);

	const onSubmit: SubmitHandler<FieldValues> = async data => {
		setIsLoading(true);
		toast('Đang thêm danh mục, xin chờ...');
		axios
			.post('/api/category', data)
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

	const handleSlugUpdate = () => {
		const nameValue = getValues('name'); // Lấy giá trị của input "name"
		if (nameValue) {
			const generatedSlug = generateSlug(nameValue);
			setValue('slug', generatedSlug); // Cập nhật giá trị trong form
		}
	};

	const cateOptions = parentCategory?.map(cate => ({
		label: cate.name,
		value: cate.id // Gửi id khi chọn
	}));

	return (
		<>
			<AdminModal isOpen={isOpen} handleClose={toggleOpen}>
				<FormWarp custom="!pt-1">
					<Heading title="Thêm danh mục" center>
						<></>
					</Heading>
					<Input
						id="name"
						label="Tên danh mục con"
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
						id="parentId"
						label="Danh mục"
						disabled={isLoading}
						type="combobox"
						register={register}
						errors={errors}
						defaultValue={watch('parentId')}
						options={cateOptions}
						required
					/>
					<Button label="Tạo danh mục" isLoading={isLoading} onClick={handleSubmit(onSubmit)} />
				</FormWarp>
			</AdminModal>
		</>
	);
};

export default AddProductChildCate;

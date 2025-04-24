'use client';
import Button from '@/app/components/Button';
import Heading from '@/app/components/Heading';
import Input from '@/app/components/inputs/Input';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface PasswordResetFormProps {
	userId: string;
}

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ userId }) => {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<FieldValues>();

	const onSubmit: SubmitHandler<FieldValues> = (data) => {
		setIsLoading(true);
		console.log(data);

		axios
			.post(`/api/password/${userId}`, data)
			.then(() => {
				toast.success('Thay đổi mật khẩu thành công');
				router.push('/cart');
			})
			.catch(() => {
				toast.error('Thay đổi mật khẩu thất bại do link đã hết hạn');
			})
			.finally(() => setIsLoading(false));
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
			e.preventDefault();
			handleSubmit(onSubmit)();
		}
	};
	return (
		<>
			<Heading title="Đặt lại mật khẩu" center>
				<></>
			</Heading>
			<p>
				Nhập thông tin để đặt lại mật khẩu tại
				<b> ThanhHuy Store</b>
			</p>
			<Input
				id="email"
				label="Email"
				type="email"
				disabled={isLoading}
				register={register}
				errors={errors}
				required
			/>
			<Input
				id="newPassword"
				label="Mật khẩu"
				type="password"
				disabled={isLoading}
				register={register}
				errors={errors}
				onKeyDown={handleKeyDown}
				toggleVisibility={true}
				required
			/>
			<Button label="Khôi phục" onClick={handleSubmit(onSubmit)} isLoading={isLoading} />
		</>
	);
};

export default PasswordResetForm;

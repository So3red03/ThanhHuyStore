'use client';
import Button from '@/app/components/Button';
import Heading from '@/app/components/Heading';
import Input from '@/app/components/inputs/Input';
import axios from 'axios';
import { useState } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const PasswordRecoveryForm = () => {
	const [isLoading, setIsLoading] = useState(false);
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<FieldValues>({ defaultValues: { email: '' } });

	const onSubmit: SubmitHandler<FieldValues> = (data) => {
		setIsLoading(true);
		axios
			.post('/api/password', data)
			.then(() => {
				toast.success('Check gmail để thay đổi mật khẩu');
			})
			.catch((error) => {
				console.log(error);

				toast.error('Tài khoản này không tồn tại');
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
			<Heading title="Khôi phục mật khẩu">
				<></>
			</Heading>

			<p>
				Vui lòng nhập email bạn đã đăng ký với
				<b> ThanhHuy Store</b>
			</p>
			<Input
				id="email"
				label="Email"
				type="email"
				disabled={isLoading}
				register={register}
				errors={errors}
				onKeyDown={handleKeyDown}
				required
			/>
			<Button label="Khôi phục" onClick={handleSubmit(onSubmit)} isLoading={isLoading} />
		</>
	);
};

export default PasswordRecoveryForm;

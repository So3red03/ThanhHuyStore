'use client';

import { useState, useEffect } from 'react';
import Heading from '../../components/Heading';
import Input from '../../components/inputs/Input';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import Button from '../../components/Button';
import Link from 'next/link';
import { AiOutlineGoogle } from 'react-icons/ai';
import axios from 'axios';
import { signIn } from 'next-auth/react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { SafeUser } from '../../../../types';
import FormWarp from '@/app/components/FormWrap';
import Image from 'next/image';

interface RegisterFormProps {
	currentUser: SafeUser | null | undefined;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ currentUser }) => {
	const [isLoading, setIsLoading] = useState(false);
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<FieldValues>({ defaultValues: { email: '', password: '', name: '' } });
	const router = useRouter();

	const onSubmit: SubmitHandler<FieldValues> = (data) => {
		setIsLoading(true);

		axios
			.post('/api/user', data)
			.then(() => {
				toast.success('Tài khoản đăng kí thành công');
				// Đăng nhập bằng phương thức xác thực credentials với dữ liệu vừa đăng ký.
				signIn('credentials', {
					email: data.email,
					password: data.password,
					redirect: false,
				}).then((callback) => {
					if (callback?.ok) {
						router.push('/cart');
						router.refresh();
						toast.success('Đăng nhập thành công');
					}
					if (callback?.error) {
						toast.error(callback.error);
					}
				});
			})
			.catch(() => toast.error('Email này đã được đăng kí!'))
			.finally(() => setIsLoading(false));
	};

	useEffect(() => {
		if (currentUser) {
			router.push('/cart');
		}
	}, [currentUser, router]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(onSubmit)();
		}
	};

	if (currentUser) {
		return <p className="text-center">Bạn đã đăng nhập. Đang chuyển hướng</p>;
	}

	return (
		<div className="flex mx-auto justify-center items-center gap-20">
			<div className="hidden xl:block w-[650px] h-[500px]">
				<Image src="/login_register.jpeg" alt="login_register" width={650} height={500} />
			</div>

			<FormWarp custom="!w-[500px]">
				<Heading title="Tạo tài khoản ThanhHuy Store">
					<></>
				</Heading>
				<Button
					outline
					label="Đăng nhập với Google"
					icon={AiOutlineGoogle}
					onClick={() => {
						signIn('google');
					}}
				/>
				<hr className="bg-slate-300 w-full h-px" />
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
					id="name"
					label="Tài khoản"
					type="name"
					disabled={isLoading}
					register={register}
					errors={errors}
					required
				/>

				<Input
					id="password"
					label="Mật khẩu"
					type="password"
					toggleVisibility={true}
					disabled={isLoading}
					register={register}
					errors={errors}
					onKeyDown={handleKeyDown}
					required
				/>
				<Button label="Đăng ký" onClick={handleSubmit(onSubmit)} isLoading={isLoading} />
				<p className="text-sm">
					Bạn đã có tài khoản?{' '}
					<Link href="/login" className="text-[#0066CC]">
						Đăng nhập
					</Link>
				</p>
			</FormWarp>
		</div>
	);
};

export default RegisterForm;

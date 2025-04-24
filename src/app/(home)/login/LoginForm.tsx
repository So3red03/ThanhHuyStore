'use client';

import { useEffect, useState } from 'react';
import Heading from '../../components/Heading';
import Input from '../../components/inputs/Input';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import Button from '../../components/Button';
import Link from 'next/link';
import { AiOutlineGoogle } from 'react-icons/ai';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { SafeUser } from '../../../../types';
import FormWarp from '@/app/components/FormWrap';
import Image from 'next/image';

interface LoginFormProps {
	currentUser: SafeUser | null | undefined;
}

const LoginForm: React.FC<LoginFormProps> = ({ currentUser }) => {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<FieldValues>({ defaultValues: { email: '', password: '', name: '' } });

	const onSubmit: SubmitHandler<FieldValues> = (data) => {
		setIsLoading(true);
		signIn('credentials', {
			...data,
			redirect: false,
		}).then((callback) => {
			if (callback?.ok) {
				router.push('/cart');
				router.refresh();
				toast.success('Đăng nhập thành công');
			}
			if (callback?.error) {
				toast.error('Email hoặc mật khẩu không chính xác');
				setIsLoading(false);
				router.refresh();
			}
		});
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
		return <p className="text-center mt-7">Bạn đã đăng nhập. Đang chuyển hướng</p>;
	}

	return (
		<div className="flex mx-auto justify-center items-center gap-20">
			<div className="hidden xl:block w-[650px] h-[500px]">
				<Image src="/login_register.jpeg" alt="login_register" width={650} height={500} />
			</div>

			<FormWarp custom="!w-[500px]">
				<Heading title="Đăng nhập ThanhHuy Store">
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
				<Button
					outline
					label="Đăng nhập với Facebook"
					icon={AiOutlineGoogle}
					onClick={() => {
						signIn('facebook');
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
				<div className="flex justify-end w-full">
					<Link href="/passwordrecovery" className="text-[#0066CC] ">
						Quên mật khẩu ?
					</Link>
				</div>
				<Button label="Đăng nhập" onClick={handleSubmit(onSubmit)} isLoading={isLoading} />
				<p className="text-sm">
					Chưa có tài khoản?{' '}
					<Link href="/register" className="text-[#0066CC]">
						Đăng ký
					</Link>
				</p>
			</FormWarp>
		</div>
	);
};

export default LoginForm;

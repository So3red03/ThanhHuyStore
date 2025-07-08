'use client';

import { useEffect, useState } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { AiOutlineGoogle } from 'react-icons/ai';
import { SafeUser } from '../../../../types';
import Heading from '../Heading';
import Input from '../inputs/Input';
import Button from '../Button';
import { useAuthModal } from './useAuthModal';

interface LoginModalProps {
  currentUser: SafeUser | null | undefined;
}

const LoginModal: React.FC<LoginModalProps> = ({ currentUser }) => {
  const router = useRouter();
  const { switchModal, closeModal } = useAuthModal();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FieldValues>({
    defaultValues: { email: '', password: '' }
  });

  const onSubmit: SubmitHandler<FieldValues> = data => {
    setIsLoading(true);
    signIn('credentials', {
      ...data,
      redirect: false
    }).then(callback => {
      if (callback?.ok) {
        router.push('/cart');
        router.refresh();
        toast.success('Đăng nhập thành công');
        closeModal();
        reset();
      }
      if (callback?.error) {
        if (callback.error === 'EMAIL_NOT_VERIFIED') {
          toast.error('Email chưa được xác thực. Vui lòng kiểm tra email và xác thực tài khoản.');
          switchModal('emailVerification');
        } else {
          toast.error('Email hoặc mật khẩu không chính xác');
        }
        setIsLoading(false);
        router.refresh();
      }
    });
  };

  useEffect(() => {
    if (currentUser) {
      closeModal();
    }
  }, [currentUser, closeModal]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      // Trigger form submission when Enter is pressed on password field
      handleSubmit(onSubmit)();
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google');
    closeModal();
  };

  const handleSwitchToRegister = (e: React.MouseEvent) => {
    e.preventDefault();
    switchModal('register');
  };

  const handleSwitchToPasswordRecovery = (e: React.MouseEvent) => {
    e.preventDefault();
    switchModal('passwordRecovery');
  };

  if (currentUser) {
    return null;
  }

  return (
    <div className='w-full max-w-md mx-auto px-8 py-6'>
      <div className='mb-8'>
        <Heading title='Đăng nhập ThanhHuy Store'>
          <></>
        </Heading>
      </div>

      <div className='mb-6'>
        <Button outline label='Đăng nhập với Google' icon={AiOutlineGoogle} onClick={handleGoogleSignIn} />
      </div>

      <div className='relative mb-6'>
        <hr className='bg-slate-300 w-full h-px' />
        <span className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-sm text-gray-500'>
          hoặc
        </span>
      </div>

      <div className='space-y-5 mb-6'>
        <Input
          id='email'
          label='Email'
          type='email'
          disabled={isLoading}
          register={register}
          errors={errors}
          required
        />

        <Input
          id='password'
          label='Mật khẩu'
          type='password'
          toggleVisibility={true}
          disabled={isLoading}
          register={register}
          errors={errors}
          onKeyDown={handleKeyDown}
          required
        />
      </div>

      <div className='flex justify-end mb-6'>
        <button
          onClick={handleSwitchToPasswordRecovery}
          className='text-[#0066CC] hover:underline text-sm transition-colors duration-200'
        >
          Quên mật khẩu?
        </button>
      </div>

      <div className='mb-6'>
        <Button label='Đăng nhập' onClick={handleSubmit(onSubmit)} isLoading={isLoading} />
      </div>

      <div className='text-center'>
        <p className='text-sm text-gray-600'>
          Chưa có tài khoản?{' '}
          <button
            onClick={handleSwitchToRegister}
            className='text-[#0066CC] hover:underline font-medium transition-colors duration-200'
          >
            Đăng ký ngay
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginModal;

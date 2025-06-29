'use client';

import { useState, useEffect } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import axios from 'axios';
import { AiOutlineGoogle } from 'react-icons/ai';
import { SafeUser } from '../../../../types';
import Heading from '../Heading';
import Input from '../inputs/Input';
import Button from '../Button';
import { useAuthModal } from './useAuthModal';

interface RegisterModalProps {
  currentUser: SafeUser | null | undefined;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ currentUser }) => {
  const router = useRouter();
  const { switchModal, closeModal } = useAuthModal();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FieldValues>({
    defaultValues: { email: '', password: '', name: '' }
  });

  const onSubmit: SubmitHandler<FieldValues> = data => {
    setIsLoading(true);

    axios
      .post('/api/user', data)
      .then(() => {
        toast.success('Tài khoản đăng kí thành công');
        // Đăng nhập bằng phương thức xác thực credentials với dữ liệu vừa đăng ký.
        signIn('credentials', {
          email: data.email,
          password: data.password,
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
            toast.error(callback.error);
          }
        });
      })
      .catch(() => toast.error('Email này đã được đăng kí!'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (currentUser) {
      closeModal();
    }
  }, [currentUser, closeModal]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form && form.checkValidity()) {
        handleSubmit(onSubmit)();
      }
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google');
    closeModal();
  };

  const handleSwitchToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    switchModal('login');
  };

  if (currentUser) {
    return null;
  }

  return (
    <div className='w-full max-w-md mx-auto px-8 py-6'>
      <div className='mb-8'>
        <Heading title='Tạo tài khoản ThanhHuy Store'>
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
          onKeyDown={handleKeyDown}
          required
        />

        <Input
          id='name'
          label='Tài khoản'
          type='name'
          disabled={isLoading}
          register={register}
          errors={errors}
          onKeyDown={handleKeyDown}
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

      <div className='mb-6'>
        <Button label='Đăng ký' onClick={handleSubmit(onSubmit)} isLoading={isLoading} />
      </div>

      <div className='text-center'>
        <p className='text-sm text-gray-600'>
          Bạn đã có tài khoản?{' '}
          <button
            onClick={handleSwitchToLogin}
            className='text-[#0066CC] hover:underline font-medium transition-colors duration-200'
          >
            Đăng nhập ngay
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterModal;

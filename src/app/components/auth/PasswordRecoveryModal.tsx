'use client';

import { useState } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import axios from 'axios';
import Heading from '../Heading';
import Input from '../inputs/Input';
import Button from '../Button';
import { useAuthModal } from './useAuthModal';

const PasswordRecoveryModal = () => {
  const { switchModal } = useAuthModal();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FieldValues>({
    defaultValues: { email: '' }
  });

  const onSubmit: SubmitHandler<FieldValues> = data => {
    setIsLoading(true);
    axios
      .post('/api/password', data)
      .then(() => {
        toast.success('Check gmail để thay đổi mật khẩu');
        reset();
      })
      .catch(error => {
        console.log(error);
        toast.error('Tài khoản này không tồn tại');
      })
      .finally(() => setIsLoading(false));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form && form.checkValidity()) {
        handleSubmit(onSubmit)();
      }
    }
  };

  const handleSwitchToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    switchModal('login');
  };

  return (
    <div className='w-full max-w-md mx-auto px-8 py-6'>
      <div className='mb-8'>
        <Heading title='Khôi phục mật khẩu'>
          <></>
        </Heading>
      </div>

      <div className='mb-8 text-center'>
        <p className='text-gray-600 text-sm leading-relaxed'>
          Vui lòng nhập email bạn đã đăng ký với
          <span className='font-semibold text-gray-800'> ThanhHuy Store</span>
        </p>
        <p className='text-gray-500 text-xs mt-2'>Chúng tôi sẽ gửi link khôi phục mật khẩu đến email của bạn</p>
      </div>

      <div className='mb-6'>
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
      </div>

      <div className='mb-6'>
        <Button label='Gửi link khôi phục' onClick={handleSubmit(onSubmit)} isLoading={isLoading} />
      </div>

      <div className='text-center'>
        <p className='text-sm text-gray-600'>
          Nhớ mật khẩu rồi?{' '}
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

export default PasswordRecoveryModal;

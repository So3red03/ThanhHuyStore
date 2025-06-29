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
    reset,
  } = useForm<FieldValues>({ 
    defaultValues: { email: '' } 
  });

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    setIsLoading(true);
    axios
      .post('/api/password', data)
      .then(() => {
        toast.success('Check gmail để thay đổi mật khẩu');
        reset();
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

  const handleSwitchToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    switchModal('login');
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <Heading title="Khôi phục mật khẩu">
        <></>
      </Heading>

      <p className="text-gray-600 mb-6 text-center">
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
      
      <Button 
        label="Khôi phục" 
        onClick={handleSubmit(onSubmit)} 
        isLoading={isLoading} 
      />
      
      <p className="text-sm text-center mt-4">
        Nhớ mật khẩu rồi?{' '}
        <button 
          onClick={handleSwitchToLogin}
          className="text-[#0066CC] hover:underline"
        >
          Đăng nhập
        </button>
      </p>
    </div>
  );
};

export default PasswordRecoveryModal;

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
    reset,
  } = useForm<FieldValues>({ 
    defaultValues: { email: '', password: '' } 
  });

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
        closeModal();
        reset();
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
      closeModal();
    }
  }, [currentUser, closeModal]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
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
    <div className="w-full max-w-md mx-auto p-6">
      <Heading title="Đăng nhập ThanhHuy Store">
        <></>
      </Heading>
      
      <Button
        outline
        label="Đăng nhập với Google"
        icon={AiOutlineGoogle}
        onClick={handleGoogleSignIn}
      />
      
      <hr className="bg-slate-300 w-full h-px my-4" />
      
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
      
      <div className="flex justify-end w-full mb-4">
        <button 
          onClick={handleSwitchToPasswordRecovery}
          className="text-[#0066CC] hover:underline text-sm"
        >
          Quên mật khẩu ?
        </button>
      </div>
      
      <Button 
        label="Đăng nhập" 
        onClick={handleSubmit(onSubmit)} 
        isLoading={isLoading} 
      />
      
      <p className="text-sm text-center mt-4">
        Chưa có tài khoản?{' '}
        <button 
          onClick={handleSwitchToRegister}
          className="text-[#0066CC] hover:underline"
        >
          Đăng ký
        </button>
      </p>
    </div>
  );
};

export default LoginModal;

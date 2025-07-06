'use client';

import { useState, useEffect } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import axios from 'axios';
import FormWrap from '@/app/components/FormWrap';
import Heading from '@/app/components/Heading';
import Input from '@/app/components/inputs/Input';
import Button from '@/app/components/Button';
import NullData from '@/app/components/NullData';
import { MdLock, MdCheckCircle, MdError } from 'react-icons/md';

interface PasswordResetClientProps {
  token: string;
}

const PasswordResetClient: React.FC<PasswordResetClientProps> = ({ token }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<FieldValues>({
    defaultValues: {
      newPassword: '',
      confirmPassword: ''
    }
  });

  const newPassword = watch('newPassword');

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      try {
        // Check if token is valid by making a request to the API
        const response = await axios.get(`/api/password/${token}`);
        setIsValidToken(true);
      } catch (error) {
        console.error('Token validation failed:', error);
        setIsValidToken(false);
      } finally {
        setIsValidating(false);
      }
    };

    if (token) {
      validateToken();
    } else {
      setIsValidating(false);
      setIsValidToken(false);
    }
  }, [token]);

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (data.newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(`/api/password/${token}`, {
        newPassword: data.newPassword
      });

      setIsSuccess(true);
      toast.success('Đặt lại mật khẩu thành công!');
      reset();

      // Redirect to home page after 3 seconds
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error: any) {
      console.error('Password reset failed:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi đặt lại mật khẩu';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
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

  // Loading state while validating token
  if (isValidating) {
    return (
      <FormWrap>
        <div className='flex flex-col items-center justify-center py-12'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4'></div>
          <p className='text-gray-600'>Đang xác thực link khôi phục...</p>
        </div>
      </FormWrap>
    );
  }

  // Invalid token state
  if (!isValidToken) {
    return (
      <FormWrap>
        <div className='mb-8 gap-3 flex flex-col items-center'>
          <MdError className='text-5xl text-red-500 mb-2' />
          <Heading title='Link không hợp lệ'>
            <></>
          </Heading>
          <div className='mt-6 space-y-4'>
            <p className='text-gray-600 text-center'>Link khôi phục mật khẩu không hợp lệ hoặc đã hết hạn.</p>
            <p className='text-sm text-gray-500'>
              Vui lòng yêu cầu link khôi phục mới hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.
            </p>
            <div className='pt-4'>
              <Button label='Về trang chủ' onClick={() => router.push('/')} />
            </div>
          </div>
        </div>
      </FormWrap>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <FormWrap>
        <div className='text-center py-8'>
          <MdCheckCircle className='mx-auto text-6xl text-green-500 mb-4' />
          <Heading title='Đặt lại mật khẩu thành công!'>
            <></>
          </Heading>
          <div className='mt-6 space-y-4'>
            <p className='text-gray-600'>Mật khẩu của bạn đã được cập nhật thành công.</p>
            <p className='text-sm text-gray-500'>Bạn sẽ được chuyển về trang chủ trong giây lát...</p>
            <div className='pt-4'>
              <Button label='Về trang chủ ngay' onClick={() => router.push('/')} />
            </div>
          </div>
        </div>
      </FormWrap>
    );
  }

  // Main password reset form
  return (
    <FormWrap>
      <div className='w-full max-w-md mx-auto'>
        <div className='flex flex-col items-center mb-8'>
          <MdLock className='text-5xl text-blue-600 mb-3' />
          <Heading title='Đặt lại mật khẩu'>
            <></>
          </Heading>
        </div>
        <p className='text-gray-600 text-sm mt-3 mb-6 text-center'>Vui lòng nhập mật khẩu mới cho tài khoản của bạn</p>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          <div>
            <Input
              id='newPassword'
              label='Mật khẩu mới'
              type='password'
              toggleVisibility={true}
              disabled={isLoading}
              register={register}
              errors={errors}
              onKeyDown={handleKeyDown}
              required
            />
          </div>

          <div>
            <Input
              id='confirmPassword'
              label='Xác nhận mật khẩu'
              type='password'
              toggleVisibility={true}
              disabled={isLoading}
              register={register}
              errors={errors}
              onKeyDown={handleKeyDown}
              required
            />
          </div>

          {newPassword && newPassword.length > 0 && newPassword.length < 6 && (
            <p className='text-red-500 text-sm'>Mật khẩu phải có ít nhất 6 ký tự</p>
          )}

          <div className='pt-4'>
            <Button label='Đặt lại mật khẩu' onClick={handleSubmit(onSubmit)} isLoading={isLoading} />
          </div>
        </form>

        <div className='text-center mt-6'>
          <button
            onClick={() => router.push('/')}
            className='text-blue-600 hover:underline text-sm transition-colors duration-200'
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </FormWrap>
  );
};

export default PasswordResetClient;

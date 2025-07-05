'use client';

import { useState } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import axios from 'axios';
import Heading from '../Heading';
import Input from '../inputs/Input';
import Button from '../Button';
import { useAuthModal } from './useAuthModal';
import { MdEmail, MdCheckCircle, MdArrowBack } from 'react-icons/md';

const PasswordRecoveryModal = () => {
  const { switchModal } = useAuthModal();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

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
        setEmailSent(true);
        setSentEmail(data.email);
        toast.success('Email khôi phục đã được gửi!');
        reset();
      })
      .catch(error => {
        console.log(error);
        const errorMessage = error.response?.data?.message || 'Tài khoản này không tồn tại';
        toast.error(errorMessage);
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

  const handleBackToForm = () => {
    setEmailSent(false);
    setSentEmail('');
    reset();
  };

  // Success state - email sent
  if (emailSent) {
    return (
      <div className='w-full max-w-md mx-auto px-8 py-6'>
        <div className='flex items-center justify-center mb-8 gap-3'>
          <MdCheckCircle className='ext-5xl text-green-500' />
          <Heading title='Email đã được gửi!'>
            <></>
          </Heading>
        </div>

        <div className='mb-8 text-center space-y-4'>
          <p className='text-gray-600 text-sm leading-relaxed'>Chúng tôi đã gửi link khôi phục mật khẩu đến email:</p>
          <p className='font-semibold text-gray-800 bg-gray-50 p-3 rounded-lg'>{sentEmail}</p>
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <p className='text-blue-800 text-sm'>
              <strong>Lưu ý:</strong> Link sẽ hết hạn sau 5 phút. Vui lòng kiểm tra hộp thư và thực hiện đặt lại mật
              khẩu ngay.
            </p>
          </div>
          <p className='text-gray-500 text-xs'>Không thấy email? Kiểm tra thư mục spam hoặc thử gửi lại.</p>
        </div>

        <div className='space-y-3'>
          <Button label='Gửi lại email' onClick={handleSubmit(onSubmit)} isLoading={isLoading} />
          <button
            onClick={handleBackToForm}
            className='w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 py-2 transition-colors duration-200'
          >
            <MdArrowBack />
            Thử email khác
          </button>
        </div>

        <div className='text-center mt-6'>
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
  }

  // Main form
  return (
    <div className='w-full max-w-md mx-auto px-8 py-6'>
      <div className='flex items-center justify-center mb-8 gap-3'>
        <MdEmail className='text-5xl text-blue-600' />
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

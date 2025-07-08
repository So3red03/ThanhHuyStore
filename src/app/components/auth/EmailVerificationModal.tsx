'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { SafeUser } from '../../../../types';
import Heading from '../Heading';
import Button from '../Button';
import { useAuthModal } from './useAuthModal';

interface EmailVerificationModalProps {
  currentUser: SafeUser | null | undefined;
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({ currentUser }) => {
  const { switchModal, closeModal } = useAuthModal();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Vui lòng nhập email để gửi lại xác thực');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/api/auth/send-verification', {
        email,
        isResend: true
      });
      toast.success(response.data.message);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi gửi email';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    switchModal('login');
  };

  const handleSwitchToRegister = (e: React.MouseEvent) => {
    e.preventDefault();
    switchModal('register');
  };

  if (currentUser) {
    return null;
  }

  return (
    <div className='w-full max-w-md mx-auto px-8 py-6'>
      <div className='mb-8'>
        <Heading title='Xác thực email'>
          <></>
        </Heading>
      </div>

      <div className='text-center mb-6'>
        <div className='text-6xl mb-4'>📧</div>
        <h2 className='text-xl font-semibold text-gray-800 mb-4'>Kiểm tra email của bạn</h2>
        <p className='text-gray-600 mb-6 leading-relaxed'>
          Chúng tôi đã gửi email xác thực đến địa chỉ email của bạn. Vui lòng kiểm tra hộp thư và nhấp vào link xác thực
          để hoàn tất đăng ký.
        </p>
      </div>

      <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6'>
        <div className='flex items-start'>
          <div className='text-yellow-600 mr-3 mt-1'>⚠️</div>
          <div className='text-sm text-yellow-800'>
            <p className='font-medium mb-1'>Lưu ý quan trọng:</p>
            <ul className='list-disc list-inside space-y-1'>
              <li>Link xác thực sẽ hết hạn sau 5 phút</li>
              <li>Kiểm tra cả thư mục spam/junk mail</li>
              <li>Bạn cần xác thực email trước khi đăng nhập</li>
            </ul>
          </div>
        </div>
      </div>

      <div className='space-y-4 mb-6'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Email của bạn</label>
          <input
            type='email'
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder='Nhập email để gửi lại xác thực'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            disabled={isLoading}
          />
        </div>

        <Button
          label={isLoading ? 'Đang gửi...' : 'Gửi lại email xác thực'}
          onClick={handleResendVerification}
          isLoading={isLoading}
          outline
        />
      </div>

      <div className='border-t border-gray-200 pt-6'>
        <div className='text-center space-y-3'>
          <p className='text-sm text-gray-600'>
            Đã xác thực email?{' '}
            <button
              onClick={handleSwitchToLogin}
              className='text-[#0066CC] hover:underline font-medium transition-colors duration-200'
            >
              Đăng nhập ngay
            </button>
          </p>

          <p className='text-sm text-gray-600'>
            Chưa có tài khoản?{' '}
            <button
              onClick={handleSwitchToRegister}
              className='text-[#0066CC] hover:underline font-medium transition-colors duration-200'
            >
              Đăng ký mới
            </button>
          </p>
        </div>
      </div>

      <div className='mt-6 text-center'>
        <button
          onClick={() => closeModal()}
          className='text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200'
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationModal;

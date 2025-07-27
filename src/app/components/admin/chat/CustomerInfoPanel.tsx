'use client';

import { User, ChatRoom } from '@prisma/client';
import { useOtherUser } from '@/app/actions/getOtherUser';
import Avatar from './Avatar';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MdEmail, MdPhone, MdCalendarToday, MdPerson, MdShoppingCart, MdStar, MdClose } from 'react-icons/md';
import { useUserStats } from '@/app/hooks/useUserStats';

interface CustomerInfoPanelProps {
  conversation: ChatRoom & { users: User[] };
  isOpen: boolean;
  onClose: () => void;
}

const CustomerInfoPanel: React.FC<CustomerInfoPanelProps> = ({ conversation, isOpen, onClose }) => {
  const otherUser = useOtherUser(conversation);
  const { stats, loading, error } = useUserStats(otherUser?.id || null);

  // Show error state if needed
  if (error) {
    console.error('Error loading user stats:', error);
  }

  if (!otherUser) {
    return null;
  }

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div
        className={`
        fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50
        transform transition-all duration-300 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        border-l border-gray-100 flex flex-col
      `}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50'>
          <h3 className='text-xl font-bold text-gray-900'>Thông tin khách hàng</h3>
          <button
            onClick={onClose}
            className='p-2 rounded-full hover:bg-white/60 transition-all duration-200 group'
            title='Đóng panel'
          >
            <MdClose size={20} className='text-gray-500 group-hover:text-gray-700 transition-colors' />
          </button>
        </div>

        {/* Customer Info - Scrollable Content */}
        <div className='flex-1 p-6 space-y-8 overflow-y-auto'>
          {/* Avatar & Basic Info */}
          <div className='text-center'>
            <div className='relative inline-block mb-4'>
              <Avatar user={otherUser} />
            </div>
            <h4 className='text-2xl font-bold text-gray-900 mb-2'>{otherUser.name || 'Khách hàng'}</h4>
            <div className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800'>
              {otherUser.role === 'USER' ? 'Khách hàng' : otherUser.role}
            </div>
          </div>

          {/* Contact Information */}
          <div className='bg-gray-50 rounded-xl p-5'>
            <h5 className='text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2'>
              <div className='w-1 h-4 bg-blue-500 rounded-full'></div>
              THÔNG TIN LIÊN HỆ
            </h5>
            <div className='space-y-4'>
              <div className='flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm'>
                <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                  <MdEmail className='text-blue-600' size={18} />
                </div>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-gray-900'>{otherUser.email}</p>
                  <p className='text-xs text-gray-500'>Email</p>
                </div>
              </div>

              {otherUser.phoneNumber && (
                <div className='flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm'>
                  <div className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'>
                    <MdPhone className='text-green-600' size={18} />
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-gray-900'>{otherUser.phoneNumber}</p>
                    <p className='text-xs text-gray-500'>Số điện thoại</p>
                  </div>
                </div>
              )}

              <div className='flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm'>
                <div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center'>
                  <MdCalendarToday className='text-purple-600' size={18} />
                </div>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-gray-900'>
                    {format(new Date(otherUser.createAt), 'dd/MM/yyyy', { locale: vi })}
                  </p>
                  <p className='text-xs text-gray-500'>Ngày tham gia</p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className='bg-gray-50 rounded-xl p-5'>
            <h5 className='text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2'>
              <div className='w-1 h-4 bg-green-500 rounded-full'></div>
              TRẠNG THÁI TÀI KHOẢN
            </h5>
            <div className='space-y-4'>
              <div className='flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm'>
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    otherUser.emailVerified ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${otherUser.emailVerified ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-gray-900'>
                    {otherUser.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                  </p>
                  <p className='text-xs text-gray-500'>Email verification</p>
                </div>
              </div>

              {otherUser.lastLogin && (
                <div className='flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm'>
                  <div className='w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center'>
                    <MdPerson className='text-indigo-600' size={18} />
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-gray-900'>
                      {format(new Date(otherUser.lastLogin), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </p>
                    <p className='text-xs text-gray-500'>Lần cuối đăng nhập</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className='bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5'>
            <h5 className='text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2'>
              <div className='w-1 h-4 bg-yellow-500 rounded-full'></div>
              THỐNG KÊ NHANH
            </h5>

            <div className='grid grid-cols-2 gap-4'>
              <div className='bg-white p-4 rounded-xl shadow-sm border border-blue-100 hover:shadow-md transition-shadow'>
                <div className='flex items-center justify-between mb-2'>
                  <MdShoppingCart className='text-blue-500' size={24} />
                  <div
                    className={`w-2 h-2 rounded-full ${
                      loading ? 'bg-gray-400 animate-pulse' : 'bg-blue-500 animate-pulse'
                    }`}
                  ></div>
                </div>
                <p className='text-2xl font-bold text-blue-700 mb-1'>{loading ? '...' : stats?.orders.total || 0}</p>
                <p className='text-xs text-blue-600 font-medium'>Đơn hàng</p>
                {stats?.orders.totalSpent && stats.orders.totalSpent > 0 && (
                  <p className='text-xs text-gray-500 mt-1'>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                      stats.orders.totalSpent
                    )}
                  </p>
                )}
              </div>

              <div className='bg-white p-4 rounded-xl shadow-sm border border-yellow-100 hover:shadow-md transition-shadow'>
                <div className='flex items-center justify-between mb-2'>
                  <MdStar className='text-yellow-500' size={24} />
                  <div
                    className={`w-2 h-2 rounded-full ${
                      loading ? 'bg-gray-400 animate-pulse' : 'bg-yellow-500 animate-pulse'
                    }`}
                  ></div>
                </div>
                <p className='text-2xl font-bold text-yellow-700 mb-1'>{loading ? '...' : stats?.reviews.total || 0}</p>
                <p className='text-xs text-yellow-600 font-medium'>Đánh giá</p>
              </div>
            </div>

            {/* Customer Type Badge */}
            <div className='mt-6 flex justify-center'>
              <div
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-lg ${
                  loading
                    ? 'bg-gray-400'
                    : stats?.customerType === 'Khách hàng VIP'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                    : stats?.customerType === 'Khách hàng thân thiết'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    : stats?.customerType === 'Khách hàng quay lại'
                    ? 'bg-gradient-to-r from-green-400 to-blue-500'
                    : 'bg-gradient-to-r from-gray-400 to-gray-500'
                } text-white`}
              >
                <MdPerson className='mr-2' size={16} />
                {loading ? 'Đang tải...' : stats?.customerType || 'Khách hàng mới'}
                <div className='ml-2 w-2 h-2 bg-white rounded-full animate-bounce'></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerInfoPanel;

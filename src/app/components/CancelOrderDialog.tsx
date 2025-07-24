'use client';

import { useState } from 'react';
import { CartProductType, Order } from '@prisma/client';
import { SafeUser } from '../../../types';
import { MdClose } from 'react-icons/md';
import Button from './Button';
import axios from 'axios';
import toast from 'react-hot-toast';

interface CancelOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order & {
    user: SafeUser;
    products: CartProductType[];
  };
  currentUser: SafeUser;
  onSuccess: () => void;
}

const CANCEL_REASONS = [
  'Tôi không còn nhu cầu mua sản phẩm nữa',
  'Tôi đặt nhầm đơn hàng',
  'Thời gian giao hàng không phù hợp',
  'Tôi muốn thay đổi thông tin đơn hàng nhưng không thể',
  'Khác (vui lòng ghi rõ lý do)'
];

const CancelOrderDialog: React.FC<CancelOrderDialogProps> = ({ isOpen, onClose, order, currentUser, onSuccess }) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [otherReason, setOtherReason] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleCancel = async () => {
    if (!selectedReason) {
      toast.error('Vui lòng chọn lý do hủy đơn hàng');
      return;
    }

    if (selectedReason === 'Khác' && !otherReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy đơn hàng');
      return;
    }

    setIsLoading(true);

    try {
      const cancelReason = selectedReason === 'Khác' ? otherReason : selectedReason;

      const response = await axios.post('/api/orders/cancel', {
        orderId: order.id,
        reason: cancelReason,
        userId: currentUser.id
      });

      if (response.data.success) {
        toast.success('Đơn hàng đã được hủy thành công');
        onSuccess();
      } else {
        toast.error(response.data.message || 'Có lỗi xảy ra khi hủy đơn hàng');
      }
    } catch (error: any) {
      console.error('Cancel order error:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi hủy đơn hàng');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-md mx-4'>
        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold'>Lý Do Hủy</h2>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600' disabled={isLoading}>
            <MdClose size={24} />
          </button>
        </div>

        {/* Reasons List */}
        <div className='space-y-3 mb-6'>
          {CANCEL_REASONS.map((reason, index) => (
            <label key={index} className='flex items-center cursor-pointer'>
              <input
                type='radio'
                name='cancelReason'
                value={reason}
                checked={selectedReason === reason}
                onChange={e => setSelectedReason(e.target.value)}
                className='mr-3 text-red-500 focus:ring-red-500'
                disabled={isLoading}
              />
              <span className={`text-sm ${selectedReason === reason ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                {reason}
              </span>
            </label>
          ))}
        </div>

        {/* Other Reason Input */}
        {selectedReason === 'Khác' && (
          <div className='mb-6'>
            <textarea
              placeholder='Vui lòng nhập lý do hủy đơn hàng...'
              value={otherReason}
              onChange={e => setOtherReason(e.target.value)}
              className='w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent'
              rows={3}
              disabled={isLoading}
            />
          </div>
        )}

        {/* Action Button */}
        <Button
          label='Xác nhận'
          onClick={handleCancel}
          isLoading={isLoading}
          custom='w-full bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600'
        />
      </div>
    </div>
  );
};

export default CancelOrderDialog;

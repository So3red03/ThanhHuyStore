'use client';

import { useState } from 'react';
import { MdClose } from 'react-icons/md';
import Button from '../Button';
import axios from 'axios';
import toast from 'react-hot-toast';

interface AdminCancelOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  customerName: string;
  onSuccess: () => void;
}

const ADMIN_CANCEL_REASONS = [
  'Sản phẩm hết hàng',
  'Không thể liên lạc với khách hàng',
  'Địa chỉ giao hàng không hợp lệ',
  'Khách hàng yêu cầu hủy',
  'Lỗi hệ thống thanh toán',
  'Sản phẩm bị lỗi/hỏng',
  'Không thể giao hàng đến địa chỉ',
  'Khác'
];

const AdminCancelOrderDialog: React.FC<AdminCancelOrderDialogProps> = ({
  isOpen,
  onClose,
  orderId,
  customerName,
  onSuccess
}) => {
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
      
      const response = await axios.post('/api/orders/admin-cancel', {
        orderId: orderId,
        reason: cancelReason
      });

      if (response.data.success) {
        toast.success('Đơn hàng đã được hủy thành công');
        onSuccess();
      } else {
        toast.error(response.data.message || 'Có lỗi xảy ra khi hủy đơn hàng');
      }
    } catch (error: any) {
      console.error('Admin cancel order error:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi hủy đơn hàng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedReason('');
      setOtherReason('');
      onClose();
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-md mx-4'>
        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h2 className='text-lg font-semibold text-red-600'>Hủy Đơn Hàng</h2>
            <p className='text-sm text-gray-600'>Khách hàng: {customerName}</p>
          </div>
          <button
            onClick={handleClose}
            className='text-gray-400 hover:text-gray-600'
            disabled={isLoading}
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Warning */}
        <div className='mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
          <p className='text-sm text-yellow-800'>
            ⚠️ Hành động này sẽ hủy đơn hàng và không thể hoàn tác. Khách hàng sẽ được thông báo.
          </p>
        </div>

        {/* Reasons List */}
        <div className='space-y-3 mb-6'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Chọn lý do hủy đơn hàng:
          </label>
          {ADMIN_CANCEL_REASONS.map((reason, index) => (
            <label key={index} className='flex items-center cursor-pointer'>
              <input
                type='radio'
                name='cancelReason'
                value={reason}
                checked={selectedReason === reason}
                onChange={(e) => setSelectedReason(e.target.value)}
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
              onChange={(e) => setOtherReason(e.target.value)}
              className='w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent'
              rows={3}
              disabled={isLoading}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className='flex gap-3'>
          <Button
            label='Hủy bỏ'
            onClick={handleClose}
            outline
            disabled={isLoading}
            custom='flex-1'
          />
          <Button
            label='Xác nhận hủy'
            onClick={handleCancel}
            isLoading={isLoading}
            custom='flex-1 bg-red-500 hover:bg-red-600 text-white'
          />
        </div>
      </div>
    </div>
  );
};

export default AdminCancelOrderDialog;

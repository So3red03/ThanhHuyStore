'use client';

import { useState } from 'react';
import { MdClose, MdWarning, MdAdminPanelSettings } from 'react-icons/md';
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
  'Không thể liên lạc với khách hàng',
  'Địa chỉ giao hàng không hợp lệ',
  'Khách hàng yêu cầu hủy',
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
    <div className='fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity duration-300'>
      <div className='bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4'>
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-red-100 rounded-full'>
              <MdAdminPanelSettings className='text-red-600' size={24} />
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-800'>Hủy Đơn Hàng</h2>
              <p className='text-sm text-gray-500'>
                Khách hàng: <span className='font-medium text-gray-700'>{customerName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className='text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors duration-200'
            disabled={isLoading}
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Warning */}
        <div className='mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg'>
          <div className='flex items-center space-x-2'>
            <MdWarning className='text-amber-600 flex-shrink-0' size={20} />
            <p className='text-sm text-amber-800 font-medium'>
              Hành động này sẽ hủy đơn hàng và không thể hoàn tác. Khách hàng sẽ được thông báo.
            </p>
          </div>
        </div>

        {/* Reasons List */}
        <div className='space-y-3 mb-6'>
          <label className='block text-sm font-semibold text-gray-800 mb-4'>Chọn lý do hủy đơn hàng:</label>
          <div className='space-y-2'>
            {ADMIN_CANCEL_REASONS.map((reason, index) => (
              <label
                key={index}
                className={`flex items-center cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 hover:bg-gray-50 ${
                  selectedReason === reason ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type='radio'
                  name='cancelReason'
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={e => setSelectedReason(e.target.value)}
                  className='mr-3 text-red-500 focus:ring-red-500 focus:ring-2'
                  disabled={isLoading}
                />
                <span
                  className={`text-sm transition-colors duration-200 ${
                    selectedReason === reason ? 'text-red-700 font-semibold' : 'text-gray-700'
                  }`}
                >
                  {reason}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Other Reason Input */}
        {selectedReason === 'Khác' && (
          <div className='mb-6 transition-all duration-300 ease-in-out'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Chi tiết lý do:</label>
            <textarea
              placeholder='Vui lòng nhập lý do hủy đơn hàng chi tiết...'
              value={otherReason}
              onChange={e => setOtherReason(e.target.value)}
              className='w-full p-4 border-2 border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-gray-50 focus:bg-white'
              rows={4}
              disabled={isLoading}
              maxLength={500}
            />
            <p className='text-xs text-gray-500 mt-1'>Tối đa 500 ký tự</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className='flex gap-3 pt-4 border-t border-gray-100'>
          <Button
            label='Hủy bỏ'
            onClick={handleClose}
            outline
            disabled={isLoading}
            custom='flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200'
          />
          <Button
            label={isLoading ? 'Đang xử lý...' : 'Xác nhận hủy'}
            onClick={handleCancel}
            isLoading={isLoading}
            custom='flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200'
          />
        </div>
      </div>
    </div>
  );
};

export default AdminCancelOrderDialog;

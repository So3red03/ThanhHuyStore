'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import Button from '@/app/components/Button';
import { MdCloudUpload, MdClose } from 'react-icons/md';
import Image from 'next/image';

interface ReturnRequestFormProps {
  orderId: string;
  orderCode: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const ReturnRequestForm: React.FC<ReturnRequestFormProps> = ({ orderId, orderCode, onClose, onSuccess }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'RETURN',
    reason: '',
    description: '',
    images: [] as string[]
  });

  const returnTypes = [
    { value: 'RETURN', label: 'Trả hàng', description: 'Không ưng ý sản phẩm' },
    { value: 'EXCHANGE', label: 'Đổi hàng', description: 'Sản phẩm lỗi, sai size/màu' },
    { value: 'REFUND', label: 'Hoàn tiền', description: 'Yêu cầu hoàn lại tiền' }
  ];

  const returnReasons = [
    'Sản phẩm bị lỗi/hỏng',
    'Sản phẩm không đúng mô tả',
    'Sản phẩm sai size/màu sắc',
    'Không ưng ý sản phẩm',
    'Nhận được sản phẩm khác',
    'Chất lượng không như mong đợi',
    'Lý do khác'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // TODO: Implement image upload to cloud storage
    // For now, we'll use placeholder URLs
    const newImages = Array.from(files).map((file, index) => URL.createObjectURL(file));

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages].slice(0, 5) // Max 5 images
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reason) {
      toast.error('Vui lòng chọn lý do đổi/trả hàng');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('/api/returns/create', {
        orderId,
        type: formData.type,
        reason: formData.reason,
        description: formData.description,
        images: formData.images
      });

      if (response.data.success) {
        toast.success('Yêu cầu đổi/trả hàng đã được gửi thành công!');
        onSuccess?.();
        onClose();
        router.refresh();
      }
    } catch (error: any) {
      console.error('Error creating return request:', error);
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-800'>Yêu cầu đổi/trả hàng</h2>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600 transition-colors'>
            <MdClose size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-6 space-y-6'>
          {/* Order Info */}
          <div className='bg-gray-50 p-4 rounded-lg'>
            <h3 className='font-medium text-gray-800 mb-2'>Thông tin đơn hàng</h3>
            <p className='text-sm text-gray-600'>Mã đơn hàng: #{orderCode}</p>
          </div>

          {/* Return Type */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-3'>
              Loại yêu cầu <span className='text-red-500'>*</span>
            </label>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
              {returnTypes.map(type => (
                <label
                  key={type.value}
                  className={`relative flex flex-col p-4 border rounded-lg cursor-pointer transition-all ${
                    formData.type === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type='radio'
                    name='type'
                    value={type.value}
                    checked={formData.type === type.value}
                    onChange={e => handleInputChange('type', e.target.value)}
                    className='sr-only'
                  />
                  <span className='font-medium text-gray-800'>{type.label}</span>
                  <span className='text-xs text-gray-500 mt-1'>{type.description}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Lý do <span className='text-red-500'>*</span>
            </label>
            <select
              value={formData.reason}
              onChange={e => handleInputChange('reason', e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              required
            >
              <option value=''>Chọn lý do</option>
              {returnReasons.map(reason => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Mô tả chi tiết</label>
            <textarea
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              placeholder='Mô tả chi tiết về vấn đề (tùy chọn)'
              rows={4}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none'
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Hình ảnh bằng chứng</label>
            <div className='space-y-3'>
              {/* Upload Button */}
              <label className='flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors'>
                <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                  <MdCloudUpload className='w-8 h-8 mb-2 text-gray-400' />
                  <p className='text-sm text-gray-500'>
                    <span className='font-semibold'>Nhấn để tải ảnh</span> hoặc kéo thả
                  </p>
                  <p className='text-xs text-gray-500'>PNG, JPG (tối đa 5 ảnh)</p>
                </div>
                <input type='file' multiple accept='image/*' onChange={handleImageUpload} className='hidden' />
              </label>

              {/* Image Preview */}
              {formData.images.length > 0 && (
                <div className='grid grid-cols-2 md:grid-cols-5 gap-3'>
                  {formData.images.map((image, index) => (
                    <div key={index} className='relative group'>
                      <Image
                        src={image}
                        alt={`Preview ${index + 1}`}
                        width={100}
                        height={100}
                        className='w-full h-20 object-cover rounded-lg border border-gray-200'
                      />
                      <button
                        type='button'
                        onClick={() => removeImage(index)}
                        className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                      >
                        <MdClose size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className='flex gap-3 pt-4'>
            <Button label='Hủy' onClick={onClose} outline custom='flex-1' />
            <button
              type='submit'
              disabled={isLoading}
              className='flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {isLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnRequestForm;

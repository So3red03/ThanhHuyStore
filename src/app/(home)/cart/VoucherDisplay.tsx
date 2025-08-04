'use client';
import React from 'react';
import { useCart } from '../../hooks/useCart';
import { formatPrice } from '../../utils/formatPrice';
import { FiX, FiTag } from 'react-icons/fi';

const VoucherDisplay: React.FC = () => {
  const { selectedVoucher, setSelectedVoucher, discountAmount } = useCart();

  if (!selectedVoucher || discountAmount === 0) {
    return null;
  }

  const handleRemoveVoucher = () => {
    setSelectedVoucher(null);
  };

  const getDiscountDisplay = () => {
    if (selectedVoucher.discountType === 'PERCENTAGE') {
      return `Giảm ${selectedVoucher.discountValue}%`;
    } else {
      return `Giảm ${formatPrice(selectedVoucher.discountValue)}`;
    }
  };

  const getVoucherTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      NEW_USER: 'bg-blue-100 text-blue-800 border-blue-200',
      RETARGETING: 'bg-purple-100 text-purple-800 border-purple-200',
      UPSELL: 'bg-green-100 text-green-800 border-green-200',
      LOYALTY: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      EVENT: 'bg-red-100 text-red-800 border-red-200',
      GENERAL: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[type] || colors.GENERAL;
  };

  return (
    <div className='bg-green-50 border border-green-200 rounded-lg p-3 mt-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          {/* Voucher Icon/Image */}
          <div className='flex-shrink-0'>
            {selectedVoucher.image ? (
              <img
                src={selectedVoucher.image}
                alt={selectedVoucher.code}
                className='w-10 h-10 rounded-lg object-cover'
              />
            ) : (
              <div className='w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white'>
                <FiTag className='w-5 h-5' />
              </div>
            )}
          </div>

          {/* Voucher Info */}
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-1'>
              <span className='font-semibold text-indigo-600 text-sm'>{selectedVoucher.code}</span>
              <span className={`text-xs px-2 py-1 rounded border ${getVoucherTypeColor(selectedVoucher.voucherType)}`}>
                {selectedVoucher.voucherType}
              </span>
            </div>
            <p className='text-sm  mb-1'>{selectedVoucher.description}</p>
            <div className='flex items-center gap-3 text-xs'>
              <span className='font-semibold text-green-600'>{getDiscountDisplay()}</span>
              <span className='font-medium'>| Đơn tối thiểu {formatPrice(selectedVoucher.minOrderValue)}</span>
            </div>
          </div>
        </div>

        {/* Remove Button */}
        <button
          onClick={handleRemoveVoucher}
          className='flex-shrink-0 p-1 text-red-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors'
          title='Bỏ voucher'
        >
          <FiX className='w-4 h-4' />
        </button>
      </div>
    </div>
  );
};

export default VoucherDisplay;

import React, { useState, useEffect, useRef } from 'react';
import { FiChevronDown, FiChevronUp, FiSearch } from 'react-icons/fi';
import { formatPrice } from '../../../../utils/formatPrice';
import { useCart } from '../../hooks/useCart';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Voucher {
  id: string;
  code: string;
  description: string;
  image?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderValue?: number;
  quantity: number;
  usedCount: number;
  maxUsagePerUser: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  voucherType: string;
}

interface DiscountComboBoxProps {
  cartTotal?: number;
}

const DiscountComboBox: React.FC<DiscountComboBoxProps> = ({ cartTotal = 0 }) => {
  const { selectedVoucher, setSelectedVoucher, cartTotalAmount } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);
  // Use cartTotalAmount from useCart if cartTotal is not provided
  const totalAmount = cartTotal || cartTotalAmount;

  const toggleOpen = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Fetch vouchers from API
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/voucher/active');
        setVouchers(response.data);
      } catch (error) {
        console.error('Error fetching vouchers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVouchers();
  }, []);

  // Filter vouchers based on search term and cart total
  const filteredVouchers = vouchers.filter(voucher => {
    const matchesSearch =
      voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const meetsMinOrder = !voucher.minOrderValue || totalAmount >= voucher.minOrderValue;

    return matchesSearch && meetsMinOrder && voucher.isActive;
  });

  // Handle voucher selection
  const handleVoucherSelect = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setIsOpen(false);
    toast.success(`Đã áp dụng voucher ${voucher.code}`);
  };

  // Handle voucher removal
  const handleRemoveVoucher = () => {
    setSelectedVoucher(null);
    toast.success('Đã bỏ voucher');
  };

  // Calculate discount display
  const getDiscountDisplay = (voucher: Voucher) => {
    if (voucher.discountType === 'PERCENTAGE') {
      return `Giảm ${voucher.discountValue}%`;
    } else {
      return `Giảm ${formatPrice(voucher.discountValue)}`;
    }
  };

  // Get voucher type color
  const getVoucherTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      NEW_USER: 'bg-blue-600',
      RETARGETING: 'bg-purple-600',
      UPSELL: 'bg-green-600',
      LOYALTY: 'bg-yellow-600',
      EVENT: 'bg-red-600',
      GENERAL: 'bg-gray-600'
    };
    return colors[type] || colors.GENERAL;
  };

  return (
    <div className='relative' ref={comboboxRef}>
      <div
        className='cursor-pointer flex items-center w-full justify-between bg-white border rounded px-3 py-2 text-blue-600 border-gray-300 hover:border-blue-400 transition-colors'
        onClick={toggleOpen}
      >
        <div className='flex items-center gap-2'>
          <svg viewBox='0 0 20 16' fill='none' xmlns='http://www.w3.org/2000/svg' className='w-4'>
            <path
              d='M12.8 4L14 5.2L7.2 12L6 10.8L12.8 4ZM2 0H18C19.11 0 20 0.89 20 2V6C19.4696 6 18.9609 6.21071 18.5858 6.58579C18.2107 6.96086 18 7.46957 18 8C18 8.53043 18.2107 9.03914 18.5858 9.41421C18.9609 9.78929 19.4696 10 20 10V14C20 15.11 19.11 16 18 16H2C1.46957 16 0.960859 15.7893 0.585786 15.4142C0.210714 15.0391 0 14.5304 0 14V10C1.11 10 2 9.11 2 8C2 7.46957 1.78929 6.96086 1.41421 6.58579C1.03914 6.21071 0.530433 6 0 6V2C0 1.46957 0.210714 0.960859 0.585786 0.585786C0.960859 0.210714 1.46957 0 2 0ZM2 2V4.54C2.60768 4.8904 3.11236 5.39466 3.46325 6.00205C3.81415 6.60944 3.9989 7.29854 3.9989 8C3.9989 8.70146 3.81415 9.39056 3.46325 9.99795C3.11236 10.6053 2.60768 11.1096 2 11.46V14H18V11.46C17.3923 11.1096 16.8876 10.6053 16.5367 9.99795C16.1858 9.39056 16.0011 8.70146 16.0011 8C16.0011 7.29854 16.1858 6.60944 16.5367 6.00205C16.8876 5.39466 17.3923 4.8904 18 4.54V2H2ZM7.5 4C8.33 4 9 4.67 9 5.5C9 6.33 8.33 7 7.5 7C6.67 7 6 6.33 6 5.5C6 4.67 6.67 4 7.5 4ZM12.5 9C13.33 9 14 9.67 14 10.5C14 11.33 13.33 12 12.5 12C11.67 12 11 11.33 11 10.5C11 9.67 11.67 9 12.5 9Z'
              fill='#1982F9'
            ></path>
          </svg>
          <span>{selectedVoucher ? `Đã chọn ${selectedVoucher.code}` : 'Sử dụng mã giảm giá'}</span>
        </div>
        {isOpen ? <FiChevronUp /> : <FiChevronDown />}
      </div>

      {isOpen && (
        <div className='absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-xl max-h-96 overflow-hidden'>
          {/* Search Input */}
          <div className='relative p-3 border-b border-gray-200'>
            <FiSearch className='absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400' />
            <input
              type='text'
              className='w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              placeholder='Nhập mã voucher...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Vouchers List */}
          <div className='max-h-80 overflow-y-auto'>
            {isLoading ? (
              <div className='p-4 text-center text-gray-500'>Đang tải voucher...</div>
            ) : filteredVouchers.length === 0 ? (
              <div className='p-4 text-center text-gray-500'>
                {searchTerm ? 'Không tìm thấy voucher phù hợp' : 'Không có voucher khả dụng'}
              </div>
            ) : (
              filteredVouchers.map(voucher => (
                <div
                  key={voucher.id}
                  className='flex items-center p-3 border-b last:border-0 border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors group'
                  onClick={() => handleVoucherSelect(voucher)}
                >
                  {/* Voucher Image/Icon */}
                  <div className='flex-shrink-0 mr-3'>
                    {voucher.image ? (
                      <img src={voucher.image} alt={voucher.code} className='w-12 h-12 rounded-lg object-cover' />
                    ) : (
                      <div
                        className={`w-12 h-12 ${getVoucherTypeColor(
                          voucher.voucherType
                        )} rounded-lg flex items-center justify-center text-white font-bold text-xs`}
                      >
                        {voucher.discountType === 'PERCENTAGE' ? `${voucher.discountValue}%` : 'VNĐ'}
                      </div>
                    )}
                  </div>

                  {/* Voucher Info */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <span className='font-semibold text-blue-600 text-sm'>{voucher.code}</span>
                      <span className='text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded'>{voucher.voucherType}</span>
                    </div>
                    <p className='text-sm text-gray-700 mb-1'>{voucher.description}</p>
                    <div className='flex items-center gap-3 text-xs text-gray-500'>
                      <span className='font-medium text-green-600'>{getDiscountDisplay(voucher)}</span>
                      {voucher.minOrderValue && <span>| Đơn tối thiểu {formatPrice(voucher.minOrderValue)}</span>}
                    </div>
                  </div>

                  {/* Hover Effect */}
                  {/* <div className='opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 font-medium text-sm'>
                    Chọn
                  </div> */}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountComboBox;

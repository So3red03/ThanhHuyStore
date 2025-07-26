'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatPrice } from '../../../../utils/formatPrice';
import { MdArrowForward, MdSwapHoriz } from 'react-icons/md';
import {
  fetchProductInfo,
  fetchVariantInfo,
  getDisplayName,
  getDisplayPrice,
  getDisplayImage,
  formatVariantAttributes,
  ProductInfo,
  VariantInfo
} from '../../utils/productUtils';
import { truncateText } from '../../../../utils/truncateText';

interface ExchangeProductDisplayProps {
  // Original product being returned
  originalItem: {
    productId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
    name?: string;
  };
  // New product being exchanged to
  exchangeToProductId: string;
  exchangeToVariantId?: string;
  // Additional cost (positive = customer pays more, negative = customer gets refund)
  additionalCost?: number;
  // Display mode
  mode?: 'compact' | 'detailed';
  // Show price difference
  showPriceDifference?: boolean;
}

const ExchangeProductDisplay: React.FC<ExchangeProductDisplayProps> = ({
  originalItem,
  exchangeToProductId,
  exchangeToVariantId,
  additionalCost = 0,
  mode = 'detailed',
  showPriceDifference = true
}) => {
  const [originalProduct, setOriginalProduct] = useState<ProductInfo | null>(null);
  const [originalVariant, setOriginalVariant] = useState<VariantInfo | null>(null);
  const [exchangeProduct, setExchangeProduct] = useState<ProductInfo | null>(null);
  const [exchangeVariant, setExchangeVariant] = useState<VariantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch original product info
        const originalProductInfo = await fetchProductInfo(originalItem.productId);
        if (!originalProductInfo) {
          setError('Không tìm thấy sản phẩm gốc');
          return;
        }
        setOriginalProduct(originalProductInfo);

        // Fetch original variant if exists
        if (originalItem.variantId) {
          const originalVariantInfo = await fetchVariantInfo(originalItem.variantId);
          if (originalVariantInfo) {
            setOriginalVariant(originalVariantInfo);
          }
        }

        // Fetch exchange product info
        const exchangeProductInfo = await fetchProductInfo(exchangeToProductId);
        if (!exchangeProductInfo) {
          setError('Không tìm thấy sản phẩm đổi');
          return;
        }
        setExchangeProduct(exchangeProductInfo);

        // Fetch exchange variant if exists
        if (exchangeToVariantId) {
          const exchangeVariantInfo = await fetchVariantInfo(exchangeToVariantId);
          if (exchangeVariantInfo) {
            setExchangeVariant(exchangeVariantInfo);
          }
        }
      } catch (err) {
        console.error('Error fetching exchange product data:', err);
        setError('Lỗi tải thông tin sản phẩm');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [originalItem.productId, originalItem.variantId, exchangeToProductId, exchangeToVariantId]);

  if (isLoading) {
    return (
      <div className='p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl'>
        <div className='flex items-center gap-2 mb-3'>
          <MdSwapHoriz className='text-blue-600 animate-spin' size={20} />
          <span className='text-sm font-medium text-blue-800'>Đang tải thông tin đổi hàng...</span>
        </div>
        <div className='flex items-center gap-4'>
          <div className='flex-1 animate-pulse'>
            <div className='flex items-center gap-3'>
              <div className='w-16 h-16 bg-gray-300 rounded-lg'></div>
              <div className='flex-1 space-y-2'>
                <div className='h-4 bg-gray-300 rounded w-3/4'></div>
                <div className='h-3 bg-gray-300 rounded w-1/2'></div>
              </div>
            </div>
          </div>
          <MdArrowForward className='text-gray-400' size={24} />
          <div className='flex-1 animate-pulse'>
            <div className='flex items-center gap-3'>
              <div className='w-16 h-16 bg-gray-300 rounded-lg'></div>
              <div className='flex-1 space-y-2'>
                <div className='h-4 bg-gray-300 rounded w-3/4'></div>
                <div className='h-3 bg-gray-300 rounded w-1/2'></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !originalProduct || !exchangeProduct) {
    return (
      <div className='p-4 bg-red-50 border border-red-200 rounded-xl'>
        <div className='flex items-center gap-2 mb-2'>
          <span className='text-red-500'>❌</span>
          <span className='text-sm font-medium text-red-800'>Lỗi hiển thị thông tin đổi hàng</span>
        </div>
        <p className='text-xs text-red-600'>{error}</p>
      </div>
    );
  }

  const originalDisplayName = getDisplayName(originalProduct, originalVariant || undefined);
  const originalDisplayPrice = getDisplayPrice(originalProduct, originalVariant || undefined);
  const originalDisplayImage = getDisplayImage(originalProduct, originalVariant || undefined);
  const originalVariantAttributes = formatVariantAttributes(originalVariant || undefined);

  const exchangeDisplayName = getDisplayName(exchangeProduct, exchangeVariant || undefined);
  const exchangeDisplayPrice = getDisplayPrice(exchangeProduct, exchangeVariant || undefined);
  const exchangeDisplayImage = getDisplayImage(exchangeProduct, exchangeVariant || undefined);
  const exchangeVariantAttributes = formatVariantAttributes(exchangeVariant || undefined);

  const priceDifference = exchangeDisplayPrice - originalDisplayPrice;

  if (mode === 'compact') {
    return (
      <div className='p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg'>
        <div className='flex items-center gap-2 mb-2'>
          <MdSwapHoriz className='text-blue-600' size={16} />
          <span className='text-sm font-medium text-blue-800'>Đổi hàng</span>
        </div>
        <div className='flex items-center gap-2 text-sm'>
          <span className='truncate max-w-[120px]'>{originalDisplayName}</span>
          <MdArrowForward className='text-gray-400 flex-shrink-0' size={16} />
          <span className='truncate max-w-[120px] font-medium'>{exchangeDisplayName}</span>
        </div>
        {showPriceDifference && priceDifference !== 0 && (
          <div className='mt-1 text-xs'>
            <span className={`font-medium ${priceDifference > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {priceDifference > 0 ? '+' : ''}
              {formatPrice(priceDifference)}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className='p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl'>
      {/* Exchange Flow */}
      <div className='flex items-center gap-4'>
        {/* Original Product */}
        <div className='flex-1'>
          <div className='text-xs text-gray-600 mb-2 font-medium'>Sản phẩm cũ</div>
          <div className='flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg'>
            <div className='relative w-16 h-16 flex-shrink-0'>
              <Image
                src={originalDisplayImage}
                alt={originalDisplayName}
                fill
                className='object-cover rounded-lg'
                sizes='64px'
              />
            </div>
            <div className='flex-1 min-w-0'>
              <h4 className='text-sm font-medium text-gray-900 truncate' title={originalDisplayName}>
                {truncateText(originalDisplayName)}
              </h4>
              {originalVariantAttributes && (
                <p className='text-xs text-gray-600 mt-1 truncate' title={originalVariantAttributes}>
                  {originalVariantAttributes}
                </p>
              )}
              <div className='flex items-center gap-2 mt-2 text-sm'>
                <span className='text-gray-600'>SL:</span>
                <span className='font-medium'>{originalItem.quantity}</span>
                <span className='text-gray-400'>×</span>
                <span className='font-medium text-gray-700'>{formatPrice(originalDisplayPrice)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className='flex flex-col items-center gap-1 px-2'>
          <MdArrowForward className='text-blue-600' size={24} />
          <span className='text-xs text-blue-600 font-medium'>Đổi sang</span>
        </div>

        {/* Exchange Product */}
        <div className='flex-1'>
          <div className='text-xs text-gray-600 mb-2 font-medium'>Sản phẩm mới</div>
          <div className='flex items-center gap-3 p-3 bg-white border border-green-200 rounded-lg'>
            <div className='relative w-16 h-16 flex-shrink-0'>
              <Image
                src={exchangeDisplayImage}
                alt={exchangeDisplayName}
                fill
                className='object-cover rounded-lg'
                sizes='64px'
              />
            </div>
            <div className='flex-1 min-w-0'>
              <h4 className='text-sm font-medium text-gray-900 truncate' title={exchangeDisplayName}>
                {truncateText(exchangeDisplayName)}
              </h4>
              {exchangeVariantAttributes && (
                <p className='text-xs text-gray-600 mt-1 truncate' title={exchangeVariantAttributes}>
                  {exchangeVariantAttributes}
                </p>
              )}
              <div className='flex items-center gap-2 mt-2 text-sm'>
                <span className='text-gray-600'>SL:</span>
                <span className='font-medium'>1</span>
                <span className='text-gray-400'>×</span>
                <span className='font-medium text-green-600'>{formatPrice(exchangeDisplayPrice)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Price Difference */}
      {showPriceDifference && (
        <div className='mt-4 p-3 bg-white border border-gray-200 rounded-lg'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-700'>Chênh lệch giá:</span>
            <div className='text-right'>
              <div
                className={`text-lg font-bold ${
                  priceDifference > 0 ? 'text-red-600' : priceDifference < 0 ? 'text-green-600' : 'text-gray-600'
                }`}
              >
                {priceDifference === 0
                  ? 'Không có'
                  : `${priceDifference > 0 ? '+' : ''}${formatPrice(priceDifference)}`}
              </div>
              <div className='text-xs text-gray-500'>
                {priceDifference > 0
                  ? 'Khách hàng cần bù thêm'
                  : priceDifference < 0
                  ? 'Khách hàng được hoàn'
                  : 'Giá bằng nhau'}
              </div>
            </div>
          </div>
          {additionalCost !== undefined && additionalCost !== priceDifference && (
            <div className='mt-2 pt-2 border-t border-gray-100'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-gray-600'>Phí thực tế:</span>
                <span
                  className={`font-medium ${
                    additionalCost > 0 ? 'text-red-600' : additionalCost < 0 ? 'text-green-600' : 'text-gray-600'
                  }`}
                >
                  {additionalCost === 0 ? 'Không có' : `${additionalCost > 0 ? '+' : ''}${formatPrice(additionalCost)}`}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExchangeProductDisplay;

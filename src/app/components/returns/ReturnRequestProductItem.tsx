'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatPrice } from '../../../../utils/formatPrice';
import { truncateText } from '../../../../utils/truncateText';
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

interface ReturnRequestItem {
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  reason?: string;
}

interface ReturnRequestProductItemProps {
  item: ReturnRequestItem;
  showReason?: boolean;
}

const ReturnRequestProductItem: React.FC<ReturnRequestProductItemProps> = ({ item, showReason = false }) => {
  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [variant, setVariant] = useState<VariantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch product info
        const productInfo = await fetchProductInfo(item.productId);
        if (!productInfo) {
          setError('Không tìm thấy sản phẩm');
          return;
        }
        setProduct(productInfo);

        // Fetch variant info if variantId exists
        if (item.variantId) {
          const variantInfo = await fetchVariantInfo(item.variantId);
          if (variantInfo) {
            setVariant(variantInfo);
          }
        }
      } catch (err) {
        console.error('Error fetching product data:', err);
        setError('Lỗi tải thông tin sản phẩm');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductData();
  }, [item.productId, item.variantId]);

  const getReasonText = (reason?: string) => {
    switch (reason) {
      case 'DEFECTIVE':
        return 'Sản phẩm bị lỗi';
      case 'WRONG_ITEM':
        return 'Giao sai sản phẩm';
      case 'CHANGE_MIND':
        return 'Đổi ý không muốn mua';
      default:
        return reason || 'Không rõ';
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg animate-pulse'>
        <div className='w-16 h-16 bg-gray-300 rounded-lg'></div>
        <div className='flex-1 space-y-2'>
          <div className='h-4 bg-gray-300 rounded w-3/4'></div>
          <div className='h-3 bg-gray-300 rounded w-1/2'></div>
          <div className='h-3 bg-gray-300 rounded w-1/4'></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className='flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg'>
        <div className='w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center'>
          <span className='text-red-500 text-xs'>❌</span>
        </div>
        <div className='flex-1'>
          <p className='text-sm text-red-600 font-medium'>{error || 'Không tìm thấy sản phẩm'}</p>
          <p className='text-xs text-red-500'>ID: {item.productId.substring(0, 8)}...</p>
        </div>
      </div>
    );
  }

  const displayName = getDisplayName(product, variant || undefined);
  const displayPrice = getDisplayPrice(product, variant || undefined);
  const displayImage = getDisplayImage(product, variant || undefined);
  const variantAttributes = formatVariantAttributes(variant || undefined);

  return (
    <div className='flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200'>
      {/* Product Image */}
      <div className='relative w-16 h-16 flex-shrink-0'>
        <Image src={displayImage} alt={displayName} fill className='object-cover rounded-lg' sizes='64px' />
      </div>

      {/* Product Info */}
      <div className='flex-1 min-w-0'>
        <h4 className='text-sm font-medium text-gray-900' title={displayName}>
          {truncateText(displayName, 50)}
        </h4>

        {variantAttributes && (
          <p className='text-xs text-gray-600 mt-1' title={variantAttributes}>
            {truncateText(variantAttributes, 60)}
          </p>
        )}

        <div className='flex items-center justify-between mt-2'>
          <div className='flex items-center gap-2 text-sm'>
            <span className='text-gray-600'>SL:</span>
            <span className='font-medium'>{item.quantity}</span>
            <span className='text-gray-400'>×</span>
            <span className='font-medium text-blue-600'>{formatPrice(displayPrice)}</span>
          </div>

          <div className='text-sm font-semibold text-gray-900'>{formatPrice(item.quantity * displayPrice)}</div>
        </div>

        {showReason && item.reason && (
          <div className='mt-2 px-2 py-1 bg-orange-100 border border-orange-200 rounded text-xs text-orange-700'>
            <span className='font-medium'>Lý do:</span> {getReasonText(item.reason)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnRequestProductItem;

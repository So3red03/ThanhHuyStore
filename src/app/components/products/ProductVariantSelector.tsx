'use client';

import { CartProductType, selectedImgType } from '@/app/(home)/product/[productId]/ProductDetails';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

interface ProductVariantSelectorProps {
  cartProduct: CartProductType;
  product: any;
  handleColorSelect: (value: selectedImgType) => void;
  performance?: boolean;
}

const ProductVariantSelector: React.FC<ProductVariantSelectorProps> = ({ 
  product, 
  cartProduct, 
  handleColorSelect, 
  performance 
}) => {
  const pathname = usePathname();
  const isProductDetail = pathname?.includes('/product/');

  // Get available options based on product type
  const getAvailableOptions = () => {
    if (product.productType === 'VARIANT' && product.variants && product.variants.length > 0) {
      // For variant products, create options from variants using new structure
      return product.variants.map((variant: any) => {
        // Use new thumbnail + galleryImages structure
        let imageUrls = ['/noavatar.png'];
        let previewImage = '/noavatar.png';

        // New structure: thumbnail + galleryImages
        if (variant.thumbnail || (variant.galleryImages && variant.galleryImages.length > 0)) {
          const allImages = [variant.thumbnail, ...(variant.galleryImages || [])].filter(Boolean);
          if (allImages.length > 0) {
            imageUrls = allImages;
            previewImage = variant.thumbnail || variant.galleryImages[0];
          }
        }
        // Fallback: check old images structure for backward compatibility
        else if (variant.images && variant.images.length > 0) {
          // Check if images is array of strings (old format) or array of objects (new format)
          if (typeof variant.images[0] === 'string') {
            // Old format: images is array of URLs
            imageUrls = variant.images;
            previewImage = variant.images[0];
          } else {
            // New format: images is array of objects - COLLECT ALL IMAGES FROM ALL OBJECTS
            const allImages: string[] = [];
            for (const imageObj of variant.images) {
              if (imageObj && imageObj.images && Array.isArray(imageObj.images) && imageObj.images.length > 0) {
                allImages.push(...imageObj.images);
              }
            }
            if (allImages.length > 0) {
              imageUrls = allImages;
              previewImage = allImages[0];
            }
          }
        }

        // Create display label from attributes
        const attributes = variant.attributes || {};
        const colorName = attributes.color || attributes['màu-sắc'] || '';
        const capacity = attributes.capacity || attributes['dung-lượng'] || '';

        let displayLabel = '';
        if (colorName && capacity) {
          displayLabel = `${colorName} ${capacity}`;
        } else if (colorName) {
          displayLabel = colorName;
        } else if (capacity) {
          displayLabel = capacity;
        } else {
          displayLabel = 'Tùy chọn';
        }

        return {
          images: imageUrls,
          selectedImg: previewImage,
          displayLabel,
          previewImage,
          variant,
          variantId: variant.id,
          attributes: variant.attributes
        };
      });
    } else {
      // For simple products, use new thumbnail + galleryImages structure
      if (product.thumbnail || (product.galleryImages && product.galleryImages.length > 0)) {
        const allImages = [product.thumbnail, ...(product.galleryImages || [])].filter(Boolean);
        return allImages.map((imageUrl: string, index: number) => ({
          images: [imageUrl],
          selectedImg: imageUrl,
          displayLabel: `Tùy chọn ${index + 1}`,
          previewImage: imageUrl,
          variant: null
        }));
      }
      // Fallback: use old images array structure for backward compatibility
      return (product.images || []).map((image: any, index: number) => ({
        images: image.images || [],
        selectedImg: image.images?.[0] || '/noavatar.png',
        displayLabel: `Tùy chọn ${index + 1}`,
        previewImage: image.images?.[0] || '/noavatar.png',
        variant: null
      }));
    }
  };

  const availableOptions = getAvailableOptions();

  // Group options by attribute type for better display
  const groupedOptions = () => {
    if (product.productType === 'VARIANT') {
      // Group by capacity first, then by color
      const capacityGroups: { [key: string]: any[] } = {};
      const colorGroups: { [key: string]: any[] } = {};

      availableOptions.forEach((option: any) => {
        const attributes = option.variant?.attributes || {};
        const capacity = attributes.capacity || attributes['dung-lượng'];
        const color = attributes.color || attributes['màu-sắc'];

        if (capacity) {
          if (!capacityGroups[capacity]) capacityGroups[capacity] = [];
          capacityGroups[capacity].push(option);
        }

        if (color) {
          if (!colorGroups[color]) colorGroups[color] = [];
          colorGroups[color].push(option);
        }
      });

      return { capacityGroups, colorGroups };
    }
    return { capacityGroups: {}, colorGroups: {} };
  };

  const { capacityGroups, colorGroups } = groupedOptions();

  if (performance) {
    // Simplified version for ProductCard - only show for variant products
    if (product.productType === 'VARIANT' && availableOptions.length > 1) {
      return (
        <div className='flex gap-1 justify-center'>
          {availableOptions.slice(0, 3).map((option: any, index: number) => (
            <div
              key={option.color + index}
              onClick={e => {
                e.stopPropagation();
                handleColorSelect(option);
              }}
              className={`w-4 h-4 rounded border cursor-pointer ${
                cartProduct.selectedImg === (option.selectedImg || option.previewImage)
                  ? 'border-red-500 border-2'
                  : 'border-gray-300'
              }`}
            >
              <img
                src={option.previewImage}
                alt={option.displayLabel}
                className='w-full h-full object-cover rounded'
                onError={e => {
                  e.currentTarget.src = '/noavatar.png';
                }}
              />
            </div>
          ))}
        </div>
      );
    }
    // For simple products, don't show any options
    return null;
  }

  return (
    <div className='flex flex-col gap-6 select-none'>
      {/* Capacity Options - New Design */}
      {Object.keys(capacityGroups).length > 0 && (
        <div>
          <span className='font-semibold block mb-3 text-gray-800'>Dung lượng</span>
          <div className='flex gap-3 flex-wrap'>
            {Object.keys(capacityGroups).map(capacity => {
              const option = capacityGroups[capacity][0]; // Take first option for this capacity
              const isSelected = cartProduct.selectedImg === (option.selectedImg || option.previewImage);

              return (
                <button
                  key={capacity}
                  onClick={e => {
                    e.stopPropagation();
                    handleColorSelect(option);
                  }}
                  className={`relative px-6 py-3 border-2 rounded-lg text-sm font-medium transition-all duration-200 min-w-[80px] ${
                    isSelected
                      ? 'border-red-500 bg-red-50 text-red-600 shadow-md'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:shadow-sm'
                  }`}
                >
                  {capacity}
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className='absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center'>
                      <svg className='w-2.5 h-2.5 text-white' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color Options - New Design */}
      {Object.keys(colorGroups).length > 0 && (
        <div>
          <span className='font-semibold block mb-3 text-gray-800'>Màu sắc</span>
          <div className='flex gap-3 flex-wrap'>
            {Object.keys(colorGroups).map(color => {
              const option = colorGroups[color][0]; // Take first option for this color
              const isSelected = cartProduct.selectedImg === (option.selectedImg || option.previewImage);

              return (
                <button
                  key={color}
                  onClick={e => {
                    e.stopPropagation();
                    handleColorSelect(option);
                  }}
                  className={`relative flex items-center gap-3 px-4 py-3 border-2 rounded-lg text-sm font-medium transition-all duration-200 min-w-[120px] ${
                    isSelected
                      ? 'border-red-500 bg-red-50 text-red-600 shadow-md'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:shadow-sm'
                  }`}
                >
                  <div className='relative w-8 h-8 rounded-md overflow-hidden border border-gray-200'>
                    <Image
                      src={option.previewImage}
                      alt={color}
                      fill
                      className='object-cover'
                      sizes='32px'
                      onError={e => {
                        e.currentTarget.src = '/noavatar.png';
                      }}
                    />
                  </div>
                  <span className='flex-1 text-left'>{color}</span>
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className='absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center'>
                      <svg className='w-2.5 h-2.5 text-white' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Fallback for simple products or no grouped options */}
      {Object.keys(capacityGroups).length === 0 &&
        Object.keys(colorGroups).length === 0 &&
        availableOptions.length > 0 && (
          <div>
            <span className='font-semibold block mb-3 text-gray-800'>Tùy chọn</span>
            <div className='flex gap-3 flex-wrap'>
              {availableOptions.map((option: any, index: number) => {
                const isSelected = cartProduct.selectedImg === (option.selectedImg || option.previewImage);

                return (
                  <button
                    key={option.color + index}
                    onClick={e => {
                      e.stopPropagation();
                      handleColorSelect(option);
                    }}
                    className={`relative flex items-center gap-3 px-4 py-3 border-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? 'border-red-500 bg-red-50 text-red-600 shadow-md'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:shadow-sm'
                    }`}
                  >
                    <div className='relative w-8 h-8 rounded-md overflow-hidden border border-gray-200'>
                      <Image
                        src={option.previewImage}
                        alt={option.displayLabel}
                        fill
                        className='object-cover'
                        sizes='32px'
                        onError={e => {
                          e.currentTarget.src = '/noavatar.png';
                        }}
                      />
                    </div>
                    <span className='flex-1 text-left'>{option.displayLabel}</span>
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className='absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center'>
                        <svg className='w-2.5 h-2.5 text-white' fill='currentColor' viewBox='0 0 20 20'>
                          <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      {availableOptions.length === 0 && (
        <div className='text-gray-500 text-sm py-4 text-center bg-gray-50 rounded-lg'>
          Không có tùy chọn
        </div>
      )}
    </div>
  );
};

export default ProductVariantSelector;

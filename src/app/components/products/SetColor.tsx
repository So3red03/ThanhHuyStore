'use client';

import { CartProductType, selectedImgType } from '@/app/(home)/product/[productId]/ProductDetails';
import { usePathname } from 'next/navigation';

interface SetColorProps {
  cartProduct: CartProductType;
  product: any;
  handleColorSelect: (value: selectedImgType) => void;
  performance?: boolean;
}

const SetColor: React.FC<SetColorProps> = ({ product, cartProduct, handleColorSelect, performance }) => {
  const pathname = usePathname();
  const isProductDetail = pathname?.includes('/product/');

  // Get available options based on product type
  const getAvailableOptions = () => {
    if (product.productType === 'VARIANT' && product.variants && product.variants.length > 0) {
      // For variant products, create options from variants
      return product.variants.map((variant: any) => {
        // Extract images from variant.images structure: [{color, colorCode, images: [urls]}, ...]
        let imageUrls = ['/noavatar.png'];
        let previewImage = '/noavatar.png';

        if (variant.images && variant.images.length > 0) {
          console.log('🔍 SetColor variant.images:', variant.images);

          // Check if images is array of strings (old format) or array of objects (new format)
          if (typeof variant.images[0] === 'string') {
            // Old format: images is array of URLs
            imageUrls = variant.images;
            previewImage = variant.images[0];
            console.log('📸 SetColor using old format');
          } else {
            // New format: images is array of objects - MERGE ALL IMAGES
            console.log('📸 SetColor using new format - merging images');
            const allImages: string[] = [];
            variant.images.forEach((imageObj: any) => {
              if (imageObj && imageObj.images && Array.isArray(imageObj.images)) {
                allImages.push(...imageObj.images);
              }
            });

            if (allImages.length > 0) {
              imageUrls = allImages;
              previewImage = allImages[0];
              console.log('✅ SetColor merged images:', allImages);
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
          color: colorName || 'default',
          colorCode: '#000000', // Not used in new design
          images: imageUrls,
          displayLabel,
          previewImage,
          variant
        };
      });
    } else {
      // For simple products, use existing images array
      return (product.images || []).map((image: any) => ({
        ...image,
        displayLabel: image.color || 'Tùy chọn',
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
    // Simplified version for ProductCard
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
              cartProduct.selectedImg.color === option.color ? 'border-red-500 border-2' : 'border-gray-300'
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

  return (
    <div className='flex flex-col gap-4 select-none'>
      {/* Capacity Options */}
      {Object.keys(capacityGroups).length > 0 && (
        <div>
          <span className='font-semibold block mb-2'>Dung lượng:</span>
          <div className='flex gap-2 flex-wrap'>
            {Object.keys(capacityGroups).map(capacity => {
              const option = capacityGroups[capacity][0]; // Take first option for this capacity
              const isSelected =
                cartProduct.selectedImg.variant?.attributes?.['dung-lượng'] === capacity ||
                cartProduct.selectedImg.variant?.attributes?.capacity === capacity;

              return (
                <button
                  key={capacity}
                  onClick={e => {
                    e.stopPropagation();
                    handleColorSelect(option);
                  }}
                  className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                    isSelected
                      ? 'border-red-500 bg-red-50 text-red-600'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {capacity}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color Options */}
      {Object.keys(colorGroups).length > 0 && (
        <div>
          <span className='font-semibold block mb-2'>Màu sắc:</span>
          <div className='flex gap-2 flex-wrap'>
            {Object.keys(colorGroups).map(color => {
              const option = colorGroups[color][0]; // Take first option for this color
              const isSelected = cartProduct.selectedImg.color === color;

              return (
                <button
                  key={color}
                  onClick={e => {
                    e.stopPropagation();
                    handleColorSelect(option);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                    isSelected
                      ? 'border-red-500 bg-red-50 text-red-600'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={option.previewImage}
                    alt={color}
                    className='w-6 h-6 object-cover rounded border'
                    onError={e => {
                      e.currentTarget.src = '/noavatar.png';
                    }}
                  />
                  {color}
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
            <span className='font-semibold block mb-2'>Tùy chọn:</span>
            <div className='flex gap-2 flex-wrap'>
              {availableOptions.map((option: any, index: number) => {
                const isSelected = cartProduct.selectedImg.color === option.color;

                return (
                  <button
                    key={option.color + index}
                    onClick={e => {
                      e.stopPropagation();
                      handleColorSelect(option);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                      isSelected
                        ? 'border-red-500 bg-red-50 text-red-600'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={option.previewImage}
                      alt={option.displayLabel}
                      className='w-6 h-6 object-cover rounded border'
                      onError={e => {
                        e.currentTarget.src = '/noavatar.png';
                      }}
                    />
                    {option.displayLabel}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      {availableOptions.length === 0 && <div className='text-gray-500 text-sm'>Không có tùy chọn</div>}
    </div>
  );
};

export default SetColor;

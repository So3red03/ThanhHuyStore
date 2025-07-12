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

  // Get current selected variant attributes
  const getCurrentSelectedAttributes = () => {
    if (product.productType === 'VARIANT' && cartProduct.selectedImg) {
      const currentVariant = availableOptions.find(
        (option: any) =>
          option.selectedImg === cartProduct.selectedImg || option.previewImage === cartProduct.selectedImg
      );
      return currentVariant?.variant?.attributes || {};
    }
    return {};
  };

  // Group options by attribute type for better display
  const groupedOptions = () => {
    if (product.productType === 'VARIANT') {
      const currentAttributes = getCurrentSelectedAttributes();
      const selectedCapacity = currentAttributes.capacity || currentAttributes['dung-lượng'];
      const selectedColor = currentAttributes.color || currentAttributes['màu-sắc'];

      // Get unique capacities and colors
      const capacities = new Set<string>();
      const colors = new Set<string>();

      availableOptions.forEach((option: any) => {
        const attributes = option.variant?.attributes || {};
        const capacity = attributes.capacity || attributes['dung-lượng'];
        const color = attributes.color || attributes['màu-sắc'];

        if (capacity) capacities.add(capacity);
        if (color) colors.add(color);
      });

      // Create capacity options
      const capacityOptions = Array.from(capacities).map(capacity => {
        // Find variant with this capacity and current selected color (if any)
        let targetVariant = availableOptions.find((option: any) => {
          const attrs = option.variant?.attributes || {};
          const varCapacity = attrs.capacity || attrs['dung-lượng'];
          const varColor = attrs.color || attrs['màu-sắc'];
          return varCapacity === capacity && (!selectedColor || varColor === selectedColor);
        });

        // If no exact match, find any variant with this capacity
        if (!targetVariant) {
          targetVariant = availableOptions.find((option: any) => {
            const attrs = option.variant?.attributes || {};
            const varCapacity = attrs.capacity || attrs['dung-lượng'];
            return varCapacity === capacity;
          });
        }

        return {
          value: capacity,
          option: targetVariant,
          isSelected: capacity === selectedCapacity
        };
      });

      // Create color options
      const colorOptions = Array.from(colors).map(color => {
        // Find variant with this color and current selected capacity (if any)
        let targetVariant = availableOptions.find((option: any) => {
          const attrs = option.variant?.attributes || {};
          const varCapacity = attrs.capacity || attrs['dung-lượng'];
          const varColor = attrs.color || attrs['màu-sắc'];
          return varColor === color && (!selectedCapacity || varCapacity === selectedCapacity);
        });

        // If no exact match, find any variant with this color
        if (!targetVariant) {
          targetVariant = availableOptions.find((option: any) => {
            const attrs = option.variant?.attributes || {};
            const varColor = attrs.color || attrs['màu-sắc'];
            return varColor === color;
          });
        }

        return {
          value: color,
          option: targetVariant,
          isSelected: color === selectedColor
        };
      });

      return { capacityOptions, colorOptions };
    }
    return { capacityOptions: [], colorOptions: [] };
  };

  const { capacityOptions, colorOptions } = groupedOptions();

  if (performance) {
    // Simplified version for ProductCard - only show for variant products
    if (product.productType === 'VARIANT' && availableOptions.length > 1) {
      // Limit to max 4 options to prevent layout breaking
      const maxOptions = Math.min(availableOptions.length, 4);
      const displayOptions = availableOptions.slice(0, maxOptions);

      return (
        <div className='flex gap-1.5 justify-center items-center flex-wrap max-w-full'>
          {displayOptions.map((option: any, index: number) => {
            const isSelected = cartProduct.selectedImg === (option.selectedImg || option.previewImage);

            return (
              <div
                key={option.color + index}
                onClick={e => {
                  e.stopPropagation();
                  handleColorSelect(option);
                }}
                className={`relative w-6 h-6 rounded-md border-2 cursor-pointer transition-all duration-200 overflow-hidden ${
                  isSelected
                    ? 'border-blue-500 ring-1 ring-blue-200 shadow-sm'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <img
                  src={option.previewImage || option.selectedImg || '/noavatar.png'}
                  alt={option.displayLabel}
                  className='w-full h-full object-cover rounded-sm'
                  onError={e => {
                    e.currentTarget.src = '/noavatar.png';
                  }}
                />
                {/* Blue selection indicator instead of red circle */}
                {isSelected && (
                  <div className='absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center'>
                    <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Show "more" indicator if there are more options */}
          {availableOptions.length > maxOptions && (
            <div className='w-6 h-6 rounded-md border-2 border-gray-300 bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium'>
              +{availableOptions.length - maxOptions}
            </div>
          )}
        </div>
      );
    }
    // For simple products, don't show any options
    return null;
  }

  return (
    <div className='flex flex-col gap-4 select-none'>
      {/* Capacity Options - Compact Design */}
      {capacityOptions.length > 0 && (
        <div>
          <span className='font-medium block mb-2 text-gray-700 text-sm'>Dung lượng</span>
          <div className='flex gap-2 flex-wrap'>
            {capacityOptions.map(({ value: capacity, option, isSelected }) => {
              return (
                <button
                  key={capacity}
                  onClick={e => {
                    e.stopPropagation();
                    if (option) handleColorSelect(option);
                  }}
                  className={`relative px-4 py-2 border rounded-md text-sm font-medium transition-all duration-200 min-w-[60px] ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {capacity.toUpperCase()}
                  {/* Compact selection indicator */}
                  {isSelected && (
                    <div className='absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center'>
                      <svg className='w-2 h-2 text-white' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color Options - Compact Design */}
      {colorOptions.length > 0 && (
        <div>
          <span className='font-medium block mb-2 text-gray-700 text-sm'>Màu sắc</span>
          <div className='flex gap-2 flex-wrap'>
            {colorOptions.map(({ value: color, option, isSelected }) => {
              return (
                <button
                  key={color}
                  onClick={e => {
                    e.stopPropagation();
                    if (option) handleColorSelect(option);
                  }}
                  className={`relative flex items-center gap-2 px-3 py-2 border rounded-md text-sm font-medium transition-all duration-200 min-w-[100px] ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className='relative w-6 h-6 rounded overflow-hidden border border-gray-200'>
                    <Image
                      src={option?.previewImage || option?.selectedImg || '/noavatar.png'}
                      alt={color}
                      fill
                      className='object-cover'
                      sizes='24px'
                      onError={e => {
                        e.currentTarget.src = '/noavatar.png';
                      }}
                    />
                  </div>
                  <span className='flex-1 text-left text-sm text-slate-700'>
                    {color.charAt(0).toUpperCase() + color.slice(1)}
                  </span>
                  {/* Compact selection indicator */}
                  {isSelected && (
                    <div className='absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center'>
                      <svg className='w-2 h-2 text-white' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
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
      {capacityOptions.length === 0 && colorOptions.length === 0 && availableOptions.length > 0 && (
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
                      ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-md'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:shadow-sm'
                  }`}
                >
                  <div className='relative w-10 h-10 rounded-md overflow-hidden border border-gray-200'>
                    <Image
                      src={option.previewImage || option.selectedImg || '/noavatar.png'}
                      alt={option.displayLabel}
                      fill
                      className='object-cover'
                      sizes='40px'
                      onError={e => {
                        e.currentTarget.src = '/noavatar.png';
                      }}
                    />
                  </div>
                  <span className='flex-1 text-left'>{option.displayLabel}</span>
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className='absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center'>
                      <svg className='w-2.5 h-2.5 text-white' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
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
        <div className='text-gray-500 text-sm py-4 text-center bg-gray-50 rounded-lg'>Không có tùy chọn</div>
      )}
    </div>
  );
};

export default ProductVariantSelector;

'use client';

import { CartProductType } from '@/app/(home)/product/[productId]/ProductDetails';
import Image from 'next/image';
import { useState } from 'react';

interface ProductImageProps {
  cartProduct: CartProductType;
  availableImages?: string[]; // All available images for gallery
  onImageSelect?: (imageUrl: string) => void; // Callback when user selects an image
}

const ProductImage: React.FC<ProductImageProps> = ({ cartProduct, availableImages = [], onImageSelect }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Get all images (use availableImages if provided, otherwise fallback to selectedImg)
  const allImages = availableImages.length > 0 ? availableImages : [cartProduct.selectedImg || '/noavatar.png'];

  // Get the current image URL
  const imageUrl = allImages[selectedImageIndex] || '/noavatar.png';

  // Handle image load
  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // Handle thumbnail click
  const handleThumbnailClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsLoading(true);
    if (onImageSelect) {
      onImageSelect(allImages[index]);
    }
  };

  const handleMouseHover = (e: any) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setPosition({ x, y });

    const cursorX = e.pageX - left;
    const cursorY = e.pageY - top;
    setCursorPosition({ x: cursorX, y: cursorY });
  };

  return (
    <div className='flex gap-4 h-full max-h-[500px] min-h-[300px]'>
      {/* Thumbnail Gallery - Left Side */}
      {allImages.length > 1 && (
        <div className='flex flex-col gap-2 w-20 md:w-24'>
          <div className='flex flex-col gap-2 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'>
            {allImages.map((image, index) => (
              <div
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={`relative aspect-square cursor-pointer rounded-lg border-2 transition-all duration-200 overflow-hidden ${
                  selectedImageIndex === index
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Image
                  src={image}
                  alt={`${cartProduct.name} - Ảnh ${index + 1}`}
                  fill
                  className='object-cover'
                  sizes='(max-width: 768px) 80px, 96px'
                  onError={e => {
                    e.currentTarget.src = '/noavatar.png';
                  }}
                />
                {/* Selection indicator */}
                {selectedImageIndex === index && (
                  <div className='absolute inset-0 bg-blue-500 bg-opacity-10 flex items-center justify-center'></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Image Display - Right Side */}
      <div className='flex-1 relative aspect-square'>
        <div
          className='relative w-full h-full cursor-zoom-in overflow-hidden rounded-lg border border-gray-200 shadow-sm'
          onMouseEnter={() => setShowMagnifier(true)}
          onMouseLeave={() => setShowMagnifier(false)}
          onMouseMove={handleMouseHover}
        >
          {/* Loading Skeleton */}
          {isLoading && (
            <div className='absolute inset-0 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center'>
              <div className='text-gray-400 text-sm'>Đang tải...</div>
            </div>
          )}

          {/* Main Product Image */}
          <Image
            src={imageUrl}
            alt={`${cartProduct.name} - Ảnh sản phẩm`}
            fill
            className={`object-cover transition-all duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={handleImageLoad}
            sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            priority
            onError={e => {
              e.currentTarget.src = '/noavatar.png';
            }}
          />

          {/* Magnifier */}
          {showMagnifier && !isLoading && (
            <div
              className='absolute pointer-events-none border-2 border-white shadow-xl'
              style={{
                left: `${cursorPosition.x - 75}px`,
                top: `${cursorPosition.y - 75}px`,
                width: '150px',
                height: '150px',
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: '400% 400%',
                backgroundPosition: `${position.x}% ${position.y}%`,
                borderRadius: '50%',
                zIndex: 10
              }}
            />
          )}
        </div>

        {/* Image Counter */}
        {allImages.length > 1 && (
          <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium'>
            {selectedImageIndex + 1} / {allImages.length}
          </div>
        )}

        {/* Navigation Arrows for mobile */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={() =>
                handleThumbnailClick(selectedImageIndex > 0 ? selectedImageIndex - 1 : allImages.length - 1)
              }
              className='absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200 md:hidden'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
              </svg>
            </button>
            <button
              onClick={() =>
                handleThumbnailClick(selectedImageIndex < allImages.length - 1 ? selectedImageIndex + 1 : 0)
              }
              className='absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200 md:hidden'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductImage;

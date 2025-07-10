'use client';

import { CartProductType } from '@/app/(home)/product/[productId]/ProductDetails';
import Image from 'next/image';
import { useState } from 'react';

interface ProductImageProps {
  cartProduct: CartProductType;
}

const ProductImage: React.FC<ProductImageProps> = ({ cartProduct }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get the image URL
  const imageUrl = cartProduct.selectedImg || '/noavatar.png';

  // Handle image load
  const handleImageLoad = () => {
    setIsLoading(false);
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
    <div className='grid grid-cols-6 gap-2 h-full max-h-[500px] min-h-[300px]'>
      {/* Main Image Display */}
      <div className='col-span-6 relative aspect-square'>
        <div
          className='relative w-full h-full cursor-zoom-in overflow-hidden rounded-lg border border-gray-200'
          onMouseEnter={() => setShowMagnifier(true)}
          onMouseLeave={() => setShowMagnifier(false)}
          onMouseMove={handleMouseHover}
        >
          {/* Loading Skeleton */}
          {isLoading && (
            <div className='absolute inset-0 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center'>
              <div className='text-gray-400'>Loading...</div>
            </div>
          )}

          {/* Main Product Image */}
          <Image
            src={imageUrl}
            alt={`${cartProduct.name} - Ảnh sản phẩm`}
            fill
            className={`object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={handleImageLoad}
            sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            priority
          />

          {/* Magnifier */}
          {showMagnifier && (
            <div
              className='absolute pointer-events-none border-2 border-white shadow-lg'
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

        {/* Image Counter - Only show if there would be multiple images */}
        <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm'>
          1 / 1
        </div>
      </div>
    </div>
  );
};

export default ProductImage;

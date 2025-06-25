'use client';

import { CartProductType, selectedImgType } from '@/app/(home)/product/[productId]/ProductDetails';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface ProductImageProps {
  cartProduct: CartProductType;
}

const ProductImage: React.FC<ProductImageProps> = ({ cartProduct }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [largeImage, setLargeImage] = useState(cartProduct.selectedImg.images[0]);
  const [selectedImage, setSelectedImage] = useState(cartProduct.selectedImg.images[0]);

  // Cập nhật largeImage khi cartProduct khi  thay đổi
  useEffect(() => {
    setLargeImage(cartProduct.selectedImg.images[0]);
    // Mặc định cập nhật có viền ở image đầu tiên product khi thay đổi color
    setSelectedImage(cartProduct.selectedImg.images[0]);
  }, [cartProduct]);

  const handleMouseHover = (e: any) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setPosition({ x, y });

    setCursorPosition({ x: e.pageX - left, y: e.pageY - top });
  };

  const handleImageClick = (Image: string) => {
    setLargeImage(Image);
    setSelectedImage(Image); // Cập nhật ảnh đang được chọn
  };

  return (
    <div className='grid grid-cols-6 gap-2 max-h-[350px] min-h-[350px] sm:min-h-[400px]'>
      {/* Hiển thị các ảnh nhỏ tương ứng với màu được chọn */}
      <div className='flex items-center justify-center flex-col gap-4 cursor-pointer border h-fit max-h-[400px] min-h-[300px] sm:min-h-[400px] overflow-y-auto no-scrollbar'>
        {cartProduct.selectedImg.images.map((currentImg: string) => {
          return (
            <div
              key={currentImg}
              className={`relative w-[85%] aspect-square flex items-center justify-center rounded ${
                currentImg === selectedImage ? 'border-[1.5px] border-teal-300' : 'border-none'
              }`}
              onClick={() => handleImageClick(currentImg)}
            >
              <Image
                src={currentImg}
                alt={cartProduct.selectedImg.color}
                fill
                sizes='100vw'
                className='object-contain'
                loading='lazy'
              />
            </div>
          );
        })}
      </div>

      {/* Hiển thị ảnh lớn của màu theo ảnh nhỏ được chọn */}
      <div
        className='col-span-5 relative aspect-square flex items-start justify-center'
        onMouseEnter={() => setShowMagnifier(true)}
        onMouseLeave={() => setShowMagnifier(false)}
        onMouseMove={handleMouseHover}
      >
        <Image
          width={270}
          height={50}
          className='h-auto w-[430px] object-contain'
          src={largeImage}
          alt={cartProduct.name}
          priority
        />
        {showMagnifier && (
          <div
            style={{
              position: 'absolute',
              left: `${cursorPosition.x - 75}px`,
              top: `${cursorPosition.y - 75}px`,
              pointerEvents: 'none'
            }}
          >
            <div
              className='w-[150px] h-[150px] border border-black'
              style={{
                backgroundImage: `url(${largeImage})`,
                backgroundPosition: `${position.x}% ${position.y}%`,
                backgroundSize: '450%'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductImage;

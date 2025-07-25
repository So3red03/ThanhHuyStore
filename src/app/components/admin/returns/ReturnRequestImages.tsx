'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MdImage, MdClose, MdZoomIn } from 'react-icons/md';
import AdminModal from '../AdminModal';

interface ReturnRequestImagesProps {
  images: string[];
  type: 'RETURN' | 'EXCHANGE';
}

const ReturnRequestImages: React.FC<ReturnRequestImagesProps> = ({ images, type }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className='p-4 border-2 border-dashed border-gray-200 rounded-lg text-center'>
        <MdImage className='mx-auto text-gray-400 mb-2' size={32} />
        <p className='text-sm text-gray-500'>Không có hình ảnh</p>
      </div>
    );
  }

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsModalOpen(true);
  };

  const handleNextImage = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex + 1) % images.length);
    }
  };

  const handlePrevImage = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex(selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1);
    }
  };

  return (
    <>
      <div>
        <div className='mb-3'>
          <strong>
            Hình ảnh {type === 'EXCHANGE' ? 'sản phẩm hiện tại' : 'chứng minh'} ({images.length}):
          </strong>
        </div>

        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
          {images.map((image: string, index: number) => (
            <div key={index} className='relative group'>
              <div className='aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md'>
                <Image
                  src={image}
                  alt={`${type === 'EXCHANGE' ? 'Sản phẩm hiện tại' : 'Hình chứng minh'} ${index + 1}`}
                  width={150}
                  height={150}
                  className='w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer'
                  onClick={() => handleImageClick(index)}
                />
              </div>

              {/* Hover overlay */}
              <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center'>
                <div className='opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-black bg-opacity-70 px-3 py-1 rounded-full'>
                  <MdZoomIn className='text-white' size={16} />
                  <span className='text-white text-xs font-medium'>Xem lớn</span>
                </div>
              </div>

              {/* Image number badge */}
              <div className='absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full'>
                {index + 1}
              </div>
            </div>
          ))}
        </div>

        <p className='text-xs text-gray-500 mt-3 flex items-center gap-1'>
          <MdImage size={12} />
          {type === 'EXCHANGE'
            ? 'Ảnh sản phẩm hiện tại để xác nhận tình trạng có thể đổi được'
            : 'Ảnh chứng minh vấn đề với sản phẩm'}
        </p>
      </div>

      {/* Image Modal */}
      {isModalOpen && selectedImageIndex !== null && (
        <AdminModal isOpen={isModalOpen} handleClose={() => setIsModalOpen(false)}>
          <div className='max-w-4xl mx-auto p-4'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold'>
                Hình ảnh {selectedImageIndex + 1} / {images.length}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className='p-2 hover:bg-gray-100 rounded-full transition-colors'
              >
                <MdClose size={24} />
              </button>
            </div>

            <div className='relative'>
              <div className='aspect-video max-h-[70vh] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center'>
                <Image
                  src={images[selectedImageIndex]}
                  alt={`Hình ảnh ${selectedImageIndex + 1}`}
                  width={800}
                  height={600}
                  className='max-w-full max-h-full object-contain'
                />
              </div>

              {/* Navigation buttons */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className='absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all'
                  >
                    ←
                  </button>
                  <button
                    onClick={handleNextImage}
                    className='absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all'
                  >
                    →
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className='flex justify-center gap-2 mt-4 overflow-x-auto pb-2'>
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === selectedImageIndex
                        ? 'border-blue-500 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      width={64}
                      height={64}
                      className='w-full h-full object-cover'
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </AdminModal>
      )}
    </>
  );
};

export default ReturnRequestImages;

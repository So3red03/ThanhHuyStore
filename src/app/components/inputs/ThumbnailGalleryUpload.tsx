'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { MdClose, MdImage, MdPhotoLibrary, MdDragIndicator } from 'react-icons/md';
import { HiOutlinePhotograph, HiOutlineCollection } from 'react-icons/hi';

interface ThumbnailGalleryUploadProps {
  thumbnail: File | null;
  galleryImages: File[];
  onThumbnailChange: (file: File | null) => void;
  onGalleryChange: (files: File[]) => void;
  disabled?: boolean;
}

const ThumbnailGalleryUpload: React.FC<ThumbnailGalleryUploadProps> = ({
  thumbnail,
  galleryImages,
  onThumbnailChange,
  onGalleryChange,
  disabled = false
}) => {
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File validation
  const validateFile = (file: File): string | null => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return `File ${file.name}: Định dạng không được hỗ trợ. Chỉ chấp nhận JPG, PNG, GIF, WEBP.`;
    }
    if (file.size > maxSize) {
      return `File ${file.name}: Kích thước quá lớn. Tối đa 5MB.`;
    }
    return null;
  };

  // Thumbnail dropzone
  const onThumbnailDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setErrors([]);

      if (rejectedFiles.length > 0) {
        const newErrors = rejectedFiles.map(
          ({ file, errors }) => `${file.name}: ${errors.map((e: any) => e.message).join(', ')}`
        );
        setErrors(newErrors);
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const error = validateFile(file);

        if (error) {
          setErrors([error]);
          return;
        }

        setIsUploading(true);
        onThumbnailChange(file);

        // Create preview with animation
        const reader = new FileReader();
        reader.onload = () => {
          setThumbnailPreview(reader.result as string);
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
      }
    },
    [onThumbnailChange]
  );

  // Gallery dropzone
  const onGalleryDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setErrors([]);

      if (rejectedFiles.length > 0) {
        const newErrors = rejectedFiles.map(
          ({ file, errors }) => `${file.name}: ${errors.map((e: any) => e.message).join(', ')}`
        );
        setErrors(newErrors);
        return;
      }

      // Validate all files
      const validFiles: File[] = [];
      const fileErrors: string[] = [];

      acceptedFiles.forEach(file => {
        const error = validateFile(file);
        if (error) {
          fileErrors.push(error);
        } else {
          validFiles.push(file);
        }
      });

      if (fileErrors.length > 0) {
        setErrors(fileErrors);
        return;
      }

      const newFiles = [...galleryImages, ...validFiles];
      onGalleryChange(newFiles);

      // Create previews for new files with progress simulation
      validFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = () => {
          setGalleryPreviews(prev => [...prev, reader.result as string]);
          // Simulate upload progress
          setUploadProgress(((index + 1) / validFiles.length) * 100);
        };
        reader.readAsDataURL(file);
      });
    },
    [galleryImages, onGalleryChange]
  );

  const {
    getRootProps: getThumbnailRootProps,
    getInputProps: getThumbnailInputProps,
    isDragActive: isThumbnailDragActive
  } = useDropzone({
    onDrop: onThumbnailDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled
  });

  const {
    getRootProps: getGalleryRootProps,
    getInputProps: getGalleryInputProps,
    isDragActive: isGalleryDragActive
  } = useDropzone({
    onDrop: onGalleryDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
    disabled
  });

  const removeThumbnail = () => {
    onThumbnailChange(null);
    setThumbnailPreview(null);
  };

  const removeGalleryImage = (index: number) => {
    const newFiles = galleryImages.filter((_, i) => i !== index);
    const newPreviews = galleryPreviews.filter((_, i) => i !== index);
    onGalleryChange(newFiles);
    setGalleryPreviews(newPreviews);
  };

  // Drag and drop reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newFiles = [...galleryImages];
    const newPreviews = [...galleryPreviews];

    // Swap items
    const draggedFile = newFiles[draggedIndex];
    const draggedPreview = newPreviews[draggedIndex];

    newFiles.splice(draggedIndex, 1);
    newPreviews.splice(draggedIndex, 1);

    newFiles.splice(dropIndex, 0, draggedFile);
    newPreviews.splice(dropIndex, 0, draggedPreview);

    onGalleryChange(newFiles);
    setGalleryPreviews(newPreviews);
    setDraggedIndex(null);
  };

  // Clear errors after 5 seconds
  useEffect(() => {
    if (errors.length > 0) {
      const timer = setTimeout(() => setErrors([]), 5000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  return (
    <div className='space-y-8'>
      {/* Error Messages */}
      {errors.length > 0 && (
        <div className='bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg animate-in slide-in-from-left duration-300'>
          <div className='flex items-start'>
            <div className='flex-shrink-0'>
              <MdClose className='h-5 w-5 text-red-400' />
            </div>
            <div className='ml-3'>
              <h3 className='text-sm font-medium text-red-800'>Có lỗi xảy ra:</h3>
              <div className='mt-2 text-sm text-red-700'>
                <ul className='list-disc list-inside space-y-1'>
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
            <button
              onClick={() => setErrors([])}
              className='ml-auto flex-shrink-0 text-red-400 hover:text-red-600 transition-colors'
            >
              <MdClose size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Thumbnail Upload Section */}
      <div className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-2 bg-blue-50 rounded-lg'>
            <HiOutlinePhotograph className='w-5 h-5 text-blue-600' />
          </div>
          <div>
            <label className='block text-lg font-semibold text-gray-900'>Ảnh đại diện</label>
            <p className='text-sm text-gray-500'>Ảnh chính sẽ hiển thị đầu tiên cho khách hàng</p>
          </div>
          <span className='ml-auto px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full'>Bắt buộc</span>
        </div>

        {thumbnail || thumbnailPreview ? (
          <div className='relative group'>
            <div className='relative w-40 h-40 border-2 border-gray-200 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300'>
              {isUploading && (
                <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
                </div>
              )}
              <Image
                src={thumbnailPreview || (thumbnail ? URL.createObjectURL(thumbnail) : '')}
                alt='Thumbnail preview'
                fill
                className='object-cover group-hover:scale-105 transition-transform duration-300'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
              <button
                type='button'
                onClick={removeThumbnail}
                className='absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transform hover:scale-110 transition-all duration-200 shadow-lg opacity-0 group-hover:opacity-100'
                disabled={disabled}
                aria-label='Xóa ảnh đại diện'
              >
                <MdClose size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div
            {...getThumbnailRootProps()}
            className={`
              relative w-40 h-40 border-2 border-dashed rounded-xl cursor-pointer
              flex flex-col items-center justify-center
              transition-all duration-300 group
              ${
                isThumbnailDragActive
                  ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
            `}
          >
            <input {...getThumbnailInputProps()} />
            <div
              className={`p-4 rounded-full transition-all duration-300 ${
                isThumbnailDragActive ? 'bg-blue-100 scale-110' : 'bg-gray-100 group-hover:bg-blue-100'
              }`}
            >
              <MdImage
                className={`transition-colors duration-300 ${
                  isThumbnailDragActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'
                }`}
                size={32}
              />
            </div>
            <div className='text-center mt-3'>
              <p className='text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors'>
                {isThumbnailDragActive ? 'Thả ảnh vào đây' : 'Kéo thả ảnh vào đây'}
              </p>
              <p className='text-xs text-gray-500 mt-1'>hoặc nhấp để chọn tệp</p>
            </div>
          </div>
        )}
      </div>

      {/* Gallery Upload Section */}
      <div className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-green-50 rounded-lg'>
            <HiOutlineCollection className='w-5 h-5 text-green-600' />
          </div>
          <div className='flex-1'>
            <label className='block text-lg font-semibold text-gray-900'>Thư viện ảnh</label>
            <p className='text-sm text-gray-500'>Thêm nhiều ảnh để khách hàng xem chi tiết sản phẩm</p>
          </div>
          {galleryImages.length > 0 && (
            <span className='px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full'>
              {galleryImages.length} ảnh
            </span>
          )}
        </div>

        {/* Gallery Images Grid with Drag & Drop Reordering */}
        {galleryImages.length > 0 && (
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6'>
            {galleryImages.map((file, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, index)}
                className={`relative group cursor-move transition-all duration-300 hover:scale-105 ${
                  draggedIndex === index ? 'opacity-50 scale-95' : ''
                }`}
              >
                <div className='relative w-full aspect-square border-2 border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300'>
                  <Image
                    src={galleryPreviews[index] || URL.createObjectURL(file)}
                    alt={`Gallery ${index + 1}`}
                    fill
                    className='object-cover group-hover:scale-110 transition-transform duration-300'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />

                  {/* Drag Handle */}
                  <div className='absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                    <MdDragIndicator className='text-gray-600' size={16} />
                  </div>

                  {/* Remove Button */}
                  <button
                    type='button'
                    onClick={() => removeGalleryImage(index)}
                    className='absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transform hover:scale-110 transition-all duration-200 shadow-lg opacity-0 group-hover:opacity-100'
                    disabled={disabled}
                    aria-label={`Xóa ảnh ${index + 1}`}
                  >
                    <MdClose size={14} />
                  </button>

                  {/* Image Index */}
                  <div className='absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                    {index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Gallery Dropzone */}
        <div
          {...getGalleryRootProps()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 cursor-pointer
            flex flex-col items-center justify-center
            transition-all duration-300 group
            ${
              isGalleryDragActive
                ? 'border-green-500 bg-green-50 scale-105 shadow-lg'
                : 'border-gray-300 hover:border-green-400 hover:bg-green-50/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
          `}
        >
          <input {...getGalleryInputProps()} />

          <div
            className={`p-6 rounded-full transition-all duration-300 ${
              isGalleryDragActive ? 'bg-green-100 scale-110' : 'bg-gray-100 group-hover:bg-green-100'
            }`}
          >
            <MdPhotoLibrary
              className={`transition-colors duration-300 ${
                isGalleryDragActive ? 'text-green-600' : 'text-gray-400 group-hover:text-green-500'
              }`}
              size={40}
            />
          </div>

          <div className='text-center mt-4'>
            <p className='text-lg font-medium text-gray-700 group-hover:text-green-600 transition-colors mb-2'>
              {isGalleryDragActive ? 'Thả ảnh vào đây' : 'Thêm ảnh vào thư viện'}
            </p>
            <p className='text-sm text-gray-500 mb-3'>Kéo thả nhiều ảnh cùng lúc hoặc nhấp để chọn</p>
            <div className='flex items-center justify-center gap-4 text-xs text-gray-400'>
              <span>JPG, PNG, GIF, WEBP</span>
              <span>•</span>
              <span>Tối đa 5MB/ảnh</span>
              <span>•</span>
              <span>Kéo để sắp xếp</span>
            </div>
          </div>

          {/* Progress Bar */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className='absolute bottom-4 left-4 right-4'>
              <div className='bg-gray-200 rounded-full h-2 overflow-hidden'>
                <div
                  className='bg-green-500 h-full transition-all duration-300 ease-out'
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className='text-xs text-gray-500 mt-1 text-center'>Đang tải lên... {Math.round(uploadProgress)}%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThumbnailGalleryUpload;

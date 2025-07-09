'use client';

import { ImageType } from '@/app/(admin)/admin/manage-products/AddProductModalNew';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaCircleArrowUp } from 'react-icons/fa6';

interface SelecteImageProps {
  item?: ImageType;
  handleFileChange: (value: File[]) => void;
}

const SelectImage: React.FC<SelecteImageProps> = ({ item, handleFileChange }) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleFileChange(acceptedFiles); // Gửi cả mảng file
      }
    },
    [handleFileChange]
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['jpeg', 'png'] },
    multiple: true
  });
  return (
    <div
      {...getRootProps()}
      className='border-2 border-slate-400 p-2 border-dashed cursor-pointer text-sm font-normal text-slate-400 flex items-center justify-center'
    >
      <input {...getInputProps()} />
      {isDragActive ? <p>Thả ảnh vào đây</p> : <p>Click để tải hình ảnh lên</p>}
      <FaCircleArrowUp className='ml-1' />
    </div>
  );
};

export default SelectImage;

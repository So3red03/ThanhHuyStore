'use client';

import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { MdCloudUpload, MdImage } from 'react-icons/md';
import Image from 'next/image';

interface ImageUploadFieldProps {
  label: string;
  image: File | string | null;
  onImageChange: (file: File | null) => void;
  disabled?: boolean;
  accept?: string;
  maxSize?: number; // in MB
  preview?: boolean;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  image,
  onImageChange,
  disabled = false,
  accept = 'image/*',
  maxSize = 5,
  preview = true
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        alert(`Kích thước file không được vượt quá ${maxSize}MB`);
        return;
      }
      onImageChange(file);
    }
  };

  const getImageSrc = () => {
    if (!image) return null;
    if (typeof image === 'string') return image;
    return URL.createObjectURL(image);
  };

  const getImageAlt = () => {
    if (typeof image === 'string') return 'Current image';
    return image?.name || 'Preview image';
  };

  return (
    <Box sx={{ mb: 3 }}>
      {/* Label */}
      <Typography 
        variant="body2" 
        sx={{ 
          mb: 1, 
          fontWeight: 500,
          color: '#374151'
        }}
      >
        {label}
      </Typography>

      {/* Upload Area */}
      <Paper
        elevation={0}
        sx={{
          border: '2px dashed #d1d5db',
          borderRadius: '12px',
          p: 3,
          textAlign: 'center',
          backgroundColor: '#f9fafb',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: '#64748b',
            backgroundColor: '#f1f5f9'
          }
        }}
      >
        {/* Preview Image */}
        {preview && image && (
          <Box sx={{ mb: 2 }}>
            <Image
              src={getImageSrc()!}
              alt={getImageAlt()}
              width={120}
              height={120}
              style={{
                objectFit: 'cover',
                borderRadius: '8px',
                border: '2px solid #e5e7eb'
              }}
            />
          </Box>
        )}

        {/* Upload Status */}
        <Box sx={{ mb: 2 }}>
          {image ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <MdImage size={20} color="#10b981" />
              <Typography variant="body2" color="#10b981" fontWeight={500}>
                {typeof image === 'string' ? 'Ảnh hiện tại' : image.name}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <MdCloudUpload size={24} color="#9ca3af" />
              <Typography variant="body2" color="#6b7280">
                Chưa có file nào được chọn
              </Typography>
            </Box>
          )}
        </Box>

        {/* Upload Button */}
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
          style={{ display: 'none' }}
          id={`image-upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
        />
        <label htmlFor={`image-upload-${label.replace(/\s+/g, '-').toLowerCase()}`}>
          <Button
            component="span"
            variant="contained"
            disabled={disabled}
            sx={{
              backgroundColor: '#64748b',
              color: 'white',
              px: 3,
              py: 1,
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: '#475569'
              },
              '&:disabled': {
                backgroundColor: '#d1d5db',
                color: '#9ca3af'
              }
            }}
          >
            {image ? 'Đổi hình ảnh' : 'Chọn hình ảnh'}
          </Button>
        </label>

        {/* Help Text */}
        <Typography 
          variant="caption" 
          color="#6b7280" 
          sx={{ 
            display: 'block', 
            mt: 1,
            fontSize: '0.75rem'
          }}
        >
          Chọn ảnh JPG, PNG hoặc GIF. Kích thước tối đa: {maxSize}MB
        </Typography>
      </Paper>
    </Box>
  );
};

export default ImageUploadField;

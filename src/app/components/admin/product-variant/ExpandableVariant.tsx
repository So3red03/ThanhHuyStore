'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Collapse,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import { MdExpandMore, MdExpandLess, MdDelete, MdEdit, MdUpload, MdImage, MdClose } from 'react-icons/md';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { uploadVariantProductThumbnail, uploadVariantProductGallery } from '@/app/utils/firebase-product-storage';

interface ExpandableVariantProps {
  variant: {
    id: string;
    databaseId?: string; // Real database ObjectID for existing variants
    name: string;
    attributes: { [key: string]: string };
    price: number;
    stock: number;
    sku: string;
    thumbnail?: string | File | null; // Thumbnail for variant
    galleryImages?: (string | File)[]; // Gallery images for variant
    enabled: boolean;
    imageFiles?: File[]; // Optional File objects for upload
    thumbnailFile?: File | null; // Thumbnail file for upload
  };
  onUpdate: (variantId: string, updates: any) => void;
  onDelete: (variantId: string) => void;
}

const ExpandableVariant: React.FC<ExpandableVariantProps> = ({ variant, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  // Image validation
  const validateImageFiles = (files: File[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    files.forEach((file, index) => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`File ${index + 1}: Chỉ chấp nhận định dạng JPG, PNG, GIF, WebP`);
      }
      if (file.size > maxSize) {
        errors.push(`File ${index + 1}: Kích thước tối đa 5MB`);
      }
    });

    return { isValid: errors.length === 0, errors };
  };

  const [editData, setEditData] = useState(() => {
    return {
      ...variant,
      thumbnail: variant.thumbnail || null,
      galleryImages: variant.galleryImages || [],
      thumbnailFile: variant.thumbnailFile || null,
      imageFiles: variant.imageFiles || [] // Initialize imageFiles
    };
  });

  // Update editData when variant props change (for edit mode)
  useEffect(() => {
    setEditData({
      ...variant,
      thumbnail: variant.thumbnail || null,
      galleryImages: variant.galleryImages || [],
      thumbnailFile: variant.thumbnailFile || null,
      imageFiles: variant.imageFiles || []
    });
  }, [variant]);

  // Thumbnail dropzone
  const onThumbnailDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const validation = validateImageFiles([file]);

      if (validation.isValid) {
        setEditData(prev => ({ ...prev, thumbnailFile: file }));
        setThumbnailPreview(URL.createObjectURL(file));
        setErrors([]);
      } else {
        setErrors(validation.errors);
      }
    }
  }, []);

  const {
    getRootProps: getThumbnailRootProps,
    getInputProps: getThumbnailInputProps,
    isDragActive: isThumbnailDragActive
  } = useDropzone({
    onDrop: onThumbnailDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    maxFiles: 1,
    disabled: !isEditing
  });

  // Gallery dropzone
  const onGalleryDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const validation = validateImageFiles(acceptedFiles);

        if (validation.isValid) {
          const currentFiles = editData.imageFiles || [];
          const newFiles = [...currentFiles, ...acceptedFiles];

          if (newFiles.length > 10) {
            setErrors(['Tối đa 10 ảnh gallery']);
            return;
          }

          setEditData(prev => ({ ...prev, imageFiles: newFiles }));

          // Create previews
          const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file));
          setGalleryPreviews(prev => [...prev, ...newPreviews]);
          setErrors([]);
        } else {
          setErrors(validation.errors);
        }
      }
    },
    [editData.imageFiles]
  );

  const {
    getRootProps: getGalleryRootProps,
    getInputProps: getGalleryInputProps,
    isDragActive: isGalleryDragActive
  } = useDropzone({
    onDrop: onGalleryDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    multiple: true,
    disabled: !isEditing
  });

  // Image helper functions
  const removeThumbnail = () => {
    setEditData(prev => ({ ...prev, thumbnail: null, thumbnailFile: null }));
    setThumbnailPreview(null);
  };

  const removeGalleryImage = (index: number) => {
    const existingCount = editData.galleryImages?.length || 0;

    if (index < existingCount) {
      // Removing existing gallery image
      const newGalleryImages = (editData.galleryImages || []).filter((_, i) => i !== index);
      setEditData(prev => ({ ...prev, galleryImages: newGalleryImages }));
    } else {
      // Removing new uploaded file
      const fileIndex = index - existingCount;
      const newFiles = (editData.imageFiles || []).filter((_, i) => i !== fileIndex);
      const newPreviews = galleryPreviews.filter((_, i) => i !== fileIndex);
      setEditData(prev => ({ ...prev, imageFiles: newFiles }));
      setGalleryPreviews(newPreviews);
    }
  };

  // Drag and drop reordering for gallery
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

    const existingImages = editData.galleryImages || [];
    const newFiles = editData.imageFiles || [];
    const totalImages = [...existingImages, ...newFiles];

    // Swap items in the combined array
    const draggedItem = totalImages[draggedIndex];
    totalImages.splice(draggedIndex, 1);
    totalImages.splice(dropIndex, 0, draggedItem);

    // Split back into existing and new arrays
    const newExistingImages = totalImages.slice(0, existingImages.length);
    const newNewFiles = totalImages.slice(existingImages.length).filter((item): item is File => item instanceof File);

    setEditData(prev => ({
      ...prev,
      galleryImages: newExistingImages,
      imageFiles: newNewFiles
    }));
    setDraggedIndex(null);
  };

  // Clear errors after 5 seconds
  useEffect(() => {
    if (errors.length > 0) {
      const timer = setTimeout(() => setErrors([]), 5000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  // Upload images to Firebase
  const uploadImagesToFirebase = async (productName: string, variantId: string) => {
    let thumbnailUrl: string | null = null;
    let galleryUrls: string[] = [];

    try {
      // Upload thumbnail if it's a File
      if (editData.thumbnailFile instanceof File) {
        thumbnailUrl = await uploadVariantProductThumbnail(editData.thumbnailFile, productName, variantId);
      }

      // Upload gallery images if they are Files
      if (editData.imageFiles && editData.imageFiles.length > 0) {
        const fileImages = editData.imageFiles.filter((img: any) => img instanceof File);
        if (fileImages.length > 0) {
          galleryUrls = await uploadVariantProductGallery(fileImages, productName, variantId);
        }
      }

      return {
        thumbnail: thumbnailUrl || editData.thumbnail,
        galleryImages: galleryUrls.length > 0 ? galleryUrls : editData.galleryImages || []
      };
    } catch (error) {
      console.error('Error uploading images to Firebase:', error);
      throw new Error('Lỗi upload ảnh lên Firebase');
    }
  };

  const handleSave = async () => {
    try {
      // Check if this is CREATE mode (new variant) or EDIT mode (existing variant)
      const variantId = variant.databaseId;
      const isEditMode = variantId && /^[0-9a-fA-F]{24}$/.test(variantId);

      if (!isEditMode) {
        // CREATE MODE: Just update local state, don't call API
        // Update parent component state with current edit data
        onUpdate(variant.id, {
          ...editData,
          thumbnail: editData.thumbnailFile || editData.thumbnail,
          galleryImages:
            editData.imageFiles && editData.imageFiles.length > 0 ? editData.imageFiles : editData.galleryImages || []
        });

        setIsEditing(false);
        setErrors([]);
        return;
      }

      // EDIT MODE: Call API to update existing variant in database

      // Check if we need to upload new images to Firebase
      const hasNewThumbnail = editData.thumbnailFile instanceof File;
      const hasNewGalleryImages = editData.imageFiles && editData.imageFiles.some(file => file instanceof File);

      let thumbnailToSend = editData.thumbnail;
      let galleryImagesToSend = editData.galleryImages || [];

      // Upload new images to Firebase if needed
      if (hasNewThumbnail || hasNewGalleryImages) {
        try {
          // We need product name and variant ID for Firebase upload
          // For now, use a generic approach - in production, these should be passed as props
          const productName = variant.name || 'variant-product';
          const variantIdForFirebase = `variant-${Date.now()}`;

          const uploadedImages = await uploadImagesToFirebase(productName, variantIdForFirebase);

          thumbnailToSend = uploadedImages.thumbnail;
          galleryImagesToSend = uploadedImages.galleryImages;
        } catch (error) {
          console.error('❌ Firebase upload failed:', error);
          setErrors([error instanceof Error ? error.message : 'Lỗi upload ảnh lên Firebase']);
          return;
        }
      }

      // Call API to update variant
      const response = await fetch(`/api/product/variant/variants/${variantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sku: editData.sku,
          price: editData.price,
          stock: editData.stock,
          isActive: editData.enabled,
          thumbnail: thumbnailToSend,
          galleryImages: galleryImagesToSend
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update variant');
      }

      const result = await response.json();

      // Update parent component state
      onUpdate(variant.id, {
        ...editData,
        thumbnail: thumbnailToSend,
        galleryImages: galleryImagesToSend
      });

      setIsEditing(false);
      setErrors([]);
    } catch (error) {
      console.error('❌ Error updating variant:', error);
      setErrors([error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật biến thể']);
    }
  };

  const handleCancel = () => {
    setEditData({
      ...variant,
      thumbnail: variant.thumbnail || null,
      galleryImages: variant.galleryImages || [],
      thumbnailFile: variant.thumbnailFile || null,
      imageFiles: variant.imageFiles || []
    });
    setIsEditing(false);
  };

  const getAttributeDisplay = () => {
    return Object.entries(variant.attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  return (
    <Box
      sx={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        mb: 2,
        overflow: 'hidden'
      }}
    >
      {/* Header - Always visible */}
      <Box
        sx={{
          p: 2,
          backgroundColor: '#f9fafb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
        onClick={handleToggleExpand}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {/* Variant ID */}
          <Typography variant='body2' sx={{ fontWeight: 600, color: '#374151', minWidth: '60px' }}>
            #{variant.id}
          </Typography>

          {/* Attributes */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {Object.entries(variant.attributes).map(([key, value]) => (
              <Chip
                key={key}
                label={`${value}`}
                size='small'
                sx={{
                  backgroundColor: key === 'color' ? '#dbeafe' : '#f3f4f6',
                  color: key === 'color' ? '#1e40af' : '#374151',
                  fontSize: '12px'
                }}
              />
            ))}
          </Box>

          {/* Price */}
          <Typography variant='body2' sx={{ color: '#059669', fontWeight: 500 }}>
            {variant.price.toLocaleString('vi-VN')}₫
          </Typography>

          {/* Stock */}
          <Typography variant='body2' sx={{ color: '#6b7280' }}>
            Kho: {variant.stock}
          </Typography>

          {/* Status */}
          <Chip
            label={variant.enabled ? 'Kích hoạt' : 'Tắt'}
            size='small'
            color={variant.enabled ? 'success' : 'default'}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            size='small'
            onClick={e => {
              e.stopPropagation();
              setIsEditing(true);
              setExpanded(true);
            }}
            sx={{ color: '#3b82f6' }}
          >
            <MdEdit size={16} />
          </IconButton>
          <IconButton
            size='small'
            onClick={e => {
              e.stopPropagation();
              onDelete(variant.id);
            }}
            sx={{ color: '#ef4444' }}
          >
            <MdDelete size={16} />
          </IconButton>
          <IconButton size='small' sx={{ color: '#6b7280' }}>
            {expanded ? <MdExpandLess /> : <MdExpandMore />}
          </IconButton>
        </Box>
      </Box>

      {/* Expandable Content */}
      <Collapse in={expanded}>
        <Box sx={{ p: 3, backgroundColor: 'white' }}>
          {isEditing ? (
            // Edit Mode - Enhanced Layout
            <Box sx={{ display: 'flex', gap: 4 }}>
              {/* Left Side - Compact Image Upload */}
              <Box sx={{ minWidth: '240px', maxWidth: '280px' }}>
                {/* Error Messages */}
                {errors.length > 0 && (
                  <Box
                    sx={{
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      p: 2,
                      mb: 2
                    }}
                  >
                    <Typography variant='body2' sx={{ color: '#dc2626', fontWeight: 600 }}>
                      Có lỗi xảy ra:
                    </Typography>
                    {errors.map((error, index) => (
                      <Typography key={index} variant='caption' sx={{ color: '#dc2626', display: 'block' }}>
                        • {error}
                      </Typography>
                    ))}
                  </Box>
                )}

                {/* Enhanced Thumbnail Upload */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <MdImage size={20} color='#3b82f6' />
                    <Typography variant='subtitle2' sx={{ fontWeight: 600, color: '#1f2937' }}>
                      Ảnh đại diện
                    </Typography>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.5,
                        backgroundColor: '#fef2f2',
                        borderRadius: '12px',
                        border: '1px solid #fecaca'
                      }}
                    >
                      <Typography variant='caption' sx={{ color: '#dc2626', fontWeight: 600 }}>
                        Bắt buộc
                      </Typography>
                    </Box>
                  </Box>

                  {editData.thumbnail || editData.thumbnailFile || thumbnailPreview ? (
                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                      <Box
                        sx={{
                          width: '120px',
                          height: '120px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          position: 'relative',
                          '&:hover .overlay': { opacity: 1 }
                        }}
                      >
                        <Image
                          src={
                            thumbnailPreview ||
                            (editData.thumbnailFile ? URL.createObjectURL(editData.thumbnailFile) : '') ||
                            (typeof editData.thumbnail === 'string' ? editData.thumbnail : '') ||
                            ''
                          }
                          alt='Thumbnail preview'
                          fill
                          className='object-cover'
                        />
                        <Box
                          className='overlay'
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.2), transparent)',
                            opacity: 0,
                            transition: 'opacity 0.3s'
                          }}
                        />
                        <IconButton
                          onClick={removeThumbnail}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: '#ef4444',
                            color: 'white',
                            width: 32,
                            height: 32,
                            '&:hover': { backgroundColor: '#dc2626', transform: 'scale(1.1)' },
                            transition: 'all 0.2s'
                          }}
                        >
                          <MdClose size={16} />
                        </IconButton>
                      </Box>
                    </Box>
                  ) : (
                    <Box
                      {...getThumbnailRootProps()}
                      sx={{
                        width: '120px',
                        height: '120px',
                        border: '2px dashed #d1d5db',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        backgroundColor: isThumbnailDragActive ? '#eff6ff' : '#f9fafb',
                        borderColor: isThumbnailDragActive ? '#3b82f6' : '#d1d5db',
                        transform: isThumbnailDragActive ? 'scale(1.02)' : 'scale(1)',
                        transition: 'all 0.3s',
                        '&:hover': {
                          borderColor: '#3b82f6',
                          backgroundColor: '#f0f9ff',
                          transform: 'scale(1.02)'
                        }
                      }}
                    >
                      <input {...getThumbnailInputProps()} />
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: '50%',
                          backgroundColor: isThumbnailDragActive ? '#dbeafe' : '#f3f4f6',
                          transition: 'all 0.3s'
                        }}
                      >
                        <MdImage size={32} color={isThumbnailDragActive ? '#3b82f6' : '#6b7280'} />
                      </Box>
                      <Typography
                        variant='body2'
                        sx={{
                          color: isThumbnailDragActive ? '#3b82f6' : '#6b7280',
                          textAlign: 'center',
                          fontWeight: 500,
                          mt: 1
                        }}
                      >
                        {isThumbnailDragActive ? 'Thả ảnh vào đây' : 'Kéo thả hoặc click để chọn'}
                      </Typography>
                      <Typography variant='caption' sx={{ color: '#9ca3af', textAlign: 'center' }}>
                        JPG, PNG, GIF, WebP (tối đa 5MB)
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Enhanced Gallery Upload */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <MdImage size={20} color='#3b82f6' />
                    <Typography variant='subtitle2' sx={{ fontWeight: 600, color: '#1f2937' }}>
                      Thư viện ảnh
                    </Typography>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.5,
                        backgroundColor: '#f0f9ff',
                        borderRadius: '12px',
                        border: '1px solid #bfdbfe'
                      }}
                    >
                      <Typography variant='caption' sx={{ color: '#1d4ed8', fontWeight: 600 }}>
                        Tùy chọn
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    {...getGalleryRootProps()}
                    sx={{
                      width: '100%',
                      minHeight: '80px',
                      border: '2px dashed #d1d5db',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      backgroundColor: isGalleryDragActive ? '#eff6ff' : '#f9fafb',
                      borderColor: isGalleryDragActive ? '#3b82f6' : '#d1d5db',
                      transform: isGalleryDragActive ? 'scale(1.02)' : 'scale(1)',
                      transition: 'all 0.3s',
                      p: 2,
                      '&:hover': {
                        borderColor: '#3b82f6',
                        backgroundColor: '#f0f9ff',
                        transform: 'scale(1.01)'
                      }
                    }}
                  >
                    <input {...getGalleryInputProps()} />
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: '50%',
                        backgroundColor: isGalleryDragActive ? '#dbeafe' : '#f3f4f6',
                        transition: 'all 0.3s'
                      }}
                    >
                      <MdUpload size={24} color={isGalleryDragActive ? '#3b82f6' : '#6b7280'} />
                    </Box>
                    <Typography
                      variant='body2'
                      sx={{
                        color: isGalleryDragActive ? '#3b82f6' : '#6b7280',
                        textAlign: 'center',
                        fontWeight: 500,
                        mt: 1
                      }}
                    >
                      {isGalleryDragActive ? 'Thả ảnh vào đây' : 'Thêm ảnh gallery'}
                    </Typography>
                    <Typography variant='caption' sx={{ color: '#9ca3af', textAlign: 'center' }}>
                      Kéo thả nhiều ảnh hoặc click để chọn (tối đa 10 ảnh)
                    </Typography>
                  </Box>
                </Box>

                {/* Enhanced Gallery Display with Drag & Drop */}
                {((editData.imageFiles && editData.imageFiles.length > 0) ||
                  (editData.galleryImages && editData.galleryImages.length > 0) ||
                  galleryPreviews.length > 0) && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant='caption' sx={{ color: '#6b7280', mb: 2, display: 'block' }}>
                      Thư viện ảnh ({(editData.imageFiles?.length || 0) + (editData.galleryImages?.length || 0)} ảnh)
                    </Typography>
                    <Box
                      sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: 1.5 }}
                    >
                      {/* Display existing gallery images */}
                      {editData.galleryImages?.map((img, index) => (
                        <Box
                          key={`existing-${index}`}
                          sx={{
                            position: 'relative',
                            width: '60px',
                            height: '60px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '2px solid #e5e7eb',
                            cursor: 'grab',
                            '&:hover': {
                              borderColor: '#3b82f6',
                              transform: 'scale(1.05)',
                              '& .delete-btn': { opacity: 1 }
                            },
                            transition: 'all 0.2s'
                          }}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={handleDragOver}
                          onDrop={e => handleDrop(e, index)}
                        >
                          <Image
                            src={typeof img === 'string' ? img : img instanceof File ? URL.createObjectURL(img) : img}
                            alt={`Gallery ${index + 1}`}
                            fill
                            className='object-cover'
                          />
                          <IconButton
                            className='delete-btn'
                            onClick={() => removeGalleryImage(index)}
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              backgroundColor: '#ef4444',
                              color: 'white',
                              width: 20,
                              height: 20,
                              opacity: 0,
                              '&:hover': { backgroundColor: '#dc2626', transform: 'scale(1.1)' },
                              transition: 'all 0.2s'
                            }}
                          >
                            <MdClose size={12} />
                          </IconButton>
                        </Box>
                      ))}

                      {/* Display new uploaded files */}
                      {editData.imageFiles?.map((file, index) => (
                        <Box
                          key={`new-${index}`}
                          sx={{
                            position: 'relative',
                            width: '60px',
                            height: '60px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '2px solid #10b981',
                            cursor: 'grab',
                            '&:hover': {
                              borderColor: '#059669',
                              transform: 'scale(1.05)',
                              '& .delete-btn': { opacity: 1 }
                            },
                            transition: 'all 0.2s'
                          }}
                        >
                          <Image
                            src={URL.createObjectURL(file)}
                            alt={`New ${index + 1}`}
                            fill
                            className='object-cover'
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 4,
                              left: 4,
                              backgroundColor: '#10b981',
                              color: 'white',
                              borderRadius: '4px',
                              px: 0.5,
                              py: 0.25
                            }}
                          >
                            <Typography variant='caption' sx={{ fontSize: '10px', fontWeight: 600 }}>
                              MỚI
                            </Typography>
                          </Box>
                          <IconButton
                            className='delete-btn'
                            onClick={() => removeGalleryImage((editData.galleryImages?.length || 0) + index)}
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              backgroundColor: '#ef4444',
                              color: 'white',
                              width: 20,
                              height: 20,
                              opacity: 0,
                              '&:hover': { backgroundColor: '#dc2626', transform: 'scale(1.1)' },
                              transition: 'all 0.2s'
                            }}
                          >
                            <MdClose size={12} />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Compact Gallery Tips */}
                <Box
                  sx={{ mt: 1.5, p: 1.5, backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                >
                  <Typography variant='caption' sx={{ color: '#64748b', display: 'block', fontSize: '11px' }}>
                    💡 Kéo thả để sắp xếp • Ảnh đầu làm ảnh chính • JPG/PNG/GIF/WebP (≤5MB)
                  </Typography>
                </Box>
              </Box>

              {/* Right Side - Form Fields */}
              <Box sx={{ flex: 1 }}>
                <Typography variant='h6' sx={{ fontWeight: 600, color: '#1f2937', mb: 3 }}>
                  Thông tin biến thể
                </Typography>

                {/* Row 1: SKU and Status */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 3, mb: 3 }}>
                  <TextField
                    label='SKU'
                    value={editData.sku}
                    onChange={e => setEditData({ ...editData, sku: e.target.value })}
                    size='small'
                    fullWidth
                  />
                  <FormControl size='small' fullWidth>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select
                      value={editData.enabled ? 'enabled' : 'disabled'}
                      onChange={e => setEditData({ ...editData, enabled: e.target.value === 'enabled' })}
                      label='Trạng thái'
                    >
                      <MenuItem value='enabled'>Kích hoạt</MenuItem>
                      <MenuItem value='disabled'>Tắt</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Row 2: Pricing - Only regular price */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
                  <TextField
                    label='Giá thường (VNĐ)'
                    type='number'
                    value={editData.price}
                    onChange={e => setEditData({ ...editData, price: Number(e.target.value) })}
                    size='small'
                    fullWidth
                    required
                  />
                  <TextField
                    label='Số lượng tồn kho'
                    type='number'
                    value={editData.stock}
                    onChange={e => setEditData({ ...editData, stock: Number(e.target.value) })}
                    size='small'
                    fullWidth
                    required
                  />
                </Box>

                {/* Save Mode Info */}
                <Box sx={{ mb: 2, p: 2, backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <Typography variant='caption' sx={{ color: '#64748b', display: 'block' }}>
                    {variant.databaseId && /^[0-9a-fA-F]{24}$/.test(variant.databaseId) ? (
                      <>
                        <strong>Chế độ chỉnh sửa:</strong> Thay đổi sẽ được cập nhật trực tiếp vào database
                      </>
                    ) : (
                      <>
                        <strong>Chế độ tạo mới:</strong> Thay đổi sẽ được lưu tạm thời, cần submit form chính để lưu vào
                        database
                      </>
                    )}
                  </Typography>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                  <Button variant='outlined' onClick={handleCancel} sx={{ borderColor: '#d1d5db', color: '#6b7280' }}>
                    Hủy
                  </Button>
                  <Button
                    variant='contained'
                    onClick={handleSave}
                    sx={{
                      backgroundColor: '#3b82f6',
                      '&:hover': { backgroundColor: '#2563eb' }
                    }}
                  >
                    Lưu thay đổi
                  </Button>
                </Box>
              </Box>
            </Box>
          ) : (
            // View Mode
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant='body2' sx={{ color: '#6b7280' }}>
                <strong>SKU:</strong> {variant.sku}
              </Typography>
              <Typography variant='body2' sx={{ color: '#6b7280' }}>
                <strong>Thuộc tính:</strong> {getAttributeDisplay()}
              </Typography>
              <Typography variant='body2' sx={{ color: '#6b7280' }}>
                <strong>Giá:</strong> {variant.price.toLocaleString('vi-VN')}₫
              </Typography>
              <Typography variant='body2' sx={{ color: '#6b7280' }}>
                <strong>Tồn kho:</strong> {variant.stock} sản phẩm
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default ExpandableVariant;

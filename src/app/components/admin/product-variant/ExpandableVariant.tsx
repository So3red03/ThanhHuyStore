'use client';
import React, { useState } from 'react';
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
import { MdExpandMore, MdExpandLess, MdDelete, MdEdit, MdUpload } from 'react-icons/md';

interface ExpandableVariantProps {
  variant: {
    id: string;
    name: string;
    attributes: { [key: string]: string };
    price: number;
    salePrice?: number;
    stock: number;
    sku: string;
    images: string[];
    enabled: boolean;
  };
  onUpdate: (variantId: string, updates: any) => void;
  onDelete: (variantId: string) => void;
}

const ExpandableVariant: React.FC<ExpandableVariantProps> = ({ variant, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(variant);

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleSave = () => {
    // Convert selected images to URLs if needed
    const updatedData = {
      ...editData,
      images: editData.images // These should already be URLs from handleImageUpload
    };
    onUpdate(variant.id, updatedData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(variant);
    setIsEditing(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files);
      // Create temporary URLs for preview
      const imageUrls = newImages.map(file => URL.createObjectURL(file));
      setEditData(prev => ({
        ...prev,
        images: [...prev.images, ...imageUrls]
      }));
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setEditData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
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
              {/* Left Side - Image Upload */}
              <Box sx={{ minWidth: '200px' }}>
                <Typography variant='subtitle2' sx={{ fontWeight: 600, color: '#1f2937', mb: 2 }}>
                  Hình ảnh biến thể
                </Typography>
                <Box
                  component='label'
                  htmlFor={`image-upload-${variant.id}`}
                  sx={{
                    width: '150px',
                    height: '150px',
                    border: '2px dashed #d1d5db',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#f9fafb',
                    '&:hover': {
                      borderColor: '#3b82f6',
                      backgroundColor: '#f0f9ff'
                    }
                  }}
                >
                  <input
                    type='file'
                    multiple
                    accept='image/*'
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    id={`image-upload-${variant.id}`}
                  />
                  <MdUpload size={24} color='#9ca3af' />
                  <Typography variant='caption' sx={{ color: '#6b7280', mt: 1, textAlign: 'center' }}>
                    Chọn nhiều hình ảnh
                  </Typography>
                </Box>

                {/* Display selected images */}
                {editData.images.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant='caption' sx={{ color: '#6b7280', mb: 1, display: 'block' }}>
                      Đã chọn {editData.images.length} hình ảnh
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {editData.images.map((img, index) => (
                        <Box
                          key={index}
                          sx={{
                            position: 'relative',
                            width: 60,
                            height: 60,
                            borderRadius: '4px',
                            overflow: 'hidden',
                            border: '1px solid #e5e7eb'
                          }}
                        >
                          <img
                            src={img}
                            alt={`Variant ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                          {/* Delete button */}
                          <Box
                            onClick={() => handleRemoveImage(index)}
                            sx={{
                              position: 'absolute',
                              top: 2,
                              right: 2,
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              backgroundColor: 'rgba(239, 68, 68, 0.9)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: '#dc2626'
                              }
                            }}
                          >
                            <Typography sx={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>×</Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
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

                {/* Row 2: Pricing */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
                  <TextField
                    label='Giá thường (VNĐ)'
                    type='number'
                    value={editData.price}
                    onChange={e => setEditData({ ...editData, price: Number(e.target.value) })}
                    size='small'
                    fullWidth
                  />
                  <TextField
                    label='Giá khuyến mãi (VNĐ)'
                    type='number'
                    value={editData.salePrice || ''}
                    onChange={e => setEditData({ ...editData, salePrice: Number(e.target.value) || undefined })}
                    size='small'
                    fullWidth
                  />
                </Box>

                {/* Row 3: Stock and Weight */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
                  <TextField
                    label='Số lượng tồn kho'
                    type='number'
                    value={editData.stock}
                    onChange={e => setEditData({ ...editData, stock: Number(e.target.value) })}
                    size='small'
                    fullWidth
                  />
                  <TextField label='Trọng lượng (kg)' type='number' value={0} size='small' fullWidth />
                </Box>

                {/* Row 4: Dimensions */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
                  <TextField label='Dài (cm)' type='number' size='small' fullWidth />
                  <TextField label='Rộng (cm)' type='number' size='small' fullWidth />
                  <TextField label='Cao (cm)' type='number' size='small' fullWidth />
                </Box>

                {/* Row 5: Description */}
                <TextField label='Mô tả' multiline rows={3} fullWidth size='small' sx={{ mb: 3 }} />

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
                {variant.salePrice && <span> (Khuyến mãi: {variant.salePrice.toLocaleString('vi-VN')}₫)</span>}
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

'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Palette as PaletteIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { ProductAttribute, AttributeValue, AttributeType, AttributeValueFormData } from './types';

interface AttributeValueManagerProps {
  attribute: ProductAttribute;
  globalAttribute: any; // GlobalAttribute type
  onValuesChange: (values: AttributeValue[]) => void;
}

const AttributeValueManager: React.FC<AttributeValueManagerProps> = ({
  attribute,
  globalAttribute,
  onValuesChange
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingValue, setEditingValue] = useState<AttributeValue | null>(null);
  const [formData, setFormData] = useState<AttributeValueFormData>({
    value: '',
    label: '',
    description: '',
    colorCode: '',
    imageUrl: '',
    priceAdjustment: 0
  });

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      value: '',
      label: '',
      description: '',
      colorCode: '',
      imageUrl: '',
      priceAdjustment: 0
    });
  }, []);

  // Handle add value
  const handleAddValue = useCallback(() => {
    setEditingValue(null);
    resetForm();
    setShowAddDialog(true);
  }, [resetForm]);

  // Handle edit value
  const handleEditValue = useCallback((value: AttributeValue) => {
    setEditingValue(value);
    setFormData({
      value: value.value,
      label: value.label,
      description: value.description || '',
      colorCode: value.colorCode || '',
      imageUrl: value.imageUrl || '',
      priceAdjustment: value.priceAdjustment
    });
    setShowAddDialog(true);
  }, []);

  // Handle save value
  const handleSaveValue = useCallback(() => {
    if (!formData.value.trim() || !formData.label.trim()) return;

    const newValue: AttributeValue = {
      id: editingValue?.id || `temp_${Date.now()}`,
      attributeId: attribute.id,
      value: formData.value.trim(),
      label: formData.label.trim(),
      description: formData.description?.trim() || undefined,
      colorCode: formData.colorCode?.trim() || undefined,
      imageUrl: formData.imageUrl?.trim() || undefined,
      priceAdjustment: formData.priceAdjustment,
      position: editingValue?.position || attribute.values.length,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let updatedValues;
    if (editingValue) {
      // Update existing value
      updatedValues = attribute.values.map(v => (v.id === editingValue.id ? newValue : v));
    } else {
      // Add new value
      updatedValues = [...attribute.values, newValue];
    }

    onValuesChange(updatedValues);
    setShowAddDialog(false);
    resetForm();
  }, [formData, editingValue, attribute, onValuesChange, resetForm]);

  // Handle delete value
  const handleDeleteValue = useCallback(
    (valueId: string) => {
      const updatedValues = attribute.values.filter(v => v.id !== valueId);
      // Reorder positions
      const reorderedValues = updatedValues.map((v, index) => ({
        ...v,
        position: index
      }));
      onValuesChange(reorderedValues);
    },
    [attribute.values, onValuesChange]
  );

  // Auto-generate value from label
  const handleLabelChange = (label: string) => {
    setFormData(prev => ({
      ...prev,
      label,
      value: prev.value || generateValueFromLabel(label)
    }));
  };

  const generateValueFromLabel = (label: string): string => {
    return label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
  };

  // Format price adjustment
  const formatPriceAdjustment = (amount: number): string => {
    if (amount === 0) return '±0đ';
    return amount > 0 ? `+${amount.toLocaleString()}đ` : `${amount.toLocaleString()}đ`;
  };

  return (
    <Box>
      {/* Add Value Button */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant='outlined'
          startIcon={<AddIcon />}
          onClick={handleAddValue}
          size='small'
          sx={{
            borderColor: '#2e7d32',
            color: '#2e7d32',
            '&:hover': {
              borderColor: '#1b5e20',
              backgroundColor: 'rgba(46, 125, 50, 0.04)'
            }
          }}
        >
          Thêm giá trị
        </Button>
      </Box>

      {/* Values List */}
      {attribute.values.length === 0 ? (
        <Alert severity='info' sx={{ fontSize: '0.875rem' }}>
          Chưa có giá trị nào. Nhấn &quot;Thêm giá trị&quot; để bắt đầu.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {attribute.values
            .sort((a, b) => a.position - b.position)
            .map(value => (
              <Card
                key={value.id}
                sx={{
                  border: '1px solid #e0e0e0',
                  '&:hover': {
                    backgroundColor: '#f8f9fa'
                  }
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Drag Handle */}
                    <IconButton size='small' sx={{ cursor: 'grab' }}>
                      <DragIcon />
                    </IconButton>

                    {/* Color Preview (for COLOR type) */}
                    {attribute.type === AttributeType.COLOR && value.colorCode && (
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          backgroundColor: value.colorCode,
                          border: '2px solid #e0e0e0'
                        }}
                      />
                    )}

                    {/* Value Info */}
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                          {value.label}
                        </Typography>
                        <Chip
                          label={value.value}
                          size='small'
                          variant='outlined'
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                        {value.priceAdjustment !== 0 && (
                          <Chip
                            label={formatPriceAdjustment(value.priceAdjustment)}
                            size='small'
                            color={value.priceAdjustment > 0 ? 'success' : 'error'}
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        )}
                      </Box>
                      {value.description && (
                        <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.8rem' }}>
                          {value.description}
                        </Typography>
                      )}
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title='Sửa'>
                        <IconButton size='small' onClick={() => handleEditValue(value)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Xóa'>
                        <IconButton size='small' onClick={() => handleDeleteValue(value.id)} sx={{ color: '#f44336' }}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
        </Box>
      )}

      {/* Add/Edit Value Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{editingValue ? 'Sửa giá trị' : 'Thêm giá trị mới'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Label */}
            <TextField
              label='Nhãn hiển thị'
              value={formData.label}
              onChange={e => handleLabelChange(e.target.value)}
              fullWidth
              required
              helperText='Tên hiển thị cho khách hàng'
            />

            {/* Value */}
            <TextField
              label='Giá trị'
              value={formData.value}
              onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
              fullWidth
              required
              helperText='Giá trị kỹ thuật (không dấu, không khoảng trắng)'
            />

            {/* Color Code (for COLOR type) */}
            {attribute.type === AttributeType.COLOR && (
              <TextField
                label='Mã màu'
                value={formData.colorCode}
                onChange={e => setFormData(prev => ({ ...prev, colorCode: e.target.value }))}
                placeholder='#FFFFFF'
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <PaletteIcon />
                    </InputAdornment>
                  )
                }}
                fullWidth
                helperText='Mã màu hex (VD: #FF0000)'
              />
            )}

            {/* Price Adjustment */}
            <TextField
              label='Điều chỉnh giá'
              type='number'
              value={formData.priceAdjustment}
              onChange={e => setFormData(prev => ({ ...prev, priceAdjustment: Number(e.target.value) }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <MoneyIcon />
                  </InputAdornment>
                ),
                endAdornment: <InputAdornment position='end'>đ</InputAdornment>
              }}
              fullWidth
              helperText='Số tiền tăng/giảm so với giá gốc (âm = giảm, dương = tăng)'
            />

            {/* Description */}
            <TextField
              label='Mô tả (tùy chọn)'
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={2}
              fullWidth
              helperText='Mô tả chi tiết về giá trị này'
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Hủy</Button>
          <Button
            onClick={handleSaveValue}
            variant='contained'
            disabled={!formData.value.trim() || !formData.label.trim()}
          >
            {editingValue ? 'Cập nhật' : 'Thêm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttributeValueManager;

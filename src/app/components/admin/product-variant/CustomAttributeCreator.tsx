'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  IconButton,
  Alert,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Palette as PaletteIcon,
  List as ListIcon,
  Numbers as NumbersIcon,
  TextFields as TextIcon
} from '@mui/icons-material';
import { AttributeType, GlobalAttribute, AttributeFormData } from './types';

interface CustomAttributeCreatorProps {
  open: boolean;
  onClose: () => void;
  onCreate: (attribute: GlobalAttribute) => void;
}

const CustomAttributeCreator: React.FC<CustomAttributeCreatorProps> = ({ open, onClose, onCreate }) => {
  const [formData, setFormData] = useState<AttributeFormData>({
    name: '',
    label: '',
    type: AttributeType.SELECT,
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên thuộc tính là bắt buộc';
    } else if (!/^[a-z_][a-z0-9_]*$/.test(formData.name)) {
      newErrors.name = 'Tên thuộc tính chỉ được chứa chữ thường, số và dấu gạch dưới, bắt đầu bằng chữ cái';
    }

    if (!formData.label.trim()) {
      newErrors.label = 'Nhãn hiển thị là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Create new global attribute
      const newAttribute: GlobalAttribute = {
        id: `custom_${Date.now()}`, // Will be replaced by backend
        name: formData.name.trim(),
        label: formData.label.trim(),
        type: formData.type,
        description: formData.description?.trim() || undefined,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      onCreate(newAttribute);
      handleClose();
    } catch (error) {
      console.error('Error creating attribute:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    setFormData({
      name: '',
      label: '',
      type: AttributeType.SELECT,
      description: ''
    });
    setErrors({});
    onClose();
  };

  // Auto-generate name from label
  const handleLabelChange = (label: string) => {
    setFormData(prev => ({
      ...prev,
      label,
      name: prev.name || generateNameFromLabel(label)
    }));
  };

  const generateNameFromLabel = (label: string): string => {
    return label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
  };

  // Get attribute type info
  const getAttributeTypeInfo = (type: AttributeType) => {
    switch (type) {
      case AttributeType.COLOR:
        return {
          icon: <PaletteIcon />,
          color: '#f44336',
          label: 'Màu sắc',
          description: 'Thuộc tính màu sắc với color picker và mã hex'
        };
      case AttributeType.SELECT:
        return {
          icon: <ListIcon />,
          color: '#2196f3',
          label: 'Lựa chọn',
          description: 'Danh sách các tùy chọn có sẵn để khách hàng chọn'
        };
      case AttributeType.NUMBER:
        return {
          icon: <NumbersIcon />,
          color: '#ff9800',
          label: 'Số',
          description: 'Thuộc tính số cho phép nhập giá trị số'
        };
      case AttributeType.TEXT:
        return {
          icon: <TextIcon />,
          color: '#4caf50',
          label: 'Văn bản',
          description: 'Thuộc tính văn bản cho phép nhập text tự do'
        };
      default:
        return {
          icon: <ListIcon />,
          color: '#9e9e9e',
          label: 'Khác',
          description: ''
        };
    }
  };

  const attributeTypes = [AttributeType.SELECT, AttributeType.COLOR, AttributeType.TEXT, AttributeType.NUMBER];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant='h6' sx={{ fontWeight: 600 }}>
            Tạo thuộc tính mới
          </Typography>
          <IconButton onClick={handleClose} size='small'>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          {/* Label */}
          <TextField
            label='Nhãn hiển thị'
            value={formData.label}
            onChange={e => handleLabelChange(e.target.value)}
            error={!!errors.label}
            helperText={errors.label || 'Tên hiển thị cho khách hàng (VD: Màu sắc, Dung lượng)'}
            fullWidth
            required
          />

          {/* Name */}
          <TextField
            label='Tên thuộc tính'
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            error={!!errors.name}
            helperText={errors.name || 'Tên kỹ thuật (VD: color, storage). Chỉ chữ thường, số và dấu gạch dưới'}
            fullWidth
            required
          />

          {/* Type Selection */}
          <Box>
            <Typography variant='subtitle2' sx={{ mb: 2, fontWeight: 600 }}>
              Loại thuộc tính
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {attributeTypes.map(type => {
                const typeInfo = getAttributeTypeInfo(type);
                const isSelected = formData.type === type;

                return (
                  <Card
                    key={type}
                    sx={{
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
                      backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
                      '&:hover': {
                        borderColor: '#1976d2',
                        backgroundColor: 'rgba(25, 118, 210, 0.04)'
                      }
                    }}
                    onClick={() => setFormData(prev => ({ ...prev, type }))}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {typeInfo.icon}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                            {typeInfo.label}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {typeInfo.description}
                          </Typography>
                        </Box>
                        {isSelected && <Chip label='Đã chọn' size='small' color='primary' />}
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </Box>

          {/* Description */}
          <TextField
            label='Mô tả (tùy chọn)'
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            multiline
            rows={3}
            helperText='Mô tả chi tiết về thuộc tính này'
            fullWidth
          />

          {/* Preview */}
          {formData.label && (
            <Alert severity='info'>
              <Typography variant='body2'>
                <strong>Xem trước:</strong> Thuộc tính &quot;{formData.label}&quot; ({formData.name}) sẽ được tạo với
                loại {getAttributeTypeInfo(formData.type).label.toLowerCase()}.
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} variant='outlined'>
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          disabled={isLoading || !formData.label.trim() || !formData.name.trim()}
        >
          {isLoading ? 'Đang tạo...' : 'Tạo thuộc tính'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomAttributeCreator;

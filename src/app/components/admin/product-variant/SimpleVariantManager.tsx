'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  IconButton,
  Divider
} from '@mui/material';
import { MdAdd, MdDelete } from 'react-icons/md';

interface VariantOption {
  id: string;
  attribute: string;
  value: string;
}

interface SimpleVariantManagerProps {
  onVariantsChange: (variants: VariantOption[]) => void;
}

const SimpleVariantManager: React.FC<SimpleVariantManagerProps> = ({ onVariantsChange }) => {
  const [variants, setVariants] = useState<VariantOption[]>([
    { id: '1', attribute: '', value: '' }
  ]);

  const attributeOptions = [
    { value: 'color', label: 'Màu sắc' },
    { value: 'size', label: 'Kích thước' },
    { value: 'weight', label: 'Trọng lượng' },
    { value: 'storage', label: 'Dung lượng' },
    { value: 'ram', label: 'RAM' },
    { value: 'material', label: 'Chất liệu' }
  ];

  const addVariant = () => {
    const newVariant: VariantOption = {
      id: Date.now().toString(),
      attribute: '',
      value: ''
    };
    const updatedVariants = [...variants, newVariant];
    setVariants(updatedVariants);
    onVariantsChange(updatedVariants);
  };

  const removeVariant = (id: string) => {
    const updatedVariants = variants.filter(v => v.id !== id);
    setVariants(updatedVariants);
    onVariantsChange(updatedVariants);
  };

  const updateVariant = (id: string, field: 'attribute' | 'value', newValue: string) => {
    const updatedVariants = variants.map(v => 
      v.id === id ? { ...v, [field]: newValue } : v
    );
    setVariants(updatedVariants);
    onVariantsChange(updatedVariants);
  };

  return (
    <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
      <Typography variant='h6' sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
        Biến thể sản phẩm
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {variants.map((variant, index) => (
          <Box key={variant.id} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Chọn thuộc tính</InputLabel>
              <Select
                value={variant.attribute}
                label="Chọn thuộc tính"
                onChange={(e) => updateVariant(variant.id, 'attribute', e.target.value)}
                sx={{ borderRadius: '8px' }}
              >
                {attributeOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Giá trị thuộc tính"
              placeholder="Ví dụ: Đỏ, XL, 64GB..."
              value={variant.value}
              onChange={(e) => updateVariant(variant.id, 'value', e.target.value)}
              sx={{ 
                flex: 1,
                '& .MuiOutlinedInput-root': { borderRadius: '8px' }
              }}
            />

            {variants.length > 1 && (
              <IconButton 
                onClick={() => removeVariant(variant.id)}
                sx={{ color: '#ef4444' }}
              >
                <MdDelete size={20} />
              </IconButton>
            )}
          </Box>
        ))}

        <Button
          variant="outlined"
          startIcon={<MdAdd />}
          onClick={addVariant}
          sx={{
            mt: 2,
            borderColor: '#ef4444',
            color: '#ef4444',
            '&:hover': {
              borderColor: '#dc2626',
              backgroundColor: '#fef2f2'
            }
          }}
        >
          Thêm thuộc tính khác
        </Button>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Inventory Section */}
      <Box>
        <Typography variant='h6' sx={{ fontWeight: 600, mb: 2, color: '#1f2937' }}>
          Quản lý tồn kho
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<MdAdd />}
            sx={{
              backgroundColor: '#ef4444',
              '&:hover': {
                backgroundColor: '#dc2626'
              }
            }}
          >
            Nhập kho
          </Button>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              📦 Vận chuyển
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              🌍 Giao hàng toàn cầu
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              ⚙️ Thuộc tính
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              🔧 Nâng cao
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Thêm vào kho"
            sx={{ 
              flex: 1,
              '& .MuiOutlinedInput-root': { borderRadius: '8px' }
            }}
          />
          <Button
            variant="contained"
            sx={{
              backgroundColor: '#ef4444',
              '&:hover': {
                backgroundColor: '#dc2626'
              }
            }}
          >
            ✓ Xác nhận
          </Button>
        </Box>

        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Sản phẩm trong kho hiện tại: 54
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sản phẩm đang vận chuyển: 390
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Lần nhập kho cuối: 24th June, 2022
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tổng tồn kho từ trước đến nay: 2,430
          </Typography>
        </Box>
      </Box>
    </Card>
  );
};

export default SimpleVariantManager;

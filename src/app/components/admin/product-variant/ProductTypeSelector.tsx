'use client';

import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography } from '@mui/material';
import { MdInventory, MdTune } from 'react-icons/md';
import { ProductType } from './types';

interface ProductTypeSelectorProps {
  selectedType: ProductType;
  onChange: (type: ProductType) => void;
  disabled?: boolean;
}

const ProductTypeSelector: React.FC<ProductTypeSelectorProps> = ({ 
  selectedType, 
  onChange, 
  disabled = false 
}) => {
  return (
    <FormControl fullWidth size="small">
      <InputLabel>Loại sản phẩm</InputLabel>
      <Select
        value={selectedType}
        label="Loại sản phẩm"
        onChange={(e) => onChange(e.target.value as ProductType)}
        disabled={disabled}
        sx={{ borderRadius: '12px' }}
      >
        <MenuItem value={ProductType.SIMPLE}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <MdInventory size={20} color="#6b7280" />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Sản phẩm đơn
              </Typography>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                Sản phẩm không có biến thể
              </Typography>
            </Box>
          </Box>
        </MenuItem>
        <MenuItem value={ProductType.VARIANT}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <MdTune size={20} color="#6b7280" />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Sản phẩm biến thể
              </Typography>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                Sản phẩm có nhiều lựa chọn
              </Typography>
            </Box>
          </Box>
        </MenuItem>
      </Select>
    </FormControl>
  );
};

export default ProductTypeSelector;

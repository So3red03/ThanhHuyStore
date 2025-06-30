'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Grid,
  Chip
} from '@mui/material';
import {
  Inventory as SimpleIcon,
  Tune as VariantIcon
} from '@mui/icons-material';
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
  const productTypes = [
    {
      value: ProductType.SIMPLE,
      label: 'Sản phẩm đơn giản',
      description: 'Sản phẩm có một giá và một số lượng tồn kho duy nhất',
      icon: <SimpleIcon sx={{ fontSize: 40, color: '#2196f3' }} />,
      features: [
        'Một giá duy nhất',
        'Một số lượng tồn kho',
        'Không có biến thể',
        'Dễ quản lý'
      ],
      recommended: false
    },
    {
      value: ProductType.VARIANT,
      label: 'Sản phẩm biến thể',
      description: 'Sản phẩm có nhiều biến thể với các thuộc tính khác nhau (màu sắc, kích thước, v.v.)',
      icon: <VariantIcon sx={{ fontSize: 40, color: '#ff9800' }} />,
      features: [
        'Nhiều biến thể',
        'Thuộc tính tùy chỉnh',
        'Giá và tồn kho riêng biệt',
        'Linh hoạt cao'
      ],
      recommended: true
    }
  ];

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        Loại sản phẩm
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Chọn loại sản phẩm phù hợp với nhu cầu của bạn
      </Typography>

      <FormControl component="fieldset" fullWidth disabled={disabled}>
        <RadioGroup
          value={selectedType}
          onChange={(e) => onChange(e.target.value as ProductType)}
        >
          <Grid container spacing={3}>
            {productTypes.map((type) => (
              <Grid item xs={12} md={6} key={type.value}>
                <Card 
                  sx={{ 
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    border: selectedType === type.value 
                      ? '2px solid #1976d2' 
                      : '1px solid #e0e0e0',
                    backgroundColor: selectedType === type.value 
                      ? 'rgba(25, 118, 210, 0.04)' 
                      : 'transparent',
                    opacity: disabled ? 0.6 : 1,
                    '&:hover': disabled ? {} : {
                      borderColor: '#1976d2',
                      backgroundColor: 'rgba(25, 118, 210, 0.04)'
                    },
                    height: '100%'
                  }}
                  onClick={() => !disabled && onChange(type.value)}
                >
                  <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      <FormControlLabel
                        value={type.value}
                        control={<Radio />}
                        label=""
                        sx={{ m: 0 }}
                      />
                      
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          {type.icon}
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {type.label}
                              </Typography>
                              {type.recommended && (
                                <Chip 
                                  label="Khuyến nghị" 
                                  size="small" 
                                  color="primary"
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                              )}
                            </Box>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ lineHeight: 1.4 }}
                            >
                              {type.description}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Features */}
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            Tính năng:
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {type.features.map((feature, index) => (
                              <Typography 
                                key={index}
                                variant="body2" 
                                color="text.secondary"
                                sx={{ 
                                  fontSize: '0.875rem',
                                  '&:before': {
                                    content: '"•"',
                                    marginRight: 1,
                                    color: '#1976d2'
                                  }
                                }}
                              >
                                {feature}
                              </Typography>
                            ))}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </RadioGroup>
      </FormControl>

      {/* Additional Info */}
      <Box sx={{ mt: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Lưu ý:</strong> Bạn có thể thay đổi loại sản phẩm sau khi tạo, 
          nhưng việc chuyển từ sản phẩm biến thể sang đơn giản sẽ xóa tất cả dữ liệu biến thể.
        </Typography>
      </Box>
    </Box>
  );
};

export default ProductTypeSelector;

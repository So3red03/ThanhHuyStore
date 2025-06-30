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
  Chip,
  Grid
} from '@mui/material';
import {
  RadioButtonChecked as ButtonIcon,
  ArrowDropDown as DropdownIcon,
  Circle as ColorSwatchIcon,
  TextFields as TextIcon,
  CheckBox as CheckboxIcon,
  RadioButtonUnchecked as RadioIcon
} from '@mui/icons-material';
import { AttributeType, DisplayType } from './types';

interface DisplayTypeSelectorProps {
  attributeType: AttributeType;
  selectedDisplayType: DisplayType;
  onChange: (displayType: DisplayType) => void;
}

const DisplayTypeSelector: React.FC<DisplayTypeSelectorProps> = ({
  attributeType,
  selectedDisplayType,
  onChange
}) => {
  // Get available display types based on attribute type
  const getAvailableDisplayTypes = (type: AttributeType): DisplayTypeOption[] => {
    const baseOptions: DisplayTypeOption[] = [
      {
        value: DisplayType.BUTTON,
        label: 'Nút riêng biệt',
        description: 'Hiển thị mỗi giá trị như một nút riêng biệt (như hình 1)',
        icon: <ButtonIcon />,
        recommended: true
      },
      {
        value: DisplayType.DROPDOWN,
        label: 'Menu thả xuống',
        description: 'Hiển thị tất cả giá trị trong menu dropdown (như hình 2)',
        icon: <DropdownIcon />
      },
      {
        value: DisplayType.RADIO,
        label: 'Nút radio',
        description: 'Hiển thị như radio buttons',
        icon: <RadioIcon />
      }
    ];

    switch (type) {
      case AttributeType.COLOR:
        return [
          {
            value: DisplayType.COLOR_SWATCH,
            label: 'Vòng tròn màu',
            description: 'Hiển thị màu sắc dưới dạng vòng tròn có thể click',
            icon: <ColorSwatchIcon />,
            recommended: true
          },
          ...baseOptions
        ];
      
      case AttributeType.TEXT:
        return [
          {
            value: DisplayType.TEXT_INPUT,
            label: 'Nhập văn bản',
            description: 'Cho phép khách hàng nhập văn bản tự do',
            icon: <TextIcon />,
            recommended: true
          },
          ...baseOptions
        ];
      
      case AttributeType.SELECT:
        return [
          ...baseOptions,
          {
            value: DisplayType.CHECKBOX,
            label: 'Checkbox (nhiều lựa chọn)',
            description: 'Cho phép chọn nhiều giá trị cùng lúc',
            icon: <CheckboxIcon />
          }
        ];
      
      case AttributeType.NUMBER:
        return [
          {
            value: DisplayType.TEXT_INPUT,
            label: 'Nhập số',
            description: 'Cho phép khách hàng nhập số',
            icon: <TextIcon />,
            recommended: true
          },
          ...baseOptions
        ];
      
      default:
        return baseOptions;
    }
  };

  const availableOptions = getAvailableDisplayTypes(attributeType);

  return (
    <FormControl component="fieldset" fullWidth>
      <RadioGroup
        value={selectedDisplayType}
        onChange={(e) => onChange(e.target.value as DisplayType)}
      >
        <Grid container spacing={2}>
          {availableOptions.map((option) => (
            <Grid item xs={12} sm={6} key={option.value}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: selectedDisplayType === option.value 
                    ? '2px solid #1976d2' 
                    : '1px solid #e0e0e0',
                  backgroundColor: selectedDisplayType === option.value 
                    ? 'rgba(25, 118, 210, 0.04)' 
                    : 'transparent',
                  '&:hover': {
                    borderColor: '#1976d2',
                    backgroundColor: 'rgba(25, 118, 210, 0.04)'
                  }
                }}
                onClick={() => onChange(option.value)}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <FormControlLabel
                      value={option.value}
                      control={<Radio size="small" />}
                      label=""
                      sx={{ m: 0 }}
                    />
                    
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {option.icon}
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {option.label}
                        </Typography>
                        {option.recommended && (
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
                        sx={{ fontSize: '0.875rem', lineHeight: 1.4 }}
                      >
                        {option.description}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </RadioGroup>
    </FormControl>
  );
};

interface DisplayTypeOption {
  value: DisplayType;
  label: string;
  description: string;
  icon: React.ReactNode;
  recommended?: boolean;
}

export default DisplayTypeSelector;

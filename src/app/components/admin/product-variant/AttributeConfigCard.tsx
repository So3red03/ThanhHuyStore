'use client';

import React, { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Collapse,
  Divider,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { AttributeConfigCardProps, DisplayType, AttributeType } from './types';
import DisplayTypeSelector from './DisplayTypeSelector';
import AttributeValueManager from './AttributeValueManager';

const AttributeConfigCard: React.FC<AttributeConfigCardProps> = ({
  attribute,
  globalAttribute,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Handle attribute updates
  const handleDisplayTypeChange = useCallback(
    (displayType: DisplayType) => {
      onUpdate({
        ...attribute,
        displayType
      });
    },
    [attribute, onUpdate]
  );

  const handleRequiredChange = useCallback(
    (isRequired: boolean) => {
      onUpdate({
        ...attribute,
        isRequired
      });
    },
    [attribute, onUpdate]
  );

  const handleVariationChange = useCallback(
    (isVariation: boolean) => {
      onUpdate({
        ...attribute,
        isVariation
      });
    },
    [attribute, onUpdate]
  );

  const handleCustomLabelChange = useCallback(
    (customLabel: string) => {
      onUpdate({
        ...attribute,
        customLabel: customLabel.trim() || undefined
      });
    },
    [attribute, onUpdate]
  );

  const handleValuesChange = useCallback(
    (values: any[]) => {
      onUpdate({
        ...attribute,
        values
      });
    },
    [attribute, onUpdate]
  );

  // Get display label
  const displayLabel = attribute.customLabel || globalAttribute.label;

  // Get attribute type icon/color
  const getAttributeTypeInfo = (type: AttributeType) => {
    switch (type) {
      case AttributeType.COLOR:
        return { color: '#f44336', label: 'Màu sắc' };
      case AttributeType.SELECT:
        return { color: '#2196f3', label: 'Lựa chọn' };
      case AttributeType.NUMBER:
        return { color: '#ff9800', label: 'Số' };
      case AttributeType.TEXT:
        return { color: '#4caf50', label: 'Văn bản' };
      default:
        return { color: '#9e9e9e', label: 'Khác' };
    }
  };

  const typeInfo = getAttributeTypeInfo(globalAttribute.type);

  return (
    <Card
      sx={{
        border: '1px solid #e0e0e0',
        '&:hover': {
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }
      }}
    >
      <CardContent sx={{ pb: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Typography variant='h6' sx={{ fontWeight: 600 }}>
              {displayLabel}
            </Typography>
            <Chip
              label={typeInfo.label}
              size='small'
              sx={{
                backgroundColor: typeInfo.color,
                color: 'white',
                fontWeight: 500
              }}
            />
            {globalAttribute.name && (
              <Chip label={globalAttribute.name} size='small' variant='outlined' sx={{ fontSize: '0.75rem' }} />
            )}
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title='Di chuyển lên'>
              <IconButton size='small' onClick={() => onMoveUp(attribute.id)}>
                <ArrowUpIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title='Di chuyển xuống'>
              <IconButton size='small' onClick={() => onMoveDown(attribute.id)}>
                <ArrowDownIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title='Xóa thuộc tính'>
              <IconButton size='small' onClick={() => onDelete(attribute.id)} sx={{ color: '#f44336' }}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <IconButton size='small' onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Quick Info */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Chip
            label={attribute.isRequired ? 'Bắt buộc' : 'Tùy chọn'}
            size='small'
            color={attribute.isRequired ? 'error' : 'default'}
            variant='outlined'
          />
          <Chip
            label={attribute.isVariation ? 'Dùng cho biến thể' : 'Chỉ hiển thị'}
            size='small'
            color={attribute.isVariation ? 'primary' : 'default'}
            variant='outlined'
          />
          <Chip label={`Hiển thị: ${getDisplayTypeLabel(attribute.displayType)}`} size='small' variant='outlined' />
        </Box>

        {/* Expanded Content */}
        <Collapse in={expanded}>
          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Custom Label */}
            <TextField
              label='Tên hiển thị tùy chỉnh'
              value={attribute.customLabel || ''}
              onChange={e => handleCustomLabelChange(e.target.value)}
              placeholder={globalAttribute.label}
              size='small'
              fullWidth
              helperText='Để trống để sử dụng tên mặc định từ thư viện'
            />

            {/* Display Type Selector */}
            <Box>
              <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600 }}>
                Kiểu hiển thị
              </Typography>
              <DisplayTypeSelector
                attributeType={globalAttribute.type}
                selectedDisplayType={attribute.displayType}
                onChange={handleDisplayTypeChange}
              />
            </Box>

            {/* Settings */}
            <Box sx={{ display: 'flex', gap: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={attribute.isRequired}
                    onChange={e => handleRequiredChange(e.target.checked)}
                    color='primary'
                  />
                }
                label='Bắt buộc'
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={attribute.isVariation}
                    onChange={e => handleVariationChange(e.target.checked)}
                    color='primary'
                  />
                }
                label='Dùng cho biến thể'
              />
            </Box>

            {/* Attribute Values */}
            <Box>
              <Typography variant='subtitle2' sx={{ mb: 2, fontWeight: 600 }}>
                Giá trị thuộc tính
              </Typography>
              <AttributeValueManager
                attribute={attribute}
                globalAttribute={globalAttribute}
                onValuesChange={handleValuesChange}
              />
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

// Helper function to get display type label
const getDisplayTypeLabel = (displayType: DisplayType): string => {
  switch (displayType) {
    case DisplayType.BUTTON:
      return 'Nút riêng biệt';
    case DisplayType.DROPDOWN:
      return 'Menu thả xuống';
    case DisplayType.COLOR_SWATCH:
      return 'Vòng tròn màu';
    case DisplayType.TEXT_INPUT:
      return 'Nhập văn bản';
    case DisplayType.RADIO:
      return 'Nút radio';
    case DisplayType.CHECKBOX:
      return 'Checkbox';
    default:
      return 'Không xác định';
  }
};

export default AttributeConfigCard;

'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Divider,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Palette as PaletteIcon,
  List as ListIcon,
  Numbers as NumbersIcon,
  TextFields as TextIcon
} from '@mui/icons-material';
import { GlobalAttribute, AttributeType } from './types';

interface GlobalAttributeSelectorProps {
  open: boolean;
  onClose: () => void;
  globalAttributes: GlobalAttribute[];
  usedAttributeIds: string[];
  onSelect: (attribute: GlobalAttribute) => void;
}

const GlobalAttributeSelector: React.FC<GlobalAttributeSelectorProps> = ({
  open,
  onClose,
  globalAttributes,
  usedAttributeIds,
  onSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<AttributeType | 'ALL'>('ALL');

  // Filter available attributes (not already used)
  const availableAttributes = useMemo(() => {
    return globalAttributes.filter(attr => !usedAttributeIds.includes(attr.id));
  }, [globalAttributes, usedAttributeIds]);

  // Filter by search and type
  const filteredAttributes = useMemo(() => {
    let filtered = availableAttributes;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(attr => 
        attr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attr.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (attr.description && attr.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by type
    if (selectedType !== 'ALL') {
      filtered = filtered.filter(attr => attr.type === selectedType);
    }

    return filtered;
  }, [availableAttributes, searchTerm, selectedType]);

  const handleSelect = (attribute: GlobalAttribute) => {
    onSelect(attribute);
    setSearchTerm('');
    setSelectedType('ALL');
  };

  const handleClose = () => {
    onClose();
    setSearchTerm('');
    setSelectedType('ALL');
  };

  // Get attribute type info
  const getAttributeTypeInfo = (type: AttributeType) => {
    switch (type) {
      case AttributeType.COLOR:
        return { icon: <PaletteIcon />, color: '#f44336', label: 'Màu sắc' };
      case AttributeType.SELECT:
        return { icon: <ListIcon />, color: '#2196f3', label: 'Lựa chọn' };
      case AttributeType.NUMBER:
        return { icon: <NumbersIcon />, color: '#ff9800', label: 'Số' };
      case AttributeType.TEXT:
        return { icon: <TextIcon />, color: '#4caf50', label: 'Văn bản' };
      default:
        return { icon: <ListIcon />, color: '#9e9e9e', label: 'Khác' };
    }
  };

  const attributeTypes = [
    { value: 'ALL', label: 'Tất cả', count: availableAttributes.length },
    { value: AttributeType.COLOR, label: 'Màu sắc', count: availableAttributes.filter(a => a.type === AttributeType.COLOR).length },
    { value: AttributeType.SELECT, label: 'Lựa chọn', count: availableAttributes.filter(a => a.type === AttributeType.SELECT).length },
    { value: AttributeType.NUMBER, label: 'Số', count: availableAttributes.filter(a => a.type === AttributeType.NUMBER).length },
    { value: AttributeType.TEXT, label: 'Văn bản', count: availableAttributes.filter(a => a.type === AttributeType.TEXT).length }
  ];

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Chọn thuộc tính từ thư viện
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Search and Filter */}
        <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
          <TextField
            fullWidth
            placeholder="Tìm kiếm thuộc tính..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{ mb: 2 }}
          />

          {/* Type Filter */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {attributeTypes.map((type) => (
              <Chip
                key={type.value}
                label={`${type.label} (${type.count})`}
                onClick={() => setSelectedType(type.value as AttributeType | 'ALL')}
                color={selectedType === type.value ? 'primary' : 'default'}
                variant={selectedType === type.value ? 'filled' : 'outlined'}
                size="small"
              />
            ))}
          </Box>
        </Box>

        {/* Attributes List */}
        <Box sx={{ p: 3, height: 'calc(100% - 140px)', overflow: 'auto' }}>
          {filteredAttributes.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              {availableAttributes.length === 0 
                ? 'Tất cả thuộc tính có sẵn đã được sử dụng.'
                : 'Không tìm thấy thuộc tính nào phù hợp với bộ lọc.'
              }
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {filteredAttributes.map((attribute) => {
                const typeInfo = getAttributeTypeInfo(attribute.type);
                
                return (
                  <Grid item xs={12} sm={6} key={attribute.id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        border: '1px solid #e0e0e0',
                        '&:hover': {
                          borderColor: '#1976d2',
                          backgroundColor: 'rgba(25, 118, 210, 0.04)'
                        }
                      }}
                      onClick={() => handleSelect(attribute)}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {typeInfo.icon}
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {attribute.label}
                            </Typography>
                          </Box>
                          <IconButton size="small" color="primary">
                            <AddIcon />
                          </IconButton>
                        </Box>

                        <Box sx={{ mb: 1 }}>
                          <Chip 
                            label={typeInfo.label}
                            size="small"
                            sx={{ 
                              backgroundColor: typeInfo.color,
                              color: 'white',
                              fontSize: '0.75rem'
                            }}
                          />
                          <Chip 
                            label={attribute.name}
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1, fontSize: '0.75rem' }}
                          />
                        </Box>

                        {attribute.description && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: '0.875rem', lineHeight: 1.4 }}
                          >
                            {attribute.description}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
        <Button onClick={handleClose} variant="outlined">
          Hủy
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GlobalAttributeSelector;

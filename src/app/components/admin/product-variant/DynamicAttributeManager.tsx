'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Button as MuiButton,
  Card,
  Grid,
  Chip,
  IconButton,
  InputLabel
} from '@mui/material';
import { MdAdd, MdDelete, MdEdit } from 'react-icons/md';

export interface AttributeValue {
  id: string;
  value: string;
  label: string;
}

export interface ProductAttribute {
  id: string;
  name: string;
  slug: string;
  values: AttributeValue[];
  isUsedForVariations: boolean;
}

export interface VariationCombination {
  id: string;
  attributes: Record<string, string>; // { color: 'blue', storage: '256gb' }
  price?: number;
  stock?: number;
  sku?: string;
  images?: string[];
  isActive: boolean;
}

interface DynamicAttributeManagerProps {
  attributes: ProductAttribute[];
  variations: VariationCombination[];
  onAttributesChange: (attributes: ProductAttribute[]) => void;
  onVariationsChange: (variations: VariationCombination[]) => void;
}

const DynamicAttributeManager: React.FC<DynamicAttributeManagerProps> = ({
  attributes,
  variations,
  onAttributesChange,
  onVariationsChange
}) => {
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [newAttributeName, setNewAttributeName] = useState('');
  const [newAttributeValues, setNewAttributeValues] = useState<string>('');

  // Generate all possible variations from selected attributes
  const generateVariations = () => {
    const selectedAttrs = attributes.filter(attr => 
      selectedAttributes.includes(attr.id) && attr.values.length > 0
    );

    if (selectedAttrs.length === 0) {
      onVariationsChange([]);
      return;
    }

    // Generate cartesian product of all attribute values
    const combinations: VariationCombination[] = [];
    
    const generateCombinations = (
      attrIndex: number, 
      currentCombination: Record<string, string>
    ) => {
      if (attrIndex === selectedAttrs.length) {
        const id = Object.values(currentCombination).join('-');
        combinations.push({
          id,
          attributes: { ...currentCombination },
          isActive: true
        });
        return;
      }

      const currentAttr = selectedAttrs[attrIndex];
      currentAttr.values.forEach(value => {
        generateCombinations(attrIndex + 1, {
          ...currentCombination,
          [currentAttr.slug]: value.value
        });
      });
    };

    generateCombinations(0, {});
    onVariationsChange(combinations);
  };

  // Add new attribute
  const addAttribute = () => {
    if (!newAttributeName.trim()) return;

    const slug = newAttributeName.toLowerCase().replace(/\s+/g, '-');
    const values = newAttributeValues
      .split(',')
      .map(v => v.trim())
      .filter(v => v)
      .map((value, index) => ({
        id: `${slug}-${index}`,
        value: value.toLowerCase().replace(/\s+/g, '-'),
        label: value
      }));

    const newAttribute: ProductAttribute = {
      id: `attr-${Date.now()}`,
      name: newAttributeName,
      slug,
      values,
      isUsedForVariations: true
    };

    onAttributesChange([...attributes, newAttribute]);
    setNewAttributeName('');
    setNewAttributeValues('');
  };

  // Remove attribute
  const removeAttribute = (attributeId: string) => {
    const updatedAttributes = attributes.filter(attr => attr.id !== attributeId);
    onAttributesChange(updatedAttributes);
    
    // Remove from selected attributes
    setSelectedAttributes(prev => prev.filter(id => id !== attributeId));
  };

  // Update variation
  const updateVariation = (variationId: string, updates: Partial<VariationCombination>) => {
    const updatedVariations = variations.map(variation =>
      variation.id === variationId ? { ...variation, ...updates } : variation
    );
    onVariationsChange(updatedVariations);
  };

  return (
    <Box>
      {/* Attribute Management */}
      <Card sx={{ p: 3, mb: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <Typography variant='h6' sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
          Quản lý thuộc tính
        </Typography>

        {/* Add New Attribute */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label='Tên thuộc tính'
              value={newAttributeName}
              onChange={(e) => setNewAttributeName(e.target.value)}
              placeholder='VD: Màu sắc, Dung lượng'
              size='small'
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Giá trị (phân cách bằng dấu phẩy)'
              value={newAttributeValues}
              onChange={(e) => setNewAttributeValues(e.target.value)}
              placeholder='VD: Xanh, Đen, Trắng'
              size='small'
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <MuiButton
              fullWidth
              variant='contained'
              onClick={addAttribute}
              startIcon={<MdAdd />}
              sx={{
                backgroundColor: '#3b82f6',
                '&:hover': { backgroundColor: '#2563eb' },
                height: '40px'
              }}
            >
              Thêm
            </MuiButton>
          </Grid>
        </Grid>

        {/* Existing Attributes */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {attributes.map(attribute => (
            <Card key={attribute.id} sx={{ p: 2, border: '1px solid #e5e7eb' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                  {attribute.name}
                </Typography>
                <IconButton
                  size='small'
                  onClick={() => removeAttribute(attribute.id)}
                  sx={{ color: '#ef4444' }}
                >
                  <MdDelete />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {attribute.values.map(value => (
                  <Chip
                    key={value.id}
                    label={value.label}
                    size='small'
                    sx={{ backgroundColor: '#f3f4f6' }}
                  />
                ))}
              </Box>
            </Card>
          ))}
        </Box>
      </Card>

      {/* Attribute Selection for Variations */}
      <Card sx={{ p: 3, mb: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <Typography variant='h6' sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
          Chọn thuộc tính cho biến thể
        </Typography>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Thuộc tính sử dụng cho biến thể</InputLabel>
          <Select
            multiple
            value={selectedAttributes}
            onChange={(e) => setSelectedAttributes(e.target.value as string[])}
            label='Thuộc tính sử dụng cho biến thể'
            sx={{ borderRadius: '6px' }}
          >
            {attributes.map(attribute => (
              <MenuItem key={attribute.id} value={attribute.id}>
                {attribute.name} ({attribute.values.length} giá trị)
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <MuiButton
          variant='contained'
          onClick={generateVariations}
          disabled={selectedAttributes.length === 0}
          sx={{
            backgroundColor: '#3b82f6',
            '&:hover': { backgroundColor: '#2563eb' }
          }}
        >
          Tạo biến thể ({selectedAttributes.length} thuộc tính)
        </MuiButton>
      </Card>

      {/* Generated Variations */}
      {variations.length > 0 && (
        <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <Typography variant='h6' sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
            Biến thể sản phẩm ({variations.length})
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {variations.map(variation => (
              <Card key={variation.id} sx={{ p: 2, border: '1px solid #e5e7eb' }}>
                <Grid container spacing={2} alignItems='center'>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {Object.entries(variation.attributes).map(([key, value]) => (
                        <Chip
                          key={key}
                          label={`${key}: ${value}`}
                          size='small'
                          sx={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}
                        />
                      ))}
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth
                      label='Giá'
                      type='number'
                      value={variation.price || ''}
                      onChange={(e) => updateVariation(variation.id, { 
                        price: parseFloat(e.target.value) || undefined 
                      })}
                      size='small'
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth
                      label='Tồn kho'
                      type='number'
                      value={variation.stock || ''}
                      onChange={(e) => updateVariation(variation.id, { 
                        stock: parseInt(e.target.value) || undefined 
                      })}
                      size='small'
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label='SKU'
                      value={variation.sku || ''}
                      onChange={(e) => updateVariation(variation.id, { sku: e.target.value })}
                      size='small'
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size='small' sx={{ color: '#3b82f6' }}>
                        <MdEdit />
                      </IconButton>
                      <IconButton 
                        size='small' 
                        sx={{ color: '#ef4444' }}
                        onClick={() => {
                          const updatedVariations = variations.filter(v => v.id !== variation.id);
                          onVariationsChange(updatedVariations);
                        }}
                      >
                        <MdDelete />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
              </Card>
            ))}
          </Box>
        </Card>
      )}
    </Box>
  );
};

export default DynamicAttributeManager;

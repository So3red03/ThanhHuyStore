'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  Chip,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AutoAwesome as AutoGenerateIcon,
  AttachMoney as MoneyIcon,
  Inventory as StockIcon
} from '@mui/icons-material';
import { VariantMatrixProps, ProductVariant, AttributeCombination, ProductAttribute } from './types';

const VariantMatrix: React.FC<VariantMatrixProps> = ({
  productId,
  attributes,
  variants,
  onVariantsChange,
  basePrice
}) => {
  const [showBulkPriceDialog, setShowBulkPriceDialog] = useState(false);
  const [showBulkStockDialog, setShowBulkStockDialog] = useState(false);
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkStock, setBulkStock] = useState('');

  // Generate all possible combinations
  const possibleCombinations = useMemo(() => {
    const variationAttributes = attributes.filter(attr => attr.isVariation && attr.values.length > 0);

    if (variationAttributes.length === 0) return [];

    const generateCombinations = (attrs: ProductAttribute[], index = 0): AttributeCombination[] => {
      if (index >= attrs.length) return [{}];

      const currentAttr = attrs[index];
      const restCombinations = generateCombinations(attrs, index + 1);
      const combinations: AttributeCombination[] = [];

      currentAttr.values.forEach(value => {
        restCombinations.forEach(restCombo => {
          combinations.push({
            [currentAttr.attributeId || currentAttr.id]: value.value,
            ...restCombo
          });
        });
      });

      return combinations;
    };

    return generateCombinations(variationAttributes);
  }, [attributes]);

  // Get attribute label by id and value
  const getAttributeLabel = useCallback(
    (attributeId: string, value: string) => {
      const attribute = attributes.find(attr => (attr.attributeId || attr.id) === attributeId);
      if (!attribute) return value;

      const attributeValue = attribute.values.find(v => v.value === value);
      return attributeValue?.label || value;
    },
    [attributes]
  );

  // Calculate variant price with adjustments
  const calculateVariantPrice = useCallback(
    (combination: AttributeCombination) => {
      let totalAdjustment = 0;

      Object.entries(combination).forEach(([attributeId, value]) => {
        const attribute = attributes.find(attr => (attr.attributeId || attr.id) === attributeId);
        if (attribute) {
          const attributeValue = attribute.values.find(v => v.value === value);
          if (attributeValue) {
            totalAdjustment += attributeValue.priceAdjustment;
          }
        }
      });

      return basePrice + totalAdjustment;
    },
    [attributes, basePrice]
  );

  // Generate SKU from combination
  const generateSKU = useCallback(
    (combination: AttributeCombination) => {
      const parts = Object.entries(combination).map(([attributeId, value]) => {
        return value.toUpperCase().substring(0, 3);
      });
      return `${productId}-${parts.join('-')}`;
    },
    [productId]
  );

  // Auto-generate all variants
  const handleAutoGenerate = useCallback(() => {
    const newVariants: ProductVariant[] = possibleCombinations.map(combination => {
      const existingVariant = variants.find(v => JSON.stringify(v.attributes) === JSON.stringify(combination));

      if (existingVariant) return existingVariant;

      return {
        id: `temp_${Date.now()}_${Math.random()}`,
        productId,
        sku: generateSKU(combination),
        attributes: combination,
        price: calculateVariantPrice(combination),
        stock: 0,
        images: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    onVariantsChange(newVariants);
  }, [possibleCombinations, variants, productId, generateSKU, calculateVariantPrice, onVariantsChange]);

  // Update variant
  const handleUpdateVariant = useCallback(
    (variantId: string, field: string, value: any) => {
      const updatedVariants = variants.map(variant =>
        variant.id === variantId ? { ...variant, [field]: value, updatedAt: new Date() } : variant
      );
      onVariantsChange(updatedVariants);
    },
    [variants, onVariantsChange]
  );

  // Delete variant
  const handleDeleteVariant = useCallback(
    (variantId: string) => {
      const updatedVariants = variants.filter(v => v.id !== variantId);
      onVariantsChange(updatedVariants);
    },
    [variants, onVariantsChange]
  );

  // Bulk update prices
  const handleBulkUpdatePrice = useCallback(() => {
    const price = parseFloat(bulkPrice);
    if (isNaN(price)) return;

    const updatedVariants = variants.map(variant => ({
      ...variant,
      price,
      updatedAt: new Date()
    }));

    onVariantsChange(updatedVariants);
    setShowBulkPriceDialog(false);
    setBulkPrice('');
  }, [variants, bulkPrice, onVariantsChange]);

  // Bulk update stock
  const handleBulkUpdateStock = useCallback(() => {
    const stock = parseInt(bulkStock);
    if (isNaN(stock)) return;

    const updatedVariants = variants.map(variant => ({
      ...variant,
      stock,
      updatedAt: new Date()
    }));

    onVariantsChange(updatedVariants);
    setShowBulkStockDialog(false);
    setBulkStock('');
  }, [variants, bulkStock, onVariantsChange]);

  // Get variation attributes for table headers
  const variationAttributes = attributes.filter(attr => attr.isVariation);

  if (variationAttributes.length === 0) {
    return (
      <Alert severity='info'>
        Chưa có thuộc tính nào được đánh dấu &quot;Dùng cho biến thể&quot;. Vui lòng cấu hình ít nhất một thuộc tính để
        tạo biến thể.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant='h6' sx={{ fontWeight: 600, mb: 1 }}>
          Ma trận biến thể
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Quản lý giá và tồn kho cho từng biến thể sản phẩm
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant='contained'
          startIcon={<AutoGenerateIcon />}
          onClick={handleAutoGenerate}
          sx={{ backgroundColor: '#2e7d32' }}
        >
          Tạo tất cả biến thể
        </Button>
        <Button
          variant='outlined'
          startIcon={<MoneyIcon />}
          onClick={() => setShowBulkPriceDialog(true)}
          disabled={variants.length === 0}
        >
          Cập nhật giá hàng loạt
        </Button>
        <Button
          variant='outlined'
          startIcon={<StockIcon />}
          onClick={() => setShowBulkStockDialog(true)}
          disabled={variants.length === 0}
        >
          Cập nhật tồn kho hàng loạt
        </Button>
      </Box>

      {/* Variants Table */}
      {variants.length === 0 ? (
        <Alert severity='info'>Chưa có biến thể nào. Nhấn &quot;Tạo tất cả biến thể&quot; để bắt đầu.</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
          <Table size='small'>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                {/* Attribute columns */}
                {variationAttributes.map(attr => (
                  <TableCell key={attr.id} sx={{ fontWeight: 600 }}>
                    {attr.customLabel || attr.label || attr.name}
                  </TableCell>
                ))}
                <TableCell sx={{ fontWeight: 600 }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Giá (đ)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tồn kho</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {variants.map(variant => (
                <TableRow key={variant.id} hover>
                  {/* Attribute values */}
                  {variationAttributes.map(attr => (
                    <TableCell key={attr.id}>
                      <Chip
                        label={getAttributeLabel(
                          attr.attributeId || attr.id,
                          variant.attributes[attr.attributeId || attr.id]
                        )}
                        size='small'
                        variant='outlined'
                      />
                    </TableCell>
                  ))}

                  {/* SKU */}
                  <TableCell>
                    <TextField
                      value={variant.sku}
                      onChange={e => handleUpdateVariant(variant.id, 'sku', e.target.value)}
                      size='small'
                      sx={{ minWidth: 120 }}
                    />
                  </TableCell>

                  {/* Price */}
                  <TableCell>
                    <TextField
                      type='number'
                      value={variant.price}
                      onChange={e => handleUpdateVariant(variant.id, 'price', parseFloat(e.target.value) || 0)}
                      size='small'
                      sx={{ minWidth: 100 }}
                    />
                  </TableCell>

                  {/* Stock */}
                  <TableCell>
                    <TextField
                      type='number'
                      value={variant.stock}
                      onChange={e => handleUpdateVariant(variant.id, 'stock', parseInt(e.target.value) || 0)}
                      size='small'
                      sx={{ minWidth: 80 }}
                    />
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Chip
                      label={variant.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      size='small'
                      color={variant.isActive ? 'success' : 'default'}
                      onClick={() => handleUpdateVariant(variant.id, 'isActive', !variant.isActive)}
                      sx={{ cursor: 'pointer' }}
                    />
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <Tooltip title='Xóa biến thể'>
                      <IconButton
                        size='small'
                        onClick={() => handleDeleteVariant(variant.id)}
                        sx={{ color: '#f44336' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Bulk Price Dialog */}
      <Dialog open={showBulkPriceDialog} onClose={() => setShowBulkPriceDialog(false)}>
        <DialogTitle>Cập nhật giá hàng loạt</DialogTitle>
        <DialogContent>
          <TextField
            label='Giá mới'
            type='number'
            value={bulkPrice}
            onChange={e => setBulkPrice(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
            helperText='Giá này sẽ được áp dụng cho tất cả biến thể'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBulkPriceDialog(false)}>Hủy</Button>
          <Button onClick={handleBulkUpdatePrice} variant='contained'>
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Stock Dialog */}
      <Dialog open={showBulkStockDialog} onClose={() => setShowBulkStockDialog(false)}>
        <DialogTitle>Cập nhật tồn kho hàng loạt</DialogTitle>
        <DialogContent>
          <TextField
            label='Số lượng tồn kho'
            type='number'
            value={bulkStock}
            onChange={e => setBulkStock(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
            helperText='Số lượng này sẽ được áp dụng cho tất cả biến thể'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBulkStockDialog(false)}>Hủy</Button>
          <Button onClick={handleBulkUpdateStock} variant='contained'>
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VariantMatrix;

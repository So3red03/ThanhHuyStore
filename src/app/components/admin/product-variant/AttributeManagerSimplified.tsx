'use client';

import React, { useState, useCallback } from 'react';
import { Box, Typography, Button, Paper, Divider, Alert, Fade } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { AttributeManagerProps, ProductAttribute, DisplayType, AttributeType } from './types';
import AttributeConfigCard from './AttributeConfigCard';
import CustomAttributeCreator from './CustomAttributeCreator';

const AttributeManagerSimplified: React.FC<AttributeManagerProps> = ({ productId, attributes, onAttributesChange }) => {
  const [showCustomCreator, setShowCustomCreator] = useState(false);

  // Add custom attribute (simplified - no global attributes)
  const handleAddCustomAttribute = useCallback(
    (attributeData: any) => {
      const newProductAttribute: ProductAttribute = {
        id: `temp_${Date.now()}`,
        productId: productId || '',
        name: attributeData.name,
        label: attributeData.label,
        type: attributeData.type,
        displayType: attributeData.type === AttributeType.COLOR ? DisplayType.COLOR_SWATCH : DisplayType.BUTTON,
        isRequired: true,
        isVariation: true,
        position: attributes.length,
        description: attributeData.description,
        values: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      onAttributesChange([...attributes, newProductAttribute]);
      setShowCustomCreator(false);
    },
    [attributes, onAttributesChange, productId]
  );

  // Update attribute
  const handleUpdateAttribute = useCallback(
    (updatedAttribute: ProductAttribute) => {
      const updatedAttributes = attributes.map(attr => (attr.id === updatedAttribute.id ? updatedAttribute : attr));
      onAttributesChange(updatedAttributes);
    },
    [attributes, onAttributesChange]
  );

  // Delete attribute
  const handleDeleteAttribute = useCallback(
    (attributeId: string) => {
      const filteredAttributes = attributes.filter(attr => attr.id !== attributeId);
      // Reorder positions
      const reorderedAttributes = filteredAttributes.map((attr, index) => ({
        ...attr,
        position: index
      }));
      onAttributesChange(reorderedAttributes);
    },
    [attributes, onAttributesChange]
  );

  // Move attribute up
  const handleMoveUp = useCallback(
    (attributeId: string) => {
      const index = attributes.findIndex(attr => attr.id === attributeId);
      if (index > 0) {
        const newAttributes = [...attributes];
        [newAttributes[index], newAttributes[index - 1]] = [newAttributes[index - 1], newAttributes[index]];
        // Update positions
        newAttributes.forEach((attr, idx) => {
          attr.position = idx;
        });
        onAttributesChange(newAttributes);
      }
    },
    [attributes, onAttributesChange]
  );

  // Move attribute down
  const handleMoveDown = useCallback(
    (attributeId: string) => {
      const index = attributes.findIndex(attr => attr.id === attributeId);
      if (index < attributes.length - 1) {
        const newAttributes = [...attributes];
        [newAttributes[index], newAttributes[index + 1]] = [newAttributes[index + 1], newAttributes[index]];
        // Update positions
        newAttributes.forEach((attr, idx) => {
          attr.position = idx;
        });
        onAttributesChange(newAttributes);
      }
    },
    [attributes, onAttributesChange]
  );

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant='h6' sx={{ fontWeight: 600, mb: 1 }}>
          Cấu hình thuộc tính sản phẩm
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Thêm và cấu hình các thuộc tính cho sản phẩm biến thể (như WooCommerce)
        </Typography>
      </Box>

      {/* Add Attribute Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant='outlined'
          startIcon={<AddIcon />}
          onClick={() => setShowCustomCreator(true)}
          sx={{
            borderColor: '#2e7d32',
            color: '#2e7d32',
            '&:hover': {
              borderColor: '#1b5e20',
              backgroundColor: 'rgba(46, 125, 50, 0.04)'
            }
          }}
        >
          Thêm thuộc tính
        </Button>
      </Box>

      {/* Attributes List */}
      {attributes.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            backgroundColor: '#f8f9fa',
            border: '2px dashed #dee2e6'
          }}
        >
          <Typography variant='body1' color='text.secondary' sx={{ mb: 2 }}>
            Chưa có thuộc tính nào được thêm
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Nhấn &quot;Thêm thuộc tính&quot; để tạo thuộc tính cho sản phẩm này (như Màu sắc, Dung lượng, v.v.)
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {attributes
            .sort((a, b) => a.position - b.position)
            .map(attribute => (
              <Fade key={attribute.id} in timeout={300}>
                <div>
                  <AttributeConfigCard
                    attribute={attribute}
                    globalAttribute={{
                      id: attribute.id,
                      name: attribute.name,
                      label: attribute.label,
                      type: attribute.type,
                      description: attribute.description,
                      isActive: true,
                      createdAt: attribute.createdAt,
                      updatedAt: attribute.updatedAt
                    }}
                    onUpdate={handleUpdateAttribute}
                    onDelete={handleDeleteAttribute}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                  />
                </div>
              </Fade>
            ))}
        </Box>
      )}

      {/* Info Alert */}
      {attributes.length > 0 && (
        <Alert severity='info' sx={{ mt: 3 }}>
          <Typography variant='body2'>
            <strong>Lưu ý:</strong> Thứ tự thuộc tính sẽ ảnh hưởng đến cách hiển thị trên trang sản phẩm. Sử dụng nút
            mũi tên để sắp xếp lại thứ tự.
          </Typography>
        </Alert>
      )}

      {/* Custom Attribute Creator Modal */}
      <CustomAttributeCreator
        open={showCustomCreator}
        onClose={() => setShowCustomCreator(false)}
        onCreate={handleAddCustomAttribute}
      />
    </Box>
  );
};

export default AttributeManagerSimplified;

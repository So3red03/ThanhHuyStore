'use client';

import React, { useState } from 'react';
import { Box, Container, Paper, Typography, Stepper, Step, StepLabel, Button, Divider } from '@mui/material';
import {
  ProductTypeSelector,
  VariantMatrix,
  ProductType,
  ProductAttribute,
  ProductVariant,
  AttributeType
} from './index';
import AttributeManagerSimplified from './AttributeManagerSimplified';

// Simplified demo - no mock data needed

const VariantProductDemo: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [productType, setProductType] = useState<ProductType>(ProductType.VARIANT);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [basePrice] = useState(50000000); // 50M VND

  const steps = ['Chọn loại sản phẩm', 'Cấu hình thuộc tính', 'Quản lý biến thể'];

  const handleNext = () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setProductType(ProductType.VARIANT);
    setAttributes([]);
    setVariants([]);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <ProductTypeSelector selectedType={productType} onChange={setProductType} />;
      case 1:
        return (
          <AttributeManagerSimplified
            productId='demo-product'
            attributes={attributes}
            onAttributesChange={setAttributes}
          />
        );
      case 2:
        return (
          <VariantMatrix
            productId='demo-product'
            attributes={attributes}
            variants={variants}
            onVariantsChange={setVariants}
            basePrice={basePrice}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth='lg' sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant='h4' sx={{ fontWeight: 600, mb: 1 }}>
            Demo: Hệ thống sản phẩm biến thể
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Trải nghiệm hệ thống quản lý sản phẩm biến thể linh hoạt như WordPress
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Divider sx={{ mb: 4 }} />

        {/* Step Content */}
        <Box sx={{ minHeight: 400 }}>{renderStepContent(activeStep)}</Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button disabled={activeStep === 0} onClick={handleBack} variant='outlined'>
            Quay lại
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button onClick={handleReset} variant='outlined' color='secondary'>
              Đặt lại
            </Button>

            {activeStep === steps.length - 1 ? (
              <Button variant='contained' color='success'>
                Hoàn thành
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                variant='contained'
                disabled={
                  (activeStep === 0 && !productType) ||
                  (activeStep === 1 && productType === ProductType.VARIANT && attributes.length === 0)
                }
              >
                Tiếp theo
              </Button>
            )}
          </Box>
        </Box>

        {/* Debug Info */}
        <Box sx={{ mt: 4, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1 }}>
            Debug Information:
          </Typography>
          <Typography variant='body2' component='pre' sx={{ fontSize: '0.8rem' }}>
            {JSON.stringify(
              {
                productType,
                attributesCount: attributes.length,
                variantsCount: variants.length,
                attributes: attributes.map(attr => ({
                  id: attr.id,
                  attributeId: attr.attributeId,
                  displayType: attr.displayType,
                  valuesCount: attr.values.length
                })),
                variants: variants.map(variant => ({
                  id: variant.id,
                  sku: variant.sku,
                  attributes: variant.attributes,
                  price: variant.price,
                  stock: variant.stock
                }))
              },
              null,
              2
            )}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default VariantProductDemo;

'use client';

import React, { useEffect, useState } from 'react';
import { Product } from '@prisma/client';
import AddProductModal from './AddProductModalNew';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  subCategories: any[];
  parentCategories: any[];
  onProductUpdated?: () => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  product,
  subCategories,
  parentCategories,
  onProductUpdated
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Transform product data for the form
  const getInitialFormData = () => {
    if (!product) return null;

    console.log('Product data for edit:', product); // Debug log

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      brand: product.brand,
      price: product.price,
      basePrice: product.basePrice,
      inStock: product.inStock,
      categoryId: product.categoryId,
      productType: product.productType,
      images: product.images || [],
      priority: product.priority || 0,
      isEdit: true
    };
  };

  const handleSuccess = () => {
    onProductUpdated?.();
    onClose();
  };

  if (!product) return null;

  return (
    <AddProductModal
      isOpen={isOpen}
      onClose={onClose}
      subCategories={subCategories}
      parentCategories={parentCategories}
      initialData={getInitialFormData()}
      onSuccess={handleSuccess}
      mode='edit'
    />
  );
};

export default EditProductModal;

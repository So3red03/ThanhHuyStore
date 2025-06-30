// Product Variant System Components
// Export all components for easy importing

// Core Components
export { default as AttributeManager } from './AttributeManager';
export { default as AttributeConfigCard } from './AttributeConfigCard';
export { default as AttributeValueManager } from './AttributeValueManager';
export { default as DisplayTypeSelector } from './DisplayTypeSelector';
export { default as GlobalAttributeSelector } from './GlobalAttributeSelector';
export { default as CustomAttributeCreator } from './CustomAttributeCreator';

// Variant Management
export { default as VariantMatrix } from './VariantMatrix';
export { default as ProductTypeSelector } from './ProductTypeSelector';

// Types
export * from './types';

// Re-export commonly used types for convenience
export { ProductType, AttributeType, DisplayType } from './types';

export type {
  ProductAttribute,
  AttributeValue,
  ProductVariant,
  VariantProduct,
  AttributeManagerProps,
  VariantMatrixProps
} from './types';

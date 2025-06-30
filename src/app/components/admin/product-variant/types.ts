// Product Variant System Types
// Completely flexible attribute system similar to WordPress WooCommerce

export enum ProductType {
  SIMPLE = 'SIMPLE',
  VARIANT = 'VARIANT'
}

export enum AttributeType {
  TEXT = 'TEXT', // Free text input
  COLOR = 'COLOR', // Color picker + hex code
  NUMBER = 'NUMBER', // Numeric input
  SELECT = 'SELECT' // Predefined options
}

export enum DisplayType {
  BUTTON = 'BUTTON', // Individual buttons (like Image 1)
  DROPDOWN = 'DROPDOWN', // Select dropdown
  COLOR_SWATCH = 'COLOR_SWATCH', // Color circles
  TEXT_INPUT = 'TEXT_INPUT', // Text field
  RADIO = 'RADIO', // Radio buttons
  CHECKBOX = 'CHECKBOX' // Multiple selection
}

// Global attribute (reusable across products)
export interface GlobalAttribute {
  id: string;
  name: string; // "color", "storage", "ram"
  label: string; // "Màu sắc", "Dung lượng", "RAM"
  type: AttributeType;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Product-specific attribute (simplified, like WooCommerce)
export interface ProductAttribute {
  id: string;
  productId: string;
  attributeId?: string; // Reference to GlobalAttribute (optional for custom attributes)
  name: string; // "color", "storage", "ram" (product-specific)
  label: string; // "Màu sắc", "Dung lượng", "RAM"
  customLabel?: string; // Custom label override
  type: AttributeType;
  displayType: DisplayType;
  isRequired: boolean;
  isVariation: boolean; // Used for variation or just info
  position: number;
  description?: string; // Optional description
  values: AttributeValue[];
  createdAt: Date;
  updatedAt: Date;
}

// Attribute value (product-specific only)
export interface AttributeValue {
  id: string;
  attributeId: string; // Reference to ProductAttribute
  value: string; // Internal value: "silver", "128gb", "16gb"
  label: string; // Display label: "Bạc", "128GB", "16GB"
  description?: string; // Detailed description
  colorCode?: string; // For COLOR type: "#C0C0C0"
  imageUrl?: string; // Optional image for value
  priceAdjustment: number; // Price modifier: +/- amount
  position: number; // Sort order
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Product variant
export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  attributes: Record<string, string>; // {"color": "silver", "storage": "512gb"}
  price: number;
  stock: number;
  images: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Extended product interface
export interface VariantProduct {
  id: string;
  name: string;
  description: string;
  productType: ProductType;
  basePrice?: number; // Base price for variants
  price?: number; // Price for simple products
  categoryId: string;
  inStock?: number; // Stock for simple products
  attributes: ProductAttribute[];
  variants: ProductVariant[];
  images: any[]; // Existing image structure
  createdAt: Date;
  updatedAt: Date;
}

// Form data interfaces (simplified)
export interface AttributeFormData {
  name: string;
  label: string;
  type: AttributeType;
  description?: string;
}

export interface AttributeValueFormData {
  value: string;
  label: string;
  description?: string;
  colorCode?: string;
  imageUrl?: string;
  priceAdjustment: number;
}

export interface ProductAttributeFormData {
  name: string;
  label: string;
  type: AttributeType;
  displayType: DisplayType;
  isRequired: boolean;
  isVariation: boolean;
  description?: string;
  values: AttributeValueFormData[];
}

export interface VariantFormData {
  sku: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
  images: string[];
}

// Component props interfaces (simplified)
export interface AttributeManagerProps {
  productId?: string;
  attributes: ProductAttribute[];
  onAttributesChange: (attributes: ProductAttribute[]) => void;
}

export interface AttributeConfigCardProps {
  attribute: ProductAttribute;
  globalAttribute: GlobalAttribute;
  onUpdate: (attribute: ProductAttribute) => void;
  onDelete: (attributeId: string) => void;
  onMoveUp: (attributeId: string) => void;
  onMoveDown: (attributeId: string) => void;
}

export interface VariantMatrixProps {
  productId: string;
  attributes: ProductAttribute[];
  variants: ProductVariant[];
  onVariantsChange: (variants: ProductVariant[]) => void;
  basePrice: number;
}

export interface AttributeSelectorProps {
  attribute: ProductAttribute;
  selectedValue?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

// Utility types
export type AttributeCombination = Record<string, string>;
export type VariantPriceCalculation = {
  basePrice: number;
  adjustments: number;
  finalPrice: number;
};

// API response types
export interface CreateAttributeResponse {
  success: boolean;
  attribute: ProductAttribute;
  message?: string;
}

export interface CreateVariantResponse {
  success: boolean;
  variant: ProductVariant;
  message?: string;
}

export interface VariantValidationError {
  field: string;
  message: string;
}

export interface VariantValidationResult {
  isValid: boolean;
  errors: VariantValidationError[];
}

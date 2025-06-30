# Product Variant System

## Overview
A completely flexible product variant system similar to WordPress WooCommerce, allowing administrators to create custom attributes and manage product variations with different display types.

## Key Features

### 🎯 **Flexible Attribute System**
- **Global Attribute Library**: Reusable attributes across products
- **Custom Attributes**: Create product-specific attributes
- **Multiple Attribute Types**: COLOR, SELECT, TEXT, NUMBER
- **Flexible Display Types**: BUTTON, DROPDOWN, COLOR_SWATCH, TEXT_INPUT, RADIO, CHECKBOX

### 🛠️ **WordPress-like Experience**
- Drag & drop attribute ordering
- Visual attribute configuration
- Bulk operations for variants
- Auto-generation of variant combinations

### 📊 **Variant Management**
- Matrix view for easy variant management
- Bulk price and stock updates
- SKU auto-generation
- Price adjustments per attribute value

## Components

### Core Components

#### `AttributeManager`
Main component for managing product attributes.
```tsx
<AttributeManager
  productId="product-123"
  attributes={attributes}
  onAttributesChange={setAttributes}
  globalAttributes={globalAttributes}
/>
```

#### `ProductTypeSelector`
Choose between simple and variant products.
```tsx
<ProductTypeSelector
  selectedType={productType}
  onChange={setProductType}
/>
```

#### `VariantMatrix`
Table view for managing all product variants.
```tsx
<VariantMatrix
  productId="product-123"
  attributes={attributes}
  variants={variants}
  onVariantsChange={setVariants}
  basePrice={50000000}
/>
```

### Attribute Configuration

#### `AttributeConfigCard`
Configure individual attributes with display options.

#### `DisplayTypeSelector`
Choose how attributes are displayed to customers.

#### `AttributeValueManager`
Manage attribute values with pricing adjustments.

### Attribute Selection

#### `GlobalAttributeSelector`
Select attributes from the global library.

#### `CustomAttributeCreator`
Create new custom attributes.

## Usage Examples

### Basic Setup
```tsx
import {
  AttributeManager,
  VariantMatrix,
  ProductTypeSelector,
  ProductType
} from '@/app/components/admin/product-variant';

const [productType, setProductType] = useState(ProductType.VARIANT);
const [attributes, setAttributes] = useState([]);
const [variants, setVariants] = useState([]);
```

### Creating a MacBook Product
```tsx
// 1. Choose variant product type
<ProductTypeSelector
  selectedType={ProductType.VARIANT}
  onChange={setProductType}
/>

// 2. Configure attributes
const attributes = [
  {
    attributeId: 'color',
    displayType: DisplayType.COLOR_SWATCH,
    values: [
      { value: 'silver', label: 'Bạc', colorCode: '#C0C0C0' },
      { value: 'black', label: 'Đen', colorCode: '#000000' }
    ]
  },
  {
    attributeId: 'configuration',
    displayType: DisplayType.DROPDOWN,
    values: [
      { 
        value: 'm3-pro-18gb-512gb',
        label: 'M3 Pro 12-core, 18GB, 512GB',
        description: 'Apple M3 Pro chip with 12-core CPU and 18-core GPU',
        priceAdjustment: 0
      },
      {
        value: 'm3-pro-36gb-512gb',
        label: 'M3 Pro 12-core, 36GB, 512GB', 
        description: 'Apple M3 Pro chip with 12-core CPU and 18-core GPU',
        priceAdjustment: 5000000
      }
    ]
  }
];

// 3. Auto-generate variants
// Results in 4 variants: Silver+18GB, Silver+36GB, Black+18GB, Black+36GB
```

## Data Structure

### Global Attribute
```typescript
interface GlobalAttribute {
  id: string;
  name: string;            // "color", "storage"
  label: string;           // "Màu sắc", "Dung lượng"
  type: AttributeType;     // COLOR, SELECT, TEXT, NUMBER
  description?: string;
}
```

### Product Attribute
```typescript
interface ProductAttribute {
  id: string;
  productId: string;
  attributeId: string;     // Reference to GlobalAttribute
  displayType: DisplayType; // How to display to customers
  isRequired: boolean;
  isVariation: boolean;    // Affects price/stock vs just info
  customLabel?: string;    // Override global label
  values: AttributeValue[];
}
```

### Attribute Value
```typescript
interface AttributeValue {
  id: string;
  value: string;           // "silver", "128gb"
  label: string;           // "Bạc", "128GB"
  description?: string;    // Detailed description
  colorCode?: string;      // For COLOR type
  priceAdjustment: number; // Price modifier
}
```

### Product Variant
```typescript
interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  attributes: Record<string, string>; // {"color": "silver", "storage": "512gb"}
  price: number;
  stock: number;
  images: string[];
  isActive: boolean;
}
```

## Display Types

### Button (Separate buttons like Image 1)
```tsx
// Results in individual buttons for each value
[Silver] [Black] [Gold]
```

### Dropdown (Combined like Image 2)
```tsx
// Results in dropdown with descriptions
<select>
  <option>M3 Pro 12-core, 18GB, 512GB - Apple M3 Pro chip...</option>
  <option>M3 Pro 12-core, 36GB, 512GB - Apple M3 Pro chip...</option>
</select>
```

### Color Swatch
```tsx
// Results in colored circles
○ ● ○ (with actual colors)
```

## Integration

### With AddProductModal
```tsx
// Replace existing product form with:
{productType === ProductType.SIMPLE ? (
  <SimpleProductForm />
) : (
  <VariantProductForm
    attributes={attributes}
    variants={variants}
    onAttributesChange={setAttributes}
    onVariantsChange={setVariants}
  />
)}
```

### Database Schema
```sql
-- Add to existing products table
ALTER TABLE products ADD COLUMN product_type ENUM('SIMPLE', 'VARIANT') DEFAULT 'SIMPLE';
ALTER TABLE products ADD COLUMN base_price DECIMAL(10,2);

-- New tables for variant system
CREATE TABLE global_attributes (...);
CREATE TABLE product_attributes (...);
CREATE TABLE attribute_values (...);
CREATE TABLE product_variants (...);
```

## Demo
Run the demo component to see the system in action:
```tsx
import VariantProductDemo from './VariantProductDemo';

<VariantProductDemo />
```

## Benefits

### For Administrators
- ✅ Complete flexibility in attribute creation
- ✅ Reusable attribute library
- ✅ Visual configuration interface
- ✅ Bulk operations for efficiency

### For Customers
- ✅ Intuitive attribute selection
- ✅ Multiple display styles
- ✅ Clear pricing information
- ✅ Responsive design

### For Developers
- ✅ Type-safe TypeScript interfaces
- ✅ Modular component architecture
- ✅ Easy to extend and customize
- ✅ Clean separation of concerns

# Variant System API Documentation

## Overview
Complete REST API documentation for the Product Variant System. All endpoints follow RESTful conventions and return JSON responses.

## Base URL
```
/api/variants
```

## Authentication
- **Public endpoints**: Product listing and details
- **Protected endpoints**: All CREATE, UPDATE, DELETE operations require admin authentication
- **Authentication method**: Session-based (getCurrentUser)

## Response Format
All endpoints return JSON with consistent structure:

```typescript
// Success Response
{
  success: true,
  data: any,
  message?: string
}

// Error Response  
{
  error: string,
  status: number
}
```

## Endpoints

### 1. Product Management

#### GET /api/variants/products
**Description**: List all variant products with pagination

**Query Parameters**:
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page
- `search` (string) - Search in name, description, brand
- `categoryId` (string) - Filter by category

**Response**:
```json
{
  "products": [
    {
      "id": "string",
      "name": "MacBook Pro 16-inch",
      "description": "string",
      "brand": "Apple",
      "productType": "VARIANT",
      "basePrice": 60000000,
      "categoryId": "string",
      "images": ["url1", "url2"],
      "category": { "id": "string", "name": "Laptop" },
      "productAttributes": [...],
      "variants": [...],
      "_count": { "variants": 8, "reviews": 5 }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "pages": 1
  }
}
```

#### GET /api/variants/products/[id]
**Description**: Get specific variant product with full details

**Response**:
```json
{
  "id": "string",
  "name": "MacBook Pro 16-inch",
  "productAttributes": [
    {
      "id": "string",
      "name": "color",
      "label": "Màu sắc",
      "type": "COLOR",
      "displayType": "COLOR_SWATCH",
      "isRequired": true,
      "isVariation": true,
      "position": 0,
      "values": [
        {
          "id": "string",
          "value": "silver",
          "label": "Bạc",
          "colorCode": "#C0C0C0",
          "priceAdjustment": 0,
          "position": 0
        }
      ]
    }
  ],
  "variants": [
    {
      "id": "string",
      "sku": "MBP16-SLV-512GB",
      "attributes": { "color": "silver", "storage": "512gb" },
      "price": 60000000,
      "stock": 10,
      "images": ["url"],
      "isActive": true
    }
  ]
}
```

#### POST /api/variants/products 🔒
**Description**: Create new variant product
**Auth**: Admin required

**Request Body**:
```json
{
  "name": "MacBook Pro 16-inch",
  "description": "Product description",
  "brand": "Apple",
  "basePrice": 60000000,
  "categoryId": "category-id",
  "images": ["url1", "url2"],
  "attributes": [
    {
      "name": "color",
      "label": "Màu sắc",
      "type": "COLOR",
      "displayType": "COLOR_SWATCH",
      "isRequired": true,
      "isVariation": true,
      "description": "Product color",
      "values": [
        {
          "value": "silver",
          "label": "Bạc",
          "colorCode": "#C0C0C0",
          "priceAdjustment": 0
        }
      ]
    }
  ],
  "variants": [
    {
      "sku": "MBP16-SLV-512GB",
      "attributes": { "color": "silver", "storage": "512gb" },
      "price": 60000000,
      "stock": 10,
      "images": ["url"]
    }
  ]
}
```

#### PUT /api/variants/products/[id] 🔒
**Description**: Update variant product
**Auth**: Admin required
**Request Body**: Same as POST (partial updates allowed)

#### DELETE /api/variants/products/[id] 🔒
**Description**: Soft delete variant product
**Auth**: Admin required

### 2. Attribute Management

#### GET /api/variants/products/[id]/attributes
**Description**: Get all attributes for a product

#### POST /api/variants/products/[id]/attributes 🔒
**Description**: Add new attribute to product
**Auth**: Admin required

**Request Body**:
```json
{
  "name": "ram",
  "label": "RAM",
  "type": "SELECT",
  "displayType": "BUTTON",
  "isRequired": true,
  "isVariation": true,
  "description": "Memory size",
  "values": [
    {
      "value": "16gb",
      "label": "16GB",
      "priceAdjustment": 0
    },
    {
      "value": "32gb", 
      "label": "32GB",
      "priceAdjustment": 8000000
    }
  ]
}
```

#### PUT /api/variants/products/[id]/attributes 🔒
**Description**: Reorder attributes
**Auth**: Admin required

**Request Body**:
```json
{
  "attributeIds": ["attr1", "attr2", "attr3"]
}
```

#### PUT /api/variants/attributes/[id] 🔒
**Description**: Update specific attribute
**Auth**: Admin required

#### DELETE /api/variants/attributes/[id] 🔒
**Description**: Delete attribute and all its values
**Auth**: Admin required
**Note**: Also deletes all variants using this attribute

### 3. Variant Management

#### GET /api/variants/products/[id]/variants
**Description**: Get all variants for a product

**Query Parameters**:
- `includeInactive` (boolean) - Include inactive variants

#### POST /api/variants/products/[id]/variants 🔒
**Description**: Create multiple variants for a product
**Auth**: Admin required

**Request Body**:
```json
{
  "variants": [
    {
      "sku": "MBP16-SLV-1TB",
      "attributes": { "color": "silver", "storage": "1tb" },
      "price": 70000000,
      "stock": 5,
      "images": ["url"]
    }
  ]
}
```

#### PUT /api/variants/products/[id]/variants 🔒
**Description**: Bulk update variants
**Auth**: Admin required

**Request Body**:
```json
{
  "action": "updatePrices",
  "variantIds": ["var1", "var2"],
  "data": {
    "priceAdjustment": 10  // 10% increase
    // OR
    "newPrice": 65000000   // Set specific price
  }
}
```

**Available Actions**:
- `updatePrices`: Update prices (percentage or absolute)
- `updateStock`: Update stock levels
- `toggleActive`: Enable/disable variants
- `delete`: Delete variants

#### GET /api/variants/variants/[id]
**Description**: Get specific variant details

#### PUT /api/variants/variants/[id] 🔒
**Description**: Update specific variant
**Auth**: Admin required

#### DELETE /api/variants/variants/[id] 🔒
**Description**: Delete specific variant
**Auth**: Admin required

### 4. Variant Generation

#### GET /api/variants/generate
**Description**: Preview variant combinations

**Query Parameters**:
- `productId` (required) - Product ID
- `basePrice` (optional) - Base price for calculations

**Response**:
```json
{
  "success": true,
  "data": {
    "total": 8,
    "combinations": [
      {
        "index": 1,
        "attributes": { "color": "silver", "storage": "512gb", "ram": "16gb" },
        "price": 60000000,
        "priceFormatted": "60,000,000đ"
      }
    ]
  }
}
```

#### POST /api/variants/generate 🔒
**Description**: Generate all possible variants for a product
**Auth**: Admin required

**Request Body**:
```json
{
  "productId": "product-id",
  "basePrice": 60000000,
  "skuPrefix": "MBP16"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "total": 8,
    "existing": 0,
    "created": 8,
    "variants": [...]
  },
  "message": "Generated 8 new variants"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Admin access required |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

## Usage Examples

### JavaScript/TypeScript Client

```typescript
import { variantAPI } from '@/app/libs/variant-api';

// Get variant products
const products = await variantAPI.getVariantProducts({
  page: 1,
  limit: 10,
  search: 'MacBook'
});

// Create variant product
const newProduct = await variantAPI.createVariantProduct({
  name: 'iPhone 15 Pro',
  description: 'Latest iPhone',
  basePrice: 28000000,
  categoryId: 'smartphones',
  attributes: [...]
});

// Generate variants
const generated = await variantAPI.generateVariants(
  'product-id',
  50000000,
  'IP15P'
);
```

### cURL Examples

```bash
# Get variant products
curl "http://localhost:3000/api/variants/products?page=1&limit=5"

# Get specific product
curl "http://localhost:3000/api/variants/products/[product-id]"

# Preview variant generation
curl "http://localhost:3000/api/variants/generate?productId=[id]&basePrice=50000000"
```

## Testing

Run the test suite:
```bash
node scripts/test-variant-api.js
```

**Current Test Results**: ✅ 100% success rate (6/6 tests passed)

## Next Steps

1. **Authentication Testing**: Test protected endpoints with admin session
2. **Integration**: Connect with AddProductModal component
3. **Frontend**: Customer-facing variant selection UI
4. **Cart Integration**: Handle variant products in shopping cart

# Database Schema: Product Variant System

## Overview
This document describes the database schema for the flexible product variant system, designed to be similar to WordPress WooCommerce with complete customization capabilities.

## Schema Design Principles

### 1. **Flexibility First**
- No hardcoded attributes
- Global attribute library for reusability
- Product-specific customization
- Multiple display types per attribute

### 2. **Performance Optimized**
- Proper indexing for fast queries
- JSON fields for flexible data storage
- Minimal joins for common operations
- Efficient variant lookups

### 3. **Backward Compatibility**
- Existing simple products remain unchanged
- Gradual migration path
- No breaking changes to existing APIs

## Core Models

### Product (Enhanced)
```prisma
model Product {
  id               String      @id @default(auto()) @map("_id") @db.ObjectId
  name             String
  description      String
  brand            String      @default("Apple")
  
  // Product type and pricing
  productType      ProductType @default(SIMPLE)
  price            Float?      // For simple products
  basePrice        Float?      // Base price for variant products
  
  categoryId       String      @db.ObjectId
  inStock          Int?        // For simple products
  
  // Variant system relationships
  productAttributes ProductAttribute[]
  variants         ProductVariant[]
}
```

**Key Changes:**
- Added `productType` enum (SIMPLE/VARIANT)
- `price` is nullable for variant products
- Added `basePrice` for variant products
- `inStock` is nullable for variant products

### GlobalAttribute
```prisma
model GlobalAttribute {
  id          String        @id @default(auto()) @map("_id") @db.ObjectId
  name        String        @unique // "color", "storage", "ram"
  label       String        // "Màu sắc", "Dung lượng", "RAM"
  type        AttributeType
  description String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}
```

**Purpose:**
- Reusable attribute definitions across products
- Centralized attribute management
- Type safety with AttributeType enum

### ProductAttribute
```prisma
model ProductAttribute {
  id           String      @id @default(auto()) @map("_id") @db.ObjectId
  productId    String      @db.ObjectId
  attributeId  String      @db.ObjectId
  displayType  DisplayType @default(BUTTON)
  isRequired   Boolean     @default(true)
  isVariation  Boolean     @default(true)
  position     Int         @default(0)
  customLabel  String?     // Override global label
}
```

**Purpose:**
- Product-specific attribute configuration
- Display type customization per product
- Attribute ordering and requirements

### AttributeValue
```prisma
model AttributeValue {
  id              String  @id @default(auto()) @map("_id") @db.ObjectId
  attributeId     String  @db.ObjectId
  productId       String? @db.ObjectId // NULL = global, NOT NULL = product-specific
  value           String  // "silver", "128gb"
  label           String  // "Bạc", "128GB"
  description     String? // Detailed description
  colorCode       String? // For COLOR type
  imageUrl        String? // Optional image
  priceAdjustment Float   @default(0)
  position        Int     @default(0)
  isActive        Boolean @default(true)
}
```

**Purpose:**
- Flexible value storage (global or product-specific)
- Price adjustments per value
- Rich metadata (colors, images, descriptions)

### ProductVariant
```prisma
model ProductVariant {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  productId  String   @db.ObjectId
  sku        String   @unique
  attributes Json     // {"color": "silver", "storage": "512gb"}
  price      Float
  stock      Int      @default(0)
  images     String[] // Array of image URLs
  isActive   Boolean  @default(true)
}
```

**Purpose:**
- Individual variant storage
- JSON attributes for flexibility
- Independent pricing and stock
- Variant-specific images

## Enums

### ProductType
```prisma
enum ProductType {
  SIMPLE   // Traditional single-variant product
  VARIANT  // Multi-variant product
}
```

### AttributeType
```prisma
enum AttributeType {
  TEXT     // Free text input
  COLOR    // Color picker with hex codes
  NUMBER   // Numeric input
  SELECT   // Predefined options
}
```

### DisplayType
```prisma
enum DisplayType {
  BUTTON       // Individual buttons (like Image 1)
  DROPDOWN     // Select dropdown (like Image 2)
  COLOR_SWATCH // Color circles
  TEXT_INPUT   // Text field
  RADIO        // Radio buttons
  CHECKBOX     // Multiple selection
}
```

## Data Flow Examples

### Creating a MacBook Pro Variant Product

1. **Create Product**
```javascript
const product = await prisma.product.create({
  data: {
    name: 'MacBook Pro 16-inch',
    productType: 'VARIANT',
    basePrice: 60000000,
    categoryId: 'laptop-category-id'
  }
});
```

2. **Add Attributes**
```javascript
// Color attribute
await prisma.productAttribute.create({
  data: {
    productId: product.id,
    attributeId: 'color-global-id',
    displayType: 'COLOR_SWATCH',
    isVariation: true,
    position: 0
  }
});

// Storage attribute
await prisma.productAttribute.create({
  data: {
    productId: product.id,
    attributeId: 'storage-global-id',
    displayType: 'BUTTON',
    isVariation: true,
    position: 1
  }
});
```

3. **Create Variants**
```javascript
await prisma.productVariant.create({
  data: {
    productId: product.id,
    sku: 'MBP16-SLV-512GB',
    attributes: { color: 'silver', storage: '512gb' },
    price: 60000000,
    stock: 10
  }
});
```

### Querying Variants

**Get Product with All Variants:**
```javascript
const product = await prisma.product.findUnique({
  where: { id: productId },
  include: {
    productAttributes: {
      include: {
        globalAttribute: true,
        values: true
      }
    },
    variants: true
  }
});
```

**Find Variant by Attributes:**
```javascript
const variant = await prisma.productVariant.findFirst({
  where: {
    productId: productId,
    attributes: {
      equals: { color: 'silver', storage: '512gb' }
    }
  }
});
```

## Migration Strategy

### Phase 1: Schema Update
1. Add new models and enums
2. Update existing Product model
3. Generate Prisma client

### Phase 2: Data Migration
1. Set all existing products to `SIMPLE` type
2. Create global attributes library
3. Seed sample attribute values

### Phase 3: Testing
1. Create sample variant products
2. Test all CRUD operations
3. Verify performance

## Performance Considerations

### Indexing Strategy
```prisma
// ProductVariant indexes
@@index([productId])        // Fast product variant lookup
@@index([isActive])         // Filter active variants
@@unique([sku])            // Unique SKU constraint

// AttributeValue indexes
@@index([attributeId])      // Fast attribute value lookup
@@index([productId])        // Product-specific values
@@index([value])           // Value-based searches
```

### Query Optimization
- Use `include` strategically to avoid N+1 queries
- JSON field queries are indexed in MongoDB
- Batch operations for bulk updates
- Pagination for large variant lists

## Security Considerations

### Data Validation
- SKU uniqueness enforcement
- Price validation (non-negative)
- Stock validation (non-negative)
- Attribute value format validation

### Access Control
- Admin-only variant management
- Customer read-only access
- Audit logging for changes

## Backup and Recovery

### Before Migration
```bash
npm run variant:backup
```

### After Migration
- Regular database backups
- Point-in-time recovery capability
- Test restore procedures

## Monitoring

### Key Metrics
- Variant creation rate
- Query performance
- Storage usage
- Error rates

### Alerts
- Failed variant operations
- Performance degradation
- Data inconsistencies

## Future Enhancements

### Planned Features
- Variant image management
- Bulk import/export
- Advanced pricing rules
- Inventory tracking
- Analytics integration

### Scalability
- Sharding strategy for large catalogs
- Caching layer for frequent queries
- CDN for variant images
- Search optimization

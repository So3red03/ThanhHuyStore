# Fix Variant Update Error - 2025-01-11

## Vấn đề

- Lỗi khi cập nhật variant: `PUT /api/variants/variants/xanh-64gb 500`
- Error: `Malformed ObjectID: provided hex string representation must be exactly 12 bytes, instead got: "xanh-64gb", length 9`
- Xảy ra khi cập nhật tồn kho và sắp xếp hình ảnh variant

## Nguyên nhân

1. **ExpandableVariant.tsx**: Sử dụng `variant.databaseId || variant.id` làm variantId
2. **AddProductModalNew.tsx**: Khi tạo variant object cho ExpandableVariant:
   - `id` được set thành `"xanh-64gb"` (từ attributes)
   - `databaseId` không được set đúng hoặc bị mất
3. **API call**: Gửi `"xanh-64gb"` thay vì ObjectID thực sự đến `/api/variants/variants/[id]`

## Giải pháp

### 1. ✅ Sửa ExpandableVariant.tsx

- **File**: `src/app/components/admin/product-variant/ExpandableVariant.tsx`
- **Thay đổi**:
  - Chỉ sử dụng `variant.databaseId` (không fallback về `variant.id`)
  - Validate ObjectID format trước khi gọi API
  - Thêm error handling và logging chi tiết
  - Hiển thị thông báo lỗi rõ ràng cho user

### 2. ✅ Sửa AddProductModalNew.tsx

- **File**: `src/app/(admin)/admin/manage-products/AddProductModalNew.tsx`
- **Thay đổi**:
  - Thêm `databaseId: variation.id` khi convert variation sang variant format
  - Validate ObjectID format trước khi set databaseId
  - Thêm logging để debug

## Code Changes

### ExpandableVariant.tsx

```typescript
// Trước
const variantId = variant.databaseId || variant.id;

// Sau
const variantId = variant.databaseId;
if (!variantId) {
  setErrors(['Không thể cập nhật: Biến thể này chưa được lưu vào database']);
  return;
}

// Validate ObjectID format
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
if (!objectIdRegex.test(variantId)) {
  setErrors(['Không thể cập nhật: ID biến thể không hợp lệ']);
  return;
}
```

### AddProductModalNew.tsx

```typescript
// Thêm validation cho databaseId
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const databaseId = variation.id && objectIdRegex.test(variation.id) ? variation.id : undefined;

const variant = {
  id: displayId,
  databaseId: databaseId // Chỉ set nếu là ObjectID hợp lệ
  // ... other fields
};
```

## Test Cases

### ✅ Test 1: Variant đã tồn tại trong database

- Load product có variants từ database
- Edit variant (cập nhật stock, sắp xếp images)
- Kết quả: API call với ObjectID hợp lệ

### ✅ Test 2: Variant mới chưa lưu

- Tạo variant mới từ attributes
- Thử edit variant
- Kết quả: Hiển thị thông báo "chưa được lưu vào database"

### ✅ Test 3: Invalid ObjectID

- Variant có id không phải ObjectID format
- Thử edit variant
- Kết quả: Hiển thị thông báo "ID biến thể không hợp lệ"

## Validation Rules

### ObjectID Format

- Phải là string 24 ký tự
- Chỉ chứa ký tự hex (0-9, a-f, A-F)
- Regex: `/^[0-9a-fA-F]{24}$/`

### Error Handling

- Kiểm tra `databaseId` tồn tại
- Validate ObjectID format
- Hiển thị thông báo lỗi rõ ràng
- Log chi tiết để debug

## Kết quả

- ✅ Sửa lỗi "Malformed ObjectID"
- ✅ Cải thiện error handling
- ✅ Thêm validation ObjectID
- ✅ Thông báo lỗi rõ ràng cho user
- ✅ Logging chi tiết để debug

## Vấn đề phát hiện thêm: Gallery Images bị mất

### ❌ Vấn đề

- Sau khi cập nhật variant (stock, price), `galleryImages` bị set thành array rỗng
- Database shows: `galleryImages: Array (empty)`
- Ảnh bị mất hoàn toàn

### 🔍 Nguyên nhân

1. **ExpandableVariant.tsx**: `editData.imageFiles || editData.galleryImages`

   - `imageFiles` được init thành `[]` (empty array)
   - Logic `||` trả về `[]` thay vì preserve existing `galleryImages`

2. **API Route**: `galleryImages: galleryImages || []`
   - Khi `galleryImages` là `undefined`, set thành `[]`
   - Không preserve existing data

### ✅ Giải pháp

#### 1. Sửa ExpandableVariant.tsx

```typescript
// Trước
galleryImages: editData.imageFiles || editData.galleryImages;

// Sau
galleryImages: editData.imageFiles && editData.imageFiles.length > 0 ? editData.imageFiles : editData.galleryImages;
```

#### 2. Sửa API Route

```typescript
// Trước
galleryImages: galleryImages || [],

// Sau
if (galleryImages !== undefined) updateData.galleryImages = galleryImages;
```

### ✅ Kết quả

- ✅ Preserve existing galleryImages khi chỉ update stock/price
- ✅ Chỉ update galleryImages khi có ảnh mới
- ✅ Thêm logging để debug

## Vấn đề phát hiện thêm: Prisma Validation Error

### ❌ Vấn đề

- Error: `Invalid value provided. Expected ProductVariantUpdategalleryImagesInput or String, provided Object`
- `galleryImages` được gửi dưới dạng object array thay vì string array
- Schema Prisma yêu cầu `String[]` nhưng nhận được `[{path: "..."}, ...]`

### 🔍 Nguyên nhân

1. **File objects được gửi trực tiếp**: `editData.imageFiles` chứa File objects
2. **JSON.stringify File objects**: Tạo ra object format thay vì URLs
3. **Thiếu Firebase upload**: Không upload ảnh lên Firebase trước khi gửi API

### ✅ Giải pháp

#### 1. Thêm Firebase Upload trong ExpandableVariant

```typescript
// Import Firebase utilities
import { uploadVariantProductThumbnail, uploadVariantProductGallery } from '@/app/utils/firebase-product-storage';

// Upload function
const uploadImagesToFirebase = async (productName: string, variantId: string) => {
  // Upload thumbnail và gallery images
  // Return URLs thay vì File objects
};
```

#### 2. Cập nhật handleSave logic

```typescript
// Check for new images
const hasNewThumbnail = editData.thumbnailFile instanceof File;
const hasNewGalleryImages = editData.imageFiles && editData.imageFiles.some(file => file instanceof File);

// Upload to Firebase if needed
if (hasNewThumbnail || hasNewGalleryImages) {
  const uploadedImages = await uploadImagesToFirebase(productName, variantId);
  thumbnailToSend = uploadedImages.thumbnail;
  galleryImagesToSend = uploadedImages.galleryImages;
}
```

#### 3. Validate data types

```typescript
// Ensure only string URLs are sent to API
galleryImages: galleryImagesToSend; // Array of strings, not File objects
```

### ✅ Kết quả

- ✅ Upload ảnh lên Firebase trước khi gửi API
- ✅ Gửi URLs thay vì File objects
- ✅ Tuân thủ Prisma schema requirements
- ✅ Proper error handling cho Firebase upload

## Vấn đề phát hiện thêm: Logic CREATE vs EDIT Mode

### ❌ Vấn đề

- Nút "Lưu thay đổi" luôn call API ngay cả khi variant chưa có trong database
- CREATE mode (variant mới): Không nên call API, chỉ update local state
- EDIT mode (variant đã có): Cần call API để update database
- User không hiểu rõ sự khác biệt giữa 2 modes

### 🔍 Nguyên nhân

1. **Không phân biệt CREATE vs EDIT**: Logic cũ luôn cố gắng call API
2. **Thiếu validation mode**: Không check `databaseId` để xác định mode
3. **UX không rõ ràng**: User không biết khi nào call API, khi nào chỉ update local

### ✅ Giải pháp

#### 1. Phân biệt CREATE vs EDIT Mode

```typescript
const variantId = variant.databaseId;
const isEditMode = variantId && /^[0-9a-fA-F]{24}$/.test(variantId);

if (!isEditMode) {
  // CREATE MODE: Just update local state, don't call API
  onUpdate(variant.id, editData);
  return;
}

// EDIT MODE: Call API to update existing variant
```

#### 2. Cải thiện UX với thông báo rõ ràng

```typescript
// Info box hiển thị mode hiện tại
{variant.databaseId && /^[0-9a-fA-F]{24}$/.test(variant.databaseId) ? (
  <strong>Chế độ chỉnh sửa:</strong> Thay đổi sẽ được cập nhật trực tiếp vào database
) : (
  <strong>Chế độ tạo mới:</strong> Thay đổi sẽ được lưu tạm thời, cần submit form chính để lưu vào database
)}
```

#### 3. Logging để debug

```typescript
console.log('🔄 Save mode:', {
  mode: isEditMode ? 'EDIT' : 'CREATE',
  variantId,
  hasValidObjectId: isEditMode
});
```

### ✅ Kết quả

- ✅ CREATE mode: Chỉ update local state, không call API
- ✅ EDIT mode: Call API để update database
- ✅ UX rõ ràng với info box giải thích mode
- ✅ Logging chi tiết để debug

## Vấn đề phát hiện thêm: Category Selection bị ẩn

### ❌ Vấn đề

- Khi chọn "Sản phẩm biến thể", section "Phân loại" (category selection) bị ẩn
- Gây lỗi 400 Bad Request khi tạo sản phẩm vì thiếu `categoryId`
- User không thể chọn danh mục cho variant products

### 🔍 Nguyên nhân

- Section "Phân loại" nằm trong Right Column (chỉ hiển thị cho SIMPLE products)
- Khi chọn VARIANT product, Right Column bị ẩn → Category selection cũng bị ẩn
- Logic: `{productType === ProductType.SIMPLE && (Right Column)}`

### ✅ Giải pháp

#### 1. Di chuyển Category Selection ra khỏi Right Column

```typescript
// Trước: Nằm trong Right Column (chỉ cho SIMPLE)
{
  productType === ProductType.SIMPLE && (
    <Grid item xs={12} md={6}>
      {/* Category selection ở đây */}
    </Grid>
  );
}

// Sau: Nằm trong Left Column (cho cả SIMPLE và VARIANT)
<Grid item xs={12} md={productType === ProductType.SIMPLE ? 6 : 12}>
  {/* Product info */}
  {/* Category selection - Always visible */}
</Grid>;
```

#### 2. Cập nhật comment và structure

```typescript
{
  /* Organize Section - Always visible for both product types */
}
<Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb', mt: 3 }}>
  <Typography variant='h6'>Phân loại</Typography>
  {/* Category selection fields */}
</Card>;
```

### ✅ Kết quả

- ✅ Category selection luôn hiển thị cho cả SIMPLE và VARIANT products
- ✅ Không còn lỗi 400 Bad Request khi tạo variant products
- ✅ UX nhất quán cho cả 2 loại sản phẩm
- ✅ Validation `categoryId` hoạt động đúng

## Vấn đề phát hiện thêm: API Validation Error

### ❌ Vấn đề

- API báo "Missing required fields" khi tạo variant products
- Error message không cụ thể, khó debug
- Frontend gửi sai field name (`price` thay vì `basePrice`)

### 🔍 Nguyên nhân

1. **API yêu cầu**: `name`, `description`, `basePrice`, `categoryId`
2. **Frontend gửi**: `price = 0` thay vì `basePrice = 0`
3. **Error message chung chung**: "Missing required fields"

### ✅ Giải pháp

#### 1. Cải thiện API Error Messages

```typescript
// API: Detailed validation with specific error messages
const missingFields = [];
if (!name) missingFields.push('name (tên sản phẩm)');
if (!description) missingFields.push('description (mô tả)');
if (!basePrice) missingFields.push('basePrice (giá cơ bản)');
if (!categoryId) missingFields.push('categoryId (danh mục)');

return NextResponse.json(
  {
    error: `Thiếu các trường bắt buộc: ${missingFields.join(', ')}`,
    missingFields,
    receivedData: { name, description, basePrice, categoryId }
  },
  { status: 400 }
);
```

#### 2. Sửa Frontend Data Mapping

```typescript
// Trước: Gửi sai field
submitData.price = 0;
submitData.basePrice = 0;

// Sau: Chỉ gửi field API cần
submitData.basePrice = 0; // API expects basePrice (not price)
```

#### 3. Cải thiện Frontend Error Handling

```typescript
catch (error: any) {
  let errorMessage = 'Có lỗi xảy ra khi tạo sản phẩm';

  if (error?.response?.data?.error) {
    errorMessage = error.response.data.error; // Show specific API error
  }

  toast.error(errorMessage);
}
```

### ✅ Kết quả

- ✅ API error messages cụ thể và rõ ràng
- ✅ Frontend gửi đúng field names
- ✅ Error handling hiển thị lỗi từ API
- ✅ Logging chi tiết để debug

## Vấn đề phát hiện thêm: basePrice không cần thiết

### ❌ Vấn đề

- API yêu cầu `basePrice` bắt buộc cho variant products
- Nhưng trong schema, `ProductVariant` đã có field `price` riêng
- `basePrice` ở Product level không cần thiết vì mỗi variant có giá riêng

### 🔍 Nguyên nhân

- Schema: `Product.basePrice` là optional (`Float?`)
- Logic: Variant products nên tính `basePrice` từ giá thấp nhất của variants
- API validation: Đang yêu cầu `basePrice` bắt buộc

### ✅ Giải pháp

#### 1. Sửa API Validation

```typescript
// Trước: Yêu cầu basePrice bắt buộc
if (!basePrice) missingFields.push('basePrice (giá cơ bản)');

// Sau: basePrice optional, sẽ tính từ variants
const basePrice = 0; // Optional for variant products, will be calculated from variants
```

#### 2. Tính basePrice từ variants

```typescript
// Track min price for basePrice calculation
let minPrice = null;
for (const variant of variants) {
  const variantPrice = parseFloat(variant.price);
  if (minPrice === null || variantPrice < minPrice) {
    minPrice = variantPrice;
  }
}

// Update product with calculated basePrice
await tx.product.update({
  where: { id: product.id },
  data: {
    basePrice: minPrice, // Set basePrice to minimum variant price
    inStock: totalStock // Set total stock from all variants
  }
});
```

#### 3. Frontend không gửi basePrice

```typescript
// Trước: Gửi basePrice = 0
submitData.basePrice = 0;

// Sau: Không gửi, để API tự tính
// basePrice will be calculated from variants on the server side
```

### ✅ Kết quả

- ✅ API không yêu cầu basePrice bắt buộc
- ✅ basePrice được tính tự động từ giá thấp nhất của variants
- ✅ inStock được tính tự động từ tổng stock của variants
- ✅ Logic phù hợp với business requirements

## Vấn đề phát hiện thêm: Simple Product API cũng cần cải thiện

### ❌ Vấn đề

- Simple product APIs (`/api/product` POST và PUT) cũng có error messages chung chung
- Không có validation cụ thể cho từng field
- Khó debug khi có lỗi

### ✅ Giải pháp

#### 1. Cải thiện POST `/api/product`

```typescript
// Detailed validation with specific error messages
const missingFields = [];

// Common required fields for all product types
if (!name || name.trim() === '') missingFields.push('name (tên sản phẩm)');
if (!description || description.trim() === '') missingFields.push('description (mô tả)');
if (!categoryId || categoryId.trim() === '') missingFields.push('categoryId (danh mục)');

// Simple product specific validation
if (productType === 'SIMPLE') {
  const simpleProductErrors = [];

  if (!price || price <= 0) {
    simpleProductErrors.push('price (giá sản phẩm > 0)');
  }
  if (inStock === undefined || inStock === null || inStock < 0) {
    simpleProductErrors.push('inStock (số lượng tồn kho >= 0)');
  }
}
```

#### 2. Cải thiện PUT `/api/product/[id]`

```typescript
// Additional validation based on product type
if (productType === 'SIMPLE') {
  const simpleProductErrors = [];

  if (!price || price <= 0) {
    simpleProductErrors.push('price (giá sản phẩm > 0)');
  }
  if (inStock === undefined || inStock === null || inStock < 0) {
    simpleProductErrors.push('inStock (số lượng tồn kho >= 0)');
  }

  if (simpleProductErrors.length > 0) {
    return NextResponse.json(
      {
        error: `Sản phẩm đơn thiếu: ${simpleProductErrors.join(', ')}`,
        missingFields: simpleProductErrors,
        receivedData: { price, inStock }
      },
      { status: 400 }
    );
  }
}
```

#### 3. Cải thiện Variant Validation

```typescript
// Validate each variation
const variantErrors = [];
for (let i = 0; i < variations.length; i++) {
  const variation = variations[i];
  if (!variation.price || variation.price <= 0) {
    variantErrors.push(`Biến thể ${i + 1}: thiếu giá hợp lệ (> 0)`);
  }
  if (variation.stock === undefined || variation.stock === null || variation.stock < 0) {
    variantErrors.push(`Biến thể ${i + 1}: thiếu số lượng hợp lệ (>= 0)`);
  }
}
```

### ✅ Kết quả

- ✅ Tất cả APIs có error messages cụ thể và rõ ràng
- ✅ Validation nhất quán giữa POST và PUT
- ✅ Logging chi tiết để debug
- ✅ Error handling tốt cho cả simple và variant products

## Next Steps

1. ✅ Test preserve galleryImages khi update stock
2. ✅ Test upload ảnh mới cho variant với Firebase
3. ✅ Test CREATE mode (variant mới) - chỉ update local state
4. ✅ Test EDIT mode (variant đã có) - call API update
5. ✅ Test category selection cho variant products
6. ✅ Test API validation và error messages
7. ✅ Test basePrice calculation từ variants
8. ✅ Test simple product API validation
9. Test drag & drop reorder images
10. Kiểm tra performance với nhiều variants

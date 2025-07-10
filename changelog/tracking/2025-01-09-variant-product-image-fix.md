# Variant Product Image Rendering Fix

## Ngày: 2025-01-09

## Vấn đề

- ProductCard component không render được ảnh cho sản phẩm variant
- Console log hiển thị dữ liệu đúng nhưng UI không hiển thị ảnh
- SetColor component không hoạt động đúng với variant products
- ProductDetails component có lỗi tương tự

## Nguyên nhân

1. **Cấu trúc dữ liệu khác nhau**:

   - Simple products: `product.images` là array của objects với format `{color, colorCode, images: [urls]}`
   - Variant products: `product.variants[].images` là array của objects với format `{url, image, ...}`

2. **Logic truy cập ảnh không đúng**:
   - Code cũ: `firstVariant.images` được sử dụng trực tiếp như array of strings
   - Thực tế: `firstVariant.images` là array of objects cần extract URL

## Giải pháp đã thực hiện

### ✅ 1. Sửa ProductCard.tsx

- **File**: `src/app/components/products/ProductCard.tsx`
- **Thay đổi**: Cập nhật `getDefaultImage()` function
- **Chi tiết**:

  ```typescript
  // Trước
  images: firstVariant.images;

  // Sau
  const imageUrls = firstVariant.images.map((img: any) => img.url || img.image || img);
  images: imageUrls;
  ```

### ✅ 2. Sửa SetColor.tsx

- **File**: `src/app/components/products/SetColor.tsx`
- **Thay đổi**: Thêm logic xử lý variant products
- **Chi tiết**:
  - Thêm `getAvailableColors()` function
  - Xử lý riêng cho variant vs simple products
  - Thêm color mapping cho 'bgc' color

### ✅ 3. Sửa ProductDetails.tsx

- **File**: `src/app/(home)/product/[productId]/ProductDetails.tsx`
- **Thay đổi**: Thêm `getDefaultImage()` function tương tự ProductCard
- **Chi tiết**:
  - Thay thế `selectedImg: { ...product.images[0] }`
  - Sử dụng `selectedImg: getDefaultImage()`

### ✅ 4. Sửa import errors

- **Files**:
  - `src/app/components/inputs/SelectColor.tsx`
  - `src/app/components/inputs/SelectImage.tsx`
- **Thay đổi**: Cập nhật import path từ `AddProductModal` thành `AddProductModalNew`

## Kết quả mong đợi

- [x] TypeScript compile thành công (`npx tsc --noEmit`)
- [ ] ProductCard hiển thị ảnh đúng cho variant products
- [ ] SetColor component hiển thị theo UI mới (buttons với text + image)
- [ ] ProductDetails page hoạt động bình thường với variant products

## Cập nhật UI Design (2025-01-09)

### ✅ 5. Refactor SetColor component UI

- **Thay đổi**: Từ color dots (hình tròn màu) sang buttons với text và hình ảnh
- **Lý do**: Đơn giản hóa UX, rõ ràng hơn cho người dùng
- **Chi tiết**:
  - **Performance mode** (ProductCard): Hiển thị 3 ảnh nhỏ đầu tiên
  - **Full mode** (ProductDetails): Hiển thị grouped buttons:
    - **Dung lượng**: `256 GB`, `512 GB`, `1 TB`
    - **Màu sắc**: `[ảnh] Titan Sa Mạc`, `[ảnh] Titan Tự nhiên`
  - **Fallback**: Hiển thị tất cả options nếu không group được

### ✅ 6. Cập nhật selectedImgType interface

- **File**: `src/app/(home)/product/[productId]/ProductDetails.tsx`
- **Thay đổi**: Thêm optional properties:
  ```typescript
  displayLabel?: string;
  previewImage?: string;
  variant?: any;
  ```

## Test cần thực hiện

1. Kiểm tra ProductCard với variant product có hiển thị ảnh
2. Kiểm tra SetColor component có hiển thị đúng các màu sắc
3. Kiểm tra ProductDetails page với variant product
4. Kiểm tra không bị break simple products

## Phát hiện thêm (2025-01-09)

### ✅ 7. Sửa ManageProductsClient.tsx

- **Vấn đề**: Logic hiển thị ảnh variant trong admin list không đúng
- **Sửa**: Cập nhật logic truy cập `variant.images[0].images[0]` thay vì `variant.images[0]`
- **Sửa**: Logic xóa ảnh variant cũng cần xử lý nested structure

### 🔍 8. Vấn đề tiềm ẩn trong ExpandableVariant

- **Phát hiện**: Inconsistency giữa File objects và URLs
- **Chi tiết**:
  - Khi save: pass File objects (`editData.imageFiles`)
  - Khi load: expect URLs (`variant.images`)
  - Có thể gây lỗi khi edit existing variants

### ✅ 9. Xử lý cả 2 format dữ liệu variant.images

- **Vấn đề**: Có 2 format dữ liệu khác nhau:
  - **Old format**: `variant.images = [url1, url2, ...]` (array of strings)
  - **New format**: `variant.images = [{color, colorCode, images: [urls]}, ...]` (array of objects)
- **Giải pháp**: Thêm logic detect format và xử lý cả 2 loại
- **Đã sửa**: ProductCard, SetColor, ProductDetails, ManageProductsClient
- **Console logs**: Thêm debug logs để identify format đang sử dụng

### ✅ 10. Sửa API endpoint /api/product/[id] - Root cause!

- **Vấn đề gốc**: API lưu `variation.images` (array of strings) trực tiếp vào database
- **Schema yêu cầu**: `Image[]` type với format `{color, colorCode, images: [urls]}`
- **Sửa**: Thêm logic convert format trong API:
  - Detect existing format vs new format
  - Convert array of URLs thành proper Image objects
  - Preserve existing Image objects nếu đã đúng format
- **Console logs**: Debug conversion process

### ✅ 11. Sửa AddProductModalNew.tsx - Edit mode

- **Vấn đề**: Khi edit variant, existing images bị set thành `[]`
- **Sửa**: Giữ lại existing images thay vì empty array
- **Logic**: `images: variation.images || []` thay vì `images: []`

### ✅ 12. Sửa DynamicAttributeManager - Mất thuộc tính khi chuyển tab

- **Vấn đề**: Khi edit variant product, chuyển từ tab "Thuộc tính" sang "Biến thể" bị mất selectedAttributes
- **Nguyên nhân**: Không có logic initialize selectedAttributes từ existing variations
- **Sửa**:
  - Thêm useEffect để auto-detect attributes từ existing variations
  - Extract attribute keys từ variation.attributes
  - Map keys về attribute IDs và set selectedAttributes
- **UI cải tiến**: Hiển thị selected attributes bằng Chips để user biết đã chọn gì

## Ghi chú

- Đã thêm color mapping cho 'bgc' color: `bgc: '#4285f4'`
- Logic fallback vẫn hoạt động nếu không có ảnh
- Console logs vẫn được giữ lại để debug
- **Root cause đã được sửa**: API conversion + edit mode preservation
- **Edit mode attributes**: Auto-detect và preserve selected attributes

### ✅ 13. Debug và sửa cấu trúc dữ liệu - Root cause analysis

- **Database structure**: Mỗi ảnh lưu như object riêng `[{color, colorCode, images: [url]}, ...]`
- **Frontend expect**: Tất cả ảnh cùng màu trong 1 object `[{color, colorCode, images: [url1, url2, ...]}]`
- **Giải pháp**: Merge logic - gộp tất cả images từ các objects thành 1 array
- **Debug script**: Confirmed logic hoạt động 100% với actual database data
- **ProductImage**: Thêm safe access và debug logs để track data flow

### ✅ 14. Sửa ExpandableVariant component - Edit modal image display

- **Root cause**: `editData` initialization không xử lý database image structure
- **Database format**: `[{color, colorCode, images: [urls]}, ...]`
- **Component expect**: `images: string[]`
- **Solution**: Thêm `processVariantImages()` function để merge images khi initialize
- **Applied to**: `useState` initialization và `handleCancel` function
- **Debug logs**: Track image processing trong edit modal

### ✅ 15. Sửa API PUT route - Preserve images khi update variant

- **Root cause**: API xóa tất cả variants cũ và tạo mới → mất images khi user chỉ update stock
- **Problem**: User update stock 22→20, frontend gửi variant data không có images → tạo variant mới với `images: []`
- **Solution**:
  - Get existing variants trước khi xóa
  - Find existing variant by SKU để preserve images
  - Chỉ dùng new images nếu user upload mới
  - Preserve existing images nếu không có images mới
- **Console logs**: Track image preservation process

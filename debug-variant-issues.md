# Debug Variant Product Issues

## 🔍 **Các vấn đề cần kiểm tra:**

### 1. **Hình ảnh lỗi trong tab biến thể**
- **Vấn đề**: Hình ảnh hiển thị nhưng bị lỗi
- **Debug steps**:
  - Check console logs cho image load errors
  - Verify Firebase URL format
  - Check network tab trong DevTools

### 2. **Tab thuộc tính không hiện gì**
- **Vấn đề**: DynamicAttributeManager không hiển thị dữ liệu
- **Debug steps**:
  - Check console logs cho "Loaded attributes"
  - Verify productAttributes data structure
  - Check if `isUsedForVariations` field exists

### 3. **Tồn kho hiển thị sai**
- **Vấn đề**: Sản phẩm biến thể hiển thị tồn kho sai
- **Đã sửa**: Tính tổng stock từ tất cả variants

## 🧪 **Test Steps:**

### Step 1: Check Console Logs
```javascript
// Mở DevTools Console và tìm:
// 1. "Initializing edit form with data:"
// 2. "Loading variant product data:"
// 3. "Loaded variations:"
// 4. "Loaded attributes:"
// 5. "Image load error:" (nếu có)
```

### Step 2: Check Network Tab
```
// Kiểm tra:
// 1. API call để lấy product data
// 2. Firebase image requests
// 3. Response data structure
```

### Step 3: Check Data Structure
```javascript
// Trong console, check:
console.log('Product data:', initialData);
console.log('Product attributes:', initialData.productAttributes);
console.log('Variants:', initialData.variants);
```

## 🔧 **Các thay đổi đã thực hiện:**

### 1. **Sửa tồn kho sản phẩm biến thể**
```typescript
// Tính tổng stock từ tất cả variants
displayStock = product.variants.reduce((total: number, variant: any) => {
  return total + (variant.stock || 0);
}, 0);
```

### 2. **Thêm error handling cho hình ảnh**
```typescript
onError={(e) => {
  console.error('Image load error:', img);
  e.currentTarget.src = '/noavatar.png';
}}
```

### 3. **Sửa mapping attributes**
```typescript
const loadedAttributes = initialData.productAttributes.map((attr: any) => ({
  id: attr.id,
  name: attr.name,
  slug: attr.name.toLowerCase().replace(/\s+/g, '-'),
  label: attr.label || attr.name,
  type: attr.type || 'SELECT',
  isUsedForVariations: attr.isVariation !== false, // Required field
  values: (attr.values || []).map((val: any) => ({
    id: val.id,
    value: val.value,
    label: val.label || val.value,
    position: val.position || 0
  }))
}));
```

### 4. **Thêm debug logging**
```typescript
console.log('Processing variant:', variant);
console.log('Variant images:', variant.images);
console.log('Loaded attributes:', loadedAttributes);
```

## 🎯 **Expected Results:**

### ✅ **Tồn kho**
- Sản phẩm biến thể hiển thị tổng stock từ tất cả variants
- VD: Variant 1 (10) + Variant 2 (5) = Total (15)

### ✅ **Tab thuộc tính**
- Hiển thị danh sách attributes đã tạo
- Có thể thêm/sửa/xóa attributes
- Có thể thêm values cho mỗi attribute

### ✅ **Tab biến thể**
- Hiển thị danh sách variants
- Hình ảnh load đúng hoặc fallback về noavatar.png
- Có thể edit từng variant

### ✅ **Hình ảnh**
- Load đúng từ Firebase
- Error handling khi URL sai
- Console log errors để debug

## 🚨 **Potential Issues:**

### 1. **Firebase URL Format**
```
// Check if URLs are in correct format:
https://firebasestorage.googleapis.com/v0/b/...
```

### 2. **Attribute Values Missing**
```
// Check if productAttributes include values:
productAttributes: [
  {
    id: "...",
    name: "color",
    values: [
      { id: "...", value: "red", label: "Đỏ" },
      { id: "...", value: "blue", label: "Xanh" }
    ]
  }
]
```

### 3. **Variant Images Array**
```
// Check if variant.images is array of strings:
variant.images: ["url1", "url2", "url3", "url4"]
```

## 📝 **Next Steps:**

1. **Build và test:**
```bash
cd D:\ThanhHuyStore
pnpm build
pnpm start
```

2. **Test specific product:**
- Tìm sản phẩm biến thể có 4 hình ảnh
- Click edit
- Check console logs
- Test từng tab

3. **Debug images:**
- Right-click image → Inspect
- Check src attribute
- Test URL trực tiếp trong browser

4. **Debug attributes:**
- Check if DynamicAttributeManager receives data
- Verify component renders correctly
- Check if attributes state is set

---

**Note**: Nếu vẫn có vấn đề, cần check database trực tiếp để verify data structure.

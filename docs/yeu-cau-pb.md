# Yêu cầu phát triển - ThanhHuyStore

## 🔗 **1. Sửa đường dẫn sản phẩm thành slug**

### **Vấn đề hiện tại:**

- URL hiện tại: `localhost:3000/product/0937382928238` (ID dạng số)
- Không thân thiện với SEO và người dùng

### **Yêu cầu:**

- URL mới: `localhost:3000/product/dien-thoai-iphone-16` (slug dạng text)
- Slug tự động tạo từ tên sản phẩm

### **Cách thực hiện (chỉ dùng ReactJS - không đụng database):**

#### **Bước 1: Tạo utility function tạo slug**

```typescript
// utils/slugify.ts
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
    .replace(/[^a-z0-9\s-]/g, '') // Chỉ giữ chữ, số, space, dấu gạch
    .replace(/\s+/g, '-') // Thay space bằng dấu gạch
    .replace(/-+/g, '-') // Gộp nhiều dấu gạch thành 1
    .trim();
}
```

#### **Bước 2: Cập nhật frontend routes (client-side)**

```typescript
// Thay vì: /product/[id]
// Dùng: /product/[slug] với slug được tạo từ name + id

// components/ProductCard.tsx
const productSlug = `${createSlug(product.name)}-${product.id}`;
<Link href={`/product/${productSlug}`}>

// app/product/[slug]/page.tsx
const extractIdFromSlug = (slug: string) => {
  const parts = slug.split('-');
  return parts[parts.length - 1]; // Lấy ID cuối cùng
};
```

#### **Bước 3: Cập nhật API routes (backward compatible)**

```typescript
// api/product/[slug]/route.ts
export async function GET(request: Request, { params }: { params: { slug: string } }) {
  // Nếu slug chứa dấu gạch, extract ID
  const id = params.slug.includes('-') ? params.slug.split('-').pop() : params.slug; // Fallback cho old URLs

  // Query bằng ID như cũ
  const product = await prisma.product.findUnique({ where: { id } });
}
```

#### **Bước 4: SEO-friendly URLs**

```typescript
// Tất cả links sẽ hiển thị:
// localhost:3000/product/dien-thoai-iphone-16-abc123
// Nhưng vẫn query database bằng ID 'abc123'
```

---

## ✏️ **2. Sửa lỗi dấu câu trong luận văn**

### **Vấn đề hiện tại:**

- Dấu phẩy, chấm không dính sát chữ: `Hello , world .`
- Không đúng chuẩn tiếng Việt

### **Yêu cầu:**

- Dấu câu phải dính sát chữ: `Hello, world.`
- Áp dụng cho toàn bộ nội dung

### **Cách thực hiện:**

#### **Regex patterns cần sửa:**

```regex
# Tìm và thay thế
\s+([,.!?;:])  →  $1     # Bỏ space trước dấu câu
([,.!?;:])\s+  →  $1 $2  # Đảm bảo 1 space sau dấu câu
```

#### **Các file cần kiểm tra:**

- Tất cả file `.md` trong docs/
- Content trong database (descriptions, articles)
- Static text trong components

---

## 🔍 **3. Nâng cấp tính năng tìm kiếm**

### **Yêu cầu:**

- Tìm kiếm kết hợp nhiều tiêu chí
- Filter theo giá, loại, hãng
- Giao diện thân thiện

### **Cách thực hiện (client-side filtering - không cần API mới):**

#### **Bước 1: Enhanced Search Hook**

```typescript
// hooks/useAdvancedSearch.ts
export const useAdvancedSearch = (products: Product[]) => {
  const [filters, setFilters] = useState({
    query: '',
    category: '',
    brand: '',
    priceRange: [0, 50000000],
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        // Text search
        if (filters.query && !product.name.toLowerCase().includes(filters.query.toLowerCase())) {
          return false;
        }
        // Category filter
        if (filters.category && product.categoryId !== filters.category) {
          return false;
        }
        // Price range
        if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Client-side sorting
        const field = filters.sortBy;
        const order = filters.sortOrder === 'asc' ? 1 : -1;
        return (a[field] > b[field] ? 1 : -1) * order;
      });
  }, [products, filters]);

  return { filteredProducts, filters, setFilters };
};
```

#### **Bước 2: Advanced Search Component**

```typescript
// components/AdvancedSearch.tsx
const AdvancedSearch = ({ onFiltersChange }) => {
  return (
    <div className='search-container'>
      <SearchInput onChange={handleQueryChange} />
      <CategoryDropdown categories={categories} onChange={handleCategoryChange} />
      <BrandDropdown brands={brands} onChange={handleBrandChange} />
      <PriceRangeSlider min={0} max={50000000} onChange={handlePriceChange} />
      <SortOptions onChange={handleSortChange} />
    </div>
  );
};
```

#### **Bước 3: Integration vào existing pages**

```typescript
// pages/products/page.tsx
const ProductsPage = () => {
  const { filteredProducts, filters, setFilters } = useAdvancedSearch(allProducts);

  return (
    <div>
      <AdvancedSearch onFiltersChange={setFilters} />
      <SearchResults products={filteredProducts} />
      <FilterSummary filters={filters} resultCount={filteredProducts.length} />
    </div>
  );
};
```

---

## 🎁 **4. Hệ thống thông báo khuyến mãi**

### **Vấn đề hiện tại:**

- Khách hàng không biết có mã giảm giá
- Không có cách thông báo voucher

### **Yêu cầu:**

- Thông báo voucher có sẵn
- Hiển thị điều kiện áp dụng
- Gợi ý mã phù hợp

### **Cách thực hiện (sử dụng existing voucher data):**

#### **Bước 1: Voucher Notification Hook**

```typescript
// hooks/useVoucherNotification.ts
export const useVoucherNotification = (cartItems: CartItem[]) => {
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);

  useEffect(() => {
    // Fetch existing vouchers from API
    const fetchVouchers = async () => {
      const vouchers = await getActiveVouchers();

      // Client-side filtering based on cart
      const applicableVouchers = vouchers.filter(voucher => {
        const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // Check minimum order value
        if (voucher.minOrderValue && cartTotal < voucher.minOrderValue) {
          return false;
        }

        return true;
      });

      setAvailableVouchers(applicableVouchers);
    };

    fetchVouchers();
  }, [cartItems]);

  return { availableVouchers };
};
```

#### **Bước 2: Smart Notification Components**

```typescript
// components/VoucherBanner.tsx
const VoucherBanner = () => {
  const { availableVouchers } = useVoucherNotification(cartItems);

  if (availableVouchers.length === 0) return null;

  return (
    <div className='voucher-banner'>
      🎉 Bạn có thể tiết kiệm {formatDiscount(voucher)} với mã {voucher.code}!
      <button onClick={() => applyVoucher(voucher.code)}>Áp dụng ngay</button>
    </div>
  );
};
```

#### **Bước 3: Integration vào existing pages**

```typescript
// layout.tsx - Global banner
<VoucherBanner />

// cart/page.tsx - Smart suggestions
<VoucherSuggestions cartItems={cartItems} />

// checkout/page.tsx - Available vouchers
<AvailableVouchers cartTotal={cartTotal} />
```

#### **Bước 4: Admin Analytics (existing data)**

```typescript
// Use existing order data to calculate voucher effectiveness
const voucherStats = useMemo(() => {
  return orders.reduce((stats, order) => {
    if (order.voucherCode) {
      stats[order.voucherCode] = {
        usageCount: (stats[order.voucherCode]?.usageCount || 0) + 1,
        totalSavings: (stats[order.voucherCode]?.totalSavings || 0) + order.discount
      };
    }
    return stats;
  }, {});
}, [orders]);
```

---

## 📋 **Timeline thực hiện**

### **Tuần 1: Slug system**

- [ ] Cập nhật database schema
- [ ] Tạo migration script
- [ ] Cập nhật API routes
- [ ] Test và fix bugs

### **Tuần 2: Search enhancement**

- [ ] Thiết kế UI advanced search
- [ ] Implement search API
- [ ] Tích hợp frontend
- [ ] Performance optimization

### **Tuần 3: Voucher notification**

- [ ] Thiết kế voucher components
- [ ] Logic gợi ý thông minh
- [ ] Admin management interface
- [ ] Testing và deployment

### **Tuần 4: Polish & Documentation**

- [ ] Sửa lỗi dấu câu luận văn
- [ ] Code review và refactor
- [ ] Viết documentation
- [ ] User testing

---

## 🎯 **Ưu tiên thực hiện**

1. **Cao**: Slug system (SEO quan trọng)
2. **Cao**: Voucher notification (tăng conversion)
3. **Trung bình**: Advanced search (UX improvement)
4. **Thấp**: Sửa dấu câu (cosmetic fix)

---

## 📊 **Metrics đánh giá**

### **SEO (Slug system)**

- Page load speed
- Search engine ranking
- Click-through rate

### **Conversion (Voucher system)**

- Voucher usage rate
- Average order value
- Customer retention

### **UX (Search system)**

- Search success rate
- Time to find product
- User satisfaction score

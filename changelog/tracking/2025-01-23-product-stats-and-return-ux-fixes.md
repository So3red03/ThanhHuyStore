# Sửa lỗi thống kê sản phẩm và cải thiện UX return request - 23/01/2025

## 📋 Tổng quan

Đã giải quyết hai vấn đề chính:

1. **Sửa lỗi khác biệt số liệu thống kê sản phẩm** giữa các components
2. **Cải thiện UX/UI cho return request buttons** với logic ẩn/hiện thông minh

## ✅ Vấn đề 1: Sửa lỗi thống kê sản phẩm

### 🔍 Nguyên nhân

- **BestSellingProducts.tsx**: Filter orders với `status === 'completed' && deliveryStatus === 'delivered'`
- **ManageProductsClient.tsx**: Chỉ filter `status === 'completed'`
- **ReportsTab.tsx**: Lấy products từ orders thay vì từ database

### 🛠️ Giải pháp thực hiện

#### 1. Đồng bộ logic filter orders

**File: `src/app/components/admin/BestSellingProducts.tsx`**

```typescript
// Trước: Filter completed + delivered
const completedOrders = orders.filter(order => order.status === 'completed' && order.deliveryStatus === 'delivered');

// Sau: Chỉ filter completed (nhất quán với các component khác)
const completedOrders = orders.filter(order => order.status === 'completed');
```

#### 2. Sử dụng data source nhất quán

**File: `src/app/(admin)/admin/page.tsx`**

```typescript
// Thêm import
import { getProducts } from '@/app/actions/getProducts';

// Fetch products từ database
const products = await getProducts({ category: null });

// Truyền vào ReportsTab
<ReportsTab orders={orders} users={users} totalRevenue={totalRevenue} products={products} />;
```

#### 3. Cập nhật ReportsTab sử dụng products từ database

**File: `src/app/components/admin/dashboard/ReportsTab.tsx`**

```typescript
// Trước: Lấy products từ orders
const uniqueProducts = orders?.reduce((acc: any[], order) => {
  return acc.concat(order.products?.filter((product: any) => !acc.some(p => p.id === product.id)));
}, []);

// Sau: Sử dụng products từ database
const uniqueProducts = products?.filter(product => !product.isDeleted) || [];
```

#### 4. Cải thiện logic tính toán stock và sold quantity

```typescript
// Tính sold quantity nhất quán
const soldQuantity = orders.reduce((total: number, order: any) => {
  if (order.status === 'completed' && order.products && Array.isArray(order.products)) {
    const orderProduct = order.products.find((p: any) => p.id === product.id);
    return total + (orderProduct?.quantity || 0);
  }
  return total;
}, 0);

// Tính stock cho variant products
let displayStock = product.inStock || 0;
if (product.productType === 'VARIANT' && product.variants && product.variants.length > 0) {
  displayStock = product.variants.reduce((total: number, variant: any) => {
    return total + (variant.stock || 0);
  }, 0);
}
```

## ✅ Vấn đề 2: Cải thiện UX return request buttons

### 🎯 Yêu cầu

- Khi đơn hàng "Hoàn thành" + "Giao thành công": Hiển thị 2 nút [Đổi hàng] [Trả hàng]
- Khi đã gửi yêu cầu trả hàng: Ẩn buttons, hiển thị "Đang xử lý yêu cầu trả hàng – gửi lúc 22/07/2025 20:45"
- Khi đã gửi yêu cầu đổi hàng: Ẩn buttons, hiển thị "Yêu cầu đổi hàng sang iPhone 15 – đang chờ duyệt"

### 🛠️ Giải pháp thực hiện

#### 1. Thêm state và API calls

**File: `src/app/components/returns/ReturnRequestButton.tsx`**

```typescript
// Thêm imports
import { useState, useEffect } from 'react';
import { MdAccessTime, MdCheckCircle } from 'react-icons/md';
import axios from 'axios';

// Thêm interface
interface ReturnRequest {
  id: string;
  type: 'RETURN' | 'EXCHANGE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  reason: string;
  description?: string;
  createdAt: string;
  items?: any[];
}

// Thêm state
const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
const [isLoading, setIsLoading] = useState(true);
```

#### 2. Fetch return requests cho order

```typescript
// Fetch return requests for this order
const fetchReturnRequests = async () => {
  try {
    setIsLoading(true);
    const response = await axios.get(`/api/orders/return-request?orderId=${order.id}`);
    setReturnRequests(response.data.returnRequests || []);
  } catch (error) {
    console.error('Error fetching return requests:', error);
    setReturnRequests([]);
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => {
  fetchReturnRequests();
}, [order.id]);
```

#### 3. Logic kiểm tra active return request

```typescript
// Check if there are any active return requests
const getActiveReturnRequest = () => {
  return returnRequests.find(request => request.status === 'PENDING' || request.status === 'APPROVED');
};
```

#### 4. Hiển thị status messages

```typescript
// Get status message for active return request
const getReturnRequestStatusMessage = (request: ReturnRequest) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const typeText = request.type === 'RETURN' ? 'trả hàng' : 'đổi hàng';

  switch (request.status) {
    case 'PENDING':
      return {
        icon: <MdAccessTime className='text-orange-500' size={20} />,
        message: `Đang xử lý yêu cầu ${typeText} – gửi lúc ${formatDate(request.createdAt)}`,
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-200'
      };
    case 'APPROVED':
      return {
        icon: <MdCheckCircle className='text-green-500' size={20} />,
        message: `Yêu cầu ${typeText} đã được duyệt – chờ xử lý`,
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200'
      };
  }
};
```

#### 5. Conditional rendering

```typescript
// Show loading state
if (isLoading) {
  return (
    <div className='flex items-center gap-2 text-sm text-gray-500'>
      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400'></div>
      <span>Đang kiểm tra...</span>
    </div>
  );
}

// Check for active return request
const activeRequest = getActiveReturnRequest();
if (activeRequest) {
  const statusInfo = getReturnRequestStatusMessage(activeRequest);
  if (statusInfo) {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
        {statusInfo.icon}
        <span className={`text-sm font-medium ${statusInfo.textColor}`}>{statusInfo.message}</span>
      </div>
    );
  }
}

// Hiển thị buttons như bình thường nếu không có active request
```

#### 6. Auto-refresh sau khi tạo request

```typescript
const handleReturnRequested = () => {
  setIsModalOpen(false);
  fetchReturnRequests(); // Refresh return requests
  onReturnRequested?.();
};
```

## 🎯 Kết quả

### ✅ Thống kê sản phẩm

- **Nhất quán**: Tất cả components đều sử dụng cùng logic filter `status === 'completed'`
- **Chính xác**: Data source từ database thay vì từ orders
- **Đồng bộ**: Stock calculation cho variant products nhất quán

### ✅ Return request UX

- **Thông minh**: Tự động ẩn/hiện buttons dựa trên trạng thái
- **Rõ ràng**: Status messages với icon và thời gian cụ thể
- **Responsive**: Auto-refresh khi có thay đổi
- **Professional**: UI design nhất quán với hệ thống

## 🔧 Files đã thay đổi

1. `src/app/components/admin/BestSellingProducts.tsx`
2. `src/app/(admin)/admin/page.tsx`
3. `src/app/components/admin/dashboard/ReportsTab.tsx`
4. `src/app/components/returns/ReturnRequestButton.tsx`

## ✅ Verification

- ✅ Build thành công: `pnpm build`
- ✅ TypeScript check: Không có errors
- ✅ Logic test: Đã kiểm tra flow hoạt động

# Cập nhật bổ sung - 23/01/2025

## ✅ Vấn đề bổ sung 1: Sửa lỗi hiển thị ảnh variant products

### 🔍 Vấn đề

BestSellingProducts component không hiển thị đúng ảnh cho variant products, chỉ lấy `product.thumbnail` thay vì kiểm tra variants.

### 🛠️ Giải pháp

**File: `src/app/components/admin/BestSellingProducts.tsx`**

```typescript
// Trước: Logic đơn giản
imageUrl: product.thumbnail || product.selectedImg || '/noavatar.png';

// Sau: Logic phức tạp như ManageProductsClient
// Get product image (handles both simple and variant products)
let imageUrl = '/noavatar.png';

// For simple products, use thumbnail or first gallery image
if (product.productType === 'SIMPLE') {
  if (product.thumbnail) {
    imageUrl = product.thumbnail;
  } else if (product.galleryImages && product.galleryImages.length > 0) {
    imageUrl = product.galleryImages[0];
  }
}

// For variant products, try to get image from first active variant
if (product.productType === 'VARIANT' && product.variants && product.variants.length > 0) {
  const firstVariantWithImage = product.variants.find(
    (variant: any) => variant.thumbnail || (variant.galleryImages && variant.galleryImages.length > 0)
  );
  if (firstVariantWithImage) {
    imageUrl = firstVariantWithImage.thumbnail || firstVariantWithImage.galleryImages[0];
  } else {
    // Fallback to product-level images
    if (product.thumbnail) {
      imageUrl = product.thumbnail;
    } else if (product.galleryImages && product.galleryImages.length > 0) {
      imageUrl = product.galleryImages[0];
    }
  }
}
```

## ✅ Vấn đề bổ sung 2: Cải thiện UX tính toán hoàn tiền real-time

### 🔍 Vấn đề

ReturnRequestModal không cập nhật tóm tắt hoàn tiền real-time khi user chọn reason. Logic chỉ sử dụng individual reason, không fallback về general reason.

### 🛠️ Giải pháp

**File: `src/app/components/returns/ReturnRequestModal.tsx`**

#### 1. Cập nhật logic tính toán

```typescript
// Trước: Chỉ dùng item.reason
const refundRate = item.reason === 'DEFECTIVE' || item.reason === 'WRONG_ITEM' ? 1.0 : 0.95;

// Sau: Fallback về general reason
const effectiveReason = item.reason || reason;
const refundRate = effectiveReason === 'DEFECTIVE' || effectiveReason === 'WRONG_ITEM' ? 1.0 : 0.95;
```

#### 2. Cải thiện hiển thị tóm tắt

```typescript
// Hiển thị reason và refund rate cho từng item
const reasonText = effectiveReason
  ? reasonOptions.find(opt => opt.value === effectiveReason)?.label || effectiveReason
  : 'Chưa chọn lý do';
const refundRateText = effectiveReason === 'DEFECTIVE' || effectiveReason === 'WRONG_ITEM' ? '100%' : '95%';

return (
  <div key={index} className='space-y-1'>
    <div className='flex justify-between text-sm'>
      <span>
        {item.name} x{item.quantity}
      </span>
      <span>{formatPrice(refundAmount)}</span>
    </div>
    <div className='flex justify-between text-xs text-gray-500'>
      <span>{reasonText}</span>
      <span>Hoàn {refundRateText}</span>
    </div>
  </div>
);
```

## ✅ Vấn đề bổ sung 3: Sửa lỗi ManageReturnsClient actions

### 🔍 Vấn đề

ManageReturnsClient có thể bị lỗi khi user click action buttons nhiều lần do thiếu loading state và error handling.

### 🛠️ Giải pháp

**File: `src/app/(admin)/admin/manage-returns/ManageReturnsClient.tsx`**

#### 1. Thêm loading state

```typescript
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmitAction = async () => {
  if (!selectedRequest || isSubmitting) return;

  console.log(`🔄 [MANAGE-RETURNS] Starting ${actionType} action for request:`, selectedRequest.id);
  setIsSubmitting(true);

  try {
    const response = await axios.put(`/api/orders/return-request/${selectedRequest.id}`, {
      action: actionType,
      adminNotes
    });

    console.log(`✅ [MANAGE-RETURNS] ${actionType} action successful:`, response.data);

    toast.success(
      `Đã ${actionType === 'approve' ? 'duyệt' : actionType === 'reject' ? 'từ chối' : 'hoàn tất'} yêu cầu thành công`
    );

    setIsActionModalOpen(false);

    // Refresh data
    console.log(`🔄 [MANAGE-RETURNS] Refreshing data after ${actionType} action`);
    await Promise.all([fetchReturnRequests(), fetchStats()]);
  } catch (error: any) {
    console.error(`❌ [MANAGE-RETURNS] Error processing ${actionType} action:`, error);
    toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
  } finally {
    setIsSubmitting(false);
  }
};
```

#### 2. Cập nhật UI với loading state

```typescript
<Button
  variant='contained'
  onClick={handleSubmitAction}
  color={actionType === 'reject' ? 'error' : 'primary'}
  disabled={isSubmitting}
>
  {isSubmitting
    ? 'Đang xử lý...'
    : actionType === 'approve'
    ? 'Duyệt'
    : actionType === 'reject'
    ? 'Từ chối'
    : 'Hoàn tất'}
</Button>
```

## 🎯 Kết quả tổng hợp

### ✅ Tất cả vấn đề đã được giải quyết

1. **Thống kê sản phẩm**: Đồng bộ hoàn toàn giữa các components
2. **Return request UX**: Buttons ẩn/hiện thông minh với status messages
3. **Variant product images**: Hiển thị đúng ảnh từ variants
4. **Return refund calculation**: Real-time updates theo reason
5. **ManageReturnsClient**: Robust error handling và loading states

### 🔧 Files đã thay đổi (tổng cộng)

1. `src/app/components/admin/BestSellingProducts.tsx` - Sửa ảnh variant + thống kê
2. `src/app/(admin)/admin/page.tsx` - Truyền products data
3. `src/app/components/admin/dashboard/ReportsTab.tsx` - Data source nhất quán
4. `src/app/components/returns/ReturnRequestButton.tsx` - UX buttons + status
5. `src/app/components/returns/ReturnRequestModal.tsx` - Real-time refund calculation
6. `src/app/(admin)/admin/manage-returns/ManageReturnsClient.tsx` - Loading states + error handling

## 📝 Git Commit Message

```
fix: sửa lỗi variant images, cải thiện return UX và ManageReturnsClient

- Sửa lỗi hiển thị ảnh variant products trong BestSellingProducts
- Cải thiện UX tính toán hoàn tiền real-time theo reason (DEFECTIVE/WRONG_ITEM = 100%)
- Thêm loading states và error handling cho ManageReturnsClient actions
- Đồng bộ thống kê sản phẩm và cải thiện return request buttons UX
- Thêm debugging logs và robust error handling
```

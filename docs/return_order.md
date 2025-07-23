# 🔄 Tính Năng Đổi Trả Đơn Hàng - Simplified & Practical

## 📋 Phân Tích Nghiệp Vụ Đơn Giản Hóa

### 🎯 2 Loại Chính (Đơn Giản Hóa)

#### 1. **Trả Hàng (Return Only)**

- **Lý do**: Lỗi sản phẩm, không hài lòng, sai mô tả
- **Kết quả**: Hoàn tiền 100% (nếu lỗi shop) hoặc 95% (nếu khách đổi ý)
- **Thời gian**: 7 ngày kể từ khi nhận hàng
- **Điều kiện**: Sản phẩm còn nguyên vẹn, có hộp (nếu electronics)

#### 2. **Đổi Hàng (Exchange Only)**

- **Lý do**: Sai size, sai màu, muốn model khác
- **Kết quả**: Đổi 1:1 (cùng giá) hoặc bù trừ tiền (khác giá)
- **Thời gian**: 7 ngày kể từ khi nhận hàng
- **Điều kiện**: Sản phẩm mới phải còn hàng

> **Loại bỏ**: Warranty (quá phức tạp, để sau)

### 🏪 Nghiệp Vụ Thực Tế - Simplified Cases

#### **Case 1: Partial Return (Trả 1 phần)**

```
Đơn hàng #12345: iPhone (25M) + MacBook (28M) + iPad (22M) = 75M
→ Khách muốn trả iPhone vì "không hài lòng"
```

**Xử lý đơn giản**:

1. ✅ **Check**: Trong 7 ngày, còn nguyên seal
2. ✅ **Tạo Return**: Chỉ iPhone, lý do "đổi ý"
3. ✅ **Tính tiền**: 25M × 95% = 23.75M (trừ 5% phí)
4. ✅ **Update Order**: Status → "Partial Return"
5. ✅ **Restore Stock**: +1 iPhone
6. ✅ **Refund**: 23.75M qua phương thức gốc

#### **Case 2: Simple Exchange (Đổi cùng giá)**

```
Khách mua iPhone 15 Pro Xanh (25M) → muốn đổi iPhone 15 Pro Đen (25M)
```

**Xử lý đơn giản**:

1. ✅ **Check**: Còn hàng iPhone Đen
2. ✅ **Tạo Exchange**: Xanh → Đen (cùng giá)
3. ✅ **Inventory**: -1 Đen, +1 Xanh
4. ✅ **Update Order**: Thay đổi variant
5. ✅ **Ship**: Gửi iPhone Đen mới

#### **Case 3: Exchange với chênh lệch**

```
iPhone 15 Pro (25M) → iPhone 15 Pro Max (30M)
```

**Xử lý đơn giản**:

1. ✅ **Tính chênh lệch**: 30M - 25M = 5M
2. ✅ **Payment**: Khách thanh toán thêm 5M
3. ✅ **Inventory**: -1 Pro Max, +1 Pro
4. ✅ **Ship**: Gửi Pro Max mới

### 🔧 Database Schema Đơn Giản

#### **Simplified ReturnRequest Model**

```typescript
model ReturnRequest {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  orderId         String            @db.ObjectId
  userId          String            @db.ObjectId
  type            ReturnType        // RETURN hoặc EXCHANGE
  status          ReturnStatus      @default(PENDING)

  // Simplified items (JSON array)
  items           Json              // [{productId, variantId?, quantity, unitPrice, reason}]

  // Basic info
  reason          String            // "DEFECTIVE", "CHANGE_MIND", "WRONG_SIZE"
  description     String?
  images          String[]          // Tối đa 3 ảnh

  // Financial (simple)
  refundAmount    Float?            // Số tiền hoàn (đã tính phí)
  additionalCost  Float?            // Phí bù thêm (exchange)

  // Admin workflow (simple)
  adminNotes      String?
  approvedBy      String?           @db.ObjectId
  approvedAt      DateTime?

  // Timestamps
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  order           Order             @relation(fields: [orderId], references: [id])
  user            User              @relation(fields: [userId], references: [id])
  approver        User?             @relation("ReturnApprover", fields: [approvedBy], references: [id])
}

enum ReturnType {
  RETURN          // Trả hàng hoàn tiền
  EXCHANGE        // Đổi hàng
}

enum ReturnStatus {
  PENDING         // Chờ duyệt
  APPROVED        // Đã duyệt
  REJECTED        // Từ chối
  COMPLETED       // Hoàn tất
}
```

#### **Update Order Model (Minimal)**

```typescript
model Order {
  // ... existing fields

  // Simple return tracking
  returnStatus    OrderReturnStatus?  @default(NONE)
  returnRequests  ReturnRequest[]
  returnedAmount  Float?              @default(0) // Tổng tiền đã hoàn
}

enum OrderReturnStatus {
  NONE            // Chưa trả hàng
  PARTIAL         // Trả một phần
  FULL            // Trả toàn bộ
  EXCHANGED       // Đã đổi hàng
}
```

### 🔄 Simplified Workflow

#### **Return Flow (Đơn Giản)**

```
Customer Request → Auto Check (7 days?) → Admin Approve → Process Refund → Done
```

#### **Exchange Flow (Đơn Giản)**

```
Customer Request → Check Stock → Calculate Diff → Payment (if needed) → Ship New → Done
```

#### **Business Rules (Đơn Giản)**

- **Return**: 7 ngày, 100% (lỗi shop) hoặc 95% (đổi ý)
- **Exchange**: 7 ngày, cùng category, phải còn hàng
- **Auto-approve**: Đơn < 5M, lý do "lỗi shop"
- **Manual review**: Đơn ≥ 5M hoặc lý do "đổi ý"

### 💰 Simplified Calculation

#### **Return Calculation (Đơn Giản)**

```typescript
// Chỉ 2 case đơn giản
const calculateRefund = (itemPrice: number, reason: string): number => {
  if (reason === 'DEFECTIVE' || reason === 'WRONG_ITEM') {
    return itemPrice; // 100% hoàn tiền
  } else {
    return itemPrice * 0.95; // 95% hoàn tiền (trừ 5% phí)
  }
};

// Exchange calculation
const calculateExchange = (oldPrice: number, newPrice: number): number => {
  return newPrice - oldPrice; // Chênh lệch (có thể âm = hoàn tiền)
};
```

### 🚚 Simplified Logistics

#### **Return Method (Đơn Giản)**

- **Ship Back**: Khách gửi về (shop trả phí nếu lỗi shop)
- **Điều kiện**: Sản phẩm còn nguyên vẹn, có hộp gốc

### 📱 Simplified UI Flow

#### **Customer UI (Đơn Giản)**

1. **Order Detail** → **Return/Exchange Button**
2. **Select Items** → **Choose Reason** → **Submit**
3. **Receive Email** → **Ship Back** → **Get Refund**

#### **Admin UI (Đơn Giản)**

1. **Return List** → **Review Request**
2. **Approve/Reject** → **Process Refund**
3. **Update Inventory** → **Close**

### 🔒 Simplified Business Rules

#### **Return Policy (Đơn Giản)**

```typescript
const returnPolicy = {
  timeLimit: 7, // 7 ngày
  refundRates: {
    DEFECTIVE: 1.0, // 100%
    WRONG_ITEM: 1.0, // 100%
    CHANGE_MIND: 0.95 // 95%
  },
  requiresOriginalBox: true,
  nonReturnableItems: ['DIGITAL', 'CUSTOM']
};
```

#### **Exchange Rules (Đơn Giản)**

- Chỉ đổi trong cùng category
- Bù trừ tiền nếu chênh lệch giá
- Sản phẩm đổi phải còn hàng

### 🎯 Simplified Implementation Plan

#### **Phase 1: Database (Đơn Giản)**

- [ ] Tạo ReturnRequest model (đơn giản)
- [ ] Cập nhật Order model (minimal)
- [ ] Migration script

#### **Phase 2: Core APIs (Đơn Giản)**

- [ ] POST /api/returns/create (tạo return request)
- [ ] GET /api/returns/[id] (xem chi tiết)
- [ ] PUT /api/returns/[id]/approve (duyệt)
- [ ] PUT /api/returns/[id]/complete (hoàn tất)

#### **Phase 3: Customer UI (Đơn Giản)**

- [ ] Return button trong Order Detail
- [ ] Form chọn sản phẩm + lý do
- [ ] Hiển thị trạng thái return

#### **Phase 4: Admin UI (Đơn Giản)**

- [ ] Return list trong Admin
- [ ] Approve/Reject button
- [ ] Complete button (sau khi nhận hàng)

#### **Phase 5: Inventory & Refund (Đơn Giản)**

- [ ] Restore inventory khi complete
- [ ] Process refund (manual)

### 📊 Simplified Metrics

#### **Basic Metrics**

- Return rate: % đơn hàng có return
- Average processing time: Thời gian xử lý
- Refund amount: Tổng tiền hoàn

### 🚨 Simplified Risk Management

#### **Basic Controls**

- Limit: 3 returns/customer/month
- Approval: >5M cần admin duyệt
- Photo: Bắt buộc cho lý do "lỗi sản phẩm"

### 🔄 Integration Points (Đơn Giản)

#### **Existing Systems**

- **Inventory**: Restore stock khi complete
- **Payment**: Manual refund (admin)
- **Email**: Notification cho customer
- **Audit**: Log return actions

## 🎯 API Endpoints Design

### **Core APIs (Đơn Giản)**

#### **1. Create Return Request**

```typescript
POST /api/returns/create
{
  orderId: string,
  type: 'RETURN' | 'EXCHANGE',
  items: [{
    productId: string,
    variantId?: string,
    quantity: number,
    reason: 'DEFECTIVE' | 'WRONG_ITEM' | 'CHANGE_MIND'
  }],
  description?: string,
  images?: string[]
}
```

#### **2. Get Return Details**

```typescript
GET /api/returns/[id]
Response: ReturnRequest object
```

#### **3. Admin Approve/Reject**

```typescript
PUT /api/returns/[id]/approve
{
  approved: boolean,
  adminNotes?: string
}
```

#### **4. Complete Return**

```typescript
PUT /api/returns/[id]/complete
{
  refundAmount: number,
  restoreInventory: boolean
}
```

### **Database Operations**

#### **Inventory Restore Logic**

```typescript
// Khi complete return
for (const item of returnRequest.items) {
  if (item.variantId) {
    // Restore variant stock
    await updateVariantStock(item.variantId, +item.quantity);
  } else {
    // Restore simple product stock
    await updateProductStock(item.productId, +item.quantity);
  }
}
```

#### **Order Status Update**

```typescript
// Update order return status
const totalReturnedValue = calculateTotalReturnValue(returnRequest.items);
await updateOrder(orderId, {
  returnStatus: isFullReturn ? 'FULL' : 'PARTIAL',
  returnedAmount: existingReturnedAmount + totalReturnedValue
});
```

## 🔧 UI Components

### **Customer UI Components**

#### **1. Return Request Form**

```tsx
// Simple form with product selection
const ReturnRequestForm = ({ order }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [reason, setReason] = useState('');

  return (
    <div className='p-4 border rounded'>
      <h2>Yêu Cầu Đổi/Trả Hàng</h2>

      {/* Product Selection */}
      <div className='my-4'>
        <h3>Chọn sản phẩm:</h3>
        {order.products.map(product => (
          <div key={product.id} className='flex items-center my-2'>
            <input type='checkbox' onChange={e => handleSelectItem(product, e.checked)} />
            <img src={product.thumbnail} className='w-12 h-12 mx-2' />
            <div>
              <p>{product.name}</p>
              <p className='text-sm text-gray-500'>
                {formatPrice(product.price)} x {product.quantity}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Reason Selection */}
      <div className='my-4'>
        <h3>Lý do:</h3>
        <select value={reason} onChange={e => setReason(e.target.value)}>
          <option value=''>-- Chọn lý do --</option>
          <option value='DEFECTIVE'>Sản phẩm lỗi</option>
          <option value='WRONG_ITEM'>Không đúng sản phẩm</option>
          <option value='CHANGE_MIND'>Đổi ý</option>
        </select>
      </div>

      <button className='bg-blue-500 text-white px-4 py-2 rounded' onClick={handleSubmit}>
        Gửi yêu cầu
      </button>
    </div>
  );
};
```

### **Admin UI Components**

#### **1. Return Request List**

```tsx
// Simple admin list
const ReturnRequestList = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    // Fetch return requests
    fetchReturnRequests().then(setRequests);
  }, []);

  return (
    <div className='p-4'>
      <h2>Quản Lý Đổi/Trả Hàng</h2>

      <table className='w-full mt-4'>
        <thead>
          <tr>
            <th>ID</th>
            <th>Khách hàng</th>
            <th>Loại</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {requests.map(request => (
            <tr key={request.id}>
              <td>{request.id.substring(0, 8)}</td>
              <td>{request.user.name}</td>
              <td>{request.type === 'RETURN' ? 'Trả hàng' : 'Đổi hàng'}</td>
              <td>{getStatusText(request.status)}</td>
              <td>{formatDate(request.createdAt)}</td>
              <td>
                <button
                  className='bg-blue-500 text-white px-2 py-1 rounded mr-2'
                  onClick={() => handleView(request.id)}
                >
                  Xem
                </button>
                {request.status === 'PENDING' && (
                  <>
                    <button
                      className='bg-green-500 text-white px-2 py-1 rounded mr-2'
                      onClick={() => handleApprove(request.id)}
                    >
                      Duyệt
                    </button>
                    <button
                      className='bg-red-500 text-white px-2 py-1 rounded'
                      onClick={() => handleReject(request.id)}
                    >
                      Từ chối
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

## 📝 Kết Luận

### **Tóm Tắt Approach**

1. **Đơn Giản Hóa**: Chỉ tập trung vào 2 loại chính (Return & Exchange)
2. **Workflow Rõ Ràng**: Customer request → Admin approve → Process
3. **Database Tối Giản**: ReturnRequest model với các fields cần thiết
4. **UI Thân Thiện**: Form đơn giản cho customer, dashboard cho admin
5. **Business Rules**: Chính sách rõ ràng (7 ngày, 95-100% refund)

### **Next Steps**

1. **Implement Database**: Tạo models và migration
2. **Build Core APIs**: 4 endpoints chính
3. **Develop UI**: Customer form và Admin dashboard
4. **Test Flow**: Verify toàn bộ quy trình
5. **Monitor & Improve**: Theo dõi metrics và cải thiện

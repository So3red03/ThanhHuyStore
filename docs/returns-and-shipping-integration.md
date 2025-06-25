# 🔄 Tính năng Đổi/Trả hàng & Tích hợp GHN

## 📋 **TỔNG QUAN**

Tính năng đổi/trả hàng và tích hợp vận chuyển GHN (Giao Hàng Nhanh) cho ThanhHuyStore - được thiết kế đơn giản nhưng thực tiễn, phù hợp với đồ án tốt nghiệp.

## 🎯 **TÍNH NĂNG CHÍNH**

### **1. Đổi/Trả hàng**
- ✅ **3 loại yêu cầu**: Đổi hàng, Trả hàng, Hoàn tiền
- ✅ **Điều kiện**: Đơn hàng đã hoàn thành, trong vòng 7 ngày
- ✅ **Upload ảnh**: Tối đa 5 ảnh bằng chứng
- ✅ **Workflow**: Khách hàng tạo → Admin xử lý → Hoàn tất
- ✅ **Trạng thái**: PENDING → APPROVED → COMPLETED / REJECTED

### **2. Tích hợp GHN**
- ✅ **Tính phí ship**: Realtime theo địa chỉ
- ✅ **Tạo đơn vận chuyển**: Tự động từ admin
- ✅ **Tracking**: Theo dõi trạng thái realtime
- ✅ **Webhook**: Cập nhật trạng thái tự động

## 🗄️ **DATABASE SCHEMA**

### **ReturnRequest Model**
```prisma
model ReturnRequest {
  id              String       @id @default(auto()) @map("_id") @db.ObjectId
  orderId         String       @db.ObjectId
  userId          String       @db.ObjectId
  type            ReturnType   // EXCHANGE, RETURN, REFUND
  reason          String
  description     String?
  images          String[]     // Ảnh bằng chứng
  status          ReturnStatus @default(PENDING)
  adminNote       String?
  processedBy     String?      @db.ObjectId
  
  // Shipping info for return
  returnShippingCode String?    // Mã vận đơn trả hàng
  returnShippingFee  Float?     // Phí ship trả hàng
  
  createdAt       DateTime     @default(now())
  processedAt     DateTime?
  
  order           Order        @relation(fields: [orderId], references: [id])
  user            User         @relation(fields: [userId], references: [id])
}
```

### **Order Model Updates**
```prisma
// Thêm vào Order model
shippingCode    String?           // Mã vận đơn GHN
shippingStatus  String?           // Trạng thái vận chuyển
shippingData    Json?             // Dữ liệu từ GHN
returnRequests  ReturnRequest[]
```

## 🔧 **CẤU HÌNH GHN**

### **Environment Variables**
```env
# GHN (Giao Hàng Nhanh) API Configuration
GHN_API_URL=https://dev-online-gateway.ghn.vn/shiip/public-api
GHN_TOKEN=your_ghn_token_here
GHN_SHOP_ID=your_ghn_shop_id_here
GHN_FROM_DISTRICT_ID=1442
```

### **Lấy thông tin GHN**
1. **Đăng ký tài khoản**: [GHN Developer](https://khachhang.giaohangnhanh.vn/)
2. **Tạo shop**: Trong dashboard GHN
3. **Lấy token**: API Management → Generate Token
4. **Lấy shop_id**: Thông tin shop

## 🛠️ **API ENDPOINTS**

### **Returns APIs**
```typescript
POST /api/returns/create          // Tạo yêu cầu đổi/trả
GET  /api/returns/list           // Danh sách yêu cầu
POST /api/returns/[id]/process   // Xử lý yêu cầu (admin)
```

### **Shipping APIs**
```typescript
POST /api/shipping/calculate-fee     // Tính phí vận chuyển
POST /api/shipping/create-order      // Tạo đơn GHN
GET  /api/shipping/tracking/[code]   // Tracking đơn hàng
```

## 🎨 **UI/UX COMPONENTS**

### **Customer Components**
- `ReturnRequestForm.tsx` - Form tạo yêu cầu đổi/trả
- `ShippingTracker.tsx` - Theo dõi vận chuyển
- `ReturnsClient.tsx` - Trang quản lý yêu cầu của khách

### **Admin Components**
- `ReturnRequestList.tsx` - Danh sách yêu cầu (admin)
- `ManageReturnsClient.tsx` - Dashboard quản lý đổi/trả

## 📱 **NAVIGATION**

### **Customer Menu**
```
Account → Đổi/Trả hàng (/account/returns)
```

### **Admin Menu**
```
Quản lý → Đơn hàng → Đổi/Trả hàng (/admin/manage-returns)
```

## 🔄 **WORKFLOW**

### **1. Khách hàng tạo yêu cầu**
1. Vào trang đơn hàng đã hoàn thành
2. Click "Đổi/Trả hàng" (hiện nếu < 7 ngày)
3. Chọn loại: Đổi/Trả/Hoàn tiền
4. Nhập lý do và mô tả
5. Upload ảnh bằng chứng
6. Gửi yêu cầu

### **2. Admin xử lý**
1. Vào `/admin/manage-returns`
2. Xem chi tiết yêu cầu
3. Duyệt/Từ chối với ghi chú
4. Đánh dấu hoàn tất khi xong

### **3. Shipping workflow**
1. Admin tạo đơn vận chuyển từ order
2. GHN trả về mã vận đơn
3. Khách hàng theo dõi qua ShippingTracker
4. Webhook tự động cập nhật trạng thái

## 🎯 **TÍNH NĂNG NỔI BẬT**

### **1. UX/UX Harmony**
- Thiết kế nhất quán với theme ThanhHuyStore
- Màu sắc: Blue (#3b82f6) chủ đạo
- Typography: SF Pro Display font
- Responsive design cho mobile

### **2. Validation & Security**
- Kiểm tra quyền truy cập nghiêm ngặt
- Validate thời gian 7 ngày
- Chỉ cho phép đơn hàng đã hoàn thành
- Admin-only cho xử lý yêu cầu

### **3. Real-time Updates**
- Tracking vận chuyển realtime
- Activity logs cho mọi thay đổi
- Webhook integration với GHN

## 📊 **ANALYTICS & REPORTING**

### **Return Statistics**
- Tổng số yêu cầu đổi/trả
- Tỷ lệ duyệt/từ chối
- Lý do đổi/trả phổ biến
- Thời gian xử lý trung bình

### **Shipping Analytics**
- Thời gian giao hàng trung bình
- Tỷ lệ giao thành công
- Chi phí vận chuyển

## 🚀 **DEPLOYMENT NOTES**

### **Production Setup**
1. Cập nhật GHN_API_URL thành production URL
2. Sử dụng real GHN token và shop_id
3. Setup webhook endpoint cho GHN
4. Configure proper error handling

### **Testing**
1. Sử dụng GHN sandbox environment
2. Test với địa chỉ thật trong VN
3. Verify webhook functionality

## 📈 **FUTURE ENHANCEMENTS**

### **Phase 2 (Nếu có thời gian)**
- Multiple shipping providers (GHTK, VNPost)
- Auto-refund integration với Stripe/MoMo
- Return analytics dashboard
- Email notifications cho status changes
- Bulk processing cho admin

### **Advanced Features**
- QR code tracking
- SMS notifications
- Return label printing
- Inventory management integration

## 🎓 **ĐỒ ÁN TỐT NGHIỆP VALUE**

### **Technical Skills Demonstrated**
- ✅ RESTful API design
- ✅ Database relationship modeling
- ✅ External API integration (GHN)
- ✅ File upload handling
- ✅ Real-time data updates
- ✅ Webhook implementation
- ✅ Complex business logic

### **Business Value**
- ✅ Giải quyết vấn đề thực tế của e-commerce
- ✅ Tăng trải nghiệm khách hàng
- ✅ Tự động hóa quy trình vận chuyển
- ✅ Giảm workload cho admin

### **Scalability**
- ✅ Dễ mở rộng thêm shipping providers
- ✅ Flexible return policies
- ✅ Modular component architecture
- ✅ API-first design

---

**🎯 Kết quả**: Một hệ thống đổi/trả hàng và vận chuyển hoàn chỉnh, thực tiễn, phù hợp với yêu cầu đồ án tốt nghiệp và có thể áp dụng thực tế.

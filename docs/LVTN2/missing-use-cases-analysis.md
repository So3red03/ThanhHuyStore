# Use Case Diagram - Các Tính Năng Còn Thiếu So Với Hình Gốc

## 📊 Phân Tích Dựa Trên Hình Use Case Gốc

Sau khi so sánh với hình use case diagram gốc, tôi đã xác định được những tính năng còn thiếu và vẽ lại theo đúng format như hình bạn cung cấp.

## ✅ Các Tính Năng Đã Có

### 1. **Quản lý cơ bản**

- ✅ Đăng ký, đăng nhập
- ✅ Quản lý sản phẩm (thêm, sửa, xóa)
- ✅ Quản lý đơn hàng
- ✅ Quản lý danh mục
- ✅ Quản lý tài khoản

### 2. **Tính năng mua hàng**

- ✅ Xem sản phẩm, tìm kiếm
- ✅ Thêm vào giỏ hàng
- ✅ Thanh toán (COD, MoMo, Stripe)
- ✅ Theo dõi đơn hàng

### 3. **Hệ thống đổi trả**

- ✅ Yêu cầu đổi/trả hàng (đã implement)
- ✅ Quản lý return requests
- ✅ Xử lý hoàn tiền

### 4. **Email Marketing**

- ✅ Gửi email sản phẩm mới
- ✅ Email marketing theo phân khúc khách hàng
- ✅ Email confirmation đơn hàng

### 5. **Chat & Communication**

- ✅ Chat nội bộ admin-customer (realtime với Pusher)
- ✅ Chatbot AI tích hợp
- ✅ Discord notifications
- ✅ Hệ thống thông báo realtime

### 6. **Analytics & Reports**

- ✅ Báo cáo doanh thu cơ bản
- ✅ Analytics sản phẩm
- ✅ Thống kê khách hàng

## ❌ Các Use Cases Còn Thiếu (Theo Hình Gốc)

### 1. **Quản lý bài viết/tin tức**

- **Xem bài viết** - Khách hàng đọc tin tức, bài viết
- **Tìm kiếm bài viết** - Tìm kiếm theo từ khóa
- **Bình luận bài viết** - Khách hàng để lại bình luận
- **Chia sẻ bài viết** - Chia sẻ lên mạng xã hội
- **Quản lý bài viết** - Admin quản lý nội dung
- **Thêm bài viết** - Admin tạo bài viết mới
- **Sửa bài viết** - Admin chỉnh sửa nội dung
- **Xóa bài viết** - Admin xóa bài viết
- **Duyệt bình luận** - Admin kiểm duyệt comment

### 2. **Hệ thống đánh giá sản phẩm**

- **Đánh giá sản phẩm** - Khách hàng đánh giá và review
- **Xem đánh giá** - Xem review của người khác
- **Phản hồi đánh giá** - Admin phản hồi review
- **Báo cáo đánh giá** - Báo cáo review spam/fake
- **Quản lý đánh giá** - Admin quản lý tất cả review

### 3. **Hệ thống thông báo nâng cao**

- **Đăng ký nhận thông báo** - Subscribe notifications
- **Quản lý thông báo** - Admin quản lý thông báo
- **Gửi thông báo hàng loạt** - Broadcast notifications
- **Thông báo khuyến mãi** - Push promotion alerts

### 4. **Hệ thống wishlist/yêu thích**

- **Thêm vào yêu thích** - Save sản phẩm yêu thích
- **Xem danh sách yêu thích** - Xem wishlist
- **Chia sẻ danh sách yêu thích** - Share wishlist

### 5. **Hệ thống so sánh sản phẩm**

- **So sánh sản phẩm** - Compare features
- **Lưu kết quả so sánh** - Save comparison results

### 6. **Hệ thống hỗ trợ khách hàng nâng cao**

- **Tạo ticket hỗ trợ** - Tạo yêu cầu hỗ trợ
- **Theo dõi ticket** - Track support progress
- **Đánh giá dịch vụ hỗ trợ** - Rate support quality
- **Quản lý ticket hỗ trợ** - Admin manage tickets

## 🎯 Đánh Giá Mức Độ Ưu Tiên

### **Cao (High Priority)**

1. **Quản lý bài viết/tin tức** - Tăng engagement và SEO
2. **Hệ thống đánh giá sản phẩm** - Tăng tính tương tác và trust
3. **Hệ thống wishlist** - Cải thiện UX, tăng conversion

### **Trung bình (Medium Priority)**

4. **Hệ thống thông báo nâng cao** - Tối ưu marketing
5. **So sánh sản phẩm** - Hỗ trợ quyết định mua hàng
6. **Hỗ trợ khách hàng nâng cao** - Cải thiện customer service

## 📋 Kết Luận

Dựa trên hình use case diagram gốc, hệ thống ThanhHuy Store còn thiếu **6 nhóm tính năng chính** với tổng cộng **27 use cases**. Những tính năng này sẽ giúp hoàn thiện hệ thống theo đúng thiết kế ban đầu.

**Khuyến nghị**: Nên implement theo thứ tự ưu tiên, bắt đầu từ **quản lý bài viết** và **hệ thống đánh giá** vì đây là những tính năng cơ bản mà hầu hết e-commerce site đều có.

## 🎨 Mermaid Diagram - 3 Tính Năng Chính

### **Chi tiết 3 nhóm tính năng:**

#### 1. **Quản lý bài viết** (9 use cases)

- **Khách hàng**: Xem, tìm kiếm, bình luận, chia sẻ bài viết
- **Quản trị viên**: Quản lý, thêm, sửa, xóa bài viết, duyệt bình luận

#### 2. **Quản lý đổi trả hàng** (10 use cases)

- **Khách hàng**: Yêu cầu đổi/trả, xem lịch sử, theo dõi tiến độ
- **Nhân viên/Admin**: Quản lý, duyệt, từ chối, hoàn tất, xử lý hoàn tiền

#### 3. **Chat nội bộ** (9 use cases)

- **Tất cả actors**: Gửi/nhận tin nhắn, xem lịch sử, tạo cuộc trò chuyện
- **Admin/Staff**: Quản lý cuộc trò chuyện, thông báo tin nhắn mới

### **Đặc điểm diagram:**

- 3 Actors: Khách hàng, Nhân viên, Quản trị viên
- 28 Use cases được nhóm thành 3 subgraph
- Include/extend relationships với nét đứt
- Styling theo format hình gốc

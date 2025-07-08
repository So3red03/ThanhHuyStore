<style>
body {
    font-family: "Times New Roman", Times, serif;
}
</style>

# Mô tả Database - ThanhHuyStore E-commerce Platform

## Bảng User

**Mô tả:** Bảng user chứa thông tin tài khoản quản trị viên, doanh nghiệp đăng ký bán hàng và những khách hàng đã đăng ký tài khoản.

| Thuộc tính           | Kiểu     | K   | U   | M   | Diễn giải                    |
| -------------------- | -------- | --- | --- | --- | ---------------------------- |
| id                   | String   | x   | x   | x   | Mã định danh người dùng      |
| name                 | String   |     |     |     | Tên người dùng               |
| email                | String   |     | x   |     | Email đăng nhập              |
| emailVerified        | Boolean  |     |     |     | Trạng thái xác thực email    |
| phoneNumber          | String   |     |     |     | Số điện thoại                |
| image                | String   |     |     |     | Ảnh đại diện                 |
| hashedPassword       | String   |     |     |     | Mật khẩu đã mã hóa           |
| createAt             | DateTime |     |     |     | Thời gian tạo                |
| updateAt             | DateTime |     |     |     | Thời gian cập nhật           |
| lastLogin            | DateTime |     |     |     | Lần đăng nhập cuối           |
| role                 | Role     |     |     |     | Vai trò (USER/ADMIN)         |
| resetPasswordToken   | String   |     |     |     | Token reset mật khẩu         |
| resetPasswordExpires | DateTime |     |     |     | Thời gian hết hạn token      |
| purchasedCategories  | String[] |     |     |     | Danh mục đã mua (marketing)  |
| chatRoomIds          | String[] |     |     |     | Danh sách ID phòng chat      |
| seenMessageIds       | String[] |     |     |     | Danh sách ID tin nhắn đã xem |

## Bảng Account

**Mô tả:** Bảng account lưu trữ thông tin các tài khoản OAuth (Google, Facebook, etc.) liên kết với user.

| Thuộc tính        | Kiểu   | K   | U   | M   | Diễn giải                       |
| ----------------- | ------ | --- | --- | --- | ------------------------------- |
| id                | String | x   | x   | x   | Mã định danh account            |
| userId            | String |     |     | x   | ID người dùng (FK)              |
| type              | String |     |     | x   | Loại tài khoản OAuth            |
| provider          | String |     |     | x   | Nhà cung cấp (google, facebook) |
| providerAccountId | String |     |     | x   | ID tài khoản từ provider        |
| refresh_token     | String |     |     |     | Token làm mới                   |
| access_token      | String |     |     |     | Token truy cập                  |
| expires_at        | Int    |     |     |     | Thời gian hết hạn               |
| token_type        | String |     |     |     | Loại token                      |
| scope             | String |     |     |     | Phạm vi quyền                   |
| id_token          | String |     |     |     | ID token                        |
| session_state     | String |     |     |     | Trạng thái phiên                |

## Bảng Order

**Mô tả:** Bảng order chứa thông tin đơn hàng của khách hàng với đầy đủ thông tin thanh toán và vận chuyển.

| Thuộc tính      | Kiểu           | K   | U   | M   | Diễn giải               |
| --------------- | -------------- | --- | --- | --- | ----------------------- |
| id              | String         | x   | x   | x   | Mã định danh đơn hàng   |
| userId          | String         |     |     | x   | ID người dùng (FK)      |
| amount          | Float          |     |     | x   | Tổng tiền đơn hàng      |
| currency        | String         |     |     | x   | Loại tiền tệ            |
| status          | OrderStatus    |     |     |     | Trạng thái đơn hàng     |
| deliveryStatus  | DeliveryStatus |     |     |     | Trạng thái giao hàng    |
| createDate      | DateTime       |     |     |     | Ngày tạo đơn            |
| paymentIntentId | String         |     | x   | x   | ID thanh toán Stripe    |
| phoneNumber     | String         |     |     |     | Số điện thoại nhận hàng |
| paymentMethod   | String         |     |     |     | Phương thức thanh toán  |
| shippingFee     | Float          |     |     |     | Phí vận chuyển          |
| voucherId       | String         |     |     |     | ID voucher sử dụng (FK) |
| voucherCode     | String         |     |     |     | Mã voucher              |
| discountAmount  | Float          |     |     |     | Số tiền giảm giá        |
| originalAmount  | Float          |     |     |     | Tổng tiền gốc           |
| cancelReason    | String         |     |     |     | Lý do hủy đơn           |
| cancelDate      | DateTime       |     |     |     | Ngày hủy đơn            |
| shippingCode    | String         |     |     |     | Mã vận đơn GHN          |
| shippingStatus  | String         |     |     |     | Trạng thái vận chuyển   |
| shippingData    | Json           |     |     |     | Dữ liệu từ GHN          |

## Bảng Product

**Mô tả:** Bảng product chứa thông tin sản phẩm với hỗ trợ cả sản phẩm đơn giản và có biến thể.

| Thuộc tính  | Kiểu        | K   | U   | M   | Diễn giải                       |
| ----------- | ----------- | --- | --- | --- | ------------------------------- |
| id          | String      | x   | x   | x   | Mã định danh sản phẩm           |
| name        | String      |     |     | x   | Tên sản phẩm                    |
| description | String      |     |     | x   | Mô tả sản phẩm                  |
| brand       | String      |     |     |     | Thương hiệu                     |
| productType | ProductType |     |     |     | Loại sản phẩm (SIMPLE/VARIANT)  |
| price       | Float       |     |     |     | Giá sản phẩm đơn giản           |
| basePrice   | Float       |     |     |     | Giá cơ sở cho sản phẩm biến thể |
| categoryId  | String      |     |     | x   | ID danh mục (FK)                |
| inStock     | Int         |     |     |     | Số lượng tồn kho                |
| priority    | Int         |     |     |     | Độ ưu tiên hiển thị             |
| createDate  | DateTime    |     |     |     | Ngày tạo                        |
| createdAt   | DateTime    |     |     |     | Thời gian tạo                   |
| updatedAt   | DateTime    |     |     |     | Thời gian cập nhật              |
| isDeleted   | Boolean     |     |     |     | Đánh dấu xóa mềm                |
| deletedAt   | DateTime    |     |     |     | Thời gian xóa                   |
| deletedBy   | String      |     |     |     | Người thực hiện xóa             |

## Bảng Category

**Mô tả:** Bảng category chứa thông tin danh mục sản phẩm với cấu trúc phân cấp.

| Thuộc tính  | Kiểu     | K   | U   | M   | Diễn giải             |
| ----------- | -------- | --- | --- | --- | --------------------- |
| id          | String   | x   | x   | x   | Mã định danh danh mục |
| name        | String   |     |     | x   | Tên danh mục          |
| slug        | String   |     |     | x   | Slug URL              |
| image       | String   |     |     |     | Hình ảnh danh mục     |
| icon        | String   |     |     |     | Icon danh mục         |
| description | String   |     |     |     | Mô tả danh mục        |
| createdAt   | DateTime |     |     |     | Thời gian tạo         |
| updatedAt   | DateTime |     |     |     | Thời gian cập nhật    |
| parentId    | String   |     |     |     | ID danh mục cha (FK)  |

## Bảng Review

**Mô tả:** Bảng review chứa thông tin đánh giá sản phẩm của khách hàng.

| Thuộc tính  | Kiểu     | K   | U   | M   | Diễn giải             |
| ----------- | -------- | --- | --- | --- | --------------------- |
| id          | String   | x   | x   | x   | Mã định danh đánh giá |
| userId      | String   |     |     | x   | ID người dùng (FK)    |
| productId   | String   |     |     | x   | ID sản phẩm (FK)      |
| rating      | Int      |     |     | x   | Điểm đánh giá (1-5)   |
| comment     | String   |     |     | x   | Nội dung bình luận    |
| reply       | String   |     |     |     | Phản hồi từ admin     |
| createdDate | DateTime |     |     |     | Ngày tạo đánh giá     |
| updatedAt   | DateTime |     |     |     | Thời gian cập nhật    |

## Bảng Article

**Mô tả:** Bảng article chứa thông tin bài viết/tin tức của hệ thống.

| Thuộc tính | Kiểu     | K   | U   | M   | Diễn giải                 |
| ---------- | -------- | --- | --- | --- | ------------------------- |
| id         | String   | x   | x   | x   | Mã định danh bài viết     |
| userId     | String   |     |     | x   | ID tác giả (FK)           |
| title      | String   |     |     | x   | Tiêu đề bài viết          |
| image      | String   |     |     | x   | Hình ảnh đại diện         |
| content    | String   |     |     | x   | Nội dung bài viết         |
| viewCount  | Int      |     |     |     | Số lượt xem               |
| createdAt  | DateTime |     |     |     | Thời gian tạo             |
| updatedAt  | DateTime |     |     |     | Thời gian cập nhật        |
| categoryId | String   |     |     |     | ID danh mục bài viết (FK) |

## Bảng ArticleCategory

**Mô tả:** Bảng articlecategory chứa thông tin danh mục bài viết.

| Thuộc tính  | Kiểu     | K   | U   | M   | Diễn giải             |
| ----------- | -------- | --- | --- | --- | --------------------- |
| id          | String   | x   | x   | x   | Mã định danh danh mục |
| name        | String   |     |     | x   | Tên danh mục          |
| slug        | String   |     |     |     | Slug URL              |
| description | String   |     |     |     | Mô tả danh mục        |
| icon        | String   |     |     |     | Icon danh mục         |
| isActive    | Boolean  |     |     |     | Trạng thái hoạt động  |
| createdAt   | DateTime |     |     |     | Thời gian tạo         |
| updatedAt   | DateTime |     |     |     | Thời gian cập nhật    |

## Bảng ArticleReview

**Mô tả:** Bảng articlereview chứa thông tin bình luận bài viết với hỗ trợ reply.

| Thuộc tính  | Kiểu     | K   | U   | M   | Diễn giải              |
| ----------- | -------- | --- | --- | --- | ---------------------- |
| id          | String   | x   | x   | x   | Mã định danh bình luận |
| userId      | String   |     |     | x   | ID người dùng (FK)     |
| articleId   | String   |     |     | x   | ID bài viết (FK)       |
| rating      | Int      |     |     |     | Điểm đánh giá          |
| comment     | String   |     |     |     | Nội dung bình luận     |
| parentId    | String   |     |     |     | ID bình luận cha (FK)  |
| createdDate | DateTime |     |     |     | Ngày tạo               |
| updatedAt   | DateTime |     |     |     | Thời gian cập nhật     |

## Bảng ChatRoom

**Mô tả:** Bảng chatroom chứa thông tin phòng chat giữa users.

| Thuộc tính    | Kiểu     | K   | U   | M   | Diễn giải               |
| ------------- | -------- | --- | --- | --- | ----------------------- |
| id            | String   | x   | x   | x   | Mã định danh phòng chat |
| userIds       | String[] |     |     |     | Danh sách ID users      |
| messageIds    | String[] |     |     |     | Danh sách ID tin nhắn   |
| createdAt     | DateTime |     |     |     | Thời gian tạo           |
| lastMessageAt | DateTime |     |     |     | Thời gian tin nhắn cuối |
| name          | String   |     |     |     | Tên phòng chat          |

## Bảng Message

**Mô tả:** Bảng message chứa thông tin tin nhắn trong chat.

| Thuộc tính | Kiểu     | K   | U   | M   | Diễn giải             |
| ---------- | -------- | --- | --- | --- | --------------------- |
| id         | String   | x   | x   | x   | Mã định danh tin nhắn |
| chatroomId | String   |     |     | x   | ID phòng chat (FK)    |
| senderId   | String   |     |     | x   | ID người gửi (FK)     |
| body       | String   |     |     |     | Nội dung tin nhắn     |
| image      | String   |     |     |     | Hình ảnh đính kèm     |
| createdAt  | DateTime |     |     |     | Thời gian gửi         |
| seenIds    | String[] |     |     |     | Danh sách ID đã xem   |

## Bảng Banner

**Mô tả:** Bảng banner chứa thông tin banner quảng cáo trên website.

| Thuộc tính      | Kiểu     | K   | U   | M   | Diễn giải           |
| --------------- | -------- | --- | --- | --- | ------------------- |
| id              | String   | x   | x   | x   | Mã định danh banner |
| name            | String   |     |     | x   | Tên banner          |
| description     | String   |     |     |     | Mô tả banner        |
| image           | String   |     |     | x   | Hình ảnh banner     |
| imageResponsive | String   |     |     | x   | Hình ảnh responsive |
| startDate       | DateTime |     |     | x   | Ngày bắt đầu        |
| endDate         | DateTime |     |     | x   | Ngày kết thúc       |
| status          | String   |     |     | x   | Trạng thái banner   |
| createdAt       | DateTime |     |     |     | Thời gian tạo       |
| updatedAt       | DateTime |     |     |     | Thời gian cập nhật  |

## Bảng Notification

**Mô tả:** Bảng notification chứa thông tin thông báo gửi đến users.

| Thuộc tính | Kiểu             | K   | U   | M   | Diễn giải                  |
| ---------- | ---------------- | --- | --- | --- | -------------------------- |
| id         | String           | x   | x   | x   | Mã định danh thông báo     |
| userId     | String           |     |     |     | ID người nhận (FK)         |
| productId  | String           |     |     |     | ID sản phẩm liên quan (FK) |
| orderId    | String           |     |     |     | ID đơn hàng liên quan      |
| messageId  | String           |     |     |     | ID tin nhắn liên quan      |
| fromUserId | String           |     |     |     | ID người gửi (FK)          |
| type       | NotificationType |     |     | x   | Loại thông báo             |
| title      | String           |     |     | x   | Tiêu đề thông báo          |
| message    | String           |     |     | x   | Nội dung thông báo         |
| data       | Json             |     |     |     | Dữ liệu bổ sung            |
| isRead     | Boolean          |     |     |     | Trạng thái đã đọc          |
| createdAt  | DateTime         |     |     |     | Thời gian tạo              |
| updatedAt  | DateTime         |     |     |     | Thời gian cập nhật         |

## Bảng Voucher

**Mô tả:** Bảng voucher chứa thông tin mã giảm giá của hệ thống.

| Thuộc tính      | Kiểu         | K   | U   | M   | Diễn giải                   |
| --------------- | ------------ | --- | --- | --- | --------------------------- |
| id              | String       | x   | x   | x   | Mã định danh voucher        |
| code            | String       |     | x   | x   | Mã voucher                  |
| description     | String       |     |     |     | Mô tả voucher               |
| image           | String       |     |     |     | Hình ảnh voucher            |
| discountType    | DiscountType |     |     | x   | Loại giảm giá               |
| discountValue   | Float        |     |     | x   | Giá trị giảm giá            |
| minOrderValue   | Float        |     |     |     | Giá trị đơn hàng tối thiểu  |
| quantity        | Int          |     |     | x   | Số lượng voucher            |
| usedCount       | Int          |     |     |     | Số lượng đã sử dụng         |
| maxUsagePerUser | Int          |     |     |     | Số lần sử dụng tối đa/user  |
| startDate       | DateTime     |     |     | x   | Ngày bắt đầu                |
| endDate         | DateTime     |     |     | x   | Ngày kết thúc               |
| isActive        | Boolean      |     |     |     | Trạng thái hoạt động        |
| voucherType     | VoucherType  |     |     |     | Loại voucher                |
| targetUserIds   | String[]     |     |     |     | Danh sách user được áp dụng |
| createdAt       | DateTime     |     |     |     | Thời gian tạo               |
| updatedAt       | DateTime     |     |     |     | Thời gian cập nhật          |

## Bảng UserVoucher

**Mô tả:** Bảng uservoucher chứa thông tin voucher của từng user với reservation logic.

| Thuộc tính         | Kiểu     | K   | U   | M   | Diễn giải                |
| ------------------ | -------- | --- | --- | --- | ------------------------ |
| id                 | String   | x   | x   | x   | Mã định danh             |
| userId             | String   |     |     | x   | ID người dùng (FK)       |
| voucherId          | String   |     |     | x   | ID voucher (FK)          |
| usedAt             | DateTime |     |     |     | Thời gian sử dụng        |
| createdAt          | DateTime |     |     |     | Thời gian tạo            |
| orderId            | String   |     |     |     | ID đơn hàng đã sử dụng   |
| reservedForOrderId | String   |     |     |     | ID đơn hàng đang reserve |
| reservedAt         | DateTime |     |     |     | Thời gian reserve        |

## Bảng ReturnRequest

**Mô tả:** Bảng returnrequest chứa thông tin yêu cầu trả hàng/đổi hàng.

| Thuộc tính         | Kiểu         | K   | U   | M   | Diễn giải            |
| ------------------ | ------------ | --- | --- | --- | -------------------- |
| id                 | String       | x   | x   | x   | Mã định danh yêu cầu |
| orderId            | String       |     |     | x   | ID đơn hàng (FK)     |
| userId             | String       |     |     | x   | ID người dùng (FK)   |
| type               | ReturnType   |     |     | x   | Loại yêu cầu         |
| reason             | String       |     |     | x   | Lý do trả hàng       |
| description        | String       |     |     |     | Mô tả chi tiết       |
| images             | String[]     |     |     |     | Ảnh bằng chứng       |
| status             | ReturnStatus |     |     |     | Trạng thái xử lý     |
| adminNote          | String       |     |     |     | Ghi chú admin        |
| processedBy        | String       |     |     |     | Người xử lý          |
| returnShippingCode | String       |     |     |     | Mã vận đơn trả hàng  |
| returnShippingFee  | Float        |     |     |     | Phí ship trả hàng    |
| createdAt          | DateTime     |     |     |     | Thời gian tạo        |
| processedAt        | DateTime     |     |     |     | Thời gian xử lý      |

## Bảng Promotion

**Mô tả:** Bảng promotion chứa thông tin chương trình khuyến mãi.

| Thuộc tính    | Kiểu         | K   | U   | M   | Diễn giải               |
| ------------- | ------------ | --- | --- | --- | ----------------------- |
| id            | String       | x   | x   | x   | Mã định danh khuyến mãi |
| title         | String       |     |     | x   | Tiêu đề khuyến mãi      |
| description   | String       |     |     |     | Mô tả khuyến mãi        |
| discountType  | DiscountType |     |     | x   | Loại giảm giá           |
| discountValue | Float        |     |     | x   | Giá trị giảm giá        |
| maxDiscount   | Float        |     |     |     | Giảm giá tối đa         |
| startDate     | DateTime     |     |     | x   | Ngày bắt đầu            |
| endDate       | DateTime     |     |     | x   | Ngày kết thúc           |
| isActive      | Boolean      |     |     |     | Trạng thái hoạt động    |
| applyToAll    | Boolean      |     |     |     | Áp dụng cho tất cả      |
| productIds    | String[]     |     |     |     | Danh sách ID sản phẩm   |
| categoryIds   | String[]     |     |     |     | Danh sách ID danh mục   |
| createdAt     | DateTime     |     |     |     | Thời gian tạo           |
| updatedAt     | DateTime     |     |     |     | Thời gian cập nhật      |

## Bảng ProductPromotion

**Mô tả:** Bảng productpromotion chứa thông tin áp dụng khuyến mãi cho từng sản phẩm.

| Thuộc tính       | Kiểu     | K   | U   | M   | Diễn giải            |
| ---------------- | -------- | --- | --- | --- | -------------------- |
| id               | String   | x   | x   | x   | Mã định danh         |
| productId        | String   |     |     | x   | ID sản phẩm (FK)     |
| promotionId      | String   |     |     | x   | ID khuyến mãi (FK)   |
| promotionalPrice | Float    |     |     | x   | Giá khuyến mãi       |
| startDate        | DateTime |     |     | x   | Ngày bắt đầu         |
| endDate          | DateTime |     |     | x   | Ngày kết thúc        |
| isActive         | Boolean  |     |     |     | Trạng thái hoạt động |
| priority         | Int      |     |     |     | Độ ưu tiên           |
| createdAt        | DateTime |     |     |     | Thời gian tạo        |
| updatedAt        | DateTime |     |     |     | Thời gian cập nhật   |

## Bảng AnalyticsEvent

**Mô tả:** Bảng analyticsevent chứa thông tin theo dõi hành vi người dùng.

| Thuộc tính | Kiểu      | K   | U   | M   | Diễn giải            |
| ---------- | --------- | --- | --- | --- | -------------------- |
| id         | String    | x   | x   | x   | Mã định danh sự kiện |
| userId     | String    |     |     |     | ID người dùng (FK)   |
| sessionId  | String    |     |     |     | ID phiên anonymous   |
| eventType  | EventType |     |     | x   | Loại sự kiện         |
| entityType | String    |     |     |     | Loại entity          |
| entityId   | String    |     |     |     | ID entity            |
| metadata   | Json      |     |     |     | Dữ liệu bổ sung      |
| userAgent  | String    |     |     |     | User agent           |
| ipAddress  | String    |     |     |     | Địa chỉ IP           |
| referrer   | String    |     |     |     | Trang giới thiệu     |
| path       | String    |     |     | x   | Đường dẫn trang      |
| timestamp  | DateTime  |     |     |     | Thời gian sự kiện    |

## Bảng AdminSettings

**Mô tả:** Bảng adminsettings chứa cài đặt hệ thống admin.

| Thuộc tính            | Kiểu     | K   | U   | M   | Diễn giải                |
| --------------------- | -------- | --- | --- | --- | ------------------------ |
| id                    | String   | x   | x   | x   | Mã định danh cài đặt     |
| discordNotifications  | Boolean  |     |     |     | Thông báo Discord        |
| orderNotifications    | Boolean  |     |     |     | Thông báo đơn hàng       |
| emailNotifications    | Boolean  |     |     |     | Thông báo email          |
| pushNotifications     | Boolean  |     |     |     | Thông báo push           |
| analyticsTracking     | Boolean  |     |     |     | Theo dõi analytics       |
| sessionTimeout        | Int      |     |     |     | Timeout phiên (phút)     |
| lowStockAlerts        | Boolean  |     |     |     | Cảnh báo hết hàng        |
| chatbotSupport        | Boolean  |     |     |     | Hỗ trợ chatbot           |
| autoVoucherSuggestion | Boolean  |     |     |     | Gợi ý voucher tự động    |
| dailyReports          | Boolean  |     |     |     | Báo cáo hàng ngày        |
| reportInterval        | Int      |     |     |     | Khoảng thời gian báo cáo |
| codPayment            | Boolean  |     |     |     | Thanh toán COD           |
| momoPayment           | Boolean  |     |     |     | Thanh toán MoMo          |
| stripePayment         | Boolean  |     |     |     | Thanh toán Stripe        |
| createdBy             | String   |     |     | x   | Người tạo                |
| updatedBy             | String   |     |     | x   | Người cập nhật           |
| createdAt             | DateTime |     |     |     | Thời gian tạo            |
| updatedAt             | DateTime |     |     |     | Thời gian cập nhật       |

## Bảng ReportLog

**Mô tả:** Bảng reportlog chứa lịch sử gửi báo cáo tự động.

| Thuộc tính | Kiểu     | K   | U   | M   | Diễn giải             |
| ---------- | -------- | --- | --- | --- | --------------------- |
| id         | String   | x   | x   | x   | Mã định danh log      |
| type       | String   |     |     | x   | Loại báo cáo          |
| interval   | Float    |     |     | x   | Khoảng thời gian      |
| success    | Boolean  |     |     | x   | Trạng thái thành công |
| sentAt     | DateTime |     |     | x   | Thời gian gửi         |
| error      | String   |     |     |     | Thông báo lỗi         |
| createdAt  | DateTime |     |     |     | Thời gian tạo         |

## Bảng ProductAttribute

**Mô tả:** Bảng productattribute chứa thông tin thuộc tính sản phẩm cho hệ thống variant.

| Thuộc tính  | Kiểu          | K   | U   | M   | Diễn giải               |
| ----------- | ------------- | --- | --- | --- | ----------------------- |
| id          | String        | x   | x   | x   | Mã định danh thuộc tính |
| productId   | String        |     |     | x   | ID sản phẩm (FK)        |
| name        | String        |     |     | x   | Tên thuộc tính          |
| label       | String        |     |     | x   | Nhãn hiển thị           |
| type        | AttributeType |     |     | x   | Loại thuộc tính         |
| displayType | DisplayType   |     |     |     | Kiểu hiển thị           |
| isRequired  | Boolean       |     |     |     | Bắt buộc                |
| isVariation | Boolean       |     |     |     | Dùng cho variation      |
| position    | Int           |     |     |     | Vị trí sắp xếp          |
| description | String        |     |     |     | Mô tả thuộc tính        |
| createdAt   | DateTime      |     |     |     | Thời gian tạo           |
| updatedAt   | DateTime      |     |     |     | Thời gian cập nhật      |

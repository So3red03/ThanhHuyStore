# [CHƯƠNG 2. PHƯƠNG PHÁP THỰC HIỆN]()

## [2.1 CÁC HỆ THỐNG TƯƠNG TỰ]()

Để hiểu rõ hơn về mô hình hoạt động
và các chức năng cần thiết cho một website thương mại điện tử B2C, việc khảo
sát một số hệ thống thương mại điện tử hiện có là rất cần thiết. Trong đó,
Shopee và Lazada là hai nền tảng tiêu biểu với số lượng người dùng lớn, giao diện
thân thiện và hệ thống chức năng phong phú. Việc phân tích hai hệ thống này
giúp rút ra những điểm mạnh nên học hỏi và những hạn chế có thể khắc phục trong
quá trình xây dựng hệ thống riêng.

### [2.1.1 Shopee]()

#### [2.1.1.1 Ưu điểm]()

Giao diện đơn giản, thân thiện với
người dùng, dễ dàng tìm kiếm và lọc sản phẩm.

Hệ thống khuyến mãi đa dạng như
mã giảm giá, voucher miễn phí vận chuyển, flash sale... giúp tăng tỉ lệ chuyển
đổi.

Quy trình mua hàng mượt mà, hỗ trợ
nhiều phương thức thanh toán (ví điện tử, thẻ ngân hàng, COD...).

Tính năng đánh giá và bình luận
rõ ràng, giúp người mua đưa ra quyết định chính xác hơn.

Ứng dụng di động tối ưu tốt, đồng
bộ trải nghiệm với phiên bản web.

#### [2.1.1.2 Nhược điểm]()

Việc quản lý sản phẩm và đơn hàng
với số lượng lớn đôi khi gây khó khăn cho người bán nhỏ lẻ do giao diện quản trị
chưa tối ưu.

Hệ thống bị quá tải trong các dịp
khuyến mãi lớn dẫn đến tốc độ phản hồi chậm.

Thiếu tùy biến về giao diện cửa
hàng cho từng người bán.

### [2.1.2 Lazada]()

#### [2.1.2.1 Ưu điểm]()

Hệ thống phân loại sản phẩm rõ
ràng, hỗ trợ tìm kiếm theo bộ lọc chi tiết.

Giao diện chuyên nghiệp, cung cấp
trải nghiệm người dùng tốt với nhiều tiện ích như live chat, gợi ý sản phẩm, lịch
sử tìm kiếm.

Tích hợp tốt với các dịch vụ vận
chuyển và thanh toán, cho phép theo dõi trạng thái đơn hàng chính xác.

Hệ thống quản lý người bán tương
đối chi tiết, hỗ trợ nhiều báo cáo, thống kê.

#### [2.1.2.2 Nhược điểm]()

Tốc độ tải trang không thực sự tối
ưu, nhất là trên các thiết bị cấu hình thấp.

Một số tính năng bị ẩn sâu trong
giao diện, gây khó khăn cho người dùng mới.

Thời gian duyệt sản phẩm lâu hơn
so với Shopee, làm chậm quá trình niêm yết hàng.

## [2.2 CÔNG NGHỆ SỬ DỤNG]()

### [2.2.1 Frontend Technologies]()

#### [2.2.1.1 Next.js 14]()

Next.js là một React framework mạnh mẽ cho phép xây dựng các ứng dụng web full-stack. Với khả năng Server-Side Rendering (SSR) và Static Site Generation (SSG), Next.js giúp tối ưu hóa hiệu suất và SEO cho hệ thống ThanhHuyStore.

**Ưu điểm:**

- Hỗ trợ SSR và SSG out-of-the-box
- App Router mới với improved performance
- Tối ưu hóa tự động (code splitting, image optimization)
- API routes tích hợp cho backend functionality
- Hỗ trợ TypeScript mạnh mẽ

#### [2.2.1.2 React 18]()

React là thư viện JavaScript phổ biến để xây dựng giao diện người dùng, đặc biệt là các ứng dụng web tương tác. Trong dự án ThanhHuyStore, React được sử dụng để xây dựng các component tái sử dụng và quản lý state hiệu quả.

**Đặc điểm chính:**

- Component-based architecture
- Virtual DOM để tối ưu hiệu suất
- Hooks để quản lý state và lifecycle
- Ecosystem phong phú với nhiều thư viện hỗ trợ

#### [2.2.1.3 TypeScript]()

TypeScript là superset của JavaScript, thêm static typing để giúp phát triển ứng dụng lớn một cách an toàn và hiệu quả.

**Lợi ích:**

- Type safety giúp phát hiện lỗi sớm
- IntelliSense tốt hơn trong IDE
- Refactoring an toàn
- Documentation tự động thông qua types

#### [2.2.1.4 Tailwind CSS]()

Tailwind CSS là utility-first CSS framework giúp xây dựng giao diện nhanh chóng và nhất quán cho ThanhHuyStore.

**Ưu điểm:**

- Utility classes giúp styling nhanh
- Highly customizable design system
- Responsive design dễ dàng
- Purge CSS tự động để giảm bundle size

Bảng 2‑1. So sánh Next.js và các framework khác

| Tiêu chí       | Next.js           | Vue.js                   | Angular             |
| -------------- | ----------------- | ------------------------ | ------------------- |
| Cú pháp        | React JSX, dễ học | Template syntax đơn giản | TypeScript phức tạp |
| Performance    | SSR/SSG tối ưu    | SPA tốt                  | Enterprise-grade    |
| Ecosystem      | Rất phong phú     | Đang phát triển          | Comprehensive       |
| Learning curve | Trung bình        | Dễ học                   | Khó học             |
| SEO Support    | Excellent         | Cần Nuxt.js              | Universal support   |
| Community      | Rất lớn           | Đang tăng                | Lớn                 |
| Deployment     | Vercel tối ưu     | Flexible                 | Complex setup       |

### [2.2.2 Backend Technologies]()

#### [2.2.2.1 Next.js API Routes]()

Next.js API Routes cung cấp giải pháp full-stack cho ThanhHuyStore, cho phép xây dựng backend API trong cùng một dự án với frontend.

**Tính năng:**

- Serverless functions
- Built-in middleware support
- File-based routing system
- Automatic API optimization

#### [2.2.2.2 Prisma ORM]()

Prisma là modern database toolkit cung cấp type-safe database access cho Node.js và TypeScript, được sử dụng trong ThanhHuyStore để quản lý dữ liệu.

**Tính năng chính:**

- Type-safe database queries
- Auto-generated client
- Database migrations
- Schema introspection
- Multiple database support

#### [2.2.2.3 NextAuth.js]()

NextAuth.js là authentication library cho Next.js, được sử dụng trong ThanhHuyStore để quản lý xác thực và phân quyền người dùng.

**Tính năng:**

- Multiple providers support
- Session management
- JWT và database sessions
- Role-based access control

### [2.2.3 Database]()

#### [2.2.3.1 MongoDB]()

MongoDB là NoSQL document database được chọn cho ThanhHuyStore do tính linh hoạt trong việc lưu trữ dữ liệu sản phẩm và đơn hàng phức tạp.

**Ưu điểm:**

- Flexible schema design
- Horizontal scaling capability
- Rich query language
- JSON-like document storage
- GridFS cho file storage

#### [2.2.3.2 GridFS]()

GridFS là MongoDB specification để lưu trữ và truy xuất các file lớn như PDF hóa đơn trong hệ thống ThanhHuyStore.

**Tính năng:**

- Chia file thành chunks nhỏ
- Metadata management
- Streaming support
- Automatic file versioning

### [2.2.4 Payment Integration]()

#### [2.2.4.1 Stripe]()

Stripe là payment processing platform quốc tế được tích hợp vào ThanhHuyStore để xử lý thanh toán thẻ tín dụng.

**Tính năng:**

- Secure payment handling
- Webhook support
- International payments
- PCI DSS compliance

#### [2.2.4.2 MoMo]()

MoMo là ví điện tử phổ biến tại Việt Nam, được tích hợp để phục vụ khách hàng địa phương.

**Tính năng:**

- QR code payments
- Wallet integration
- Local payment method
- HMAC signature security

#### [2.2.4.3 Cash on Delivery (COD)]()

COD là phương thức thanh toán truyền thống, phù hợp với thói quen mua sắm tại Việt Nam.

**Đặc điểm:**

- No online transaction required
- Payment upon delivery
- Risk management needed
- Popular in Vietnam market

### [2.2.5 Additional Technologies]()

#### [2.2.5.1 Pusher]()

Pusher được sử dụng trong ThanhHuyStore để cung cấp real-time communication và notifications.

**Tính năng:**

- Real-time notifications
- WebSocket connections
- Event broadcasting
- Presence channels

#### [2.2.5.2 Nodemailer]()

Nodemailer là email sending library được sử dụng để gửi email xác nhận và marketing.

**Tính năng:**

- SMTP support
- HTML email templates
- Attachment support
- Email scheduling

#### [2.2.5.3 PDFKit]()

PDFKit được sử dụng để tạo hóa đơn PDF tự động trong hệ thống.

**Tính năng:**

- Programmatic PDF creation
- Custom layouts và styling
- Vector graphics support
- Automatic invoice generation

#### [2.2.5.4 Zustand]()

Zustand là state management library được sử dụng thay thế React Context để tối ưu performance.

**Ưu điểm:**

- Lightweight và fast
- TypeScript support
- Persistent storage
- Minimal boilerplate

## [2.3 PHÂN TÍCH YÊU CẦU]()

### [2.3.1 Các quy trình nghiệp vụ]()

Hệ thống thương mại điện tử ThanhHuyStore được thiết kế theo mô hình B2C, bao gồm nhiều quy trình nghiệp vụ khác nhau nhằm phục vụ các vai trò chính như khách hàng, quản trị viên và hệ thống vận hành. Các nghiệp vụ chính được triển khai bao gồm:

#### [2.3.1.1 Xác thực và quản lý người dùng]()

Hệ thống ThanhHuyStore sử dụng NextAuth.js để quản lý xác thực người dùng với các tính năng:

- Đăng ký tài khoản với email và mật khẩu
- Đăng nhập với Google OAuth
- Phân quyền người dùng (USER/ADMIN)
- Quản lý session và JWT tokens
- Khôi phục mật khẩu qua email

#### [2.3.1.2 Quản lý sản phẩm Apple]()

ThanhHuyStore chuyên bán các sản phẩm Apple chính hãng với quy trình quản lý:

- Thêm, sửa, xóa sản phẩm với thông tin chi tiết
- Quản lý hình ảnh sản phẩm qua Firebase Storage
- Phân loại theo danh mục (iPhone, iPad, MacBook, Apple Watch, AirPods)
- Quản lý biến thể sản phẩm (màu sắc, dung lượng, kích thước)
- Theo dõi tồn kho và cập nhật giá bán

#### [2.3.1.3 Giỏ hàng và đặt hàng]()

Quy trình mua hàng được tối ưu với Zustand state management:

- Thêm sản phẩm vào giỏ hàng với persistent storage
- Tính toán tự động tổng tiền, phí vận chuyển, voucher
- Checkout với thông tin giao hàng và thanh toán
- Xác nhận đơn hàng và tạo payment intent

#### [2.3.1.4 Xử lý thanh toán đa dạng]()

Hệ thống hỗ trợ ba phương thức thanh toán chính:

**COD (Cash on Delivery):**

- Thanh toán khi nhận hàng
- Không cần xử lý online payment
- Phù hợp với thói quen người Việt

**Stripe Payment:**

- Thanh toán thẻ tín dụng quốc tế
- Webhook xử lý payment confirmation
- PCI DSS compliance

**MoMo E-Wallet:**

- Ví điện tử phổ biến tại Việt Nam
- QR code payment
- HMAC signature security

#### [2.3.1.5 Tạo và quản lý hóa đơn PDF]()

Hệ thống tự động tạo hóa đơn PDF sau khi thanh toán thành công:

- Sử dụng PDFKit để tạo PDF với layout tùy chỉnh
- Lưu trữ PDF vào MongoDB GridFS
- Gửi PDF qua email với Nodemailer
- Download PDF từ admin dashboard

#### [2.3.1.6 Theo dõi hoạt động người dùng]()

Activity tracking system ghi lại các hoạt động quan trọng:

- ORDER_CREATED: Khi tạo đơn hàng mới
- PAYMENT_SUCCESS: Khi thanh toán thành công
- PRODUCT_VIEWED: Khi xem chi tiết sản phẩm
- USER_REGISTERED: Khi đăng ký tài khoản mới

#### [2.3.1.7 Thông báo real-time]()

Sử dụng Pusher và Discord webhooks cho thông báo:

- Thông báo đơn hàng mới cho admin qua Discord
- Real-time notifications trong ứng dụng
- Email notifications cho khách hàng
- Admin alerts cho các hoạt động quan trọng

#### [2.3.1.8 Quản trị hệ thống]()

Admin dashboard cung cấp các tính năng quản lý toàn diện:

- Dashboard với biểu đồ thống kê doanh thu
- Quản lý đơn hàng và cập nhật trạng thái
- Quản lý người dùng và phân quyền
- Quản lý sản phẩm và danh mục
- Xem báo cáo và analytics
- Quản lý activities và notifications

### [2.3.2 Sơ đồ chức năng]()

![Hình 2-1: Sơ đồ chức năng](image/chuong2_lvtn/so-do-chuc-nang.png)

**Hình 2-1: Sơ đồ chức năng**

Sơ đồ chức năng mô tả cấu trúc tổng quan của hệ thống ThanhHuyStore với ba thành phần chính:

- **Quản trị viên**: Quản lý toàn bộ hệ thống, sản phẩm, đơn hàng và người dùng
- **Khách hàng**: Sử dụng các chức năng mua sắm, thanh toán và theo dõi đơn hàng
- **Hệ thống**: Xử lý logic nghiệp vụ, thanh toán và thông báo

### [2.3.3 Sơ đồ Use case tổng quát]()

![Hình 2-2: Sơ đồ usecase tổng quát](image/chuong2_lvtn/so-do-usecase-tong-quat.png)

**Hình 2-2: Sơ đồ usecase tổng quát**

Sơ đồ use case mô tả các tương tác giữa các actor và hệ thống ThanhHuyStore, bao gồm tất cả các chức năng từ quản lý sản phẩm đến xử lý thanh toán.

#### [2.3.3.1 Quản trị viên (Admin)]()

Quản trị viên là người điều hành hệ thống ThanhHuyStore, có toàn quyền kiểm soát và giám sát các hoạt động.

**Vai trò và chức năng:**

- Quản lý sản phẩm Apple (thêm, sửa, xóa, cập nhật giá)
- Quản lý đơn hàng và cập nhật trạng thái giao hàng
- Quản lý người dùng và phân quyền
- Xem báo cáo doanh thu và thống kê
- Quản lý danh mục sản phẩm
- Theo dõi activities và notifications
- Xử lý khiếu nại và hỗ trợ khách hàng

#### [2.3.3.2 Khách hàng (Customer)]()

Khách hàng là người dùng cuối truy cập vào hệ thống để mua sắm các sản phẩm Apple.

**Vai trò và chức năng:**

- Đăng ký/đăng nhập tài khoản (email hoặc Google OAuth)
- Tìm kiếm và xem chi tiết sản phẩm Apple
- Thêm sản phẩm vào giỏ hàng
- Thanh toán qua COD, Stripe hoặc MoMo
- Theo dõi trạng thái đơn hàng
- Nhận email xác nhận và hóa đơn PDF
- Quản lý thông tin cá nhân
- Xem lịch sử mua hàng

#### [2.3.3.3 Hệ thống bên ngoài (External Systems)]()

Các hệ thống bên ngoài tích hợp với ThanhHuyStore để cung cấp các dịch vụ hỗ trợ.

**Bao gồm:**

- **Stripe**: Xử lý thanh toán thẻ tín dụng quốc tế
- **MoMo**: Xử lý thanh toán ví điện tử Việt Nam
- **Firebase**: Lưu trữ hình ảnh sản phẩm
- **MongoDB**: Lưu trữ dữ liệu và PDF files
- **Pusher**: Thông báo real-time
- **Discord**: Webhook notifications cho admin
- **SMTP**: Gửi email xác nhận và marketing

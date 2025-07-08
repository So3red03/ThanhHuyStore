# BÁO CÁO LUẬN VĂN TỐT NGHIỆP

## XÂY DỰNG WEBSITE BÁN HÀNG ĐIỆN TỬ (APPLE)

---

### THÔNG TIN CHUNG

- **Tên đề tài**: Xây dựng website bán hàng điện tử (Apple) với tích hợp thanh toán đa dạng và quản lý hoạt động người dùng
- **Sinh viên thực hiện**: NGUYỄN THÀNH HUY
- **Giảng viên hướng dẫn**: ThS. HUỲNH QUANG ĐỨC
- **Thời gian thực hiện**: [Thời gian thực hiện]

---

## MỤC LỤC

1. [Giới thiệu](#1-giới-thiệu)
2. [Cơ sở lý thuyết và công nghệ](#2-cơ-sở-lý-thuyết-và-công-nghệ)
3. [Phân tích và thiết kế hệ thống](#3-phân-tích-và-thiết-kế-hệ-thống)
4. [Cài đặt và triển khai](#4-cài-đặt-và-triển-khai)
5. [Kết quả và đánh giá](#5-kết-quả-và-đánh-giá)
6. [Kết luận và hướng phát triển](#6-kết-luận-và-hướng-phát-triển)

---

## 1. GIỚI THIỆU

### 1.1. Đặt vấn đề

Trong thời đại công nghệ số phát triển mạnh mẽ như hiện nay, thương mại điện tử đã trở thành một xu hướng không thể thiếu trong cuộc sống. Việc mua sắm trực tuyến không chỉ mang lại sự tiện lợi cho người tiêu dùng mà còn giúp các doanh nghiệp mở rộng thị trường và tăng doanh thu.

Apple là một trong những thương hiệu công nghệ hàng đầu thế giới với các sản phẩm như iPhone, iPad, MacBook, Apple Watch và các phụ kiện đi kèm. Nhu cầu mua sắm các sản phẩm Apple ngày càng tăng cao, đặc biệt là thông qua các kênh trực tuyến.

### 1.2. Mục tiêu đề tài

**Mục tiêu chính:**
- Xây dựng một website thương mại điện tử chuyên bán các sản phẩm Apple
- Tích hợp hệ thống thanh toán đa dạng (COD, Stripe, MoMo)
- Quản lý hoạt động người dùng và theo dõi hành vi mua sắm
- Cung cấp trải nghiệm mua sắm tốt nhất cho khách hàng

**Mục tiêu cụ thể:**
- Thiết kế giao diện thân thiện, responsive trên mọi thiết bị
- Xây dựng hệ thống quản lý sản phẩm, đơn hàng hiệu quả
- Tích hợp thanh toán an toàn và đáng tin cậy
- Phát triển tính năng theo dõi và phân tích hoạt động người dùng
- Tạo hệ thống thông báo real-time cho admin và khách hàng

### 1.3. Phạm vi đề tài

**Phạm vi nghiên cứu:**
- Nghiên cứu các công nghệ web hiện đại (Next.js, React, TypeScript)
- Tìm hiểu về hệ thống thanh toán trực tuyến
- Nghiên cứu về UX/UI design cho website thương mại điện tử
- Phân tích các mô hình kinh doanh trực tuyến

**Phạm vi thực hiện:**
- Xây dựng website bán hàng cho sản phẩm Apple
- Phát triển tính năng quản lý sản phẩm, đơn hàng, khách hàng
- Tích hợp thanh toán COD, Stripe, MoMo
- Xây dựng dashboard admin để quản lý và theo dõi
- Triển khai hệ thống trên môi trường production

### 1.4. Ý nghĩa khoa học và thực tiễn

**Ý nghĩa khoa học:**
- Ứng dụng các công nghệ web hiện đại vào thực tế
- Nghiên cứu và triển khai các mô hình kiến trúc phần mềm tiên tiến
- Tích hợp nhiều dịch vụ bên thứ ba trong một hệ thống

**Ý nghĩa thực tiễn:**
- Cung cấp giải pháp thương mại điện tử hoàn chỉnh
- Tạo ra kênh bán hàng hiệu quả cho các sản phẩm Apple
- Nâng cao trải nghiệm mua sắm của khách hàng
- Hỗ trợ doanh nghiệp trong việc số hóa kinh doanh

---

## 2. CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ

### 2.1. Cơ sở lý thuyết

#### 2.1.1. Thương mại điện tử (E-commerce)

Thương mại điện tử là việc mua bán hàng hóa, dịch vụ thông qua các phương tiện điện tử, chủ yếu là Internet. Các mô hình thương mại điện tử phổ biến:

- **B2C (Business to Consumer)**: Doanh nghiệp bán hàng trực tiếp cho người tiêu dùng
- **B2B (Business to Business)**: Doanh nghiệp bán hàng cho doanh nghiệp khác
- **C2C (Consumer to Consumer)**: Người tiêu dùng bán hàng cho người tiêu dùng

Đề tài này tập trung vào mô hình B2C, xây dựng website bán các sản phẩm Apple trực tiếp cho người tiêu dùng.

#### 2.1.2. Kiến trúc hệ thống web

**Kiến trúc 3-tier:**
- **Presentation Layer**: Giao diện người dùng (Frontend)
- **Business Logic Layer**: Xử lý logic nghiệp vụ (Backend API)
- **Data Access Layer**: Quản lý dữ liệu (Database)

**Kiến trúc Microservices:**
- Chia nhỏ ứng dụng thành các service độc lập
- Mỗi service có trách nhiệm riêng biệt
- Dễ dàng scale và maintain

#### 2.1.3. RESTful API

REST (Representational State Transfer) là một kiểu kiến trúc phần mềm cho các hệ thống phân tán. Các nguyên tắc của REST:

- **Stateless**: Mỗi request độc lập, không lưu trạng thái
- **Cacheable**: Có thể cache để tăng hiệu suất
- **Uniform Interface**: Giao diện thống nhất
- **Client-Server**: Tách biệt client và server

### 2.2. Công nghệ sử dụng

#### 2.2.1. Frontend Technologies

**Next.js 14**
- Framework React với App Router
- Server-Side Rendering (SSR) và Static Site Generation (SSG)
- Automatic code splitting và performance optimization
- Built-in Image optimization và Font optimization

**React 18**
- Library JavaScript để xây dựng user interface
- Component-based architecture
- Virtual DOM để tối ưu hiệu suất
- Hooks để quản lý state và lifecycle

**TypeScript**
- Superset của JavaScript với static typing
- Tăng tính bảo mật và maintainability của code
- IntelliSense và error checking tốt hơn
- Interface và Generic types

**Tailwind CSS**
- Utility-first CSS framework
- Responsive design dễ dàng
- Customizable design system
- Purge CSS để tối ưu bundle size

**React Hook Form**
- Library quản lý form hiệu suất cao
- Validation tích hợp
- Ít re-render hơn so với các library khác
- TypeScript support tốt

#### 2.2.2. Backend Technologies

**Next.js API Routes**
- Full-stack framework với API routes
- Serverless functions
- Middleware support
- Built-in CORS và security headers

**Prisma ORM**
- Type-safe database client
- Database schema management
- Query optimization
- Migration system

**MongoDB**
- NoSQL document database
- Flexible schema design
- Horizontal scaling
- Rich query language

**GridFS**
- MongoDB specification để lưu trữ file lớn
- Chia file thành chunks nhỏ
- Metadata management
- Streaming support

**NextAuth.js**
- Authentication library cho Next.js
- Multiple providers support
- Session management
- JWT và database sessions

#### 2.2.3. Payment Integration

**Stripe**
- Payment processing platform
- Secure payment handling
- Webhook support
- International payments

**MoMo**
- Vietnamese mobile payment
- QR code payments
- Wallet integration
- Local payment method

**Cash on Delivery (COD)**
- Traditional payment method
- No online transaction required
- Payment upon delivery
- Risk management needed

#### 2.2.4. Additional Technologies

**Pusher**
- Real-time communication
- WebSocket connections
- Event broadcasting
- Presence channels

**Nodemailer**
- Email sending library
- SMTP support
- HTML email templates
- Attachment support

**PDFKit**
- PDF generation library
- Programmatic PDF creation
- Custom layouts và styling
- Vector graphics support

**Discord Webhooks**
- Real-time notifications
- Admin alerts
- Order notifications
- System monitoring

**Chart.js & React-Chartjs-2**
- Data visualization
- Interactive charts
- Responsive design
- Multiple chart types

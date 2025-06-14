# BÁO CÁO LUẬN VĂN TỐT NGHIỆP
## HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ THANHHUYSTORE

---

### THÔNG TIN CHUNG
- **Tên đề tài**: Xây dựng hệ thống thương mại điện tử ThanhHuyStore với tích hợp thanh toán đa dạng và quản lý hoạt động người dùng
- **Sinh viên thực hiện**: [Tên sinh viên]
- **Giảng viên hướng dẫn**: [Tên giảng viên]
- **Thời gian thực hiện**: [Thời gian]

---

## MỤC LỤC

1. [Kết quả mô hình hóa bài toán](#1-kết-quả-mô-hình-hóa-bài-toán)
2. [Nghiên cứu lý thuyết và thực hiện](#2-nghiên-cứu-lý-thuyết-và-thực-hiện)
3. [Kết quả code chương trình](#3-kết-quả-code-chương-trình)
4. [Đánh giá và kết luận](#4-đánh-giá-và-kết-luận)

---

## 1. KẾT QUẢ MÔ HÌNH HÓA BÀI TOÁN

### 1.1. Mô hình tổng quan hệ thống

```
┌─────────────────────────────────────────────────────────────────┐
│                    THANHHUYSTORE E-COMMERCE SYSTEM              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   CLIENT    │    │   ADMIN     │    │   SYSTEM    │         │
│  │  INTERFACE  │    │  DASHBOARD  │    │  SERVICES   │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         │                   │                   │              │
│         └───────────────────┼───────────────────┘              │
│                             │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 CORE BUSINESS LOGIC                     │   │
│  │                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │  PRODUCT    │  │   ORDER     │  │  ACTIVITY   │     │   │
│  │  │ MANAGEMENT  │  │ PROCESSING  │  │  TRACKING   │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  │                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │   USER      │  │  PAYMENT    │  │     PDF     │     │   │
│  │  │ MANAGEMENT  │  │ INTEGRATION │  │ GENERATION  │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   DATA LAYER                            │   │
│  │                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │  MONGODB    │  │   PRISMA    │  │   GRIDFS    │     │   │
│  │  │  DATABASE   │  │    ORM      │  │ FILE STORAGE│     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               EXTERNAL INTEGRATIONS                     │   │
│  │                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │   STRIPE    │  │    MOMO     │  │   DISCORD   │     │   │
│  │  │  PAYMENTS   │  │  PAYMENTS   │  │ WEBHOOKS    │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  │                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │    SMTP     │  │   PUSHER    │  │    NEXT     │     │   │
│  │  │    EMAIL    │  │ REAL-TIME   │  │   AUTH      │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2. Mô hình luồng xử lý đơn hàng và PDF

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORDER PROCESSING FLOW                        │
└─────────────────────────────────────────────────────────────────┘

    USER PLACES ORDER
           │
           ▼
    ┌─────────────┐
    │   CREATE    │ ──────► ORDER_CREATED Activity
    │    ORDER    │         (with product info)
    └─────────────┘
           │
           ▼
    ┌─────────────┐
    │   PAYMENT   │
    │  SELECTION  │
    └─────────────┘
           │
    ┌──────┼──────┐
    │      │      │
    ▼      ▼      ▼
┌─────┐ ┌─────┐ ┌─────┐
│ COD │ │STRIPE│ │MOMO │
└─────┘ └─────┘ └─────┘
    │      │      │
    └──────┼──────┘
           │
           ▼
    ┌─────────────┐
    │   PAYMENT   │ ──────► PAYMENT_SUCCESS Activity
    │   SUCCESS   │         (with PDF link)
    └─────────────┘
           │
           ▼
    ┌─────────────┐
    │ GENERATE    │ ──────► PDF stored in MongoDB GridFS
    │    PDF      │         (Invoice with order details)
    └─────────────┘
           │
           ▼
    ┌─────────────┐
    │ UPDATE      │ ──────► Add pdfFileId to ORDER_CREATED
    │ ACTIVITIES  │         Activity for complete tracking
    └─────────────┘
           │
           ▼
    ┌─────────────┐
    │ SEND EMAIL  │ ──────► Email with PDF attachment
    │ WITH PDF    │         (Order confirmation)
    └─────────────┘
           │
           ▼
    ┌─────────────┐
    │  DISCORD    │ ──────► Admin notification
    │NOTIFICATION │         (New order alert)
    └─────────────┘
```

### 1.3. Mô hình cơ sở dữ liệu

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE SCHEMA                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    USER     │    │   ORDER     │    │  ACTIVITY   │
├─────────────┤    ├─────────────┤    ├─────────────┤
│ id          │◄──┐│ id          │    │ id          │
│ name        │   ││ userId      │───►│ userId      │
│ email       │   ││ amount      │    │ type        │
│ role        │   ││ status      │    │ title       │
│ createAt    │   ││ products    │    │ description │
└─────────────┘   ││ createDate  │    │ data        │
                  │└─────────────┘    │ createdAt   │
┌─────────────┐   │                   └─────────────┘
│  PRODUCT    │   │
├─────────────┤   │ ┌─────────────┐    ┌─────────────┐
│ id          │   │ │   REVIEW    │    │NOTIFICATION │
│ name        │   │ ├─────────────┤    ├─────────────┤
│ price       │   └►│ userId      │    │ id          │
│ category    │     │ productId   │    │ userId      │
│ inStock     │     │ rating      │    │ type        │
│ images      │     │ comment     │    │ title       │
└─────────────┘     │ createdDate │    │ message     │
                    └─────────────┘    │ isRead      │
                                       └─────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     MONGODB GRIDFS (PDF STORAGE)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │    FILES    │    │   CHUNKS    │    │  METADATA   │         │
│  ├─────────────┤    ├─────────────┤    ├─────────────┤         │
│  │ _id         │    │ _id         │    │ orderId     │         │
│  │ filename    │    │ files_id    │    │ userId      │         │
│  │ length      │    │ n           │    │ type        │         │
│  │ chunkSize   │    │ data        │    │ paymentId   │         │
│  │ uploadDate  │    └─────────────┘    └─────────────┘         │
│  │ metadata    │                                               │
│  └─────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
```

### 1.4. Giải thích mô hình

#### 1.4.1. Kiến trúc tổng quan
Hệ thống ThanhHuyStore được thiết kế theo kiến trúc **3-tier architecture**:

- **Presentation Layer**: Giao diện người dùng (Client Interface) và Admin Dashboard
- **Business Logic Layer**: Xử lý logic nghiệp vụ chính
- **Data Access Layer**: Quản lý dữ liệu với MongoDB và GridFS

#### 1.4.2. Các thành phần chính

**1. Core Business Logic:**
- **Product Management**: Quản lý sản phẩm, danh mục, kho hàng
- **Order Processing**: Xử lý đơn hàng từ tạo đến hoàn thành
- **Activity Tracking**: Theo dõi hoạt động người dùng
- **User Management**: Quản lý tài khoản, phân quyền
- **Payment Integration**: Tích hợp thanh toán đa dạng
- **PDF Generation**: Tạo hóa đơn điện tử

**2. External Integrations:**
- **Stripe & MoMo**: Cổng thanh toán trực tuyến
- **Discord Webhooks**: Thông báo real-time cho admin
- **SMTP Email**: Gửi email xác nhận và marketing
- **Pusher**: Thông báo real-time trong ứng dụng
- **NextAuth**: Xác thực và phân quyền

**3. Data Storage:**
- **MongoDB**: Lưu trữ dữ liệu chính
- **Prisma ORM**: Quản lý schema và truy vấn
- **GridFS**: Lưu trữ file PDF

#### 1.4.3. Luồng xử lý đơn hàng
1. **Tạo đơn hàng**: Người dùng đặt hàng → Tạo ORDER_CREATED activity
2. **Thanh toán**: Chọn phương thức thanh toán (COD/Stripe/MoMo)
3. **Xử lý thanh toán**: Webhook/callback xử lý kết quả thanh toán
4. **Tạo PDF**: Tự động tạo hóa đơn PDF và lưu vào GridFS
5. **Cập nhật activities**: Thêm PAYMENT_SUCCESS activity và cập nhật ORDER_CREATED
6. **Gửi email**: Email xác nhận với PDF đính kèm
7. **Thông báo**: Discord notification cho admin

---

## 2. NGHIÊN CỨU LÝ THUYẾT VÀ THỰC HIỆN

### 2.1. Các công nghệ và lý thuyết đã nghiên cứu

#### 2.1.1. Frontend Technologies
| Công nghệ | Lý thuyết | Thực hiện | Tỷ lệ hoàn thành |
|-----------|-----------|-----------|------------------|
| **Next.js 14** | App Router, Server Components, Client Components | ✅ Hoàn thành | 100% |
| **React 18** | Hooks, Context API, State Management | ✅ Hoàn thành | 100% |
| **TypeScript** | Type Safety, Interface, Generic | ✅ Hoàn thành | 95% |
| **Tailwind CSS** | Utility-first CSS, Responsive Design | ✅ Hoàn thành | 100% |
| **React Hook Form** | Form Validation, Performance Optimization | ✅ Hoàn thành | 100% |

#### 2.1.2. Backend Technologies
| Công nghệ | Lý thuyết | Thực hiện | Tỷ lệ hoàn thành |
|-----------|-----------|-----------|------------------|
| **Next.js API Routes** | RESTful API, Middleware, Error Handling | ✅ Hoàn thành | 100% |
| **Prisma ORM** | Database Schema, Query Optimization | ✅ Hoàn thành | 100% |
| **MongoDB** | NoSQL Database, Document-based Storage | ✅ Hoàn thành | 100% |
| **GridFS** | File Storage, Binary Data Management | ✅ Hoàn thành | 100% |
| **NextAuth.js** | Authentication, Authorization, Session Management | ✅ Hoàn thành | 100% |

#### 2.1.3. Payment Integration
| Công nghệ | Lý thuyết | Thực hiện | Tỷ lệ hoàn thành |
|-----------|-----------|-----------|------------------|
| **Stripe API** | Webhook, Payment Intent, Security | ✅ Hoàn thành | 100% |
| **MoMo API** | HMAC Signature, Callback Handling | ✅ Hoàn thành | 100% |
| **COD System** | Cash on Delivery Logic | ✅ Hoàn thành | 100% |

#### 2.1.4. Advanced Features
| Tính năng | Lý thuyết | Thực hiện | Tỷ lệ hoàn thành |
|-----------|-----------|-----------|------------------|
| **PDF Generation** | PDFKit, Document Structure, Styling | ✅ Hoàn thành | 100% |
| **Email System** | SMTP, HTML Templates, Attachments | ✅ Hoàn thành | 100% |
| **Activity Tracking** | Event Sourcing, User Behavior Analytics | ✅ Hoàn thành | 100% |
| **Real-time Notifications** | Pusher, WebSocket, Event Broadcasting | ✅ Hoàn thành | 90% |
| **Discord Integration** | Webhook, Bot API, Message Formatting | ✅ Hoàn thành | 100% |

### 2.2. Phân tích chi tiết các tính năng đã thực hiện

#### 2.2.1. Hệ thống Activity Tracking (100% hoàn thành)

**Lý thuyết áp dụng:**
- Event Sourcing Pattern
- Observer Pattern
- Data Aggregation

**Thực hiện:**
```typescript
// Activity Types được định nghĩa
enum ActivityType {
  ORDER_CREATED,
  ORDER_UPDATED,
  ORDER_CANCELLED,
  PAYMENT_SUCCESS,
  COMMENT_REVIEW,  // Gộp comment và review
  PROFILE_UPDATED,
  PASSWORD_CHANGED,
  EMAIL_CHANGED
}

// Activity Model
model Activity {
  id          String       @id @default(auto()) @map("_id") @db.ObjectId
  userId      String       @db.ObjectId
  type        ActivityType
  title       String
  description String?
  data        Json?        // Flexible data storage
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  user        User         @relation(fields: [userId], references: [id])
}
```

**Kết quả đạt được:**
- ✅ Theo dõi đầy đủ hoạt động người dùng
- ✅ Timeline hiển thị trực quan
- ✅ Gộp comment và review thành 1 activity
- ✅ Lưu trữ metadata linh hoạt với JSON

#### 2.2.2. Hệ thống PDF Generation (100% hoàn thành)

**Lý thuyết áp dụng:**
- Document Generation
- Binary Data Management
- GridFS Storage Pattern

**Thực hiện:**
```typescript
// PDF Generator Service
class PDFGenerator {
  async generateOrderInvoice(orderData: OrderData): Promise<Buffer> {
    const doc = new PDFDocument();
    // Tạo header với logo và thông tin công ty
    // Tạo bảng sản phẩm
    // Tính toán tổng tiền, thuế, phí ship
    // Footer với thông tin liên hệ
    return pdfBuffer;
  }
}

// MongoDB GridFS Storage
class MongoService {
  async savePDF(buffer: Buffer, orderId: string): Promise<ObjectId> {
    const bucket = new GridFSBucket(db, { bucketName: 'pdfs' });
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: { orderId, type: 'invoice' }
    });
    return fileId;
  }
}
```

**Kết quả đạt được:**
- ✅ Tạo PDF hóa đơn chuyên nghiệp
- ✅ Lưu trữ an toàn trong MongoDB GridFS
- ✅ API endpoints đầy đủ (tạo, lấy, download)
- ✅ Tích hợp vào activity timeline

#### 2.2.3. Hệ thống Email với PDF Attachment (100% hoàn thành)

**Lý thuyết áp dụng:**
- SMTP Protocol
- HTML Email Templates
- File Attachment Handling

**Thực hiện:**
```typescript
class EmailService {
  async sendOrderConfirmationWithPDF(orderData: OrderData, pdfBuffer: Buffer) {
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: orderData.customerEmail,
      subject: 'Xác nhận đơn hàng - ThanhHuyStore',
      html: this.generateOrderEmailHTML(orderData),
      attachments: [{
        filename: 'invoice.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    };

    return transporter.sendMail(mailOptions);
  }
}
```

#### 2.2.4. Admin Dashboard Refactoring (100% hoàn thành)

**Lý thuyết áp dụng:**
- Component Composition Pattern
- Separation of Concerns
- Modular Architecture

**Thực hiện:**
- Tách `AdminDashboardForm` thành 5 components:
  - `DashboardStats.tsx` - Thống kê tổng quan
  - `DashboardCharts.tsx` - Biểu đồ doanh thu
  - `BestSellingProducts.tsx` - Sản phẩm bán chạy
  - `OrdersTable.tsx` - Bảng đơn hàng với PDF actions
  - `ReviewsSection.tsx` - Quản lý đánh giá

### 2.3. Tỷ lệ hoàn thành tổng quan

| Phần | Mô tả | Tỷ lệ hoàn thành |
|------|-------|------------------|
| **Frontend** | Giao diện người dùng và admin | 100% |
| **Backend API** | RESTful APIs và business logic | 100% |
| **Database** | Schema design và data management | 100% |
| **Authentication** | Đăng nhập, phân quyền | 100% |
| **Payment Integration** | Stripe, MoMo, COD | 100% |
| **PDF System** | Generation, storage, email | 100% |
| **Activity Tracking** | User behavior analytics | 100% |
| **Email System** | SMTP, templates, attachments | 100% |
| **Real-time Features** | Notifications, webhooks | 95% |
| **Testing** | Unit tests, integration tests | 80% |

**Tổng tỷ lệ hoàn thành: 97%**

---

## 3. KẾT QUẢ CODE CHƯƠNG TRÌNH

### 3.1. Cấu trúc thư mục dự án

```
ThanhHuyStore/
├── src/
│   ├── app/
│   │   ├── (home)/                 # Client-facing pages
│   │   │   ├── cart/
│   │   │   ├── product/
│   │   │   ├── account/
│   │   │   └── stripecheckout/
│   │   ├── admin/                  # Admin dashboard
│   │   ├── api/                    # API routes
│   │   │   ├── orders/
│   │   │   │   ├── [id]/pdf/       # PDF generation
│   │   │   │   └── process-payment/ # Payment processing
│   │   │   ├── pdf/[fileId]/       # PDF download
│   │   │   ├── activities/         # Activity management
│   │   │   ├── stripe-webhook/     # Payment webhooks
│   │   │   └── callbackMomo/       # MoMo callback
│   │   ├── components/
│   │   │   ├── admin/              # Admin components
│   │   │   │   ├── DashboardStats.tsx
│   │   │   │   ├── DashboardCharts.tsx
│   │   │   │   ├── BestSellingProducts.tsx
│   │   │   │   ├── OrdersTable.tsx
│   │   │   │   ├── ReviewsSection.tsx
│   │   │   │   ├── ActivityTimeline.tsx
│   │   │   │   └── PDFTestButton.tsx
│   │   │   └── [other components]/
│   │   ├── services/               # Business services
│   │   │   ├── pdfGenerator.ts
│   │   │   ├── emailService.ts
│   │   │   └── mongoService.ts
│   │   ├── actions/                # Server actions
│   │   │   ├── createActivity.ts
│   │   │   └── seedActivities.ts
│   │   └── libs/
│   │       └── prismadb.ts
├── prisma/
│   └── schema.prisma              # Database schema
├── pages/api/
│   └── stripe-webhook.ts          # Stripe webhook handler
└── docs/
    └── BaoCaoLuanVan_ThanhHuyStore.md
```
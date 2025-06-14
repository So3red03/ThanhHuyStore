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
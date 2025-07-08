# Entity Relationship Diagram - ThanhHuyStore

## Database Schema Overview

This diagram represents the complete database schema for the ThanhHuyStore e-commerce platform based on the Prisma schema.

```
Table Account {
  id String [pk]
  userId String [ref: > User.id]
  type String [not null]
  provider String [not null]
  providerAccountId String [not null]
  refresh_token String
  access_token String
  expires_at Int
  token_type String
  scope String
  id_token String
  session_state String
}

Table User {
  id String [pk]
  name String
  email String [unique, not null]
  emailVerified Boolean
  phoneNumber String
  image String
  hashedPassword String
  createAt DateTime [default: now()]
  updateAt DateTime [default: updatedAt]
  lastLogin DateTime
  role Role [default: USER]
  resetPasswordToken String
  resetPasswordExpires DateTime
  purchasedCategories String[]
  chatRoomIds String[]
  seenMessageIds String[]
}

Table Order {
  id String [pk]
  userId String [ref: > User.id]
  amount Float [not null]
  currency String [not null]
  status OrderStatus [default: pending]
  deliveryStatus DeliveryStatus
  createDate DateTime [default: now()]
  paymentIntentId String [unique, not null]
  phoneNumber String
  paymentMethod String
  shippingFee Float
  voucherId String [ref: > Voucher.id]
  voucherCode String
  discountAmount Float [default: 0]
  originalAmount Float
  cancelReason String
  cancelDate DateTime
  shippingCode String
  shippingStatus String
  shippingData Json
}

Table Product {
  id String [pk]
  name String [not null]
  description String [not null]
  brand String [default: "Apple"]
  productType ProductType [default: SIMPLE]
  price Float
  basePrice Float
  categoryId String [ref: > Category.id]
  inStock Int
  priority Int [default: 0]
  createDate DateTime [default: now()]
  createdAt DateTime [default: now()]
  updatedAt DateTime [default: updatedAt]
  isDeleted Boolean [default: false]
  deletedAt DateTime
  deletedBy String
}

Table Category {
  id String [pk]
  name String [not null]
  slug String [not null]
  image String
  icon String
  description String
  createdAt DateTime [default: now()]
  updatedAt DateTime [default: updatedAt]
  parentId String [ref: > Category.id]
}

Table Review {
  id String [pk]
  userId String [ref: > User.id]
  productId String [ref: > Product.id]
  rating Int [not null]
  comment String [not null]
  reply String
  createdDate DateTime [default: now()]
  updatedAt DateTime [default: updatedAt]
}

Table Article {
  id String [pk]
  userId String [not null]
  title String [not null]
  image String [not null]
  content String [not null]
  viewCount Int [default: 0]
  createdAt DateTime [default: now()]
  updatedAt DateTime [default: updatedAt]
  categoryId String [ref: > ArticleCategory.id]
}

Table ArticleCategory {
  id String [pk]
  name String [not null]
  slug String
  description String
  icon String
  isActive Boolean [default: true]
  createdAt DateTime [default: now()]
  updatedAt DateTime [default: updatedAt]
}

Table ArticleReview {
  id String [pk]
  userId String [ref: > User.id]
  articleId String [ref: > Article.id]
  rating Int
  comment String
  parentId String [ref: > ArticleReview.id]
  createdDate DateTime [default: now()]
  updatedAt DateTime [default: updatedAt]
}

Table ChatRoom {
  id String [pk]
  userIds String[]
  messageIds String[]
  createdAt DateTime [default: now()]
  lastMessageAt DateTime [default: now()]
  name String
}

Table Message {
  id String [pk]
  chatroomId String [ref: > ChatRoom.id]
  senderId String [ref: > User.id]
  body String
  image String
  createdAt DateTime [default: now()]
  seenIds String[]
}

Table Banner {
  id String [pk]
  name String [not null]
  description String
  image String [not null]
  imageResponsive String [not null]
  startDate DateTime [not null]
  endDate DateTime [not null]
  status String [not null]
  createdAt DateTime [default: now()]
  updatedAt DateTime [default: updatedAt]
}

Table Notification {
  id String [pk]
  userId String [ref: > User.id]
  productId String [ref: > Product.id]
  orderId String
  messageId String
  fromUserId String [ref: > User.id]
  type NotificationType [not null]
  title String [not null]
  message String [not null]
  data Json
  isRead Boolean [default: false]
  createdAt DateTime [default: now()]
  updatedAt DateTime [default: updatedAt]
}

Table Voucher {
  id String [pk]
  code String [unique, not null]
  description String
  image String
  discountType DiscountType [not null]
  discountValue Float [not null]
  minOrderValue Float
  quantity Int [not null]
  usedCount Int [default: 0]
  maxUsagePerUser Int [default: 1]
  startDate DateTime [not null]
  endDate DateTime [not null]
  isActive Boolean [default: true]
  voucherType VoucherType [default: GENERAL]
  targetUserIds String[]
  createdAt DateTime [default: now()]
  updatedAt DateTime [default: updatedAt]
}

Table UserVoucher {
  id String [pk]
  userId String [ref: > User.id]
  voucherId String [ref: > Voucher.id]
  usedAt DateTime
  createdAt DateTime [default: now()]
  orderId String
  reservedForOrderId String
  reservedAt DateTime
}

Table ReturnRequest {
  id String [pk]
  orderId String [ref: > Order.id]
  userId String [ref: > User.id]
  type ReturnType [not null]
  reason String [not null]
  description String
  images String[]
  status ReturnStatus [default: PENDING]
  adminNote String
  processedBy String
  returnShippingCode String
  returnShippingFee Float
  createdAt DateTime [default: now()]
  processedAt DateTime
}

Table Promotion {
  id String [pk]
  title String [not null]
  description String
  discountType DiscountType [not null]
  discountValue Float [not null]
  maxDiscount Float
  startDate DateTime [not null]
  endDate DateTime [not null]
  isActive Boolean [default: true]
  applyToAll Boolean [default: false]
  productIds String[]
  categoryIds String[]
  createdAt DateTime [default: now()]
  updatedAt DateTime [default: updatedAt]
}

Table ProductPromotion {
  id String [pk]
  productId String [ref: > Product.id]
  promotionId String [ref: > Promotion.id]
  promotionalPrice Float [not null]
  startDate DateTime [not null]
  endDate DateTime [not null]
  isActive Boolean [default: true]
  priority Int [default: 0]
  createdAt DateTime [default: now()]
  updatedAt DateTime [default: updatedAt]
}

Table AnalyticsEvent {
  id String [pk]
  userId String [ref: > User.id]
  sessionId String
  eventType EventType [not null]
  entityType String
  entityId String
  metadata Json
  userAgent String
  ipAddress String
  referrer String
  path String [not null]
  timestamp DateTime [default: now()]
}

Table AdminSettings {
  id String [pk]
  discordNotifications Boolean [default: true]
  orderNotifications Boolean [default: true]
  emailNotifications Boolean [default: true]
  pushNotifications Boolean [default: false]
  analyticsTracking Boolean [default: true]
  sessionTimeout Int [default: 30]
  lowStockAlerts Boolean [default: true]
  chatbotSupport Boolean [default: false]
  autoVoucherSuggestion Boolean [default: true]
  dailyReports Boolean [default: true]
  reportInterval Int [default: 24]
  codPayment Boolean [default: true]
  momoPayment Boolean [default: false]
  stripePayment Boolean [default: false]
  createdBy String [not null]
  updatedBy String [not null]
  createdAt DateTime [default: now()]
  updatedAt DateTime [default: updatedAt]
}

Table ReportLog {
  id String [pk]
  type String [not null]
  interval Float [not null]
  success Boolean [not null]
  sentAt DateTime [not null]
  error String
  createdAt DateTime [default: now()]
}

Table ProductAttribute {
  id String [pk]
  productId String [ref: > Product.id]
  name String [not null]
  label String [not null]
  type AttributeType [not null]
  displayType DisplayType [default: BUTTON]
  isRequired Boolean [default: true]
  isVariation Boolean [default: true]
  position Int [default: 0]
  description String
  createdAt DateTime [default: now()]
  updatedAt DateTime [default: updatedAt]
}

Table AttributeValue {
  id String [pk]
  attributeId String [ref: > ProductAttribute.id]
  value String [not null]
  label String [not null]
  description String
  colorCode String
  imageUrl String
  priceAdjustment Float [default: 0]
  position Int [default: 0]
  isActive Boolean [default: true]
  createdAt DateTime [default: now()]
  updatedAt DateTime [default: updatedAt]
}

Table ProductVariant {
  id String [pk]
  productId String [ref: > Product.id]
  sku String [unique, not null]
  attributes Json [not null]
  price Float [not null]
  stock Int [default: 0]
  isActive Boolean [default: true]
  createdAt DateTime [default: now()]
  updatedAt DateTime [default: updatedAt]
}

Table AuditLog {
  id String [pk]
  eventType String [not null]
  category String [default: "ADMIN"]
  severity String [default: "MEDIUM"]
  userId String
  userEmail String
  userRole String
  ipAddress String
  userAgent String
  description String [not null]
  details Json [default: "{}"]
  metadata Json [default: "{}"]
  resourceId String
  resourceType String
  oldValue Json
  newValue Json
  timestamp DateTime [default: now()]
  createdAt DateTime [default: now()]
}
```

## Key Relationships Summary

### Core E-commerce Flow

- **User** → **Order** → **Product** (via CartProductType)
- **Order** → **ReturnRequest** (return/exchange system)
- **User** → **Review** → **Product** (product reviews)

### Content Management

- **Article** → **ArticleCategory** (blog/content system)
- **User** → **ArticleReview** → **Article** (article comments)

### Product Management

- **Product** → **Category** (product categorization)
- **Product** → **ProductVariant** (variant system)
- **Product** → **ProductAttribute** → **AttributeValue** (attributes)
- **Product** → **ProductPromotion** → **Promotion** (promotions)

### User Management & Communication

- **User** → **ChatRoom** → **Message** (chat system)
- **User** → **Notification** (notification system)
- **User** → **Account** (OAuth accounts)

### Voucher & Discount System

- **Voucher** → **UserVoucher** → **User** (voucher management)
- **Order** → **Voucher** (voucher usage)

### Analytics & Audit

- **User** → **AnalyticsEvent** (user behavior tracking)
- **AuditLog** (comprehensive audit trail)

## Enums Used

- **Role**: USER, ADMIN
- **OrderStatus**: pending, confirmed, canceled, completed
- **DeliveryStatus**: not_shipped, in_transit, delivered, returning, returned
- **ProductType**: SIMPLE, VARIANT
- **DiscountType**: PERCENTAGE, FIXED
- **VoucherType**: NEW_USER, RETARGETING, UPSELL, LOYALTY, EVENT, GENERAL
- **ReturnType**: EXCHANGE, RETURN, REFUND
- **ReturnStatus**: PENDING, APPROVED, REJECTED, COMPLETED
- **NotificationType**: ORDER_PLACED, COMMENT_RECEIVED, MESSAGE_RECEIVED, LOW_STOCK, SYSTEM_ALERT, PROMOTION_SUGGESTION, VOUCHER_SUGGESTION
- **EventType**: PAGE_VIEW, PRODUCT_VIEW, PRODUCT_CLICK, SEARCH, PURCHASE, ARTICLE_VIEW
- **AttributeType**: TEXT, COLOR, NUMBER, SELECT
- **DisplayType**: BUTTON, DROPDOWN, COLOR_SWATCH, TEXT_INPUT, RADIO, CHECKBOX

## Complex Types Used

- **CartProductType**: Embedded type for order items with variant support
- **Image**: Embedded type for product images with color variants
- **Address**: Embedded type for shipping addresses

## Database Features

- **MongoDB ObjectId**: Used for all primary keys and references
- **Soft Delete**: Products support soft deletion with isDeleted flag
- **Audit Trail**: Comprehensive logging via AuditLog model
- **Variant System**: Full product variant support with attributes and values
- **Hierarchical Categories**: Self-referencing category structure
- **Chat System**: Real-time messaging with seen status tracking
- **Voucher System**: Advanced voucher management with reservations
- **Return Management**: Complete return/exchange workflow
- **Analytics**: User behavior and event tracking
- **Promotion System**: Flexible discount and promotion management

---

# Lược Đồ Quan Hệ - Format Truyền Thống

## Schema theo format yêu cầu (dựa trên Prisma Schema ThanhHuyStore):

```
Account(id, userId, type, provider, providerAccountId, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state)

User(id, name, email, emailVerified, phoneNumber, image, hashedPassword, createAt, updateAt, lastLogin, role, resetPasswordToken, resetPasswordExpires, purchasedCategories, chatRoomIds, seenMessageIds)

Order(id, userId, amount, currency, status, deliveryStatus, createDate, paymentIntentId, phoneNumber, paymentMethod, shippingFee, voucherId, voucherCode, discountAmount, originalAmount, cancelReason, cancelDate, shippingCode, shippingStatus, shippingData)

Product(id, name, description, brand, productType, price, basePrice, categoryId, inStock, priority, createDate, createdAt, updatedAt, isDeleted, deletedAt, deletedBy)

Category(id, name, slug, image, icon, description, createdAt, updatedAt, parentId)

Review(id, userId, productId, rating, comment, reply, createdDate, updatedAt)

Article(id, userId, title, image, content, viewCount, createdAt, updatedAt, categoryId)

ArticleCategory(id, name, slug, description, icon, isActive, createdAt, updatedAt)

ArticleReview(id, userId, articleId, rating, comment, parentId, createdDate, updatedAt)

ChatRoom(id, userIds, messageIds, createdAt, lastMessageAt, name)

Message(id, chatroomId, senderId, body, image, createdAt, seenIds)

Banner(id, name, description, image, imageResponsive, startDate, endDate, status, createdAt, updatedAt)

Notification(id, userId, productId, orderId, messageId, fromUserId, type, title, message, data, isRead, createdAt, updatedAt)

Voucher(id, code, description, image, discountType, discountValue, minOrderValue, quantity, usedCount, maxUsagePerUser, startDate, endDate, isActive, voucherType, targetUserIds, createdAt, updatedAt)

UserVoucher(id, userId, voucherId, usedAt, createdAt, orderId, reservedForOrderId, reservedAt)

ReturnRequest(id, orderId, userId, type, reason, description, images, status, adminNote, processedBy, returnShippingCode, returnShippingFee, createdAt, processedAt)

Promotion(id, title, description, discountType, discountValue, maxDiscount, startDate, endDate, isActive, applyToAll, productIds, categoryIds, createdAt, updatedAt)

ProductPromotion(id, productId, promotionId, promotionalPrice, startDate, endDate, isActive, priority, createdAt, updatedAt)

AnalyticsEvent(id, userId, sessionId, eventType, entityType, entityId, metadata, userAgent, ipAddress, referrer, path, timestamp)

AdminSettings(id, discordNotifications, orderNotifications, emailNotifications, pushNotifications, analyticsTracking, sessionTimeout, lowStockAlerts, chatbotSupport, autoVoucherSuggestion, dailyReports, reportInterval, codPayment, momoPayment, stripePayment, createdBy, updatedBy, createdAt, updatedAt)

ReportLog(id, type, interval, success, sentAt, error, createdAt)

ProductAttribute(id, productId, name, label, type, displayType, isRequired, isVariation, position, description, createdAt, updatedAt)

AttributeValue(id, attributeId, value, label, description, colorCode, imageUrl, priceAdjustment, position, isActive, createdAt, updatedAt)

ProductVariant(id, productId, sku, attributes, price, stock, isActive, createdAt, updatedAt)

AuditLog(id, eventType, category, severity, userId, userEmail, userRole, ipAddress, userAgent, description, details, metadata, resourceId, resourceType, oldValue, newValue, timestamp, createdAt)
```

## Quan hệ chính (dựa trên Prisma Schema ThanhHuyStore):

### Quan hệ User & Authentication:

- User.id → Account.userId (1:n - Một user có nhiều OAuth account)
- User.id → Order.userId (1:n - Một user có nhiều đơn hàng)
- User.id → Review.userId (1:n - Một user có nhiều đánh giá sản phẩm)
- User.id → Article.userId (1:n - Một user viết nhiều bài viết)
- User.id → ArticleReview.userId (1:n - Một user có nhiều bình luận bài viết)
- User.id → Notification.userId (1:n - Một user nhận nhiều thông báo)
- User.id → Notification.fromUserId (1:n - Một user gửi nhiều thông báo)
- User.id → UserVoucher.userId (1:n - Một user có nhiều voucher)
- User.id → AnalyticsEvent.userId (1:n - Một user có nhiều sự kiện analytics)
- User.id → ReturnRequest.userId (1:n - Một user có nhiều yêu cầu trả hàng)

### Quan hệ Product & Category:

- Category.id → Product.categoryId (1:n - Một category có nhiều sản phẩm)
- Category.id → Category.parentId (1:n - Category có thể có subcategory)
- Product.id → Review.productId (1:n - Một sản phẩm có nhiều đánh giá)
- Product.id → Notification.productId (1:n - Một sản phẩm có nhiều thông báo)
- Product.id → ProductPromotion.productId (1:n - Một sản phẩm có nhiều khuyến mãi)
- Product.id → ProductAttribute.productId (1:n - Một sản phẩm có nhiều thuộc tính)
- Product.id → ProductVariant.productId (1:n - Một sản phẩm có nhiều biến thể)

### Quan hệ Product Variant System:

- ProductAttribute.id → AttributeValue.attributeId (1:n - Một thuộc tính có nhiều giá trị)

### Quan hệ Order & Payment:

- Order.id → ReturnRequest.orderId (1:n - Một đơn hàng có nhiều yêu cầu trả hàng)
- Voucher.id → Order.voucherId (1:n - Một voucher được dùng cho nhiều đơn hàng)
- Voucher.id → UserVoucher.voucherId (1:n - Một voucher thuộc về nhiều user)

### Quan hệ Promotion System:

- Promotion.id → ProductPromotion.promotionId (1:n - Một khuyến mãi áp dụng cho nhiều sản phẩm)

### Quan hệ Article & Content:

- ArticleCategory.id → Article.categoryId (1:n - Một category có nhiều bài viết)
- Article.id → ArticleReview.articleId (1:n - Một bài viết có nhiều bình luận)
- ArticleReview.id → ArticleReview.parentId (1:n - Bình luận có thể có reply)

### Quan hệ Chat System:

- ChatRoom.id → Message.chatroomId (1:n - Một phòng chat có nhiều tin nhắn)
- User.id → Message.senderId (1:n - Một user gửi nhiều tin nhắn)
- User.chatRoomIds → ChatRoom.id (n:n - Many-to-many qua array field)
- User.seenMessageIds → Message.id (n:n - Many-to-many qua array field)

### Quan hệ Analytics & Audit:

- Không có foreign key trực tiếp - AuditLog và AnalyticsEvent lưu trữ dữ liệu độc lập để phân tích

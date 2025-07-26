# ThanhHuyStore Database Schema - dbdiagram.io

// Copy and paste this into https://dbdiagram.io/d to visualize the database schema

// ===== CORE USER MANAGEMENT =====
Table User {
id String [pk]
name String
email String [unique, not null]
emailVerified Boolean
phoneNumber String
image String
hashedPassword String
createAt DateTime [default: `now()`]
updateAt DateTime [note: 'auto-updated']
lastLogin DateTime
role Role [default: 'USER']

// Password reset
resetPasswordToken String
resetPasswordExpires DateTime

// Email verification
emailVerificationToken String
emailVerificationExpires DateTime

// Email marketing
emailMarketingEnabled Boolean [default: true]
lastEmailSent DateTime
emailFrequency String [default: 'daily']

// Account blocking
isBlocked Boolean [default: false]
blockedAt DateTime
blockedBy String
blockReason String
}

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

indexes {
(provider, providerAccountId) [unique]
}
}

// ===== PRODUCT MANAGEMENT =====
Table Category {
id String [pk]
name String [not null]
slug String [not null]
image String
icon String
description String
createdAt DateTime [default: `now()`]
updatedAt DateTime [note: 'auto-updated']
parentId String [ref: > Category.id]
}

Table Product {
id String [pk]
name String [not null]
description String [not null]
brand String [default: 'Apple']
productType ProductType [default: 'SIMPLE']
price Float [note: 'For simple products']
categoryId String [ref: > Category.id, not null]
inStock Int [note: 'For simple products']
priority Int [default: 0]
createdAt DateTime [default: `now()`]
updatedAt DateTime [note: 'auto-updated']

// Soft delete
isDeleted Boolean [default: false]
deletedAt DateTime
deletedBy String

// Images
thumbnail String [note: 'Main product image']
galleryImages String [note: 'JSON array of gallery images']
}

Table ProductAttribute {
id String [pk]
productId String [ref: > Product.id, not null]
name String [not null, note: 'color, storage, ram']
label String [not null, note: 'Màu sắc, Dung lượng, RAM']
type AttributeType [not null]
displayType DisplayType [default: 'BUTTON']
isRequired Boolean [default: true]
isVariation Boolean [default: true]
position Int [default: 0]
description String
}

Table AttributeValue {
id String [pk]
attributeId String [ref: > ProductAttribute.id, not null]
value String [not null, note: 'silver, 128gb']
label String [not null, note: 'Bạc, 128GB']
description String
colorCode String [note: 'For COLOR type']
imageUrl String
priceAdjustment Float [default: 0]
position Int [default: 0]
isActive Boolean [default: true]
}

Table ProductVariant {
id String [pk]
productId String [ref: > Product.id, not null]
sku String [unique, not null]
attributes String [note: 'JSON: {"color": "silver", "storage": "512gb"}']
price Float [not null]
stock Int [default: 0]
thumbnail String [note: 'Variant-specific image']
galleryImages String [note: 'JSON array of variant gallery images']
isActive Boolean [default: true]
}

Table Review {
id String [pk]
userId String [ref: > User.id, not null]
productId String [ref: > Product.id, not null]
rating Int [not null, note: '1-5 stars']
comment String [not null]
reply String
createdDate DateTime [default: `now()`]
updatedAt DateTime
}

// ===== ORDER MANAGEMENT =====
Table Order {
id String [pk]
userId String [ref: > User.id, not null]
amount Float [not null]
currency String [not null]
status OrderStatus [default: 'pending']
deliveryStatus DeliveryStatus
paymentIntentId String [unique, not null]
phoneNumber String
paymentMethod String
shippingFee Float

// Address (embedded JSON)
address String [note: 'JSON: {city, country, line1, line2, postal_code}']

// Voucher information
voucherId String [ref: > Voucher.id]
voucherCode String
discountAmount Float [default: 0]
originalAmount Float

// Cancel information
cancelReason String
cancelDate DateTime

// Order notes
note String
orderNote String [note: 'Additional order note field']
salesStaff String [note: 'Tên nhân viên bán hàng, null = "KH tự đặt"']

// Exchange metadata
exchangeInfo String [note: 'JSON: {originalOrderId, returnRequestId, priceDifference, exchangeType}']

// Return/Exchange tracking
returnStatus OrderReturnStatus
returnedAmount Float

// Timestamps
createdAt DateTime [default: `now()`]
updatedAt DateTime [note: 'auto-updated']
}

Table ReturnRequest {
id String [pk]
orderId String [ref: > Order.id]
userId String [ref: > User.id]
type ReturnType [note: 'RETURN or EXCHANGE']
status ReturnStatus [default: 'PENDING']

items String [note: 'JSON: [{productId, variantId?, quantity, unitPrice, reason}]']

// Basic info
reason String [note: 'DEFECTIVE, WRONG_ITEM, CHANGE_MIND']
description String
images String [note: 'JSON array of image URLs']

// Financial
refundAmount Float [note: 'Số tiền hoàn (đã tính phí)']
additionalCost Float [note: 'Phí bù thêm (exchange)']
shippingBreakdown String [note: 'JSON: Chi tiết phí vận chuyển trả hàng']

// Exchange specific fields
exchangeToProductId String [ref: > Product.id, note: 'Sản phẩm muốn đổi sang']
exchangeToVariantId String [ref: > ProductVariant.id, note: 'Variant muốn đổi sang']
exchangeOrderId String [ref: > Order.id, note: 'ID của đơn hàng mới được tạo cho exchange']

// Admin workflow
adminNotes String
approvedBy String [ref: > User.id]
approvedAt DateTime

createdAt DateTime [default: `now()`]
updatedAt DateTime [note: 'auto-updated']
}

// ===== MARKETING & PROMOTIONS =====
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
voucherType VoucherType [default: 'GENERAL']
targetUserIds String [note: 'JSON array of user IDs']
createdAt DateTime [default: `now()`]
updatedAt DateTime [note: 'auto-updated']
}

Table UserVoucher {
id String [pk]
userId String [ref: > User.id, not null]
voucherId String [ref: > Voucher.id, not null]
usedAt DateTime
createdAt DateTime [default: `now()`]

// Voucher reservation fields
orderId String [ref: > Order.id]
reservedForOrderId String
reservedAt DateTime
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
productIds String [note: 'JSON array of product IDs']
categoryIds String [note: 'JSON array of category IDs']
createdAt DateTime [default: `now()`]
updatedAt DateTime [note: 'auto-updated']
}

Table ProductPromotion {
id String [pk]
productId String [ref: > Product.id, not null]
promotionId String [ref: > Promotion.id, not null]
promotionalPrice Float [not null]
startDate DateTime [not null]
endDate DateTime [not null]
isActive Boolean [default: true]
priority Int [default: 0]
createdAt DateTime [default: `now()`]
updatedAt DateTime [note: 'auto-updated']
}

// ===== SYSTEM & ANALYTICS =====
Table AnalyticsEvent {
id String [pk]
userId String [ref: > User.id]
sessionId String [note: 'Anonymous tracking']
eventType EventType [not null]
entityType String [note: 'product, article, category']
entityId String
metadata String [note: 'JSON: Flexible data storage']
userAgent String
ipAddress String
referrer String
path String [not null]
timestamp DateTime [default: `now()`]
updatedAt DateTime [note: 'auto-updated']
}

Table AuditLog {
id String [pk]
eventType String [not null, note: 'ADMIN_LOGIN, UPDATE_SETTINGS, PAYMENT_SUCCESS']
category String [default: 'ADMIN', note: 'ADMIN, SECURITY, BUSINESS, SYSTEM']
severity String [default: 'MEDIUM', note: 'LOW, MEDIUM, HIGH, CRITICAL']

// User info
userId String [ref: > User.id]
userEmail String
userRole String

// Request info
ipAddress String
userAgent String

// Event details
description String [not null]
details String [default: '{}', note: 'JSON']
metadata String [default: '{}', note: 'JSON']

// Resource info
resourceId String
resourceType String
oldValue String [note: 'JSON']
newValue String [note: 'JSON']

// Timestamps
timestamp DateTime [default: `now()`]
createdAt DateTime [default: `now()`]
}

Table AdminSettings {
id String [pk]

// Notification settings
discordNotifications Boolean [default: true]
orderNotifications Boolean [default: true]
pushNotifications Boolean [default: false]

// System settings
analyticsTracking Boolean [default: true]
sessionTimeout Int [default: 30, note: 'minutes']

// Automation settings
lowStockAlerts Boolean [default: true]
chatbotSupport Boolean [default: false]
autoVoucherSuggestion Boolean [default: true]

// Payment settings
codPayment Boolean [default: true]
momoPayment Boolean [default: false]
stripePayment Boolean [default: false]

// Email automation settings
autoEmailMarketing Boolean [default: false]
emailMarketingSchedule String [default: 'daily']
emailMarketingTime String [default: '09:00']

// Shipping Configuration
shopAddress String
shopProvince String [default: 'TP. Hồ Chí Minh']
shopDistrict String [default: 'Quận 1']
shopWard String [default: 'Phường Bến Nghé']

// Zone-based shipping fees
freeShippingThreshold Float [default: 5000000]
sameDistrictFee Float [default: 18000]
sameProvinceFee Float [default: 22000]
sameRegionFee Float [default: 28000]
crossRegionFee Float [default: 38000]

// Audit fields
createdBy String [not null]
updatedBy String [not null]
createdAt DateTime [default: `now()`]
updatedAt DateTime [note: 'auto-updated']
}

Table Notification {
id String [pk]
userId String [ref: > User.id, not null]
type NotificationType [not null]
title String [not null]
message String [not null]
data String [note: 'JSON: Additional data']
isRead Boolean [default: false]
createdAt DateTime [default: `now()`]
}

// ===== CONTENT MANAGEMENT =====
Table Article {
id String [pk]
title String [not null]
content String [not null]
excerpt String
thumbnail String
slug String [unique, not null]
status String [default: 'DRAFT']
publishedAt DateTime
createdAt DateTime [default: `now()`]
updatedAt DateTime [note: 'auto-updated']
}

Table ArticleReview {
id String [pk]
userId String [ref: > User.id, not null]
articleId String [ref: > Article.id, not null]
rating Int [not null, note: '1-5 stars']
comment String [not null]
createdAt DateTime [default: `now()`]
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
createdAt DateTime [default: `now()`]
updatedAt DateTime [note: 'auto-updated']
}

// ===== ENUMS =====
Enum Role {
USER
STAFF
ADMIN
}

Enum ProductType {
SIMPLE
VARIANT
}

Enum AttributeType {
TEXT
COLOR
NUMBER
SELECT
}

Enum DisplayType {
BUTTON
DROPDOWN
COLOR_SWATCH
TEXT_INPUT
RADIO
CHECKBOX
}

Enum OrderStatus {
pending
confirmed
canceled
completed
}

Enum DeliveryStatus {
not_shipped
in_transit
delivered
returning
returned
}

Enum ReturnType {
RETURN
EXCHANGE
}

Enum ReturnStatus {
PENDING
APPROVED
REJECTED
COMPLETED
}

Enum OrderReturnStatus {
NONE
PARTIAL
FULL
EXCHANGED
}

Enum DiscountType {
PERCENTAGE
FIXED
}

Enum VoucherType {
NEW_USER
RETARGETING
UPSELL
LOYALTY
EVENT
GENERAL
}

Enum EventType {
PRODUCT_VIEW
ARTICLE_VIEW
}

Enum NotificationType {
ORDER_PLACED
COMMENT_RECEIVED
MESSAGE_RECEIVED
LOW_STOCK
SYSTEM_ALERT
PROMOTION_SUGGESTION
VOUCHER_SUGGESTION
}

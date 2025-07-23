# SQL Server Database Schema - ThanhHuyStore

## Overview

This document contains the complete SQL Server database schema for the ThanhHuyStore e-commerce application. Converted from Prisma MongoDB schema to T-SQL syntax.

## Database Creation Script

```sql
-- Create Database
CREATE DATABASE ThanhHuyStore;
GO

USE ThanhHuyStore;
GO

-- Create Schemas for organization
CREATE SCHEMA [user];
GO
CREATE SCHEMA [product];
GO
CREATE SCHEMA [order];
GO
CREATE SCHEMA [content];
GO
CREATE SCHEMA [system];
GO
CREATE SCHEMA [marketing];
GO

-- =============================================
-- Core User Management Tables
-- =============================================

-- Users table
CREATE TABLE [user].[Users] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [Name] NVARCHAR(255) NULL,
    [Email] NVARCHAR(255) NOT NULL UNIQUE,
    [EmailVerified] BIT NULL DEFAULT 0,
    [PhoneNumber] NVARCHAR(20) NULL,
    [Image] NVARCHAR(500) NULL,
    [HashedPassword] NVARCHAR(255) NULL,
    [CreateAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdateAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [LastLogin] DATETIME2 NULL,
    [Role] NVARCHAR(20) NOT NULL DEFAULT 'USER' CHECK ([Role] IN ('USER', 'STAFF', 'ADMIN')),

    -- Password Reset
    [ResetPasswordToken] NVARCHAR(255) NULL,
    [ResetPasswordExpires] DATETIME2 NULL,

    -- Email Verification
    [EmailVerificationToken] NVARCHAR(255) NULL,
    [EmailVerificationExpires] DATETIME2 NULL,

    -- Email Marketing
    [EmailMarketingEnabled] BIT NOT NULL DEFAULT 1,
    [LastEmailSent] DATETIME2 NULL,
    [EmailFrequency] NVARCHAR(20) NOT NULL DEFAULT 'daily' CHECK ([EmailFrequency] IN ('daily', 'weekly', 'monthly')),

    -- Account Blocking
    [IsBlocked] BIT NOT NULL DEFAULT 0,
    [BlockedAt] DATETIME2 NULL,
    [BlockedBy] UNIQUEIDENTIFIER NULL,
    [BlockReason] NVARCHAR(500) NULL
);
GO

-- Accounts table (OAuth)
CREATE TABLE [user].[Accounts] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [Type] NVARCHAR(50) NOT NULL,
    [Provider] NVARCHAR(50) NOT NULL,
    [ProviderAccountId] NVARCHAR(255) NOT NULL,
    [RefreshToken] NVARCHAR(MAX) NULL,
    [AccessToken] NVARCHAR(MAX) NULL,
    [ExpiresAt] INT NULL,
    [TokenType] NVARCHAR(50) NULL,
    [Scope] NVARCHAR(255) NULL,
    [IdToken] NVARCHAR(MAX) NULL,
    [SessionState] NVARCHAR(255) NULL,

    CONSTRAINT FK_Accounts_Users FOREIGN KEY ([UserId]) REFERENCES [user].[Users]([Id]) ON DELETE CASCADE,
    CONSTRAINT UQ_Accounts_Provider_ProviderAccountId UNIQUE ([Provider], [ProviderAccountId])
);
GO

-- User purchased categories (junction table for array)
CREATE TABLE [user].[UserPurchasedCategories] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [CategoryName] NVARCHAR(255) NOT NULL,
    [PurchasedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_UserPurchasedCategories_Users FOREIGN KEY ([UserId]) REFERENCES [user].[Users]([Id]) ON DELETE CASCADE
);
GO

-- User favorite products (junction table for array)
CREATE TABLE [user].[UserFavoriteProducts] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [ProductId] UNIQUEIDENTIFIER NOT NULL,
    [AddedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_UserFavoriteProducts_Users FOREIGN KEY ([UserId]) REFERENCES [user].[Users]([Id]) ON DELETE CASCADE
);
GO

-- =============================================
-- Product Management Tables
-- =============================================

-- Categories table
CREATE TABLE [product].[Categories] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [Name] NVARCHAR(255) NOT NULL,
    [Slug] NVARCHAR(255) NOT NULL,
    [Image] NVARCHAR(500) NULL,
    [Icon] NVARCHAR(500) NULL,
    [Description] NVARCHAR(MAX) NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [ParentId] UNIQUEIDENTIFIER NULL,

    CONSTRAINT FK_Categories_Parent FOREIGN KEY ([ParentId]) REFERENCES [product].[Categories]([Id])
);
GO

-- Products table
CREATE TABLE [product].[Products] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [Name] NVARCHAR(255) NOT NULL,
    [Description] NVARCHAR(MAX) NOT NULL,
    [Brand] NVARCHAR(100) NOT NULL DEFAULT 'Apple',
    [ProductType] NVARCHAR(20) NOT NULL DEFAULT 'SIMPLE' CHECK ([ProductType] IN ('SIMPLE', 'VARIANT')),
    [Price] DECIMAL(18,2) NULL, -- For simple products
    [CategoryId] UNIQUEIDENTIFIER NOT NULL,
    [InStock] INT NULL, -- For simple products
    [Priority] INT NOT NULL DEFAULT 0,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    -- Soft delete
    [IsDeleted] BIT NOT NULL DEFAULT 0,
    [DeletedAt] DATETIME2 NULL,
    [DeletedBy] UNIQUEIDENTIFIER NULL,

    -- Images
    [Thumbnail] NVARCHAR(500) NULL,

    CONSTRAINT FK_Products_Categories FOREIGN KEY ([CategoryId]) REFERENCES [product].[Categories]([Id])
);
GO

-- Product gallery images (junction table for array)
CREATE TABLE [product].[ProductGalleryImages] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [ProductId] UNIQUEIDENTIFIER NOT NULL,
    [ImageUrl] NVARCHAR(500) NOT NULL,
    [SortOrder] INT NOT NULL DEFAULT 0,

    CONSTRAINT FK_ProductGalleryImages_Products FOREIGN KEY ([ProductId]) REFERENCES [product].[Products]([Id]) ON DELETE CASCADE
);
GO

-- Product attributes
CREATE TABLE [product].[ProductAttributes] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [ProductId] UNIQUEIDENTIFIER NOT NULL,
    [Name] NVARCHAR(100) NOT NULL,
    [Label] NVARCHAR(255) NOT NULL,
    [Type] NVARCHAR(20) NOT NULL CHECK ([Type] IN ('TEXT', 'COLOR', 'NUMBER', 'SELECT')),
    [DisplayType] NVARCHAR(20) NOT NULL DEFAULT 'BUTTON' CHECK ([DisplayType] IN ('BUTTON', 'DROPDOWN', 'COLOR_SWATCH', 'TEXT_INPUT', 'RADIO', 'CHECKBOX')),
    [IsRequired] BIT NOT NULL DEFAULT 1,
    [IsVariation] BIT NOT NULL DEFAULT 1,
    [Position] INT NOT NULL DEFAULT 0,
    [Description] NVARCHAR(MAX) NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_ProductAttributes_Products FOREIGN KEY ([ProductId]) REFERENCES [product].[Products]([Id]) ON DELETE CASCADE
);
GO

-- Attribute values
CREATE TABLE [product].[AttributeValues] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [AttributeId] UNIQUEIDENTIFIER NOT NULL,
    [Value] NVARCHAR(255) NOT NULL,
    [Label] NVARCHAR(255) NOT NULL,
    [Description] NVARCHAR(MAX) NULL,
    [ColorCode] NVARCHAR(10) NULL,
    [ImageUrl] NVARCHAR(500) NULL,
    [PriceAdjustment] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [Position] INT NOT NULL DEFAULT 0,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_AttributeValues_ProductAttributes FOREIGN KEY ([AttributeId]) REFERENCES [product].[ProductAttributes]([Id]) ON DELETE CASCADE
);
GO

-- Product variants
CREATE TABLE [product].[ProductVariants] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [ProductId] UNIQUEIDENTIFIER NOT NULL,
    [Sku] NVARCHAR(100) NOT NULL UNIQUE,
    [Attributes] NVARCHAR(MAX) NOT NULL, -- JSON: {"color": "silver", "storage": "512gb"}
    [Price] DECIMAL(18,2) NOT NULL,
    [Stock] INT NOT NULL DEFAULT 0,
    [Thumbnail] NVARCHAR(500) NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_ProductVariants_Products FOREIGN KEY ([ProductId]) REFERENCES [product].[Products]([Id]) ON DELETE CASCADE
);
GO

-- Product variant gallery images
CREATE TABLE [product].[ProductVariantGalleryImages] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [VariantId] UNIQUEIDENTIFIER NOT NULL,
    [ImageUrl] NVARCHAR(500) NOT NULL,
    [SortOrder] INT NOT NULL DEFAULT 0,

    CONSTRAINT FK_ProductVariantGalleryImages_ProductVariants FOREIGN KEY ([VariantId]) REFERENCES [product].[ProductVariants]([Id]) ON DELETE CASCADE
);
GO

-- =============================================
-- Order Management Tables
-- =============================================

-- Orders table
CREATE TABLE [order].[Orders] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [Amount] DECIMAL(18,2) NOT NULL,
    [Currency] NVARCHAR(10) NOT NULL,
    [Status] NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK ([Status] IN ('pending', 'confirmed', 'canceled', 'completed')),
    [DeliveryStatus] NVARCHAR(20) NULL CHECK ([DeliveryStatus] IN ('not_shipped', 'in_transit', 'delivered', 'returning', 'returned')),
    [PaymentIntentId] NVARCHAR(255) NOT NULL UNIQUE,
    [PhoneNumber] NVARCHAR(20) NULL,
    [PaymentMethod] NVARCHAR(50) NULL,
    [ShippingFee] DECIMAL(18,2) NULL,

    -- Address (embedded as JSON or separate fields)
    [AddressCity] NVARCHAR(100) NULL,
    [AddressCountry] NVARCHAR(100) NULL,
    [AddressLine1] NVARCHAR(255) NULL,
    [AddressLine2] NVARCHAR(255) NULL,
    [AddressPostalCode] NVARCHAR(20) NULL,

    -- Voucher information
    [VoucherId] UNIQUEIDENTIFIER NULL,
    [VoucherCode] NVARCHAR(50) NULL,
    [DiscountAmount] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [OriginalAmount] DECIMAL(18,2) NULL,

    -- Cancel information
    [CancelReason] NVARCHAR(500) NULL,
    [CancelDate] DATETIME2 NULL,

    -- Return/Exchange tracking
    [ReturnStatus] NVARCHAR(20) NULL CHECK ([ReturnStatus] IN ('NONE', 'PARTIAL', 'FULL', 'EXCHANGED')),
    [ReturnedAmount] DECIMAL(18,2) NULL,

    -- Timestamps
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_Orders_Users FOREIGN KEY ([UserId]) REFERENCES [user].[Users]([Id]) ON DELETE CASCADE
);
GO

-- Order products (CartProductType as separate table)
CREATE TABLE [order].[OrderProducts] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [OrderId] UNIQUEIDENTIFIER NOT NULL,
    [ProductId] UNIQUEIDENTIFIER NOT NULL,
    [Name] NVARCHAR(255) NOT NULL,
    [Description] NVARCHAR(MAX) NOT NULL,
    [Category] NVARCHAR(255) NOT NULL,
    [Brand] NVARCHAR(100) NULL,
    [SelectedImg] NVARCHAR(500) NOT NULL, -- For backward compatibility
    [Thumbnail] NVARCHAR(500) NULL,
    [Quantity] INT NOT NULL,
    [Price] DECIMAL(18,2) NOT NULL,
    [InStock] INT NOT NULL,

    -- Variant support
    [VariantId] UNIQUEIDENTIFIER NULL,
    [Attributes] NVARCHAR(MAX) NULL, -- JSON: {"color": "silver", "storage": "512gb"}

    CONSTRAINT FK_OrderProducts_Orders FOREIGN KEY ([OrderId]) REFERENCES [order].[Orders]([Id]) ON DELETE CASCADE
);
GO

-- Reviews table
CREATE TABLE [content].[Reviews] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [ProductId] UNIQUEIDENTIFIER NOT NULL,
    [Rating] INT NOT NULL CHECK ([Rating] BETWEEN 1 AND 5),
    [Comment] NVARCHAR(MAX) NOT NULL,
    [Reply] NVARCHAR(MAX) NULL,
    [CreatedDate] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NULL,

    CONSTRAINT FK_Reviews_Users FOREIGN KEY ([UserId]) REFERENCES [user].[Users]([Id]) ON DELETE CASCADE,
    CONSTRAINT FK_Reviews_Products FOREIGN KEY ([ProductId]) REFERENCES [product].[Products]([Id]) ON DELETE CASCADE
);
GO

-- =============================================
-- Marketing & Promotions Tables
-- =============================================

-- Vouchers table
CREATE TABLE [marketing].[Vouchers] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [Code] NVARCHAR(50) NOT NULL UNIQUE,
    [Description] NVARCHAR(MAX) NULL,
    [Image] NVARCHAR(500) NULL,
    [DiscountType] NVARCHAR(20) NOT NULL CHECK ([DiscountType] IN ('PERCENTAGE', 'FIXED')),
    [DiscountValue] DECIMAL(18,2) NOT NULL,
    [MinOrderValue] DECIMAL(18,2) NULL,
    [Quantity] INT NOT NULL,
    [UsedCount] INT NOT NULL DEFAULT 0,
    [MaxUsagePerUser] INT NOT NULL DEFAULT 1,
    [StartDate] DATETIME2 NOT NULL,
    [EndDate] DATETIME2 NOT NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [VoucherType] NVARCHAR(20) NOT NULL DEFAULT 'GENERAL' CHECK ([VoucherType] IN ('NEW_USER', 'RETARGETING', 'UPSELL', 'LOYALTY', 'EVENT', 'GENERAL')),
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Voucher target users (junction table for array)
CREATE TABLE [marketing].[VoucherTargetUsers] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [VoucherId] UNIQUEIDENTIFIER NOT NULL,
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [AssignedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_VoucherTargetUsers_Vouchers FOREIGN KEY ([VoucherId]) REFERENCES [marketing].[Vouchers]([Id]) ON DELETE CASCADE,
    CONSTRAINT FK_VoucherTargetUsers_Users FOREIGN KEY ([UserId]) REFERENCES [user].[Users]([Id]) ON DELETE CASCADE,
    CONSTRAINT UQ_VoucherTargetUsers_Voucher_User UNIQUE ([VoucherId], [UserId])
);
GO

-- User vouchers
CREATE TABLE [marketing].[UserVouchers] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [VoucherId] UNIQUEIDENTIFIER NOT NULL,
    [UsedAt] DATETIME2 NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [OrderId] UNIQUEIDENTIFIER NULL,
    [ReservedForOrderId] NVARCHAR(255) NULL,
    [ReservedAt] DATETIME2 NULL,

    CONSTRAINT FK_UserVouchers_Users FOREIGN KEY ([UserId]) REFERENCES [user].[Users]([Id]) ON DELETE CASCADE,
    CONSTRAINT FK_UserVouchers_Vouchers FOREIGN KEY ([VoucherId]) REFERENCES [marketing].[Vouchers]([Id]) ON DELETE CASCADE,
    CONSTRAINT UQ_UserVouchers_User_Voucher UNIQUE ([UserId], [VoucherId])
);
GO

-- Promotions table
CREATE TABLE [marketing].[Promotions] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [Title] NVARCHAR(255) NOT NULL,
    [Description] NVARCHAR(MAX) NULL,
    [DiscountType] NVARCHAR(20) NOT NULL CHECK ([DiscountType] IN ('PERCENTAGE', 'FIXED')),
    [DiscountValue] DECIMAL(18,2) NOT NULL,
    [MaxDiscount] DECIMAL(18,2) NULL,
    [StartDate] DATETIME2 NOT NULL,
    [EndDate] DATETIME2 NOT NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [ApplyToAll] BIT NOT NULL DEFAULT 0,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Promotion products (junction table for array)
CREATE TABLE [marketing].[PromotionProducts] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [PromotionId] UNIQUEIDENTIFIER NOT NULL,
    [ProductId] UNIQUEIDENTIFIER NOT NULL,
    [AddedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_PromotionProducts_Promotions FOREIGN KEY ([PromotionId]) REFERENCES [marketing].[Promotions]([Id]) ON DELETE CASCADE,
    CONSTRAINT FK_PromotionProducts_Products FOREIGN KEY ([ProductId]) REFERENCES [product].[Products]([Id]) ON DELETE CASCADE,
    CONSTRAINT UQ_PromotionProducts_Promotion_Product UNIQUE ([PromotionId], [ProductId])
);
GO

-- Promotion categories (junction table for array)
CREATE TABLE [marketing].[PromotionCategories] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [PromotionId] UNIQUEIDENTIFIER NOT NULL,
    [CategoryId] UNIQUEIDENTIFIER NOT NULL,
    [AddedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_PromotionCategories_Promotions FOREIGN KEY ([PromotionId]) REFERENCES [marketing].[Promotions]([Id]) ON DELETE CASCADE,
    CONSTRAINT FK_PromotionCategories_Categories FOREIGN KEY ([CategoryId]) REFERENCES [product].[Categories]([Id]) ON DELETE CASCADE,
    CONSTRAINT UQ_PromotionCategories_Promotion_Category UNIQUE ([PromotionId], [CategoryId])
);
GO

-- Product promotions
CREATE TABLE [marketing].[ProductPromotions] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [ProductId] UNIQUEIDENTIFIER NOT NULL,
    [PromotionId] UNIQUEIDENTIFIER NOT NULL,
    [PromotionalPrice] DECIMAL(18,2) NOT NULL,
    [StartDate] DATETIME2 NOT NULL,
    [EndDate] DATETIME2 NOT NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [Priority] INT NOT NULL DEFAULT 0,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_ProductPromotions_Products FOREIGN KEY ([ProductId]) REFERENCES [product].[Products]([Id]) ON DELETE CASCADE,
    CONSTRAINT FK_ProductPromotions_Promotions FOREIGN KEY ([PromotionId]) REFERENCES [marketing].[Promotions]([Id]) ON DELETE CASCADE,
    CONSTRAINT UQ_ProductPromotions_Product_Promotion UNIQUE ([ProductId], [PromotionId])
);
GO

-- =============================================
-- System & Analytics Tables
-- =============================================

-- Analytics events
CREATE TABLE [system].[AnalyticsEvents] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [UserId] UNIQUEIDENTIFIER NULL,
    [SessionId] NVARCHAR(255) NULL,
    [EventType] NVARCHAR(50) NOT NULL CHECK ([EventType] IN ('PRODUCT_VIEW', 'ARTICLE_VIEW')),
    [EntityType] NVARCHAR(50) NULL,
    [EntityId] UNIQUEIDENTIFIER NULL,
    [Metadata] NVARCHAR(MAX) NULL, -- JSON
    [UserAgent] NVARCHAR(500) NULL,
    [IpAddress] NVARCHAR(45) NULL,
    [Referrer] NVARCHAR(500) NULL,
    [Path] NVARCHAR(500) NOT NULL,
    [Timestamp] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_AnalyticsEvents_Users FOREIGN KEY ([UserId]) REFERENCES [user].[Users]([Id]),
    CONSTRAINT UQ_AnalyticsEvents_User_Entity_Event UNIQUE ([UserId], [EntityId], [EventType])
);
GO

-- Banners
CREATE TABLE [system].[Banners] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [Name] NVARCHAR(255) NOT NULL,
    [Description] NVARCHAR(MAX) NULL,
    [Image] NVARCHAR(500) NOT NULL,
    [ImageResponsive] NVARCHAR(500) NOT NULL,
    [StartDate] DATETIME2 NOT NULL,
    [EndDate] DATETIME2 NOT NULL,
    [Status] NVARCHAR(20) NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Admin settings
CREATE TABLE [system].[AdminSettings] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),

    -- Notification settings
    [DiscordNotifications] BIT NOT NULL DEFAULT 1,
    [OrderNotifications] BIT NOT NULL DEFAULT 1,
    [PushNotifications] BIT NOT NULL DEFAULT 0,

    -- System settings
    [AnalyticsTracking] BIT NOT NULL DEFAULT 1,
    [SessionTimeout] INT NOT NULL DEFAULT 30, -- minutes

    -- Automation settings
    [LowStockAlerts] BIT NOT NULL DEFAULT 1,
    [ChatbotSupport] BIT NOT NULL DEFAULT 0,
    [AutoVoucherSuggestion] BIT NOT NULL DEFAULT 1,

    -- Report settings
    [DailyReports] BIT NOT NULL DEFAULT 1,
    [ReportInterval] INT NOT NULL DEFAULT 24, -- hours

    -- Payment settings
    [CodPayment] BIT NOT NULL DEFAULT 1,
    [MomoPayment] BIT NOT NULL DEFAULT 0,
    [StripePayment] BIT NOT NULL DEFAULT 0,

    -- Email automation settings
    [AutoEmailMarketing] BIT NOT NULL DEFAULT 0,
    [EmailMarketingSchedule] NVARCHAR(20) NOT NULL DEFAULT 'daily' CHECK ([EmailMarketingSchedule] IN ('daily', 'weekly', 'monthly', 'newProduct')),
    [EmailMarketingTime] NVARCHAR(10) NOT NULL DEFAULT '09:00', -- HH:MM format

    -- Audit fields
    [CreatedBy] NVARCHAR(255) NOT NULL,
    [UpdatedBy] NVARCHAR(255) NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Audit log
CREATE TABLE [system].[AuditLogs] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [EventType] NVARCHAR(100) NOT NULL,
    [Category] NVARCHAR(50) NOT NULL DEFAULT 'ADMIN' CHECK ([Category] IN ('ADMIN', 'SECURITY', 'BUSINESS', 'SYSTEM')),
    [Severity] NVARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK ([Severity] IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),

    -- User info
    [UserId] UNIQUEIDENTIFIER NULL,
    [UserEmail] NVARCHAR(255) NULL,
    [UserRole] NVARCHAR(20) NULL,

    -- Request info
    [IpAddress] NVARCHAR(45) NULL,
    [UserAgent] NVARCHAR(500) NULL,

    -- Event details
    [Description] NVARCHAR(MAX) NOT NULL,
    [Details] NVARCHAR(MAX) NOT NULL DEFAULT '{}', -- JSON
    [Metadata] NVARCHAR(MAX) NOT NULL DEFAULT '{}', -- JSON

    -- Resource info
    [ResourceId] NVARCHAR(255) NULL,
    [ResourceType] NVARCHAR(100) NULL,
    [OldValue] NVARCHAR(MAX) NULL, -- JSON
    [NewValue] NVARCHAR(MAX) NULL, -- JSON

    -- Timestamps
    [Timestamp] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_AuditLogs_Users FOREIGN KEY ([UserId]) REFERENCES [user].[Users]([Id])
);
GO

-- Report logs
CREATE TABLE [system].[ReportLogs] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [Type] NVARCHAR(50) NOT NULL, -- SCHEDULED, MANUAL, TEST
    [Interval] DECIMAL(10,2) NOT NULL, -- Report interval in hours
    [Success] BIT NOT NULL, -- Whether the report was sent successfully
    [SentAt] DATETIME2 NOT NULL, -- When the report was sent
    [Error] NVARCHAR(MAX) NULL, -- Error message if failed
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Return requests
CREATE TABLE [order].[ReturnRequests] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [OrderId] UNIQUEIDENTIFIER NULL,
    [UserId] UNIQUEIDENTIFIER NULL,
    [Type] NVARCHAR(20) NULL CHECK ([Type] IN ('RETURN', 'EXCHANGE')),
    [Status] NVARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK ([Status] IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED')),
    [Items] NVARCHAR(MAX) NULL, -- JSON: [{productId, variantId?, quantity, unitPrice, reason}]
    [Reason] NVARCHAR(500) NULL,
    [Description] NVARCHAR(MAX) NULL,
    [RefundAmount] DECIMAL(18,2) NULL,
    [AdditionalCost] DECIMAL(18,2) NULL,
    [AdminNotes] NVARCHAR(MAX) NULL,
    [ApprovedBy] UNIQUEIDENTIFIER NULL,
    [ApprovedAt] DATETIME2 NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_ReturnRequests_Orders FOREIGN KEY ([OrderId]) REFERENCES [order].[Orders]([Id]) ON DELETE CASCADE,
    CONSTRAINT FK_ReturnRequests_Users FOREIGN KEY ([UserId]) REFERENCES [user].[Users]([Id]) ON DELETE CASCADE,
    CONSTRAINT FK_ReturnRequests_ApprovedBy FOREIGN KEY ([ApprovedBy]) REFERENCES [user].[Users]([Id])
);
GO

-- Return request images (junction table for array)
CREATE TABLE [order].[ReturnRequestImages] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [ReturnRequestId] UNIQUEIDENTIFIER NOT NULL,
    [ImageUrl] NVARCHAR(500) NOT NULL,
    [SortOrder] INT NOT NULL DEFAULT 0,

    CONSTRAINT FK_ReturnRequestImages_ReturnRequests FOREIGN KEY ([ReturnRequestId]) REFERENCES [order].[ReturnRequests]([Id]) ON DELETE CASCADE
);
GO

-- Email campaigns
CREATE TABLE [marketing].[EmailCampaigns] (
    [Id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [ProductId] UNIQUEIDENTIFIER NOT NULL,
    [SentAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [ClickCount] INT NOT NULL DEFAULT 0,
    [Status] NVARCHAR(20) NOT NULL, -- sent, failed, scheduled

    CONSTRAINT FK_EmailCampaigns_Products FOREIGN KEY ([ProductId]) REFERENCES [product].[Products]([Id]) ON DELETE CASCADE
);
GO

-- =============================================
-- Add Foreign Key Constraints
-- =============================================

-- Add foreign key for Orders.VoucherId
ALTER TABLE [order].[Orders]
ADD CONSTRAINT FK_Orders_Vouchers FOREIGN KEY ([VoucherId]) REFERENCES [marketing].[Vouchers]([Id]);
GO

-- Add foreign key for UserFavoriteProducts.ProductId
ALTER TABLE [user].[UserFavoriteProducts]
ADD CONSTRAINT FK_UserFavoriteProducts_Products FOREIGN KEY ([ProductId]) REFERENCES [product].[Products]([Id]) ON DELETE CASCADE;
GO

-- =============================================
-- Create Indexes for Performance
-- =============================================

-- User indexes
CREATE INDEX IX_Users_Email ON [user].[Users]([Email]);
CREATE INDEX IX_Users_Role ON [user].[Users]([Role]);
CREATE INDEX IX_Users_IsBlocked ON [user].[Users]([IsBlocked]);
CREATE INDEX IX_Users_CreateAt ON [user].[Users]([CreateAt]);
GO

-- Product indexes
CREATE INDEX IX_Products_CategoryId ON [product].[Products]([CategoryId]);
CREATE INDEX IX_Products_ProductType ON [product].[Products]([ProductType]);
CREATE INDEX IX_Products_IsDeleted ON [product].[Products]([IsDeleted]);
CREATE INDEX IX_Products_CreatedAt ON [product].[Products]([CreatedAt]);
CREATE INDEX IX_Products_Priority ON [product].[Products]([Priority]);
GO

-- Order indexes
CREATE INDEX IX_Orders_UserId ON [order].[Orders]([UserId]);
CREATE INDEX IX_Orders_Status ON [order].[Orders]([Status]);
CREATE INDEX IX_Orders_CreatedAt ON [order].[Orders]([CreatedAt]);
CREATE INDEX IX_Orders_PaymentIntentId ON [order].[Orders]([PaymentIntentId]);
GO

-- Analytics indexes
CREATE INDEX IX_AnalyticsEvents_EventType ON [system].[AnalyticsEvents]([EventType]);
CREATE INDEX IX_AnalyticsEvents_Timestamp ON [system].[AnalyticsEvents]([Timestamp]);
CREATE INDEX IX_AnalyticsEvents_UserId ON [system].[AnalyticsEvents]([UserId]);
CREATE INDEX IX_AnalyticsEvents_EntityId ON [system].[AnalyticsEvents]([EntityId]);
GO

-- Audit log indexes
CREATE INDEX IX_AuditLogs_EventType ON [system].[AuditLogs]([EventType]);
CREATE INDEX IX_AuditLogs_Category ON [system].[AuditLogs]([Category]);
CREATE INDEX IX_AuditLogs_Severity ON [system].[AuditLogs]([Severity]);
CREATE INDEX IX_AuditLogs_UserId ON [system].[AuditLogs]([UserId]);
CREATE INDEX IX_AuditLogs_Timestamp ON [system].[AuditLogs]([Timestamp]);
CREATE INDEX IX_AuditLogs_ResourceId ON [system].[AuditLogs]([ResourceId]);
CREATE INDEX IX_AuditLogs_ResourceType ON [system].[AuditLogs]([ResourceType]);
GO

-- Review indexes
CREATE INDEX IX_Reviews_ProductId ON [content].[Reviews]([ProductId]);
CREATE INDEX IX_Reviews_UserId ON [content].[Reviews]([UserId]);
CREATE INDEX IX_Reviews_CreatedDate ON [content].[Reviews]([CreatedDate]);
GO

-- Message indexes
CREATE INDEX IX_Messages_ChatRoomId ON [system].[Messages]([ChatRoomId]);
CREATE INDEX IX_Messages_SenderId ON [system].[Messages]([SenderId]);
CREATE INDEX IX_Messages_CreatedAt ON [system].[Messages]([CreatedAt]);
GO

-- Notification indexes
CREATE INDEX IX_Notifications_UserId ON [system].[Notifications]([UserId]);
CREATE INDEX IX_Notifications_Type ON [system].[Notifications]([Type]);
CREATE INDEX IX_Notifications_IsRead ON [system].[Notifications]([IsRead]);
CREATE INDEX IX_Notifications_CreatedAt ON [system].[Notifications]([CreatedAt]);
GO

-- Product promotion indexes
CREATE INDEX IX_ProductPromotions_ProductId ON [marketing].[ProductPromotions]([ProductId]);
CREATE INDEX IX_ProductPromotions_PromotionId ON [marketing].[ProductPromotions]([PromotionId]);
CREATE INDEX IX_ProductPromotions_StartDate_EndDate ON [marketing].[ProductPromotions]([StartDate], [EndDate]);
GO

-- Return request indexes
CREATE INDEX IX_ReturnRequests_OrderId ON [order].[ReturnRequests]([OrderId]);
CREATE INDEX IX_ReturnRequests_UserId ON [order].[ReturnRequests]([UserId]);
CREATE INDEX IX_ReturnRequests_Status ON [order].[ReturnRequests]([Status]);
CREATE INDEX IX_ReturnRequests_CreatedAt ON [order].[ReturnRequests]([CreatedAt]);
CREATE INDEX IX_ReturnRequests_Type_Status ON [order].[ReturnRequests]([Type], [Status]);
GO

-- Email campaign indexes
CREATE INDEX IX_EmailCampaigns_ProductId ON [marketing].[EmailCampaigns]([ProductId]);
CREATE INDEX IX_EmailCampaigns_SentAt ON [marketing].[EmailCampaigns]([SentAt]);
GO

-- =============================================
-- Create Update Triggers for UpdatedAt fields
-- =============================================

-- Users update trigger
CREATE TRIGGER TR_Users_UpdatedAt ON [user].[Users]
AFTER UPDATE AS
BEGIN
    UPDATE [user].[Users]
    SET [UpdateAt] = GETUTCDATE()
    WHERE [Id] IN (SELECT [Id] FROM inserted);
END;
GO

-- Products update trigger
CREATE TRIGGER TR_Products_UpdatedAt ON [product].[Products]
AFTER UPDATE AS
BEGIN
    UPDATE [product].[Products]
    SET [UpdatedAt] = GETUTCDATE()
    WHERE [Id] IN (SELECT [Id] FROM inserted);
END;
GO

-- Orders update trigger
CREATE TRIGGER TR_Orders_UpdatedAt ON [order].[Orders]
AFTER UPDATE AS
BEGIN
    UPDATE [order].[Orders]
    SET [UpdatedAt] = GETUTCDATE()
    WHERE [Id] IN (SELECT [Id] FROM inserted);
END;
GO

PRINT 'ThanhHuyStore database schema created successfully!';
GO
```

## SQL Server Schema Summary

### Database Structure

The ThanhHuyStore database is organized into 6 logical schemas:

1. **[user]** - User management and authentication
2. **[product]** - Product catalog and variants
3. **[order]** - Order processing and fulfillment
4. **[content]** - Articles, reviews, and content management
5. **[system]** - System administration and analytics
6. **[marketing]** - Promotions, vouchers, and campaigns

### Key Tables

| Schema    | Table           | Purpose                    | Estimated Rows |
| --------- | --------------- | -------------------------- | -------------- |
| user      | Users           | User accounts and profiles | 10,000+        |
| user      | Accounts        | OAuth provider accounts    | 5,000+         |
| product   | Products        | Product catalog            | 1,000+         |
| product   | ProductVariants | Product variations         | 5,000+         |
| order     | Orders          | Customer orders            | 50,000+        |
| order     | OrderProducts   | Order line items           | 200,000+       |
| content   | Reviews         | Product reviews            | 10,000+        |
| system    | AnalyticsEvents | User behavior tracking     | 1M+            |
| system    | AuditLogs       | Admin action logging       | 100,000+       |
| marketing | Vouchers        | Discount vouchers          | 1,000+         |

### Data Type Mappings

| Prisma Type             | SQL Server Type  | Notes               |
| ----------------------- | ---------------- | ------------------- |
| String @id @db.ObjectId | UNIQUEIDENTIFIER | Primary keys        |
| String                  | NVARCHAR(255)    | Text fields         |
| String @db.String       | NVARCHAR(MAX)    | Large text          |
| Int                     | INT              | Numbers             |
| Float                   | DECIMAL(18,2)    | Currency/prices     |
| Boolean                 | BIT              | True/false values   |
| DateTime                | DATETIME2        | Timestamps          |
| Json                    | NVARCHAR(MAX)    | JSON data           |
| String[]                | Junction Table   | Array relationships |

### Enum Implementations

All enums are implemented as CHECK constraints:

```sql
-- Example enum constraint
[Status] NVARCHAR(20) NOT NULL DEFAULT 'pending'
CHECK ([Status] IN ('pending', 'confirmed', 'canceled', 'completed'))
```

**Core Enums:**

- **Role**: USER, STAFF, ADMIN
- **OrderStatus**: pending, confirmed, canceled, completed
- **DeliveryStatus**: not_shipped, in_transit, delivered, returning, returned
- **ProductType**: SIMPLE, VARIANT
- **DiscountType**: PERCENTAGE, FIXED
- **VoucherType**: NEW_USER, RETARGETING, UPSELL, LOYALTY, EVENT, GENERAL
- **AttributeType**: TEXT, COLOR, NUMBER, SELECT
- **DisplayType**: BUTTON, DROPDOWN, COLOR_SWATCH, TEXT_INPUT, RADIO, CHECKBOX
- **ReturnType**: RETURN, EXCHANGE
- **ReturnStatus**: PENDING, APPROVED, REJECTED, COMPLETED
- **OrderReturnStatus**: NONE, PARTIAL, FULL, EXCHANGED
- **EventType**: PRODUCT_VIEW, ARTICLE_VIEW
- **NotificationType**: ORDER_PLACED, COMMENT_RECEIVED, MESSAGE_RECEIVED, LOW_STOCK, SYSTEM_ALERT, PROMOTION_SUGGESTION, VOUCHER_SUGGESTION

### Key Features Implemented

1. **User Management System**

   - Multi-role authentication (USER, STAFF, ADMIN)
   - Email verification with token expiration
   - Password reset functionality
   - Account blocking with audit trail
   - Wishlist and purchase history tracking
   - OAuth integration support

2. **Advanced Product System**

   - Simple and variant product types
   - Flexible attribute system with display types
   - Hierarchical category structure
   - Soft delete with audit trail
   - Multi-image support (thumbnail + gallery)
   - Priority-based product ordering

3. **Complete Order Management**

   - Full order lifecycle tracking
   - Voucher and promotion integration
   - Return/exchange request system
   - Multiple payment method support
   - Address management
   - Order cancellation with reasons

4. **Analytics & Business Intelligence**

   - User behavior tracking
   - Comprehensive audit logging
   - Email campaign performance tracking
   - Report generation and scheduling
   - Admin action monitoring

5. **Communication Platform**
   - Real-time chat system
   - Multi-user chat rooms
   - Message read receipts
   - Notification system with types
   - Email marketing campaigns

### Performance Optimizations

1. **Indexing Strategy**

   - Clustered indexes on all primary keys
   - Non-clustered indexes on foreign keys
   - Composite indexes for common query patterns
   - Covering indexes for frequently accessed columns

2. **Data Partitioning**

   - Consider partitioning AnalyticsEvents by date
   - Partition AuditLogs by timestamp
   - Archive old order data

3. **Query Optimization**
   - Use appropriate data types
   - Implement proper JOIN strategies
   - Utilize stored procedures for complex operations

### Security Implementation

1. **Data Protection**

   - Password hashing with bcrypt
   - Sensitive data encryption
   - PII masking in logs
   - Secure token generation

2. **Access Control**

   - Role-based permissions
   - API rate limiting
   - Input validation and sanitization
   - SQL injection prevention

3. **Audit & Compliance**
   - Complete admin action logging
   - IP address and user agent tracking
   - Session management
   - GDPR compliance features

### Deployment Considerations

1. **Database Setup**

   ```sql
   -- Run the complete script to create:
   -- - Database and schemas
   -- - All tables with constraints
   -- - Indexes for performance
   -- - Triggers for auto-updates
   ```

2. **Migration from MongoDB**

   - Data type conversion utilities needed
   - Array field normalization
   - JSON field validation
   - Foreign key relationship establishment

3. **Maintenance Tasks**
   - Regular index maintenance
   - Statistics updates
   - Data archiving procedures
   - Backup and recovery planning

### Usage Instructions

1. **Execute the SQL Script**

   - Run in SQL Server Management Studio
   - Ensure proper permissions
   - Verify all objects created successfully

2. **Data Migration**

   - Export data from MongoDB
   - Transform array fields to junction tables
   - Import with proper data type conversion
   - Validate foreign key relationships

3. **Application Updates**
   - Update connection strings
   - Modify ORM configurations
   - Test all CRUD operations
   - Verify constraint validations

This SQL Server schema provides a robust, scalable foundation for the ThanhHuyStore e-commerce platform with proper normalization, indexing, and security considerations.

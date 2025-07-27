import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
const nodemailer = require('nodemailer');

export async function POST(request: Request) {
  try {
    console.log('📧 [Marketing Campaign API] Request received');
    const currentUser = await getCurrentUser();

    // Chỉ admin mới có thể gọi API này
    if (!currentUser || currentUser.role !== 'ADMIN') {
      console.log('❌ [Marketing Campaign API] Unauthorized user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      // Campaign configuration
      campaignType = 'NEW_PRODUCT',
      campaignTitle,
      campaignDescription,

      // Product/Content selection
      productId,
      voucherIds = [],

      // Customer targeting
      selectedSegments = ['all'],
      manualMode = false,
      selectedUserIds = [],

      // Debug mode
      debugMode = false
    } = body;

    console.log('📧 [Marketing Campaign API] Request params:', {
      campaignType,
      campaignTitle,
      productId,
      voucherIds: voucherIds?.length || 0,
      selectedSegments,
      manualMode,
      selectedUserIds: selectedUserIds?.length || 0,
      debugMode
    });

    // Validation based on campaign type
    if (campaignType === 'NEW_PRODUCT' && !productId) {
      return NextResponse.json({ error: 'Product ID is required for new product campaigns' }, { status: 400 });
    }

    if (campaignType === 'VOUCHER_PROMOTION' && voucherIds.length === 0) {
      return NextResponse.json({ error: 'Voucher selection is required for voucher campaigns' }, { status: 400 });
    }

    // Debug: Log initial request
    if (debugMode) {
      console.log('🐛 [DEBUG] Campaign Request:', {
        campaignType,
        campaignTitle,
        productId,
        voucherIds: voucherIds?.length || 0,
        selectedSegments,
        manualMode,
        selectedUserIds: selectedUserIds?.length || 0
      });
    }

    // Get product information if needed
    let product = null;
    if (campaignType === 'NEW_PRODUCT' || campaignType === 'CROSS_SELL') {
      product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: true
        }
      });

      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      if (debugMode) {
        console.log('🐛 [DEBUG] Product found:', {
          id: product.id,
          name: product.name,
          categoryId: product.categoryId,
          categoryName: product.category?.name
        });
      }
    }

    // Get target customers based on campaign type and mode
    let interestedUsers: any[] = [];

    if (manualMode && selectedUserIds && selectedUserIds.length > 0) {
      // Manual mode: use selected user IDs
      interestedUsers = await prisma.user.findMany({
        where: {
          id: { in: selectedUserIds },
          role: 'USER',
          email: { not: '' }
        },
        select: {
          id: true,
          name: true,
          email: true
        }
      });

      if (debugMode) {
        console.log('🐛 [DEBUG] Manual mode - Selected users:', {
          selectedCount: selectedUserIds.length,
          foundCount: interestedUsers.length
        });
      }
    } else {
      // Auto mode: get customers based on campaign type and segments
      interestedUsers = await getCustomersBySegments(selectedSegments, productId, campaignType, debugMode);

      if (debugMode) {
        console.log('🐛 [DEBUG] Auto mode - Segmented users:', {
          segments: selectedSegments,
          foundCount: interestedUsers.length
        });
      }
    }

    console.log(`📧 [Send New Product Email API] Found ${interestedUsers.length} interested users`);

    if (interestedUsers.length === 0) {
      console.log('📧 [Send New Product Email API] No users found with interest in this category');
      return NextResponse.json({
        message: 'No users found with interest in this category',
        sentCount: 0
      });
    }

    // Create campaign first for tracking
    let savedCampaign: any = null;
    try {
      const campaignData = {
        campaignType,
        campaignTitle: campaignTitle || `${campaignType} Campaign`,
        campaignDescription,
        productId: productId || null,
        voucherIds: voucherIds || [],
        targetSegments: selectedSegments,
        recipientCount: 0, // Will update after sending
        targetUserIds: manualMode ? selectedUserIds : [],
        sentAt: new Date(),
        clickCount: 0,
        status: 'sending',
        sentBy: currentUser.id
      };

      savedCampaign = await prisma.emailCampaign.create({
        data: campaignData
      });

      console.log(`📊 [Campaign Analytics] Campaign created with ID: ${savedCampaign.id}`);
    } catch (error) {
      console.error('❌ [Campaign Analytics] Failed to create campaign:', error);
      // Continue without tracking if campaign creation fails
    }

    // Gửi email cho từng user
    let sentCount = 0;
    console.log('📧 [Send New Product Email API] Starting to send emails...');

    const emailPromises = interestedUsers.map(async user => {
      try {
        if (campaignType === 'NEW_PRODUCT' || campaignType === 'CROSS_SELL') {
          await sendNewProductEmail(user.email, user.name || 'Khách hàng', product, savedCampaign?.id);
        } else if (campaignType === 'VOUCHER_PROMOTION') {
          await sendVoucherEmail(user.email, user.name || 'Khách hàng', voucherIds, savedCampaign?.id);
        }
        sentCount++;
        console.log(`✅ [Send New Product Email API] Email sent to ${user.email}`);
      } catch (error) {
        console.error(`❌ [Send New Product Email API] Failed to send email to ${user.email}:`, error);
      }
    });

    await Promise.all(emailPromises);

    console.log(`📧 [Send New Product Email API] Completed sending emails: ${sentCount}/${interestedUsers.length}`);

    // Update campaign with final stats
    if (savedCampaign) {
      try {
        await prisma.emailCampaign.update({
          where: { id: savedCampaign.id },
          data: {
            recipientCount: sentCount,
            status: sentCount > 0 ? 'sent' : 'failed'
          }
        });
        console.log(`📊 [Campaign Analytics] Campaign updated with final stats: ${sentCount} emails sent`);
      } catch (error) {
        console.error('❌ [Campaign Analytics] Failed to update campaign stats:', error);
      }
    }

    return NextResponse.json({
      message: `New product emails sent successfully`,
      sentCount,
      totalUsers: interestedUsers.length,
      product: product
        ? {
            id: product.id,
            name: product.name || 'Sản phẩm mới',
            category: product.category?.name || 'Danh mục không xác định'
          }
        : null,
      debug: debugMode
        ? {
            campaignType,
            selectedSegments,
            manualMode,
            totalProcessed: interestedUsers.length
          }
        : undefined
    });
  } catch (error) {
    console.error('Error sending marketing campaign emails:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        debug: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

// Function to get customers by segments
async function getCustomersBySegments(
  segments: string[],
  productId?: string,
  campaignType?: string,
  debugMode?: boolean
) {
  try {
    if (debugMode) {
      console.log('🐛 [DEBUG] getCustomersBySegments called with:', {
        segments,
        productId,
        campaignType
      });
    }

    // If 'all' is selected, return all users
    if (segments.includes('all')) {
      const users = await prisma.user.findMany({
        where: {
          role: 'USER',
          email: { not: '' },
          orders: {
            some: {
              status: 'completed'
            }
          }
        },
        select: {
          id: true,
          name: true,
          email: true
        }
      });

      if (debugMode) {
        console.log('🐛 [DEBUG] Found all users:', users.length);
      }

      return users;
    }

    // Get users with order statistics for segmentation
    const usersWithStats = await prisma.user.findMany({
      where: {
        role: 'USER',
        email: { not: '' },
        orders: {
          some: {
            status: 'completed'
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        createAt: true,
        orders: {
          where: {
            status: 'completed'
          },
          select: {
            amount: true,
            createdAt: true
          }
        }
      }
    });

    // Filter users based on selected segments
    const filteredUsers = usersWithStats.filter(user => {
      const totalSpent = user.orders.reduce((sum, order) => sum + (order.amount || 0), 0);
      const orderCount = user.orders.length;
      const lastOrderDate =
        user.orders.length > 0 ? new Date(Math.max(...user.orders.map(o => new Date(o.createdAt).getTime()))) : null;
      const daysSinceLastOrder = lastOrderDate
        ? Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return segments.some(segmentId => {
        switch (segmentId) {
          case 'vip_customers':
            return totalSpent > 5000000 && orderCount >= 3 && (daysSinceLastOrder === null || daysSinceLastOrder <= 60);
          case 'new_customers':
            return orderCount <= 2 && (daysSinceLastOrder === null || daysSinceLastOrder <= 30);
          case 'at_risk_customers':
            return daysSinceLastOrder !== null && daysSinceLastOrder >= 90 && orderCount >= 1;
          default:
            return false;
        }
      });
    });

    const result = filteredUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email
    }));

    if (debugMode) {
      console.log('🐛 [DEBUG] Filtered users by segments:', {
        totalUsers: usersWithStats.length,
        filteredUsers: result.length,
        segments
      });
    }

    return result;
  } catch (error) {
    console.error('Error in getCustomersBySegments:', error);
    return [];
  }
}

// Function để gửi email voucher
const sendVoucherEmail = async (email: string, userName: string, voucherIds: string[], campaignId?: string) => {
  try {
    // Get voucher information
    const vouchers = await prisma.voucher.findMany({
      where: {
        id: { in: voucherIds },
        isActive: true
      }
    });

    if (vouchers.length === 0) {
      throw new Error('No active vouchers found');
    }

    // Cấu hình transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_API_URL}/unsubscribe?email=${encodeURIComponent(email)}`;

    const voucherCards = vouchers
      .map(
        voucher => `
      <div class="voucher-card">
        <div class="voucher-header">
          <h3>Mã giảm giá: ${voucher.code}</h3>
          <div class="voucher-code">${voucher.code}</div>
        </div>
        <div class="voucher-details">
          <p>${voucher.description || 'Ưu đãi đặc biệt dành cho bạn!'}</p>
          <div class="voucher-value">
            ${
              voucher.discountType === 'PERCENTAGE'
                ? `Giảm ${voucher.discountValue}%`
                : `Giảm ${voucher.discountValue?.toLocaleString('vi-VN')}₫`
            }
          </div>
          ${
            voucher.minOrderValue
              ? `<p class="min-order">Đơn tối thiểu: ${voucher.minOrderValue.toLocaleString('vi-VN')}₫</p>`
              : ''
          }
          <p class="expiry">Có hiệu lực đến: ${new Date(voucher.endDate).toLocaleDateString('vi-VN')}</p>
        </div>
      </div>
    `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ưu đãi đặc biệt từ ThanhHuy Store</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .voucher-card { background: white; border-radius: 10px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-left: 5px solid #ff6b6b; }
          .voucher-header { text-align: center; margin-bottom: 15px; }
          .voucher-code { background: #ff6b6b; color: white; padding: 10px 20px; border-radius: 25px; font-weight: bold; font-size: 18px; display: inline-block; margin: 10px 0; }
          .voucher-value { font-size: 24px; font-weight: bold; color: #e74c3c; margin: 10px 0; text-align: center; }
          .min-order { font-size: 14px; color: #666; text-align: center; }
          .expiry { font-size: 12px; color: #999; text-align: center; font-style: italic; }
          .btn { display: inline-block; background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Ưu đãi đặc biệt dành cho bạn!</h1>
            <p>Xin chào ${userName},</p>
          </div>

          <div class="content">
            <p>Chúng tôi có những ưu đãi tuyệt vời dành riêng cho bạn:</p>

            ${voucherCards}

            <p>Hãy nhanh tay sử dụng các mã giảm giá này trước khi hết hạn!</p>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_API_URL}" class="btn">Mua sắm ngay</a>
            </div>
          </div>

          <div class="footer">
            <p>ThanhHuy Store - Apple Store chính hãng</p>
            <p>Email này được gửi vì bạn là khách hàng thân thiết của chúng tôi</p>
            <p><a href="${unsubscribeUrl}">Hủy đăng ký nhận email</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: `🎁 Ưu đãi đặc biệt dành cho ${userName} - ThanhHuy Store`,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending voucher email:', error);
    throw error;
  }
};

// Function để gửi email sản phẩm mới
const sendNewProductEmail = async (email: string, userName: string, product: any, campaignId?: string) => {
  try {
    // Cấu hình transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    const productUrl = `${process.env.NEXT_PUBLIC_API_URL}/product/${
      product.name?.toLowerCase().replace(/\s+/g, '-') || 'product'
    }-${product.id}`;

    // Create tracked URL if campaignId is provided
    const finalProductUrl = campaignId
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/marketing/tracking/click/${campaignId}?redirect=${encodeURIComponent(
          productUrl
        )}`
      : productUrl;

    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_API_URL}/unsubscribe?email=${encodeURIComponent(email)}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sản phẩm mới từ ThanhHuy Store</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .product-card { background: white; border-radius: 10px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .product-image { width: 100%; max-width: 200px; height: auto; border-radius: 8px; margin: 0 auto; display: block; }
          .price { font-size: 24px; font-weight: bold; color: #e74c3c; margin: 10px 0; }
          .btn { display: inline-block; background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Sản phẩm mới đã có mặt!</h1>
            <p>Xin chào ${userName},</p>
          </div>
          
          <div class="content">
            <p>Chúng tôi vừa ra mắt một sản phẩm mới trong danh mục <strong>${
              product.category?.name || 'sản phẩm tương tự'
            }</strong> mà bạn quan tâm:</p>
            
            <div class="product-card">
              <img src="${
                product.thumbnail ||
                (product.galleryImages && product.galleryImages.length > 0 ? product.galleryImages[0] : '') ||
                '/noavatar.png'
              }" alt="${product.name}" class="product-image" style="max-width: 100%; height: auto; border-radius: 8px;">
              <h2>${product.name || 'Sản phẩm mới'}</h2>
              <p>${product.description || 'Mô tả sản phẩm...'}</p>
              <div class="price">${product.price?.toLocaleString('vi-VN') || '0'}₫</div>
              <a href="${finalProductUrl}" class="btn">Xem chi tiết sản phẩm</a>
            </div>
            
            <p>Đừng bỏ lỡ cơ hội sở hữu sản phẩm mới nhất từ ThanhHuy Store!</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_API_URL}" class="btn">Khám phá thêm sản phẩm</a>
            </div>
          </div>
          
          <div class="footer">
            <p>ThanhHuy Store - Apple Store chính hãng</p>
            <p>Email này được gửi vì bạn đã từng mua sản phẩm trong danh mục ${
              product.category?.name || 'sản phẩm tương tự'
            }</p>
            <p><a href="${unsubscribeUrl}">Hủy đăng ký nhận email</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: `🎉 Sản phẩm mới: ${product.name || 'Sản phẩm mới'} - ThanhHuy Store`,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending new product email:', error);
    throw error;
  }
};

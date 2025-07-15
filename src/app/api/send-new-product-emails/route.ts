import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
const nodemailer = require('nodemailer');

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    // Chỉ admin mới có thể gọi API này
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, timeframe = 'all', manualMode = false, selectedUserIds = [] } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Lấy thông tin sản phẩm mới
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Tính toán thời gian filter dựa trên timeframe
    let timeFilter = {};
    if (timeframe !== 'all') {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (timeframe) {
        case 'recent':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
          endDate = now;
          break;
        case 'medium':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 90);
          endDate = new Date(now);
          endDate.setDate(endDate.getDate() - 30);
          break;
        case 'older':
          endDate = new Date(now);
          endDate.setDate(endDate.getDate() - 90);
          startDate = new Date('2020-01-01'); // Ngày rất xa trong quá khứ
          break;
        default:
          startDate = new Date('2020-01-01');
          endDate = now;
      }

      timeFilter = {
        orders: {
          some: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      };
    }

    // Lấy danh sách user để gửi email
    let interestedUsers;

    if (manualMode && selectedUserIds.length > 0) {
      // Manual mode: get selected users
      interestedUsers = await prisma.user.findMany({
        where: {
          id: { in: selectedUserIds },
          email: { not: '' }
        },
        select: {
          id: true,
          name: true,
          email: true
        }
      });
    } else {
      // Auto mode: get users who bought products in same category
      interestedUsers = await prisma.user.findMany({
        where: {
          purchasedCategories: {
            has: product.category.id
          },
          email: { not: '' },
          ...timeFilter
        },
        select: {
          id: true,
          name: true,
          email: true
        }
      });
    }

    if (interestedUsers.length === 0) {
      return NextResponse.json({
        message: 'No users found with interest in this category',
        sentCount: 0
      });
    }

    // Gửi email cho từng user
    let sentCount = 0;
    const emailPromises = interestedUsers.map(async user => {
      try {
        await sendNewProductEmail(user.email, user.name || 'Khách hàng', product);
        sentCount++;
      } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error);
      }
    });

    await Promise.all(emailPromises);

    return NextResponse.json({
      message: `New product emails sent successfully`,
      sentCount,
      totalUsers: interestedUsers.length,
      product: {
        id: product.id,
        name: product.name,
        category: product.category.name
      }
    });
  } catch (error) {
    console.error('Error sending new product emails:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Function để gửi email sản phẩm mới
const sendNewProductEmail = async (email: string, userName: string, product: any) => {
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

    const productUrl = `${process.env.NEXT_PUBLIC_API_URL}/product/${product.name.toLowerCase().replace(/\s+/g, '-')}-${
      product.id
    }`;
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
              product.category.name
            }</strong> mà bạn quan tâm:</p>
            
            <div class="product-card">
              <img src="${
                product.thumbnail ||
                (product.galleryImages && product.galleryImages.length > 0 ? product.galleryImages[0] : '') ||
                '/noavatar.png'
              }" alt="${product.name}" class="product-image" style="max-width: 100%; height: auto; border-radius: 8px;">
              <h2>${product.name}</h2>
              <p>${product.description}</p>
              <div class="price">${product.price.toLocaleString('vi-VN')}₫</div>
              <a href="${productUrl}" class="btn">Xem chi tiết sản phẩm</a>
            </div>
            
            <p>Đừng bỏ lỡ cơ hội sở hữu sản phẩm mới nhất từ ThanhHuy Store!</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_API_URL}" class="btn">Khám phá thêm sản phẩm</a>
            </div>
          </div>
          
          <div class="footer">
            <p>ThanhHuy Store - Apple Store chính hãng</p>
            <p>Email này được gửi vì bạn đã từng mua sản phẩm trong danh mục ${product.category.name}</p>
            <p><a href="${unsubscribeUrl}">Hủy đăng ký nhận email</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: `🎉 Sản phẩm mới: ${product.name} - ThanhHuy Store`,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending new product email:', error);
    throw error;
  }
};

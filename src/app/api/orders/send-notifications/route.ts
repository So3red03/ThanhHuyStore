import { NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';
import { NotificationService } from '@/app/libs/notifications/notificationService';
import { sendDiscordNotificationIfEnabled } from '@/app/libs/discord/discordNotificationHelper';

const nodemailer = require('nodemailer');

// Function để gửi email
function sendEmail(email: string, content: string) {
  try {
    // Cấu hình transporter
    const transporter = nodemailer.createTransporter({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    const redirectLink = `http://localhost:3000/account/orders`;

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Đặt hàng thành công từ ThanhHuy Store',
      text: `${content} ${redirectLink}`
    };

    // Gửi email
    transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Lỗi khi gửi email:', error);
    throw new Error('Gửi email thất bại');
  }
}

// Function để gửi Discord notification
const sendDiscordNotification = async (orderData: any, currentUser: any) => {
  try {
    const webhookUrl = process.env.DISCORD_ORDER_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('Discord webhook URL not configured');
      return;
    }

    // Format sản phẩm
    const productList = orderData.products
      .map(
        (product: any, index: number) =>
          `${index + 1}. **${product.name}** - Số lượng: ${product.quantity} - Giá: ${product.price.toLocaleString(
            'vi-VN'
          )}₫`
      )
      .join('\n');

    // Tính tổng tiền
    const totalAmount = orderData.amount.toLocaleString('vi-VN');
    const originalAmount = (orderData.originalAmount || orderData.amount).toLocaleString('vi-VN');

    // Format địa chỉ
    const fullAddress = orderData.address
      ? `${orderData.address.line1}, ${orderData.address.city}, ${orderData.address.country}`
      : 'Không có thông tin địa chỉ';

    const embed = {
      title: '🛒 **ĐƠN HÀNG MỚI**',
      color: 0x00ff00, // Màu xanh lá
      fields: [
        {
          name: '👤 **Thông tin khách hàng**',
          value: `**Tên:** ${currentUser.name || 'N/A'}\n**Email:** ${currentUser.email}\n**SĐT:** ${
            orderData.phoneNumber || 'N/A'
          }`,
          inline: false
        },
        {
          name: '📍 **Địa chỉ giao hàng**',
          value: fullAddress,
          inline: false
        },
        {
          name: '🛍️ **Sản phẩm đặt mua**',
          value: productList,
          inline: false
        },
        {
          name: '💰 **Thông tin thanh toán**',
          value: `**Tổng tiền hàng:** ${originalAmount}₫\n**Phí ship:** ${(orderData.shippingFee || 0).toLocaleString(
            'vi-VN'
          )}₫\n**Giảm giá:** ${(orderData.discountAmount || 0).toLocaleString(
            'vi-VN'
          )}₫\n**Tổng thanh toán:** ${totalAmount}₫\n**Phương thức:** ${(
            orderData.paymentMethod || 'COD'
          ).toUpperCase()}`,
          inline: false
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'ThanhHuy Store - Đơn hàng mới'
      }
    };

    // Sử dụng helper function để kiểm tra settings
    await sendDiscordNotificationIfEnabled(webhookUrl, embed);
  } catch (error) {
    console.error('Error sending Discord notification:', error);
  }
};

// Function để cập nhật danh mục đã mua của user
const updateUserPurchasedCategories = async (userId: string, products: any[]) => {
  try {
    // Lấy danh mục từ các sản phẩm đã mua
    const categories = products.map(product => product.category);
    const uniqueCategories = [...new Set(categories)];

    // Lấy danh mục đã mua trước đó của user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { purchasedCategories: true }
    });

    if (user) {
      // Merge với danh mục cũ
      const existingCategories = user.purchasedCategories || [];
      const allCategories = [...new Set([...existingCategories, ...uniqueCategories])];

      // Cập nhật user
      await prisma.user.update({
        where: { id: userId },
        data: { purchasedCategories: allCategories }
      });
    }
  } catch (error) {
    console.error('Error updating user purchased categories:', error);
  }
};

export async function POST(request: Request) {
  try {
    const { orderId, paymentIntentId } = await request.json();

    if (!orderId && !paymentIntentId) {
      return NextResponse.json({ error: 'Missing orderId or paymentIntentId' }, { status: 400 });
    }

    // Tìm order
    const order = await prisma.order.findFirst({
      where: orderId ? { id: orderId } : { paymentIntentId },
      include: {
        user: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Kiểm tra xem đã gửi notifications chưa
    const existingNotification = await prisma.notification.findFirst({
      where: {
        orderId: order.id,
        type: 'ORDER_PLACED'
      }
    });

    if (existingNotification) {
      return NextResponse.json({ message: 'Notifications already sent' });
    }

    // Gửi email xác nhận đơn hàng
    await sendEmail(order.user.email, 'Bấm vào link kế bên để theo dõi đơn hàng: ');

    // Gửi thông báo Discord
    await sendDiscordNotification(order, order.user);

    // Cập nhật danh mục đã mua cho user
    await updateUserPurchasedCategories(order.user.id, order.products);

    // Tạo notification cho admin
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    });

    for (const admin of admins) {
      await NotificationService.createNotification({
        userId: admin.id,
        orderId: order.id,
        fromUserId: order.user.id,
        type: 'ORDER_PLACED',
        title: `Đơn hàng mới (${(order.paymentMethod || 'COD').toUpperCase()})`,
        message: `${order.user.name} vừa đặt đơn hàng ${(order.paymentMethod || 'COD').toUpperCase()}`,
        data: { orderId: order.id, paymentMethod: order.paymentMethod }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications sent successfully',
      orderId: order.id
    });
  } catch (error) {
    console.error('Error sending order notifications:', error);
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
  }
}

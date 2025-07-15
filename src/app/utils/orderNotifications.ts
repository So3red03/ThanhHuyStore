import prisma from '@/app/libs/prismadb';
import { NotificationService } from '@/app/libs/notifications/notificationService';
import { DiscordBotService } from '@/app/libs/discord/discordBotService';
import { NotificationType } from '@prisma/client';

const nodemailer = require('nodemailer');

// Unified Discord notification function for orders
export const sendOrderDiscordNotification = async (orderData: any, currentUser: any) => {
  try {
    console.log('=== DISCORD NOTIFICATION DEBUG ===');
    console.log('orderData.id:', orderData.id);
    console.log('orderData.id type:', typeof orderData.id);
    console.log('orderData keys:', Object.keys(orderData));

    const botService = DiscordBotService.getInstance();

    if (!botService.isConfigured()) {
      console.error('Discord bot not configured');
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
      title: `🛒 **ĐƠN HÀNG MỚI #${orderData.id}**`,
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

    // Create action buttons for order approval
    const approveCustomId = `approve_${orderData.id}`;
    const rejectCustomId = `reject_${orderData.id}`;

    console.log('=== BUTTON CUSTOM_IDS ===');
    console.log('Approve custom_id:', approveCustomId);
    console.log('Reject custom_id:', rejectCustomId);

    const components = [
      {
        type: 1, // Action Row
        components: [
          {
            type: 2, // Button
            style: 3, // Success (Green)
            label: 'CONFIRM',
            custom_id: approveCustomId
          },
          {
            type: 2, // Button
            style: 4, // Danger (Red)
            label: 'CANCEL',
            custom_id: rejectCustomId
          }
        ]
      }
    ];

    // Send message with embed and buttons
    const messageData = {
      embeds: [embed],
      components: components
    };

    console.log('Sending Discord message with components via Bot API:', JSON.stringify(messageData, null, 2));

    // Check if Discord notifications are enabled in settings
    const settings = await prisma.adminSettings.findFirst();
    if (!settings?.discordNotifications) {
      console.log('Discord notifications disabled in settings');
      return;
    }

    // Send via Discord Bot API instead of webhook
    await botService.sendMessage(messageData);
    console.log('Discord order notification sent successfully via Bot API');
  } catch (error) {
    console.error('Error sending Discord notification:', error);
  }
};

// Unified function to update user purchased categories
export const updateUserPurchasedCategories = async (userId: string, products: any[]) => {
  try {
    // Lấy danh mục từ các sản phẩm đã mua (lấy category.id thay vì category object)
    const categories = products.map(product => product.category?.id || product.categoryId).filter(Boolean);
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

// Unified function to send order confirmation email
export const sendOrderConfirmationEmail = async (email: string, content: string) => {
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

    const redirectLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/account/orders`;

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Đặt hàng thành công từ ThanhHuy Store',
      text: `${content} ${redirectLink}`
    };

    // Gửi email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Lỗi khi gửi email:', error);
    throw new Error('Gửi email thất bại');
  }
};

// Unified function to create admin notifications for new orders
export const createAdminOrderNotifications = async (order: any, currentUser: any) => {
  try {
    // Tạo notification cho admin
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    });

    for (const admin of admins) {
      await NotificationService.createNotification({
        userId: admin.id,
        orderId: order.id,
        fromUserId: currentUser.id,
        type: 'ORDER_PLACED',
        title: `Đơn hàng mới (${(order.paymentMethod || 'COD').toUpperCase()})`,
        message: `${currentUser.name || currentUser.email} vừa đặt đơn hàng ${(
          order.paymentMethod || 'COD'
        ).toUpperCase()}`,
        data: { orderId: order.id, paymentMethod: order.paymentMethod }
      });
    }
  } catch (error) {
    console.error('Error creating admin notifications:', error);
  }
};

// Check if notifications already sent to prevent duplicates
export const checkNotificationExists = async (
  orderId: string,
  type: NotificationType = NotificationType.ORDER_PLACED
) => {
  try {
    const existingNotification = await prisma.notification.findFirst({
      where: {
        orderId: orderId,
        type: type
      }
    });
    return !!existingNotification;
  } catch (error) {
    console.error('Error checking notification existence:', error);
    return false;
  }
};

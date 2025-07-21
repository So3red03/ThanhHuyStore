import prisma from '@/app/libs/prismadb';
import { NotificationService } from '@/app/libs/notifications/notificationService';
import { DiscordBotService } from '@/app/libs/discord/discordBotService';
import { NotificationType } from '@prisma/client';

const nodemailer = require('nodemailer');

// Unified Discord notification function for orders
export const sendOrderDiscordNotification = async (orderData: any, currentUser: any) => {
  try {
    const botService = DiscordBotService.getInstance();

    if (!botService.isConfigured()) {
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

    // Check if Discord notifications are enabled in settings
    const settings = await prisma.adminSettings.findFirst();
    if (!settings?.discordNotifications) {
      return;
    }

    // Send via Discord Bot API instead of webhook
    await botService.sendMessage(messageData);
  } catch (error) {
    throw new Error('Gửi thông báo Discord thất bại');
  }
};

// Unified function to update user purchased categories
export const updateUserPurchasedCategories = async (userId: string, products: any[]) => {
  try {
    // Lấy parent category từ các sản phẩm đã mua
    // Xử lý cả 2 trường hợp: CartProductType (category là string) và Product object (có categoryId)
    const parentCategoryIds = [];

    for (const product of products) {
      let categoryId = null;

      if (product.categoryId) {
        // Trường hợp Product object có categoryId
        categoryId = product.categoryId;
      } else if (product.category && typeof product.category === 'string') {
        // Kiểm tra xem category là ObjectId hay category name
        if (product.category.match(/^[0-9a-fA-F]{24}$/)) {
          // Trường hợp category là ObjectId (từ CartProductType)
          categoryId = product.category;
        } else {
          // Trường hợp category là string name - tìm categoryId từ category name
          // Ưu tiên parent category (không có parentId) trước, sau đó mới đến subcategory
          const categoryRecord = await prisma.category.findFirst({
            where: { name: product.category },
            orderBy: [
              { parentId: 'asc' }, // null values first (parent categories)
              { createdAt: 'asc' }
            ]
          });

          if (categoryRecord) {
            categoryId = categoryRecord.id;
          }
        }
      } else if (product.category?.id) {
        // Trường hợp Product object có category relation
        categoryId = product.category.id;
      }

      if (categoryId) {
        // Lấy thông tin category để tìm parent
        const category = await prisma.category.findUnique({
          where: { id: categoryId },
          select: { id: true, parentId: true }
        });

        if (category) {
          if (category.parentId) {
            // Nếu có parent, lưu parent category
            parentCategoryIds.push(category.parentId);
          } else {
            // Nếu không có parent, đây là parent category
            parentCategoryIds.push(category.id);
          }
        }
      }
    }

    const uniqueParentCategories = [...new Set(parentCategoryIds.filter(Boolean))];

    if (uniqueParentCategories.length === 0) {
      return;
    }

    // Lấy danh mục đã mua trước đó của user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { purchasedCategories: true }
    });

    if (user) {
      // Merge với danh mục cũ (chỉ lưu parent categories)
      const existingCategories = user.purchasedCategories || [];
      const allCategories = [...new Set([...existingCategories, ...uniqueParentCategories])];

      // Cập nhật user với parent categories
      await prisma.user.update({
        where: { id: userId },
        data: { purchasedCategories: allCategories }
      });
    }
  } catch (error) {
    throw new Error('Cập nhật danh mục đã mua thất bại');
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
    throw new Error('Tạo thông báo cho admin thất bại');
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
    return false;
  }
};

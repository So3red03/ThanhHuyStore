import prisma from './prismadb';
import { pusherServer } from './pusher';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationData {
  userId?: string;
  productId?: string;
  orderId?: string;
  messageId?: string;
  fromUserId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

export class NotificationService {
  // Tạo notification mới
  static async createNotification(data: CreateNotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          productId: data.productId,
          orderId: data.orderId,
          messageId: data.messageId,
          fromUserId: data.fromUserId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data,
        },
        include: {
          user: true,
          product: true,
          fromUser: true,
        },
      });

      // Gửi realtime notification qua Pusher
      if (data.userId) {
        await pusherServer.trigger(`user-${data.userId}`, 'notification', {
          notification,
          type: 'new_notification',
        });

        // Gửi cho admin channel nếu cần
        if (data.type === 'ORDER_PLACED' || data.type === 'COMMENT_RECEIVED') {
          await pusherServer.trigger('admin-notifications', 'notification', {
            notification,
            type: 'new_notification',
          });
        }
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Lấy notifications cho user
  static async getUserNotifications(userId: string, limit = 20) {
    try {
      return await prisma.notification.findMany({
        where: { userId },
        include: {
          user: true,
          product: true,
          fromUser: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  // Lấy notifications cho admin
  static async getAdminNotifications(limit = 50) {
    try {
      return await prisma.notification.findMany({
        where: {
          OR: [
            { type: 'ORDER_PLACED' },
            { type: 'COMMENT_RECEIVED' },
            { type: 'LOW_STOCK' },
            { type: 'SYSTEM_ALERT' },
          ],
        },
        include: {
          user: true,
          product: true,
          fromUser: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      throw error;
    }
  }

  // Đánh dấu notification đã đọc
  static async markAsRead(notificationId: string) {
    try {
      const notification = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
        include: {
          user: true,
          product: true,
          fromUser: true,
        },
      });

      // Gửi update qua Pusher
      if (notification.userId) {
        await pusherServer.trigger(`user-${notification.userId}`, 'notification', {
          notification,
          type: 'notification_read',
        });
      }

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Đánh dấu tất cả notifications đã đọc
  static async markAllAsRead(userId: string) {
    try {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      // Gửi update qua Pusher
      await pusherServer.trigger(`user-${userId}`, 'notification', {
        type: 'all_notifications_read',
      });

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Đếm số notifications chưa đọc
  static async getUnreadCount(userId: string) {
    try {
      return await prisma.notification.count({
        where: { userId, isRead: false },
      });
    } catch (error) {
      console.error('Error counting unread notifications:', error);
      return 0;
    }
  }

  // Helper methods cho các loại notification cụ thể
  static async createOrderNotification(orderId: string, userId: string, fromUserId?: string) {
    return this.createNotification({
      userId,
      orderId,
      fromUserId,
      type: 'ORDER_PLACED',
      title: 'Đơn hàng mới',
      message: 'Bạn có đơn hàng mới cần xử lý',
      data: { orderId },
    });
  }

  static async createMessageNotification(messageId: string, userId: string, fromUserId: string, message: string) {
    return this.createNotification({
      userId,
      messageId,
      fromUserId,
      type: 'MESSAGE_RECEIVED',
      title: 'Tin nhắn mới',
      message: `Bạn có tin nhắn mới: ${message.substring(0, 50)}...`,
      data: { messageId },
    });
  }

  static async createCommentNotification(productId: string, userId: string, fromUserId: string) {
    return this.createNotification({
      userId,
      productId,
      fromUserId,
      type: 'COMMENT_RECEIVED',
      title: 'Bình luận mới',
      message: 'Sản phẩm của bạn có bình luận mới',
      data: { productId },
    });
  }

  static async createLowStockNotification(productId: string, productName: string, stock: number) {
    // Gửi cho tất cả admin
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
    });

    const notifications = await Promise.all(
      admins.map((admin: any) =>
        this.createNotification({
          userId: admin.id,
          productId,
          type: 'LOW_STOCK',
          title: 'Cảnh báo hết hàng',
          message: `Sản phẩm "${productName}" chỉ còn ${stock} sản phẩm`,
          data: { productId, stock },
        })
      )
    );

    return notifications;
  }
}

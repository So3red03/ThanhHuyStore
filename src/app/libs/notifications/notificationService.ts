import prisma from '../prismadb';
import { pusherServer } from '../pusher';
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
          data: data.data
        },
        include: {
          user: true,
          product: true,
          fromUser: true
        }
      });

      // Gửi realtime notification qua Pusher
      if (data.userId) {
        await pusherServer.trigger(`user-${data.userId}`, 'notification', {
          notification,
          type: 'new_notification'
        });

        // Gửi cho admin channel nếu cần
        if (data.type === 'ORDER_PLACED' || data.type === 'COMMENT_RECEIVED') {
          await pusherServer.trigger('admin-notifications', 'notification', {
            notification,
            type: 'new_notification'
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
  static async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          include: {
            user: true,
            product: true,
            fromUser: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.notification.count({
          where: { userId }
        })
      ]);

      return {
        notifications,
        total,
        hasMore: skip + notifications.length < total
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Đánh dấu notification đã đọc
  static async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.update({
        where: {
          id: notificationId,
          userId: userId
        },
        data: {
          isRead: true
        }
      });

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Đánh dấu tất cả notifications đã đọc
  static async markAllAsRead(userId: string) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId: userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      });

      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Lấy số lượng notifications chưa đọc
  static async getUnreadCount(userId: string) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId: userId,
          isRead: false
        }
      });

      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Xóa notification
  static async deleteNotification(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.delete({
        where: {
          id: notificationId,
          userId: userId
        }
      });

      return notification;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Xóa tất cả notifications của user
  static async deleteAllUserNotifications(userId: string) {
    try {
      const result = await prisma.notification.deleteMany({
        where: { userId: userId }
      });

      return result;
    } catch (error) {
      console.error('Error deleting all user notifications:', error);
      throw error;
    }
  }

  // Tạo notification cho đơn hàng mới
  static async createOrderNotification(orderId: string, userId: string) {
    return this.createNotification({
      userId: userId,
      orderId: orderId,
      type: 'ORDER_PLACED',
      title: 'Đơn hàng mới',
      message: 'Đơn hàng của bạn đã được tạo thành công'
    });
  }

  // Tạo notification cho comment mới
  static async createCommentNotification(productId: string, userId: string, fromUserId: string) {
    return this.createNotification({
      userId: userId,
      productId: productId,
      fromUserId: fromUserId,
      type: 'COMMENT_RECEIVED',
      title: 'Bình luận mới',
      message: 'Có người đã bình luận về sản phẩm của bạn'
    });
  }

  // Tạo notification cho tin nhắn mới
  static async createMessageNotification(messageId: string, userId: string, fromUserId: string) {
    return this.createNotification({
      userId: userId,
      messageId: messageId,
      fromUserId: fromUserId,
      type: 'MESSAGE_RECEIVED',
      title: 'Tin nhắn mới',
      message: 'Bạn có tin nhắn mới'
    });
  }

  // Tạo notification cho cập nhật đơn hàng
  static async createOrderUpdateNotification(orderId: string, userId: string, status: string) {
    const statusMessages: { [key: string]: string } = {
      confirmed: 'Đơn hàng đã được xác nhận',
      shipped: 'Đơn hàng đang được giao',
      delivered: 'Đơn hàng đã được giao thành công',
      canceled: 'Đơn hàng đã bị hủy'
    };

    return this.createNotification({
      userId: userId,
      orderId: orderId,
      type: 'ORDER_PLACED',
      title: 'Cập nhật đơn hàng',
      message: statusMessages[status] || 'Đơn hàng có cập nhật mới'
    });
  }

  // Tạo notification cho khuyến mãi
  static async createPromotionNotification(userId: string, title: string, message: string) {
    return this.createNotification({
      userId: userId,
      type: 'ORDER_PLACED',
      title: title,
      message: message
    });
  }

  // Gửi notification cho tất cả users (broadcast)
  static async broadcastNotification(type: NotificationType, title: string, message: string, data?: any) {
    try {
      // Lấy tất cả user IDs
      const users = await prisma.user.findMany({
        select: { id: true }
      });

      // Tạo notifications cho tất cả users
      const notifications = await Promise.all(
        users.map(user =>
          this.createNotification({
            userId: user.id,
            type,
            title,
            message,
            data
          })
        )
      );

      // Gửi realtime notification cho tất cả
      await pusherServer.trigger('broadcast', 'notification', {
        type: 'broadcast_notification',
        title,
        message,
        data
      });

      return notifications;
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      throw error;
    }
  }

  // Cleanup old notifications (older than 30 days)
  static async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          }
        }
      });

      console.log(`Cleaned up ${result.count} old notifications`);
      return result;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }
}

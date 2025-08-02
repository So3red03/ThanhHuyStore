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

        // Gửi cho admin channel cho tất cả thông báo (trừ AI_ASSISTANT vì đã có riêng)
        if (data.type !== 'AI_ASSISTANT') {
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
      // Kiểm tra xem user có quyền đánh dấu notification này không
      const currentUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!currentUser) {
        throw new Error('User not found');
      }

      // Nếu là admin/staff, có thể đánh dấu bất kỳ notification nào
      // Nếu là user thường, chỉ có thể đánh dấu notification của mình
      const whereCondition: any = { id: notificationId };

      if (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF') {
        whereCondition.userId = userId;
      }

      const notification = await prisma.notification.update({
        where: whereCondition,
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
      // Kiểm tra xem user có quyền đánh dấu tất cả notifications không
      const currentUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!currentUser) {
        throw new Error('User not found');
      }

      // Nếu là admin/staff, có thể đánh dấu tất cả notifications
      // Nếu là user thường, chỉ có thể đánh dấu notifications của mình
      const whereCondition: any = { isRead: false };

      if (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF') {
        whereCondition.userId = userId;
      }

      const result = await prisma.notification.updateMany({
        where: whereCondition,
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

  // ========================================
  // NOTIFICATION SYSTEM - Thông báo sự kiện thực tế
  // ========================================

  // Tạo notification cho đơn hàng mới với context đầy đủ
  static async createOrderNotification(orderId: string, userId: string, orderData?: any) {
    // Get order and customer info
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true, image: true } }
      }
    });

    const customerName = order?.user?.name || 'Khách hàng';
    const orderAmount = order?.amount || 0;
    const productCount = order?.products?.length || 0;

    return this.createNotification({
      userId: userId,
      orderId: orderId,
      type: 'ORDER_PLACED',
      title: '🛒 Đơn hàng mới',
      message: `${customerName} vừa đặt đơn hàng #${orderId.slice(-6)} - ${orderAmount.toLocaleString(
        'vi-VN'
      )}₫ (${productCount} sản phẩm)`,
      data: {
        eventType: 'ORDER_CREATED',
        timestamp: new Date().toISOString(),
        customerName: customerName,
        customerEmail: order?.user?.email,
        customerImage: order?.user?.image,
        orderAmount: orderAmount,
        productCount: productCount,
        orderStatus: order?.status,
        ...orderData
      }
    });
  }

  // Tạo notification cho comment mới với đầy đủ context
  static async createCommentNotification(productId: string, userId: string, fromUserId: string, commentData?: any) {
    // Get product and user info for rich notification
    const [product, fromUser] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
        select: { name: true, thumbnail: true }
      }),
      prisma.user.findUnique({
        where: { id: fromUserId },
        select: { name: true, image: true }
      })
    ]);

    const productName = product?.name || 'Sản phẩm';
    const userName = fromUser?.name || 'Khách hàng';
    const commentText = commentData?.content || commentData?.text || '';

    return this.createNotification({
      userId: userId,
      productId: productId,
      fromUserId: fromUserId,
      type: 'COMMENT_RECEIVED',
      title: '💬 Bình luận mới',
      message: `${userName} vừa bình luận về ${productName}${
        commentText ? `: "${commentText.slice(0, 50)}${commentText.length > 50 ? '...' : ''}"` : ''
      }`,
      data: {
        eventType: 'COMMENT_CREATED',
        timestamp: new Date().toISOString(),
        productName: productName,
        userName: userName,
        userImage: fromUser?.image,
        productThumbnail: product?.thumbnail,
        commentContent: commentText,
        ...commentData
      }
    });
  }

  // Tạo notification cho tin nhắn mới
  static async createMessageNotification(messageId: string, userId: string, fromUserId: string, messageData?: any) {
    return this.createNotification({
      userId: userId,
      messageId: messageId,
      fromUserId: fromUserId,
      type: 'MESSAGE_RECEIVED',
      title: '📨 Tin nhắn mới',
      message: 'Bạn có tin nhắn mới từ khách hàng',
      data: {
        eventType: 'MESSAGE_RECEIVED',
        timestamp: new Date().toISOString(),
        ...messageData
      }
    });
  }

  // Tạo notification cho thanh toán thành công
  static async createPaymentNotification(orderId: string, userId: string, paymentData?: any) {
    return this.createNotification({
      userId: userId,
      orderId: orderId,
      type: 'ORDER_PLACED', // Reuse existing type
      title: '💳 Thanh toán thành công',
      message: `Đơn hàng #${orderId.slice(-6)} đã được thanh toán`,
      data: {
        eventType: 'PAYMENT_SUCCESS',
        timestamp: new Date().toISOString(),
        ...paymentData
      }
    });
  }

  // Tạo notification cho review mới
  static async createReviewNotification(productId: string, userId: string, fromUserId: string, reviewData?: any) {
    return this.createNotification({
      userId: userId,
      productId: productId,
      fromUserId: fromUserId,
      type: 'COMMENT_RECEIVED', // Reuse existing type
      title: '⭐ Đánh giá mới',
      message: 'Có khách hàng vừa đánh giá sản phẩm',
      data: {
        eventType: 'REVIEW_CREATED',
        timestamp: new Date().toISOString(),
        ...reviewData
      }
    });
  }

  // Tạo notification cho system alerts
  static async createSystemNotification(userId: string, title: string, message: string, alertData?: any) {
    return this.createNotification({
      userId: userId,
      type: 'SYSTEM_ALERT',
      title: `⚠️ ${title}`,
      message: message,
      data: {
        eventType: 'SYSTEM_ALERT',
        timestamp: new Date().toISOString(),
        ...alertData
      }
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

      return result;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }
}

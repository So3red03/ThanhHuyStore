import prisma from '../libs/prismadb';
import { ActivityType } from '@prisma/client';

export interface CreateActivityParams {
  userId: string;
  type: ActivityType;
  title: string;
  description?: string;
  data?: any;
}

export default async function createActivity(params: CreateActivityParams) {
  try {
    const { userId, type, title, description, data } = params;

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const activity = await prisma.activity.create({
      data: {
        userId,
        type,
        title,
        description,
        data: data ? JSON.parse(JSON.stringify(data)) : null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    return activity;
  } catch (error: any) {
    console.error('Error creating activity:', error);
    throw error;
  }
}

// Helper functions for specific activity types
export async function createOrderActivity(
  userId: string,
  orderId: string,
  type: 'ORDER_CREATED' | 'ORDER_UPDATED' | 'ORDER_CANCELLED',
  additionalData?: any
) {
  const titles = {
    ORDER_CREATED: 'Đơn hàng được tạo',
    ORDER_UPDATED: 'Cập nhật đơn hàng',
    ORDER_CANCELLED: 'Hủy đơn hàng'
  };

  const descriptions = {
    ORDER_CREATED: `Tài khoản vừa tạo đơn hàng #${orderId}`,
    ORDER_UPDATED: `Đơn hàng #${orderId} vừa được cập nhật`,
    ORDER_CANCELLED: `Đơn hàng #${orderId} đã bị hủy`
  };

  return createActivity({
    userId,
    type,
    title: titles[type],
    description: descriptions[type],
    data: {
      orderId,
      ...additionalData
    }
  });
}

export async function createPaymentActivity(userId: string, orderId: string, amount: number, paymentMethod?: string) {
  return createActivity({
    userId,
    type: 'PAYMENT_SUCCESS',
    title: 'Thanh toán thành công',
    description: `Đã thanh toán đơn hàng #${orderId}`,
    data: {
      orderId,
      amount,
      paymentMethod
    }
  });
}

export async function createReviewActivity(
  userId: string,
  productId: string,
  productName: string,
  rating: number,
  hasComment: boolean = false
) {
  // Đảm bảo productName không null/undefined
  const safeName = productName || 'N/A';

  // Create combined comment_review activity
  return createActivity({
    userId,
    type: 'COMMENT_REVIEW',
    title: hasComment ? 'Bình luận và đánh giá sản phẩm' : 'Đánh giá sản phẩm',
    description: hasComment ? `Đã bình luận và đánh giá sản phẩm ${safeName}` : `Đã đánh giá sản phẩm ${safeName}`,
    data: {
      productId,
      productName: safeName,
      rating,
      hasComment
    }
  });
}

export async function createProfileActivity(
  userId: string,
  type: 'PROFILE_UPDATED' | 'PASSWORD_CHANGED' | 'EMAIL_CHANGED',
  additionalData?: any
) {
  const titles = {
    PROFILE_UPDATED: 'Cập nhật thông tin cá nhân',
    PASSWORD_CHANGED: 'Thay đổi mật khẩu',
    EMAIL_CHANGED: 'Thay đổi email'
  };

  const descriptions = {
    PROFILE_UPDATED: 'Tài khoản vừa cập nhật hồ sơ',
    PASSWORD_CHANGED: 'Tài khoản vừa thay đổi mật khẩu',
    EMAIL_CHANGED: 'Tài khoản vừa thay đổi email'
  };

  return createActivity({
    userId,
    type,
    title: titles[type],
    description: descriptions[type],
    data: additionalData
  });
}

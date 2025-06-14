import prisma from '../libs/prismadb';
import { ActivityType } from '@prisma/client';

export async function seedActivities() {
  try {
    // Get some users to create activities for
    const users = await prisma.user.findMany({
      take: 5,
      include: {
        orders: true
      }
    });

    if (users.length === 0) {
      console.log('No users found to seed activities');
      return;
    }

    const activities = [];

    for (const user of users) {
      // Create some sample activities for each user
      const baseTime = new Date();

      // Order activities
      if (user.orders.length > 0) {
        const order = user.orders[0];

        activities.push({
          userId: user.id,
          type: ActivityType.ORDER_CREATED,
          title: 'Đơn hàng được tạo',
          description: `Tài khoản vừa tạo đơn hàng #${order.id}`,
          data: {
            orderId: order.id,
            amount: order.amount,
            products:
              order.products?.slice(0, 3).map((p: any) => ({
                id: p.id,
                name: p.name,
                image: p.selectedImg?.images?.[0] || '/placeholder.png'
              })) || []
          },
          createdAt: new Date(baseTime.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        });

        if (order.status === 'confirmed' || order.status === 'completed') {
          activities.push({
            userId: user.id,
            type: ActivityType.PAYMENT_SUCCESS,
            title: 'Thanh toán thành công',
            description: `Đã thanh toán đơn hàng #${order.id}`,
            data: {
              orderId: order.id,
              amount: order.amount,
              paymentMethod: order.paymentMethod || 'stripe'
            },
            createdAt: new Date(baseTime.getTime() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000) // 5 minutes after order
          });
        }

        if (order.deliveryStatus === 'in_transit') {
          activities.push({
            userId: user.id,
            type: ActivityType.ORDER_UPDATED,
            title: 'Cập nhật đơn hàng',
            description: `Đơn hàng #${order.id} vừa được cập nhật trạng thái thành "Đang giao hàng"`,
            data: {
              orderId: order.id,
              status: 'Đang giao hàng'
            },
            createdAt: new Date(baseTime.getTime() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
          });
        }
      }

      // Profile activities
      activities.push({
        userId: user.id,
        type: ActivityType.PROFILE_UPDATED,
        title: 'Cập nhật thông tin cá nhân',
        description: 'Tài khoản vừa cập nhật hồ sơ',
        data: {},
        createdAt: new Date(baseTime.getTime() - 7 * 24 * 60 * 60 * 1000) // 1 week ago
      });

      // Comment and Review activities (gộp chung)
      activities.push({
        userId: user.id,
        type: ActivityType.COMMENT_REVIEW,
        title: 'Bình luận và đánh giá sản phẩm',
        description: 'Đã bình luận và đánh giá sản phẩm iPhone 15 Pro',
        data: {
          productName: 'iPhone 15 Pro',
          rating: 5,
          hasComment: true
        },
        createdAt: new Date(baseTime.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      });

      // Review only activity
      activities.push({
        userId: user.id,
        type: ActivityType.COMMENT_REVIEW,
        title: 'Đánh giá sản phẩm',
        description: 'Đã đánh giá sản phẩm MacBook Pro M3',
        data: {
          productName: 'MacBook Pro M3',
          rating: 4,
          hasComment: false
        },
        createdAt: new Date(baseTime.getTime() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      });

      // Password change activity
      activities.push({
        userId: user.id,
        type: ActivityType.PASSWORD_CHANGED,
        title: 'Thay đổi mật khẩu',
        description: 'Tài khoản vừa thay đổi mật khẩu',
        data: {},
        createdAt: new Date(baseTime.getTime() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      });
    }

    // Create all activities
    const createdActivities = await prisma.activity.createMany({
      data: activities
    });

    console.log(`Created ${createdActivities.count} sample activities`);
    return createdActivities;
  } catch (error) {
    console.error('Error seeding activities:', error);
    throw error;
  }
}

// Function to clear all activities (for testing)
export async function clearAllActivities() {
  try {
    const deleted = await prisma.activity.deleteMany({});
    console.log(`Deleted ${deleted.count} activities`);
    return deleted;
  } catch (error) {
    console.error('Error clearing activities:', error);
    throw error;
  }
}

// Function to get activity statistics
export async function getActivityStatistics() {
  try {
    const stats = await prisma.activity.groupBy({
      by: ['type'],
      _count: {
        type: true
      },
      orderBy: {
        _count: {
          type: 'desc'
        }
      }
    });

    const totalActivities = await prisma.activity.count();
    const totalUsers = await prisma.user.count();

    return {
      stats,
      totalActivities,
      totalUsers,
      averageActivitiesPerUser: totalUsers > 0 ? totalActivities / totalUsers : 0
    };
  } catch (error) {
    console.error('Error getting activity statistics:', error);
    throw error;
  }
}

import { useState, useEffect } from 'react';
import { ActivityItem } from './ActivityTimeline';
import { Order, Review, User } from '@prisma/client';
import { ActivityTracker } from './ActivityTracker';

interface UseUserActivitiesProps {
  user: User & {
    orders: Order[];
    reviews?: Review[];
  };
}

export const useUserActivities = ({ user }: UseUserActivitiesProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Không chạy nếu không có user
    if (!user || !user.id) {
      setLoading(false);
      return;
    }
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const tracker = ActivityTracker.getInstance();

        // Lấy activities từ API
        const apiActivities = await tracker.getUserActivities(user.id, 20);

        // Generate activities từ database data
        const generatedActivities = generateActivitiesFromUserData();

        // Combine và remove duplicates
        const allActivities = [...apiActivities, ...generatedActivities];
        const uniqueActivities = allActivities.reduce((acc, current) => {
          const exists = acc.find(
            item =>
              item.type === current.type &&
              item.data?.orderId === current.data?.orderId &&
              Math.abs(item.timestamp.getTime() - current.timestamp.getTime()) < 60000 // Within 1 minute
          );
          if (!exists) {
            acc.push(current);
          }
          return acc;
        }, [] as ActivityItem[]);

        const sortedActivities = uniqueActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        setActivities(sortedActivities);
      } catch (error) {
        console.error('Error fetching activities:', error);
        // Fallback to generated activities
        setActivities(generateActivitiesFromUserData());
      } finally {
        setLoading(false);
      }
    };

    const generateActivitiesFromUserData = (): ActivityItem[] => {
      const activityList: ActivityItem[] = [];

      // Tạo activities từ orders
      user.orders.forEach((order: any) => {
        // Order created
        activityList.push({
          id: `order-created-${order.id}`,
          type: 'order_created',
          title: 'Đơn hàng được tạo',
          description: `Tài khoản này vừa đặt hàng ${order.products?.length || 0} sản phẩm`,
          timestamp: new Date(order.createDate),
          data: {
            orderId: order.id,
            products:
              order.products?.slice(0, 3).map((product: any) => ({
                id: product.id,
                name: product.name,
                image: product.selectedImg?.images?.[0] || '/placeholder.png'
              })) || []
          }
        });

        // Payment success (nếu đã thanh toán)
        if (order.status === 'confirmed' || order.status === 'completed') {
          activityList.push({
            id: `payment-${order.id}`,
            type: 'payment_success',
            title: 'Thanh toán thành công',
            description: `Đã thanh toán đơn hàng #${order.id}`,
            timestamp: new Date(order.createDate.getTime() + 5 * 60 * 1000), // 5 phút sau khi tạo đơn
            data: {
              orderId: order.id,
              amount: order.amount
            }
          });
        }

        // Order cancelled
        if (order.status === 'canceled') {
          activityList.push({
            id: `order-cancelled-${order.id}`,
            type: 'order_cancelled',
            title: 'Hủy đơn hàng',
            description: `Tài khoản vừa hủy đơn hàng #${order.id}`,
            timestamp: new Date(order.createDate.getTime() + 10 * 60 * 1000), // 10 phút sau khi tạo
            data: {
              orderId: order.id
            }
          });
        }

        // Order status updates
        if (order.deliveryStatus === 'in_transit') {
          activityList.push({
            id: `order-updated-${order.id}`,
            type: 'order_updated',
            title: 'Cập nhật đơn hàng',
            description: `Đơn hàng #${order.id} vừa được cập nhật trạng thái thành "Đang giao hàng"`,
            timestamp: new Date(order.createDate.getTime() + 24 * 60 * 60 * 1000), // 1 ngày sau
            data: {
              orderId: order.id,
              status: 'Đang giao hàng'
            }
          });
        }

        if (order.deliveryStatus === 'delivered') {
          activityList.push({
            id: `order-delivered-${order.id}`,
            type: 'order_updated',
            title: 'Giao hàng thành công',
            description: `Đơn hàng #${order.id} đã được giao thành công`,
            timestamp: new Date(order.createDate.getTime() + 48 * 60 * 60 * 1000), // 2 ngày sau
            data: {
              orderId: order.id,
              status: 'Đã giao'
            }
          });
        }
      });

      // Tạo activities từ reviews (gộp comment và review)
      user.reviews?.forEach((review: any) => {
        const hasComment = review.comment && review.comment.trim() !== '';
        activityList.push({
          id: `comment-review-${review.id}`,
          type: 'comment_review',
          title: hasComment ? 'Bình luận và đánh giá sản phẩm' : 'Đánh giá sản phẩm',
          description: hasComment
            ? `Đã bình luận và đánh giá sản phẩm ${review.product?.name || 'N/A'}`
            : `Đã đánh giá sản phẩm ${review.product?.name || 'N/A'}`,
          timestamp: new Date(review.createdDate),
          data: {
            productName: review.product?.name,
            rating: review.rating
          }
        });
      });

      // Thêm một số activities mẫu cho profile updates
      const profileUpdateDate = new Date(user.createAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 tuần sau tạo tài khoản
      activityList.push({
        id: `profile-updated-${user.id}`,
        type: 'profile_updated',
        title: 'Cập nhật thông tin cá nhân',
        description: 'Tài khoản vừa cập nhật hồ sơ',
        timestamp: profileUpdateDate
      });

      return activityList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    };

    fetchActivities();
  }, [user]);

  return { activities, loading };
};

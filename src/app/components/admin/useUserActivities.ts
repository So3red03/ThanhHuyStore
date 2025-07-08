import { useState, useEffect } from 'react';
import { ActivityItem } from './ActivityTimeline';
import { Order, Review, User } from '@prisma/client';
// ActivityTracker class removed - now using AuditLog API directly

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
        // 🚀 NEW: Fetch from AuditLog instead of Activity table
        const response = await fetch(`/api/audit-logs?userId=${user.id}&category=BUSINESS&limit=20`);
        const data = await response.json();

        // Transform AuditLog format → ActivityItem format
        const auditActivities =
          data.auditLogs?.map((log: any) => ({
            id: log.id,
            type: mapEventTypeToActivityType(log.eventType),
            title: log.details?.title || log.description,
            description: log.description,
            timestamp: new Date(log.timestamp),
            data: log.details?.uiData || {}
          })) || [];

        // Generate activities từ database data (keep existing logic)
        const generatedActivities = generateActivitiesFromUserData();

        // Combine và remove duplicates
        const allActivities: ActivityItem[] = [...auditActivities, ...generatedActivities];
        const uniqueActivities = allActivities.reduce((acc: ActivityItem[], current: ActivityItem) => {
          const exists = acc.find(
            (item: ActivityItem) =>
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

    // Map AuditLog eventType to ActivityItem type
    const mapEventTypeToActivityType = (eventType: string): string => {
      const mapping: Record<string, string> = {
        // Phase 1 & 2
        PROFILE_UPDATED: 'profile_updated',
        PASSWORD_CHANGED: 'password_changed',
        PRODUCT_REVIEWED: 'comment_review',
        ORDER_CREATED: 'order_created',
        ORDER_STATUS_CHANGED: 'order_updated',
        ORDER_CANCELLED: 'order_cancelled',
        PAYMENT_SUCCESS: 'payment_success',

        // Phase 3: Complex Events
        USER_REGISTRATION: 'user_registration',
        USER_LOGIN: 'user_login',
        CART_UPDATED: 'cart_updated',
        WISHLIST_UPDATED: 'wishlist_updated',
        NEWSLETTER_SUBSCRIBED: 'newsletter_subscribed',
        SEARCH_PERFORMED: 'search_performed'
      };
      return mapping[eventType] || eventType.toLowerCase();
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
        const productName = review.product?.name || 'N/A';
        activityList.push({
          id: `comment-review-${review.id}`,
          type: 'comment_review',
          title: 'Bình luận và đánh giá sản phẩm',
          description: `Đã bình luận và đánh giá sản phẩm ${productName}`,
          timestamp: new Date(review.createdDate),
          data: {
            productName: productName,
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

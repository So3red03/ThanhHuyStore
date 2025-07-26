import { useState, useEffect, useMemo, useCallback } from 'react';
import { ActivityItem } from '../components/admin/ActivityTimeline';

interface UseUserActivitiesProps {
  user: any; // Simplified to handle serialized data
}

export const useUserActivities = ({ user }: UseUserActivitiesProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Memoize user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);

  // 🚀 OPTIMIZED: Memoize generateActivitiesFromUserData function với better performance
  const generateActivitiesFromUserData = useCallback((): ActivityItem[] => {
    if (!user) return [];

    const activityList: ActivityItem[] = [];

    // 🎯 Helper function để safely get image URL
    const getSafeImageUrl = (product: any): string => {
      if (product.thumbnail && product.thumbnail !== 'placeholder.png') {
        return product.thumbnail;
      }
      if (product.galleryImages && Array.isArray(product.galleryImages) && product.galleryImages.length > 0) {
        const firstImage = product.galleryImages[0];
        if (firstImage && firstImage !== 'placeholder.png') {
          return firstImage;
        }
      }
      if (product.selectedImg?.images?.[0] && product.selectedImg.images[0] !== 'placeholder.png') {
        return product.selectedImg.images[0];
      }
      return '/noavatar.png';
    };

    // 🎯 Helper function để format product data
    const formatProductData = (products: any[]) =>
      products?.slice(0, 3).map((product: any) => ({
        id: product.id,
        name: product.name || 'Unknown Product',
        image: getSafeImageUrl(product)
      })) || [];

    // Tạo activities từ orders (optimized)
    if (user.orders && Array.isArray(user.orders)) {
      user.orders.forEach((order: any) => {
        // Order created
        activityList.push({
          id: `order-created-${order.id}`,
          type: 'order_created',
          title: 'Đơn hàng được tạo',
          description: `Tài khoản này vừa đặt hàng ${order.products?.length || 0} sản phẩm`,
          timestamp: new Date(order.createdAt || order.createDate),
          data: {
            orderId: order.id,
            amount: order.amount,
            status: order.status,
            products: formatProductData(order.products)
          }
        });

        // 🎯 OPTIMIZED: Chỉ tạo activities từ data thực, không fake timestamps
        const orderDate = new Date(order.createdAt || order.createDate);

        // Payment success (chỉ khi có thông tin thanh toán thực)
        if (order.status === 'confirmed' || order.status === 'completed') {
          // Sử dụng updatedAt nếu có, nếu không thì createdAt
          const paymentDate = order.updatedAt ? new Date(order.updatedAt) : orderDate;
          activityList.push({
            id: `payment-${order.id}`,
            type: 'payment_success',
            title: 'Thanh toán thành công',
            description: `Đã thanh toán đơn hàng #${order.id}`,
            timestamp: paymentDate,
            data: {
              orderId: order.id,
              amount: order.amount
            }
          });
        }

        // Order cancelled (chỉ khi thực sự bị hủy)
        if (order.status === 'canceled') {
          const cancelDate = order.updatedAt ? new Date(order.updatedAt) : orderDate;
          activityList.push({
            id: `order-cancelled-${order.id}`,
            type: 'order_cancelled',
            title: 'Hủy đơn hàng',
            description: `Tài khoản vừa hủy đơn hàng #${order.id}`,
            timestamp: cancelDate,
            data: {
              orderId: order.id
            }
          });
        }

        // Order status updates (chỉ khi có delivery status thực)
        if (order.deliveryStatus && order.deliveryStatus !== 'pending') {
          const updateDate = order.updatedAt ? new Date(order.updatedAt) : orderDate;
          let statusText = '';
          let title = '';

          switch (order.deliveryStatus) {
            case 'in_transit':
              statusText = 'Đang giao hàng';
              title = 'Cập nhật đơn hàng';
              break;
            case 'delivered':
              statusText = 'Đã giao';
              title = 'Giao hàng thành công';
              break;
            default:
              statusText = order.deliveryStatus;
              title = 'Cập nhật đơn hàng';
          }

          activityList.push({
            id: `order-status-${order.id}-${order.deliveryStatus}`,
            type: 'order_updated',
            title: title,
            description: `Đơn hàng #${order.id} vừa được cập nhật trạng thái thành "${statusText}"`,
            timestamp: updateDate,
            data: {
              orderId: order.id,
              status: statusText
            }
          });
        }
      });
    }

    // Tạo activities từ reviews (gộp comment và review)
    user.reviews?.forEach((review: any) => {
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

    // 🎯 OPTIMIZED: Chỉ thêm user registration activity từ data thực
    if (user.createAt) {
      const userCreateDate = new Date(user.createAt);
      activityList.push({
        id: `user-registration-${user.id}`,
        type: 'user_registration',
        title: 'Tạo tài khoản',
        description: 'Tài khoản được tạo thành công',
        timestamp: userCreateDate
      });
    }

    // console.log('✅ Generated activities:', activityList.length);
    return activityList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [user]);

  useEffect(() => {
    // Không chạy nếu không có user
    if (!userId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // 🎯 OPTIMIZED: Chỉ dùng data reconstruction (Option 2)
      // Không fetch từ AuditLog nữa vì AuditLog chỉ cho admin actions
      const generatedActivities = generateActivitiesFromUserData();
      setActivities(generatedActivities);
    } catch (error) {
      console.error('Error generating user activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [userId, generateActivitiesFromUserData]); // Depend on userId and the memoized function

  return { activities, loading };
};

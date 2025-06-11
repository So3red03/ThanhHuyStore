import { ActivityItem } from './ActivityTimeline';

export class ActivityTracker {
  private static instance: ActivityTracker;

  private constructor() {}

  public static getInstance(): ActivityTracker {
    if (!ActivityTracker.instance) {
      ActivityTracker.instance = new ActivityTracker();
    }
    return ActivityTracker.instance;
  }

  // Thêm activity mới qua API
  public async addActivity(activity: Omit<ActivityItem, 'id' | 'timestamp'>): Promise<void> {
    try {
      // Kiểm tra userId trước khi gọi API
      if (!activity.data?.userId) {
        console.warn('ActivityTracker: userId is required');
        this.addActivityToStorage(activity);
        return;
      }

      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: activity.data.userId,
          type: this.mapTypeToEnum(activity.type),
          title: activity.title,
          description: activity.description,
          data: activity.data
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create activity');
      }
    } catch (error) {
      console.error('Error creating activity:', error);
      // Fallback to localStorage if API fails
      this.addActivityToStorage(activity);
    }
  }

  // Map frontend types to Prisma enum
  private mapTypeToEnum(type: string): string {
    const mapping: Record<string, string> = {
      order_created: 'ORDER_CREATED',
      order_updated: 'ORDER_UPDATED',
      order_cancelled: 'ORDER_CANCELLED',
      payment_success: 'PAYMENT_SUCCESS',
      comment: 'COMMENT',
      review: 'REVIEW',
      profile_updated: 'PROFILE_UPDATED',
      password_changed: 'PASSWORD_CHANGED',
      email_changed: 'EMAIL_CHANGED'
    };
    return mapping[type] || 'PROFILE_UPDATED';
  }

  // Fallback method for localStorage
  private addActivityToStorage(activity: Omit<ActivityItem, 'id' | 'timestamp'>): void {
    try {
      const stored = localStorage.getItem('user_activities_fallback');
      const activities = stored ? JSON.parse(stored) : [];

      const newActivity: ActivityItem = {
        ...activity,
        id: `activity-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        timestamp: new Date()
      };

      activities.unshift(newActivity);

      // Keep only 50 activities in localStorage
      if (activities.length > 50) {
        activities.splice(50);
      }

      localStorage.setItem('user_activities_fallback', JSON.stringify(activities));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  // Lấy activities của user từ API
  public async getUserActivities(userId: string, limit: number = 20): Promise<ActivityItem[]> {
    try {
      // Kiểm tra userId trước khi gọi API
      if (!userId) {
        console.warn('ActivityTracker: userId is required for getUserActivities');
        return [];
      }

      const response = await fetch(`/api/activities/user/${userId}?limit=${limit}`);
      if (!response.ok) {
        // Nếu 401 Unauthorized, không log error
        if (response.status === 401) {
          console.warn('ActivityTracker: Unauthorized access to user activities');
          return [];
        }
        throw new Error(`Failed to fetch user activities: ${response.status}`);
      }
      const activities = await response.json();
      return this.mapDbActivitiesToItems(activities);
    } catch (error) {
      console.error('Error fetching user activities:', error);
      return this.getFallbackActivities(userId);
    }
  }

  // Lấy tất cả activities từ API
  public async getAllActivities(limit: number = 50): Promise<ActivityItem[]> {
    try {
      const response = await fetch(`/api/activities?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      const activities = await response.json();
      return this.mapDbActivitiesToItems(activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  // Map database activities to ActivityItem format
  private mapDbActivitiesToItems(dbActivities: any[]): ActivityItem[] {
    return dbActivities.map(activity => ({
      id: activity.id,
      type: this.mapEnumToType(activity.type) as ActivityItem['type'],
      title: activity.title,
      description: activity.description,
      timestamp: new Date(activity.createdAt),
      data: activity.data
    }));
  }

  // Map Prisma enum back to frontend types
  private mapEnumToType(enumType: string): string {
    const mapping: Record<string, string> = {
      ORDER_CREATED: 'order_created',
      ORDER_UPDATED: 'order_updated',
      ORDER_CANCELLED: 'order_cancelled',
      PAYMENT_SUCCESS: 'payment_success',
      COMMENT: 'comment',
      REVIEW: 'review',
      PROFILE_UPDATED: 'profile_updated',
      PASSWORD_CHANGED: 'password_changed',
      EMAIL_CHANGED: 'email_changed'
    };
    return mapping[enumType] || 'profile_updated';
  }

  // Fallback to localStorage if API fails
  private getFallbackActivities(userId?: string): ActivityItem[] {
    try {
      const stored = localStorage.getItem('user_activities_fallback');
      if (!stored) return [];

      const activities = JSON.parse(stored).map((activity: any) => ({
        ...activity,
        timestamp: new Date(activity.timestamp)
      }));

      if (userId) {
        return activities.filter((activity: ActivityItem) => activity.data?.userId === userId);
      }

      return activities;
    } catch (error) {
      console.error('Error loading fallback activities:', error);
      return [];
    }
  }

  // Clear all activities (admin only)
  public async clearActivities(): Promise<void> {
    try {
      // Note: This would need an admin API endpoint to clear all activities
      localStorage.removeItem('user_activities_fallback');
    } catch (error) {
      console.error('Error clearing activities:', error);
    }
  }
}

// Helper functions để track các hoạt động cụ thể
export const trackOrderCreated = (userId: string, orderId: string, products: any[]) => {
  const tracker = ActivityTracker.getInstance();
  tracker.addActivity({
    type: 'order_created',
    title: 'Đơn hàng được tạo',
    description: `Tài khoản vừa đặt hàng ${products.length} sản phẩm`,
    data: {
      userId,
      orderId,
      products: products.slice(0, 3).map(product => ({
        id: product.id,
        name: product.name,
        image: product.selectedImg?.images?.[0] || '/placeholder.png'
      }))
    }
  });
};

export const trackOrderUpdated = (userId: string, orderId: string, newStatus: string) => {
  const tracker = ActivityTracker.getInstance();
  const statusText =
    {
      in_transit: 'Đang giao hàng',
      delivered: 'Đã giao',
      returned: 'Đã hoàn trả'
    }[newStatus] || newStatus;

  tracker.addActivity({
    type: 'order_updated',
    title: 'Cập nhật đơn hàng',
    description: `Đơn hàng #${orderId} vừa được cập nhật trạng thái thành "${statusText}"`,
    data: {
      userId,
      orderId,
      status: statusText
    }
  });
};

export const trackOrderCancelled = (userId: string, orderId: string) => {
  const tracker = ActivityTracker.getInstance();
  tracker.addActivity({
    type: 'order_cancelled',
    title: 'Hủy đơn hàng',
    description: `Tài khoản vừa hủy đơn hàng #${orderId}`,
    data: {
      userId,
      orderId
    }
  });
};

export const trackPaymentSuccess = (userId: string, orderId: string, amount: number) => {
  const tracker = ActivityTracker.getInstance();
  tracker.addActivity({
    type: 'payment_success',
    title: 'Thanh toán thành công',
    description: `Đã thanh toán đơn hàng #${orderId}`,
    data: {
      userId,
      orderId,
      amount
    }
  });
};

export const trackProductComment = (userId: string, productName: string) => {
  const tracker = ActivityTracker.getInstance();
  tracker.addActivity({
    type: 'comment',
    title: 'Bình luận sản phẩm',
    description: `Đã bình luận ở sản phẩm ${productName}`,
    data: {
      userId,
      productName
    }
  });
};

export const trackProductReview = (userId: string, productName: string, rating: number) => {
  const tracker = ActivityTracker.getInstance();
  tracker.addActivity({
    type: 'review',
    title: 'Đánh giá sản phẩm',
    description: `Đã đánh giá sản phẩm ${productName}`,
    data: {
      userId,
      productName,
      rating
    }
  });
};

export const trackProfileUpdated = (userId: string) => {
  const tracker = ActivityTracker.getInstance();
  tracker.addActivity({
    type: 'profile_updated',
    title: 'Cập nhật thông tin cá nhân',
    description: 'Tài khoản vừa cập nhật hồ sơ',
    data: {
      userId
    }
  });
};

export const trackPasswordChanged = (userId: string) => {
  const tracker = ActivityTracker.getInstance();
  tracker.addActivity({
    type: 'password_changed',
    title: 'Thay đổi mật khẩu',
    description: 'Tài khoản vừa thay đổi mật khẩu',
    data: {
      userId
    }
  });
};

export const trackEmailChanged = (userId: string, newEmail: string) => {
  const tracker = ActivityTracker.getInstance();
  tracker.addActivity({
    type: 'email_changed',
    title: 'Thay đổi email',
    description: `Tài khoản vừa thay đổi email thành ${newEmail}`,
    data: {
      userId
    }
  });
};

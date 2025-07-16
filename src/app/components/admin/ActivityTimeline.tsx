'use client';

// Helper function to format price
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};
import React, { memo, useCallback, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { FaChartBar, FaCalendarAlt, FaFilter } from 'react-icons/fa';

export interface ActivityItem {
  id: string;
  type:
    | 'order_created'
    | 'order_updated'
    | 'order_cancelled'
    | 'payment_success'
    | 'comment_review'
    | 'profile_updated'
    | 'password_changed'
    | 'email_changed'
    // Phase 3: Complex Events
    | 'user_registration'
    | 'user_login'
    | 'cart_updated'
    | 'wishlist_updated'
    | 'newsletter_subscribed'
    | 'search_performed';
  title: string;
  description?: string;
  timestamp: Date;
  data?: {
    // Existing fields
    userId?: string;
    orderId?: string;
    productName?: string;
    amount?: number;
    status?: string;
    rating?: number;
    paymentIntentId?: string;
    products?: Array<{
      id: string;
      name: string;
      image: string;
    }>;

    // Phase 3: New fields
    registrationMethod?: 'email' | 'google' | 'facebook';
    loginMethod?: 'email' | 'google' | 'facebook';
    deviceInfo?: string;
    action?: 'add' | 'remove' | 'update';
    quantity?: number;
    productId?: string;
    productImage?: string;
    searchQuery?: string;
    resultsCount?: number;
    filters?: Record<string, any>;
    email?: string;
    source?: string;
    hasComment?: boolean;
    comment?: string;
  };
}

interface DateFilter {
  startDate: string;
  endDate: string;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  userName: string;
  showDateFilter?: boolean;
  showActivityCount?: boolean;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  userName,
  showDateFilter = false,
  showActivityCount = true
}) => {
  // 🎯 Date filter state
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    startDate: '',
    endDate: ''
  });

  const formatDate = useCallback((date: Date) => {
    return format(date, "dd 'tháng' M yyyy '|' HH:mm:ss", { locale: vi });
  }, []);

  const getActivityIcon = useCallback((type: string) => {
    switch (type) {
      // Phase 1 & 2 Events
      case 'order_created':
        return '🛒';
      case 'order_updated':
        return '✏️';
      case 'order_cancelled':
        return '❌';
      case 'payment_success':
        return '💳';
      case 'comment_review':
        return '💬⭐';
      case 'profile_updated':
        return '📝';
      case 'password_changed':
        return '🔐';

      // Phase 3: Complex Events
      case 'user_registration':
        return '🎉';
      case 'user_login':
        return '🔑';
      case 'cart_updated':
        return '🛍️';
      case 'wishlist_updated':
        return '❤️';
      case 'newsletter_subscribed':
        return '📧';
      case 'search_performed':
        return '🔍';

      default:
        return '📋';
    }
  }, []);

  const getActivityColor = useCallback((type: string) => {
    switch (type) {
      case 'order_created':
      case 'order_updated':
        return { bg: 'bg-[#E3F6FF]', dot: 'bg-[#16B1FF]' };
      case 'payment_success':
        return { bg: 'bg-[#EAF9E0]', dot: 'bg-[#56CA00]' };
      case 'order_cancelled':
        return { bg: 'bg-[#FFE5E5]', dot: 'bg-[#FF4444]' };
      case 'comment_review':
        return { bg: 'bg-[#FFF4E6]', dot: 'bg-[#FF8C00]' };
      case 'profile_updated':
      case 'password_changed':
      case 'email_changed':
        return { bg: 'bg-[#F3E8FF]', dot: 'bg-[#8B5CF6]' };
      default:
        return { bg: 'bg-[#F5F5F5]', dot: 'bg-[#6B7280]' };
    }
  }, []);

  const renderActivityContent = useCallback(
    (activity: ActivityItem) => {
      switch (activity.type) {
        case 'order_created':
          return (
            <div>
              <p className='text-gray-500 mb-2'>{activity.description}</p>
              {activity.data?.products && (
                <div className='flex mb-2'>
                  {activity.data.products.slice(0, 3).map((product, index) => {
                    // 🎯 IMPROVED: Better image URL handling with multiple fallbacks
                    const getProductImageUrl = (product: any): string => {
                      // Try thumbnail first (main field in schema)
                      if (product.thumbnail && product.thumbnail !== 'placeholder.png' && product.thumbnail !== '') {
                        return product.thumbnail;
                      }

                      // Try image field (from useUserActivities)
                      if (product.image && product.image !== 'placeholder.png' && product.image !== '/noavatar.png') {
                        return product.image;
                      }

                      // Try galleryImages
                      if (
                        product.galleryImages &&
                        Array.isArray(product.galleryImages) &&
                        product.galleryImages.length > 0
                      ) {
                        const firstImage = product.galleryImages[0];
                        if (firstImage && firstImage !== 'placeholder.png' && firstImage !== '') {
                          return firstImage;
                        }
                      }

                      // Try selectedImg (legacy field)
                      if (product.selectedImg?.images?.[0] && product.selectedImg.images[0] !== 'placeholder.png') {
                        return product.selectedImg.images[0];
                      }

                      return '/noavatar.png';
                    };

                    const imageUrl = getProductImageUrl(product);

                    return (
                      <div key={`${product.id}-${index}`} className='relative group'>
                        <img
                          src={imageUrl}
                          alt={product.name || 'Product'}
                          className='w-10 h-10 rounded-full border-2 border-white -ml-2 first:ml-0 object-cover hover:scale-110 transition-transform'
                          onError={e => {
                            console.warn('Image load failed for product:', product.name, 'URL:', imageUrl);
                            e.currentTarget.src = '/noavatar.png';
                          }}
                          title={product.name || 'Product'}
                        />
                      </div>
                    );
                  })}
                  {activity.data.products.length > 3 && (
                    <div className='w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 text-black text-xs -ml-2'>
                      +{activity.data.products.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          );

        case 'payment_success':
          return (
            <div>
              <p className='text-gray-500 mb-2'>
                Đã thanh toán đơn hàng #{activity.data?.paymentIntentId?.slice(-6).toUpperCase()} – tổng tiền{' '}
                {formatPrice(activity.data?.amount || 0)}
              </p>
            </div>
          );

        case 'comment_review':
          return (
            <div>
              <p className='text-gray-500 mb-2'>{activity.description}</p>
              <div className='flex items-center mb-2'>
                <img
                  src='/dog-meme.png'
                  alt={userName}
                  className='w-8 h-8 rounded-full mr-3 object-cover'
                  onError={e => {
                    e.currentTarget.src = '/no-avatar-2.jpg';
                  }}
                />
                <div>
                  <p className='text-sm font-medium'>{userName}</p>
                </div>
              </div>
              {activity.data?.rating && (
                <div className='flex items-center mt-2'>
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-lg ${i < (activity.data?.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ⭐
                    </span>
                  ))}
                  <span className='ml-2 text-sm text-gray-600'>({activity.data?.rating}/5)</span>
                </div>
              )}
            </div>
          );

        // Phase 3: Complex Events UI
        case 'user_registration':
          return (
            <div>
              <p className='text-gray-500 mb-2'>{activity.description}</p>
              {activity.data?.registrationMethod && (
                <div className='flex items-center'>
                  <span className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded'>
                    {activity.data.registrationMethod}
                  </span>
                </div>
              )}
            </div>
          );

        case 'user_login':
          return (
            <div>
              <p className='text-gray-500 mb-2'>{activity.description}</p>
              {activity.data?.deviceInfo && (
                <p className='text-xs text-gray-400'>Thiết bị: {activity.data.deviceInfo}</p>
              )}
            </div>
          );

        case 'cart_updated':
          return (
            <div>
              <p className='text-gray-500 mb-2'>{activity.description}</p>
              {activity.data?.quantity && <p className='text-xs text-gray-600'>Số lượng: {activity.data.quantity}</p>}
            </div>
          );

        case 'wishlist_updated':
          return (
            <div>
              <p className='text-gray-500 mb-2'>{activity.description}</p>
              {activity.data?.productImage && (
                <div className='flex items-center gap-2'>
                  <img
                    src={
                      activity.data.productImage !== 'placeholder.png' ? activity.data.productImage : '/noavatar.png'
                    }
                    alt={activity.data?.productName || 'Product'}
                    className='w-12 h-12 rounded object-cover border border-gray-200'
                    onError={e => {
                      console.warn(
                        'Wishlist image load failed:',
                        activity.data?.productName,
                        'URL:',
                        activity.data?.productImage
                      );
                      e.currentTarget.src = '/noavatar.png';
                    }}
                    title={activity.data?.productName || 'Product'}
                  />
                  {activity.data?.productName && (
                    <span className='text-sm text-gray-600 font-medium'>{activity.data.productName}</span>
                  )}
                </div>
              )}
            </div>
          );

        case 'search_performed':
          return (
            <div>
              <p className='text-gray-500 mb-2'>{activity.description}</p>
              {activity.data?.resultsCount !== undefined && (
                <p className='text-xs text-gray-600'>Kết quả: {activity.data.resultsCount} sản phẩm</p>
              )}
            </div>
          );

        case 'newsletter_subscribed':
          return (
            <div>
              <p className='text-gray-500 mb-2'>{activity.description}</p>
              <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded'>📧 Newsletter</span>
            </div>
          );

        default:
          return <p className='text-gray-500 mb-2'>{activity.description}</p>;
      }
    },
    [userName]
  );

  const getTimeAgo = useCallback(
    (date: Date) => {
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

      if (diffInMinutes < 1) return 'Vừa xong';
      if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours} giờ trước`;

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays} ngày trước`;

      return formatDate(date);
    },
    [formatDate]
  );

  // 🎯 Filter activities by date range
  const filteredActivities = useMemo(() => {
    if (!dateFilter.startDate && !dateFilter.endDate) {
      return activities;
    }

    return activities.filter(activity => {
      const activityDate = activity.timestamp;
      const start = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
      const end = dateFilter.endDate ? new Date(dateFilter.endDate + 'T23:59:59') : null;

      if (start && activityDate < start) return false;
      if (end && activityDate > end) return false;
      return true;
    });
  }, [activities, dateFilter]);

  // 🎯 Activity statistics
  const activityStats = useMemo(() => {
    const stats = {
      total: filteredActivities.length,
      byType: {} as Record<string, number>
    };

    filteredActivities.forEach(activity => {
      stats.byType[activity.type] = (stats.byType[activity.type] || 0) + 1;
    });

    return stats;
  }, [filteredActivities]);

  return (
    <div className='bg-white p-6 pb-10 rounded border border-neutral-200'>
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-x-3'>
          <FaChartBar className='text-2xl text-slate-700' />
          <h2 className='text-lg font-semibold'>Lịch sử hoạt động</h2>
          {showActivityCount && (
            <span className='bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full'>
              {activityStats.total} hoạt động
            </span>
          )}
        </div>

        {showDateFilter && (
          <div className='flex items-center gap-2'>
            <FaCalendarAlt className='text-gray-500' />
            <input
              type='date'
              value={dateFilter.startDate}
              onChange={e => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
              className='px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Từ ngày'
            />
            <span className='text-gray-500'>đến</span>
            <input
              type='date'
              value={dateFilter.endDate}
              onChange={e => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
              className='px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Đến ngày'
            />
            {(dateFilter.startDate || dateFilter.endDate) && (
              <button
                onClick={() => setDateFilter({ startDate: '', endDate: '' })}
                className='px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors'
                title='Xóa bộ lọc'
              >
                <FaFilter className='w-3 h-3' />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Timeline Items */}
      <div className='space-y-6 max-h-80 scroll-bar overflow-y-auto scrollbar-thin scrollbar-thumb-[#c0c0c0] scrollbar-track-transparent'>
        {filteredActivities.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            <span className='text-4xl mb-4 block'>📭</span>
            <p>{activities.length === 0 ? 'Chưa có hoạt động nào' : 'Không có hoạt động trong khoảng thời gian này'}</p>
          </div>
        ) : (
          filteredActivities.map((activity, index) => {
            const colors = getActivityColor(activity.type);
            const isLast = index === filteredActivities.length - 1;

            return (
              <div key={activity.id} className='relative'>
                {!isLast && <div className='absolute left-[7px] top-5 h-full border-l-2 border-neutral-200'></div>}
                <div className='flex items-start mb-2'>
                  <div
                    className={`w-[17.5px] h-[17.5px] ${colors.bg} rounded-full flex items-center justify-center mr-4`}
                  >
                    <div className={`w-3 h-3 ${colors.dot} rounded-full`}></div>
                  </div>
                  <div className='w-full'>
                    <div className='flex justify-between items-center mb-1'>
                      <h3 className='font-medium flex items-center gap-2'>
                        <span>{getActivityIcon(activity.type)}</span>
                        {activity.title}
                      </h3>
                      <span className='text-gray-400 text-sm'>{getTimeAgo(activity.timestamp)}</span>
                    </div>
                    {renderActivityContent(activity)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default memo(ActivityTimeline);

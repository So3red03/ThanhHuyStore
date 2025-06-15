'use client';

import { useState, useEffect } from 'react';
import { ActivityItem } from './ActivityTimeline';
import { ActivityTracker } from './ActivityTracker';
import { formatPrice } from '../../../../utils/formatPrice';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { FaChartBar } from 'react-icons/fa';

interface AllActivitiesTimelineProps {
  limit?: number;
  showUserFilter?: boolean;
}

const AllActivitiesTimeline: React.FC<AllActivitiesTimelineProps> = ({ limit = 50, showUserFilter = false }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchUser, setSearchUser] = useState<string>('');

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const tracker = ActivityTracker.getInstance();
        const allActivities = await tracker.getAllActivities(limit);
        setActivities(allActivities);
        setFilteredActivities(allActivities);
      } catch (error) {
        console.error('Error fetching activities:', error);
        setActivities([]);
        setFilteredActivities([]);
      }
    };

    fetchActivities();
  }, [limit]);

  useEffect(() => {
    let filtered = activities;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(activity => activity.type === selectedType);
    }

    // Filter by user search
    if (searchUser) {
      filtered = filtered.filter(
        activity =>
          activity.data?.userId?.includes(searchUser) ||
          activity.title.toLowerCase().includes(searchUser.toLowerCase()) ||
          activity.description?.toLowerCase().includes(searchUser.toLowerCase())
      );
    }

    setFilteredActivities(filtered);
  }, [activities, selectedType, searchUser]);

  const formatDate = (date: Date) => {
    return format(date, "dd 'tháng' M yyyy '|' HH:mm:ss", { locale: vi });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order_created':
        return '🛒';
      case 'order_updated':
        return '✏️';
      case 'order_cancelled':
        return '❌';
      case 'payment_success':
        return '💳';
      case 'comment':
        return '🗨️';
      case 'review':
        return '🌟';
      case 'profile_updated':
        return '📝';
      case 'password_changed':
        return '🔐';
      case 'email_changed':
        return '📧';
      default:
        return '📋';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'order_created':
      case 'order_updated':
        return { bg: 'bg-[#E3F6FF]', dot: 'bg-[#16B1FF]' };
      case 'payment_success':
        return { bg: 'bg-[#EAF9E0]', dot: 'bg-[#56CA00]' };
      case 'order_cancelled':
        return { bg: 'bg-[#FFE5E5]', dot: 'bg-[#FF4444]' };
      case 'comment':
      case 'review':
        return { bg: 'bg-[#FFF4E6]', dot: 'bg-[#FF8C00]' };
      case 'profile_updated':
      case 'password_changed':
      case 'email_changed':
        return { bg: 'bg-[#F3E8FF]', dot: 'bg-[#8B5CF6]' };
      default:
        return { bg: 'bg-[#F5F5F5]', dot: 'bg-[#6B7280]' };
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;

    return formatDate(date);
  };

  const activityTypes = [
    { value: 'all', label: 'Tất cả' },
    { value: 'order_created', label: 'Đơn hàng mới' },
    { value: 'order_updated', label: 'Cập nhật đơn hàng' },
    { value: 'order_cancelled', label: 'Hủy đơn hàng' },
    { value: 'payment_success', label: 'Thanh toán' },
    { value: 'comment', label: 'Bình luận' },
    { value: 'review', label: 'Đánh giá' },
    { value: 'profile_updated', label: 'Cập nhật hồ sơ' }
  ];

  const clearAllActivities = async () => {
    try {
      const tracker = ActivityTracker.getInstance();
      await tracker.clearActivities();
      setActivities([]);
      setFilteredActivities([]);
    } catch (error) {
      console.error('Error clearing activities:', error);
    }
  };

  return (
    <div className='bg-white p-6 pb-10 rounded border border-neutral-200'>
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-x-3'>
          <FaChartBar className='text-2xl text-slate-700' />
          <h2 className='text-lg font-semibold'>Lịch sử hoạt động</h2>
        </div>
        <button
          onClick={clearAllActivities}
          className='px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600'
        >
          Xóa tất cả
        </button>
      </div>

      {/* Filters */}
      <div className='mb-6 space-y-4'>
        <div className='flex flex-wrap gap-2'>
          {activityTypes.map(type => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`px-3 py-1 text-sm rounded-full border ${
                selectedType === type.value
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {showUserFilter && (
          <div>
            <input
              type='text'
              placeholder='Tìm kiếm theo user ID hoặc nội dung...'
              value={searchUser}
              onChange={e => setSearchUser(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
        )}
      </div>

      {/* Timeline Items */}
      <div className='space-y-6 max-h-96 overflow-y-auto'>
        {filteredActivities.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            <span className='text-4xl mb-4 block'>📭</span>
            <p>Không có hoạt động nào</p>
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
                        {activity.data?.userId && (
                          <span className='text-xs bg-gray-100 px-2 py-1 rounded'>
                            User: {activity.data.userId.slice(0, 8)}...
                          </span>
                        )}
                      </h3>
                      <span className='text-gray-400 text-sm'>{getTimeAgo(activity.timestamp)}</span>
                    </div>
                    <p className='text-gray-500 text-sm'>{activity.description}</p>

                    {/* Additional data display */}
                    {activity.type === 'payment_success' && activity.data?.amount && (
                      <div className='mt-2 text-sm text-green-600 font-medium'>
                        Số tiền: {formatPrice(activity.data.amount)}
                      </div>
                    )}

                    {activity.type === 'comment_review' && activity.data?.rating && (
                      <div className='mt-2 flex items-center'>
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${i < activity.data!.rating! ? 'text-yellow-400' : 'text-gray-300'}`}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                    )}
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

export default AllActivitiesTimeline;

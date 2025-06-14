'use client';

// Helper function to format price
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { FaChartBar } from 'react-icons/fa';

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
    | 'email_changed';
  title: string;
  description?: string;
  timestamp: Date;
  data?: {
    userId?: string;
    orderId?: string;
    productName?: string;
    amount?: number;
    status?: string;
    rating?: number;
    pdfFileId?: string;
    paymentIntentId?: string;
    products?: Array<{
      id: string;
      name: string;
      image: string;
    }>;
  };
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  userName: string;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities, userName }) => {
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
      case 'comment_review':
        return '💬⭐';
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
      case 'comment_review':
        return { bg: 'bg-[#FFF4E6]', dot: 'bg-[#FF8C00]' };
      case 'profile_updated':
      case 'password_changed':
      case 'email_changed':
        return { bg: 'bg-[#F3E8FF]', dot: 'bg-[#8B5CF6]' };
      default:
        return { bg: 'bg-[#F5F5F5]', dot: 'bg-[#6B7280]' };
    }
  };

  const renderActivityContent = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'order_created':
        return (
          <div>
            <p className='text-gray-500 mb-2'>{activity.description}</p>
            {activity.data?.products && (
              <div className='flex mb-2'>
                {activity.data.products.slice(0, 3).map((product, index) => (
                  <img
                    key={index}
                    src={product.image}
                    alt={product.name}
                    className='w-10 h-10 rounded-full border-2 border-white -ml-2 first:ml-0'
                  />
                ))}
                {activity.data.products.length > 3 && (
                  <div className='w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 text-black text-xs -ml-2'>
                    +{activity.data.products.length - 3}
                  </div>
                )}
              </div>
            )}
            {activity.data?.pdfFileId && (
              <div className='flex items-center w-fit bg-neutral-200 p-1 px-3 rounded-md'>
                <img
                  src='https://demos.themeselection.com/materio-vuetify-vuejs-laravel-admin-template/demo-1/build/assets/pdf-tnlsS08R.png'
                  alt='invoice'
                  className='w-5 h-5 mr-2'
                />
                <a
                  href={`/api/pdf/${activity.data.pdfFileId}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-blue-500 hover:underline'
                >
                  invoice.pdf
                </a>
              </div>
            )}
          </div>
        );

      case 'payment_success':
        return (
          <div>
            <p className='text-gray-500 mb-2'>
              Đã thanh toán đơn hàng #{activity.data?.paymentIntentId?.slice(-6).toUpperCase()} – tổng tiền {formatPrice(activity.data?.amount || 0)}
            </p>
            {activity.data?.pdfFileId && (
              <div className='flex items-center w-fit bg-neutral-200 p-1 px-3 rounded-md'>
                <img
                  src='https://demos.themeselection.com/materio-vuetify-vuejs-laravel-admin-template/demo-1/build/assets/pdf-tnlsS08R.png'
                  alt='invoice'
                  className='w-5 h-5 mr-2'
                />
                <a
                  href={`/api/pdf/${activity.data.pdfFileId}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-blue-500 hover:underline'
                >
                  invoice.pdf
                </a>
              </div>
            )}
          </div>
        );

      case 'comment_review':
        return (
          <div>
            <p className='text-gray-500 mb-2'>{activity.description}</p>
            <div className='flex items-center mb-2'>
              <img src='/dog-meme.png' alt={userName} className='w-8 h-8 rounded-full mr-3' />
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

      default:
        return <p className='text-gray-500 mb-2'>{activity.description}</p>;
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

  return (
    <div className='bg-white p-6 pb-10 rounded border border-neutral-200'>
      {/* Header */}
      <div className='flex items-center mb-4 gap-x-3'>
        <FaChartBar className='text-2xl text-slate-700' />
        <h2 className='text-lg font-semibold'>Lịch sử hoạt động</h2>
      </div>

      {/* Timeline Items */}
      <div className='space-y-6'>
        {activities.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            <span className='text-4xl mb-4 block'>📭</span>
            <p>Chưa có hoạt động nào</p>
          </div>
        ) : (
          activities.map((activity, index) => {
            const colors = getActivityColor(activity.type);
            const isLast = index === activities.length - 1;

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

export default ActivityTimeline;

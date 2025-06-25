'use client';

import {
  FaFileInvoiceDollar,
  FaSearchDollar,
  FaUsers,
  FaNewspaper,
  FaExclamationTriangle,
  FaPercentage,
  FaShoppingCart
} from 'react-icons/fa';
import { formatPrice } from '../../../../utils/formatPrice';
import Link from 'next/link';

interface EnhancedDashboardStatsProps {
  ordersCount: number;
  totalRevenue: number;
  clientsCount: number;
  newsData?: any;
  businessAlerts?: any[];
  conversionRate?: number;
  avgOrderValue?: number;
  returnRequestsCount?: number;
}

const EnhancedDashboardStats: React.FC<EnhancedDashboardStatsProps> = ({
  ordersCount,
  totalRevenue,
  clientsCount,
  newsData,
  businessAlerts = [],
  conversionRate = 0,
  avgOrderValue = 0,
  returnRequestsCount = 0
}) => {
  return (
    <div className='space-y-6'>
      {/* Original Stats Row */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4 lg:gap-y-0'>
        {/* Orders Card */}
        <div className='bg-white p-6 rounded-lg border border-gray-200'>
          <div className='flex justify-between items-center'>
            <h3 className='text-gray-500 text-sm 3xl:text-base'>Đơn hàng</h3>
            <Link href={'/admin/manage-orders'} className='hover:underline text-sm text-blue-600 3xl:text-base'>
              View All
            </Link>
          </div>
          <div className='flex justify-center items-center mt-4 gap-4'>
            <div className='p-4 bg-slate-200 rounded-full'>
              <FaFileInvoiceDollar className='text-3xl text-blue-600' />
            </div>
            <div className='flex items-center flex-col'>
              <div className='text-2xl font-bold text-blue-600'>{ordersCount}</div>
              <div className='ml-4 text-green-600'>
                <span className='text-sm'></span>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className='bg-white p-6 rounded-lg border border-gray-200'>
          <h3 className='text-gray-500 text-sm 3xl:text-base'>Doanh Thu</h3>
          <div className='flex justify-center items-center mt-4 gap-4'>
            <div className='p-4 bg-[#e0f8e9] rounded-full'>
              <FaSearchDollar className='text-3xl text-green-600' />
            </div>
            <div className='flex items-center flex-col'>
              <div className='text-2xl font-bold text-green-600'>{formatPrice(totalRevenue)}</div>
              <div className='ml-4 text-green-600'>
                <span className='text-sm'></span>
              </div>
            </div>
          </div>
        </div>

        {/* Clients Card */}
        <div className='bg-white p-6 rounded-lg border border-gray-200 md:col-span-2 lg:col-span-1'>
          <div className='flex justify-between items-center'>
            <h3 className='text-gray-500 text-sm 3xl:text-base'>Khách hàng</h3>
            <Link href={'/admin/manage-users'} className='hover:underline text-orange-600 text-sm 3xl:text-base'>
              View All
            </Link>
          </div>
          <div className='flex justify-center items-center mt-4 gap-4'>
            <div className='p-4 bg-[#ffecdf] rounded-full'>
              <FaUsers className='text-3xl text-orange-600' />
            </div>
            <div className='flex items-center flex-col'>
              <div className='text-2xl font-bold text-orange-600'>{clientsCount}</div>
              <div className='ml-4 text-red-600'>
                <span className='text-sm'></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Row */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4 lg:gap-y-0'>
        {/* News Performance */}
        <div className='bg-white p-6 rounded-lg border border-gray-200'>
          <div className='flex justify-between items-center'>
            <h3 className='text-gray-500 text-sm 3xl:text-base'>Tin tức hôm nay</h3>
            <Link href={'/admin/manage-articles'} className='hover:underline text-sm text-purple-600 3xl:text-base'>
              View All
            </Link>
          </div>
          <div className='flex justify-center items-center mt-4 gap-4'>
            <div className='p-4 bg-purple-100 rounded-full'>
              <FaNewspaper className='text-3xl text-purple-600' />
            </div>
            <div className='flex items-center flex-col'>
              <div className='text-2xl font-bold text-purple-600'>{newsData?.totalViews || 0}</div>
              <div className='text-xs text-gray-500'>lượt đọc</div>
            </div>
          </div>
        </div>

        {/* Conversion Rate */}
        {/* <div className='bg-white p-6 rounded-lg border border-gray-200'>
          <h3 className='text-gray-500 text-sm 3xl:text-base'>Tỷ lệ chuyển đổi</h3>
          <div className='flex justify-center items-center mt-4 gap-4'>
            <div className='p-4 bg-indigo-100 rounded-full'>
              <FaPercentage className='text-3xl text-indigo-600' />
            </div>
            <div className='flex items-center flex-col'>
              <div className='text-2xl font-bold text-indigo-600'>{conversionRate.toFixed(1)}%</div>
              <div className='text-xs text-gray-500'>khách/đơn</div>
            </div>
          </div>
        </div> */}

        {/* Average Order Value */}
        <div className='bg-white p-6 rounded-lg border border-gray-200'>
          <h3 className='text-gray-500 text-sm 3xl:text-base'>Giá trị TB/đơn</h3>
          <div className='flex justify-center items-center mt-4 gap-4'>
            <div className='p-4 bg-teal-100 rounded-full'>
              <FaShoppingCart className='text-3xl text-teal-600' />
            </div>
            <div className='flex items-center flex-col'>
              <div className='text-2xl font-bold text-teal-600'>{formatPrice(avgOrderValue)}</div>
              <div className='text-xs text-gray-500'>VND</div>
            </div>
          </div>
        </div>

        {/* Business Alerts */}
        <div className='bg-white p-6 rounded-lg border border-gray-200'>
          <div className='flex justify-between items-center'>
            <h3 className='text-gray-500 text-sm 3xl:text-base'>Cảnh báo</h3>
            <Link href={'/admin/manage-returns'} className='hover:underline text-sm text-red-600 3xl:text-base'>
              View All
            </Link>
          </div>
          <div className='flex justify-center items-center mt-4 gap-4'>
            <div className='p-4 bg-red-100 rounded-full'>
              <FaExclamationTriangle className='text-3xl text-red-600' />
            </div>
            <div className='flex items-center flex-col'>
              <div className='text-2xl font-bold text-red-600'>{businessAlerts.length}</div>
              <div className='text-xs text-gray-500'>thông báo</div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Alerts Details */}
      {businessAlerts.length > 0 && (
        <div className='bg-white p-4 rounded-lg border border-gray-200'>
          <h4 className='text-sm font-medium text-gray-700 mb-3'>Thông báo quan trọng:</h4>
          <div className='space-y-2'>
            {businessAlerts.slice(0, 3).map((alert, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-2 rounded text-sm ${
                  alert.type === 'warning'
                    ? 'bg-yellow-50 text-yellow-800'
                    : alert.type === 'info'
                    ? 'bg-blue-50 text-blue-800'
                    : 'bg-green-50 text-green-800'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    alert.type === 'warning' ? 'bg-yellow-500' : alert.type === 'info' ? 'bg-blue-500' : 'bg-green-500'
                  }`}
                />
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Articles Today */}
      {newsData?.topArticles && newsData.topArticles.length > 0 && (
        <div className='bg-white p-4 rounded-lg border border-gray-200'>
          <h4 className='text-sm font-medium text-gray-700 mb-3'>Bài viết được đọc nhiều nhất hôm nay:</h4>
          <div className='space-y-2'>
            {newsData.topArticles.slice(0, 3).map((article: any, index: number) => (
              <div key={index} className='flex items-center justify-between p-2 bg-gray-50 rounded text-sm'>
                <span className='truncate flex-1'>{article.title}</span>
                <span className='text-purple-600 font-medium ml-2'>{article.views} lượt đọc</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedDashboardStats;

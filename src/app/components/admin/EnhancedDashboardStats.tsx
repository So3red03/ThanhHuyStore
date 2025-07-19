'use client';

import { FaFileInvoiceDollar, FaSearchDollar, FaUsers, FaExclamationTriangle, FaShoppingCart } from 'react-icons/fa';
import { formatPrice } from '../../../../utils/formatPrice';
import Link from 'next/link';

interface EnhancedDashboardStatsProps {
  ordersCount: number;
  totalRevenue: number;
  clientsCount: number;
  avgOrderValue?: number;
  cancelledOrdersCount?: number;
  cancelledRevenue?: number;
}

const EnhancedDashboardStats: React.FC<EnhancedDashboardStatsProps> = ({
  ordersCount,
  totalRevenue,
  clientsCount,
  avgOrderValue = 0,
  cancelledOrdersCount = 0,
  cancelledRevenue = 0
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
        {/* Cancelled Revenue */}
        <div className='bg-white p-6 rounded-lg border border-gray-200'>
          <div className='flex justify-between items-center'>
            <h3 className='text-gray-500 text-sm 3xl:text-base'>Doanh thu bị hủy</h3>
            <Link href={'/admin/manage-orders'} className='hover:underline text-sm text-red-600 3xl:text-base'>
              View All
            </Link>
          </div>
          <div className='flex justify-center items-center mt-4 gap-4'>
            <div className='p-4 bg-red-100 rounded-full'>
              <FaSearchDollar className='text-3xl text-red-600' />
            </div>
            <div className='flex items-center flex-col'>
              <div className='text-2xl font-bold text-red-600'>{formatPrice(cancelledRevenue)}</div>
              <div className='text-xs text-gray-500'>VND</div>
            </div>
          </div>
        </div>
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

        {/* Cancelled Orders */}
        <div className='bg-white p-6 rounded-lg border border-gray-200'>
          <div className='flex justify-between items-center'>
            <h3 className='text-gray-500 text-sm 3xl:text-base'>Đơn hàng bị hủy</h3>
            <Link href={'/admin/manage-orders'} className='hover:underline text-sm text-red-600 3xl:text-base'>
              View All
            </Link>
          </div>
          <div className='flex justify-center items-center mt-4 gap-4'>
            <div className='p-4 bg-red-100 rounded-full'>
              <FaExclamationTriangle className='text-3xl text-red-600' />
            </div>
            <div className='flex items-center flex-col'>
              <div className='text-2xl font-bold text-red-600'>{cancelledOrdersCount}</div>
              <div className='text-xs text-gray-500'>đơn hàng</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboardStats;

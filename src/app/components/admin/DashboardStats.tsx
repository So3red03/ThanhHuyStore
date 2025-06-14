'use client';

import { FaFileInvoiceDollar, FaSackDollar, FaUsers } from 'react-icons/fa6';
import { formatPrice } from '../../../../utils/formatPrice';
import Link from 'next/link';

interface DashboardStatsProps {
  ordersCount: number;
  totalRevenue: number;
  clientsCount: number;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  ordersCount,
  totalRevenue,
  clientsCount,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6 gap-x-4 gap-y-4 lg:gap-y-0">
      {/* Orders Card */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-gray-500 text-sm 3xl:text-base">Đơn hàng</h3>
          <Link
            href={'/admin/manage-orders'}
            className="hover:underline text-sm text-blue-600 3xl:text-base"
          >
            View All
          </Link>
        </div>
        <div className="flex justify-center items-center mt-4 gap-4">
          <div className="p-4 bg-slate-200 rounded-full">
            <FaFileInvoiceDollar className="text-3xl text-blue-600" />
          </div>
          <div className="flex items-center flex-col">
            <div className="text-2xl font-bold text-blue-600">{ordersCount}</div>
            <div className="ml-4 text-green-600">
              <span className="text-sm"></span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Card */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-gray-500 text-sm 3xl:text-base">Doanh Thu</h3>
        <div className="flex justify-center items-center mt-4 gap-4">
          <div className="p-4 bg-[#e0f8e9] rounded-full">
            <FaSackDollar className="text-3xl text-green-600" />
          </div>
          <div className="flex items-center flex-col">
            <div className="text-2xl font-bold text-green-600">{formatPrice(totalRevenue)}</div>
            <div className="ml-4 text-green-600">
              <span className="text-sm"></span>
            </div>
          </div>
        </div>
      </div>

      {/* Clients Card */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 md:col-span-2 lg:col-span-1">
        <div className="flex justify-between items-center">
          <h3 className="text-gray-500 text-sm 3xl:text-base">Khách hàng</h3>
          <Link
            href={'/admin/manage-users'}
            className="hover:underline text-orange-600 text-sm 3xl:text-base"
          >
            View All
          </Link>
        </div>
        <div className="flex justify-center items-center mt-4 gap-4">
          <div className="p-4 bg-[#ffecdf] rounded-full">
            <FaUsers className="text-3xl text-orange-600" />
          </div>
          <div className="flex items-center flex-col">
            <div className="text-2xl font-bold text-orange-600">{clientsCount}</div>
            <div className="ml-4 text-red-600">
              <span className="text-sm"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;

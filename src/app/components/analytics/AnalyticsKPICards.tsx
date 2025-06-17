'use client';

import { FaEye, FaMousePointer, FaSearch, FaShoppingCart } from 'react-icons/fa';
import { MdArticle } from 'react-icons/md';
import { HiUsers } from 'react-icons/hi';

interface AnalyticsKPICardsProps {
  data: {
    pageViews: number;
    uniqueVisitors: number;
    productViews: number;
    articleViews: number;
    searches: number;
    purchases: number;
  };
}

const AnalyticsKPICards: React.FC<AnalyticsKPICardsProps> = ({ data }) => {
  const kpiCards = [
    {
      title: 'Lượt xem trang',
      value: data.pageViews,
      icon: FaEye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+12%'
    },
    {
      title: 'Khách truy cập',
      value: data.uniqueVisitors,
      icon: HiUsers,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+8%'
    },
    {
      title: 'Xem sản phẩm',
      value: data.productViews,
      icon: FaMousePointer,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: '+15%'
    },
    {
      title: 'Xem bài viết',
      value: data.articleViews,
      icon: MdArticle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: '+5%'
    },
    {
      title: 'Tìm kiếm',
      value: data.searches,
      icon: FaSearch,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      change: '+20%'
    },
    {
      title: 'Mua hàng',
      value: data.purchases,
      icon: FaShoppingCart,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      change: '+3%'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {kpiCards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {card.value.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">{card.change}</p>
              </div>
              <div className={`p-3 rounded-full ${card.bgColor}`}>
                <IconComponent className={`text-xl ${card.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AnalyticsKPICards;

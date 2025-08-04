'use client';

import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { formatPrice } from '../../utils/formatPrice';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface PromotionData {
  id: string;
  title: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  usageCount: number;
  totalDiscount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface PromotionChartProps {
  data: PromotionData[];
  title?: string;
}

const PromotionChart: React.FC<PromotionChartProps> = ({ data, title = 'Top 5 Chương trình khuyến mãi' }) => {
  if (!data || data.length === 0) {
    return (
      <div className='h-80 flex flex-col items-center justify-center text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200'>
        <div className='text-6xl mb-4 opacity-50'>🎫</div>
        <h3 className='text-lg font-semibold text-gray-700 mb-2'>Chưa có dữ liệu voucher</h3>
        <p className='text-sm text-gray-500'>Không có voucher nào được sử dụng trong khoảng thời gian này</p>
      </div>
    );
  }

  // Enhanced gradient colors for better visual appeal
  const gradientColors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  ];

  const solidColors = [
    'rgba(102, 126, 234, 0.8)',
    'rgba(240, 147, 251, 0.8)',
    'rgba(79, 172, 254, 0.8)',
    'rgba(67, 233, 123, 0.8)',
    'rgba(250, 112, 154, 0.8)'
  ];

  const chartData = {
    labels: data.map(item => (item.title.length > 15 ? item.title.substring(0, 15) + '...' : item.title)),
    datasets: [
      {
        label: 'Số lần sử dụng',
        data: data.map(item => item.usageCount),
        backgroundColor: solidColors.slice(0, data.length),
        borderColor: solidColors.slice(0, data.length).map(color => color.replace('0.8', '1')),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: solidColors.slice(0, data.length).map(color => color.replace('0.8', '0.9')),
        hoverBorderWidth: 3
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          title: function (context: any) {
            const dataIndex = context[0].dataIndex;
            return data[dataIndex].title;
          },
          label: function (context: any) {
            const dataIndex = context.dataIndex;
            const item = data[dataIndex];
            return [
              `🎯 Sử dụng: ${item.usageCount} lần`,
              `💰 Tổng giảm giá: ${formatPrice(item.totalDiscount)}`,
              `📊 Loại: ${item.discountType === 'PERCENTAGE' ? 'Phần trăm' : 'Cố định'}`,
              `🏷️ Giá trị: ${
                item.discountType === 'PERCENTAGE' ? item.discountValue + '%' : formatPrice(item.discountValue)
              }`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        border: {
          display: false
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
            weight: 'normal' as const
          },
          maxRotation: 0,
          minRotation: 0
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.04)',
          drawBorder: false
        },
        border: {
          display: false
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11
          },
          callback: function (value: any) {
            return value.toLocaleString();
          },
          padding: 10
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const
    }
  };

  const getRankIcon = (index: number) => {
    const icons = ['🥇', '🥈', '🥉', '🏅', '🎖️'];
    return icons[index] || '🏷️';
  };

  const getDiscountBadge = (type: string, value: number) => {
    const isPercentage = type === 'PERCENTAGE';
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
          isPercentage
            ? 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300'
            : 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300'
        }`}
      >
        {isPercentage ? `${value}%` : formatPrice(value)}
      </span>
    );
  };

  return (
    <div className='h-80'>
      {/* Modern Card Layout */}
      <div className='grid grid-cols-1 lg:grid-cols-5 gap-4 h-full'>
        {/* Chart Section - Takes 3/5 of space */}
        <div className='lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-4'>
          <div className='h-full'>
            <Bar data={chartData} options={options} />
          </div>
        </div>

        {/* Enhanced Stats Section - Takes 2/5 of space */}
        <div className='lg:col-span-2 space-y-2 overflow-y-auto max-h-80'>
          {data.slice(0, 5).map((item, index) => (
            <div
              key={item.id}
              className='group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] p-3'
              style={{
                background: `linear-gradient(135deg, ${solidColors[index]?.replace('0.8', '0.05')} 0%, white 100%)`
              }}
            >
              {/* Rank Badge */}
              <div className='absolute -top-2 -left-2 w-8 h-8 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center text-sm shadow-sm'>
                {getRankIcon(index)}
              </div>

              <div className='ml-4'>
                {/* Header */}
                <div className='flex items-start justify-between mb-2'>
                  <div className='flex-1 pr-2'>
                    <h4 className='font-semibold text-gray-900 text-sm leading-tight line-clamp-2'>{item.title}</h4>
                  </div>
                  <div className='text-right'>
                    <div className='text-lg font-bold text-gray-900'>{item.usageCount}</div>
                    <div className='text-xs text-gray-500'>lượt dùng</div>
                  </div>
                </div>

                {/* Badges */}
                <div className='flex flex-wrap gap-1.5 mb-2'>
                  {getDiscountBadge(item.discountType, item.discountValue)}
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      item.isActive
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-300'
                    }`}
                  >
                    {item.isActive ? '✅ Hoạt động' : '⏸️ Tạm dừng'}
                  </span>
                </div>

                {/* Savings */}
                <div className='text-xs text-gray-600 bg-gray-50 rounded-lg px-2 py-1'>
                  💰 Tiết kiệm: <span className='font-semibold text-gray-800'>{formatPrice(item.totalDiscount)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromotionChart;

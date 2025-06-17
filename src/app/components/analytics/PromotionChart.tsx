'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { formatPrice } from '../../../../utils/formatPrice';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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

const PromotionChart: React.FC<PromotionChartProps> = ({ 
  data, 
  title = 'Top 5 Chương trình khuyến mãi' 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className='bg-white p-6 rounded-lg border border-gray-200 shadow-sm'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>{title}</h3>
        <div className='flex items-center justify-center h-64 text-gray-500'>
          Không có dữ liệu
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.map(item => item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title),
    datasets: [
      {
        label: 'Số lần sử dụng',
        data: data.map(item => item.usageCount),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          title: function(context: any) {
            const dataIndex = context[0].dataIndex;
            return data[dataIndex].title;
          },
          label: function(context: any) {
            const dataIndex = context.dataIndex;
            const item = data[dataIndex];
            return [
              `Sử dụng: ${item.usageCount} lần`,
              `Tổng giảm giá: ${formatPrice(item.totalDiscount)}`,
              `Loại: ${item.discountType === 'PERCENTAGE' ? 'Phần trăm' : 'Cố định'}`,
              `Giá trị: ${item.discountType === 'PERCENTAGE' ? item.discountValue + '%' : formatPrice(item.discountValue)}`
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
            size: 12
          },
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        border: {
          display: false
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12
          },
          callback: function(value: any) {
            return value.toLocaleString();
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  };

  const getDiscountBadge = (type: string, value: number) => {
    const isPercentage = type === 'PERCENTAGE';
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        isPercentage ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
      }`}>
        {isPercentage ? `${value}%` : formatPrice(value)}
      </span>
    );
  };

  return (
    <div className='bg-white p-6 rounded-lg border border-gray-200 shadow-sm'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>{title}</h3>
      
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Chart */}
        <div className='lg:col-span-2 h-64'>
          <Bar data={chartData} options={options} />
        </div>

        {/* Stats */}
        <div className='space-y-3'>
          {data.slice(0, 5).map((item, index) => (
            <div key={item.id} className='p-3 bg-gray-50 rounded-lg'>
              <div className='flex items-start justify-between mb-2'>
                <div className='flex-1'>
                  <p className='font-medium text-gray-900 text-sm leading-tight'>
                    {item.title}
                  </p>
                  <div className='flex items-center gap-2 mt-1'>
                    {getDiscountBadge(item.discountType, item.discountValue)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                    </span>
                  </div>
                </div>
                <div className='text-right ml-2'>
                  <p className='font-bold text-blue-600'>{item.usageCount}</p>
                  <p className='text-xs text-gray-600'>lần sử dụng</p>
                </div>
              </div>
              <div className='text-xs text-gray-600'>
                Tiết kiệm: {formatPrice(item.totalDiscount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromotionChart;

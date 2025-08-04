'use client';

import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { formatPrice } from '../../utils/formatPrice';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface PaymentMethodData {
  method: string;
  count: number;
  amount: number;
  label: string;
  percentage: string;
}

interface PaymentMethodStackedChartProps {
  data: PaymentMethodData[];
  title?: string;
}

const COLORS = {
  cod: '#FF8042',
  stripe: '#6366F1',
  momo: '#EC4899',
  default: '#8884D8'
};

const PaymentMethodStackedChart: React.FC<PaymentMethodStackedChartProps> = ({ data, title }) => {
  if (!data || data.length === 0) {
    return (
      <div className='bg-white p-6 rounded-lg border border-gray-200 shadow-sm'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>{title}</h3>
        <div className='flex items-center justify-center h-64 text-gray-500'>Không có dữ liệu</div>
      </div>
    );
  }

  // Stacked Bar Chart data
  const stackedBarData = {
    labels: ['Phương thức thanh toán'],
    datasets: data.map((item, index) => ({
      label: item.label,
      data: [item.count],
      backgroundColor: COLORS[item.method as keyof typeof COLORS] || COLORS.default,
      borderColor: COLORS[item.method as keyof typeof COLORS] || COLORS.default,
      borderWidth: 1,
      borderRadius: 4,
      borderSkipped: false
    }))
  };

  const stackedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function (context: any) {
            const dataIndex = context.datasetIndex;
            const item = data[dataIndex];
            return [
              `${item.label}: ${item.count} đơn hàng`,
              `Doanh thu: ${formatPrice(item.amount)}`,
              `Tỷ lệ: ${item.percentage}%`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false
        },
        ticks: {
          display: false
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };

  return (
    <div className='bg-white p-6 rounded-lg border border-gray-200 shadow-sm'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>{title}</h3>

      <div className='h-80'>
        <Bar data={stackedBarData} options={stackedBarOptions} />
      </div>

      {/* Summary Stats */}
      <div className='mt-4 grid grid-cols-2 gap-4'>
        <div className='text-center p-3 bg-gray-50 rounded-lg'>
          <div className='text-2xl font-bold text-gray-900'>{data.reduce((sum, item) => sum + item.count, 0)}</div>
          <div className='text-sm text-gray-600'>Tổng đơn hàng</div>
        </div>
        <div className='text-center p-3 bg-gray-50 rounded-lg'>
          <div className='text-2xl font-bold text-green-600'>
            {formatPrice(data.reduce((sum, item) => sum + item.amount, 0))}
          </div>
          <div className='text-sm text-gray-600'>Tổng doanh thu</div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodStackedChart;

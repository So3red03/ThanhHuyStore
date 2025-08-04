'use client';

import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { formatPrice } from '../../utils/formatPrice';
import Image from 'next/image';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PaymentMethodData {
  method: string;
  count: number;
  amount: number;
  label: string;
  percentage: string;
}

interface PaymentMethodChartProps {
  data: PaymentMethodData[];
  title?: string;
}

const COLORS = {
  cod: '#FF8042',
  stripe: '#6366F1',
  momo: '#EC4899',
  default: '#8884D8'
};

const PaymentMethodChart: React.FC<PaymentMethodChartProps> = ({ data, title }) => {
  if (!data || data.length === 0) {
    return (
      <div className='bg-white p-6 rounded-lg border border-gray-200 shadow-sm'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>{title}</h3>
        <div className='flex items-center justify-center h-64 text-gray-500'>Không có dữ liệu</div>
      </div>
    );
  }

  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: data.map(item => COLORS[item.method as keyof typeof COLORS] || COLORS.default),
        borderColor: data.map(item => COLORS[item.method as keyof typeof COLORS] || COLORS.default),
        borderWidth: 2,
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function (context: any) {
            const dataIndex = context.dataIndex;
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
    cutout: '60%'
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'momo':
        return <Image src='/momo.png' alt='MoMo' width={20} height={20} />;
      case 'stripe':
        return <Image src='/stripe-v2-svgrepo-com.svg' alt='Stripe' width={20} height={20} />;
      case 'cod':
        return (
          <Image
            src='https://file.hstatic.net/200000636033/file/pay_2d752907ae604f08ad89868b2a5554da.png'
            alt='COD'
            width={20}
            height={20}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className='bg-white p-6 rounded-lg border border-gray-200 shadow-sm'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>{title}</h3>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Chart */}
        <div className='h-64'>
          <Doughnut data={chartData} options={options} />
        </div>

        {/* Stats */}
        <div className='space-y-4'>
          {data.map((item, index) => (
            <div key={index} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
              <div className='flex items-center gap-3'>
                {getPaymentIcon(item.method)}
                <div>
                  <p className='font-medium text-gray-900'>{item.label}</p>
                  <p className='text-sm text-gray-600'>{item.count} đơn hàng</p>
                </div>
              </div>
              <div className='text-right'>
                <p className='font-semibold text-gray-900'>{item.percentage}%</p>
                <p className='text-sm text-gray-600'>{formatPrice(item.amount)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodChart;

'use client';

import { Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto';

interface DashboardChartsProps {
  salesWeeklyData?: any;
  orderPieData?: any;
  type?: 'bar' | 'pie';
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({
  salesWeeklyData,
  orderPieData,
  type = 'bar',
}) => {
  if (type === 'bar' && salesWeeklyData) {
    return (
      <Bar
        data={salesWeeklyData}
        options={{
          scales: {
            y: {
              beginAtZero: true,
            },
          },
          responsive: true,
          maintainAspectRatio: true,
        }}
      />
    );
  }

  if (type === 'pie' && orderPieData) {
    return (
      <Pie
        data={orderPieData}
        options={{
          maintainAspectRatio: false,
          responsive: true,
        }}
      />
    );
  }

  return null;
};

export default DashboardCharts;

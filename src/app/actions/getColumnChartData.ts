import moment from 'moment';
import 'moment/locale/vi';
import prisma from '../libs/prismadb';
import { OrderStatus } from '@prisma/client';

export default async function getColumnChartData() {
  try {
    const startDate = moment().subtract(6, 'days').startOf('days');
    const endDate = moment().endOf('days');

    // Truy vấn order group by theo createdAt
    const result = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate.toISOString(),
          lte: endDate.toISOString()
        },
        status: OrderStatus.completed
      },
      _sum: {
        amount: true
      }
    });
    // Khởi tạo đối tượng để tổng hợp data theo ngày
    const aggregatedData: {
      [day: string]: { day: string; date: string; totalAmount: number };
    } = {};
    const currentDate = startDate.clone();
    while (currentDate <= endDate) {
      const day = currentDate.format('dddd');
      aggregatedData[day] = {
        day,
        date: currentDate.format('YYYY-MM-DD'),
        totalAmount: 0
      };

      // Move to the next day
      currentDate.add(1, 'day');
    }
    // Calculate the total amount for each day
    result?.forEach(entry => {
      const day = moment((entry as any).createdAt).format('dddd');
      const amount = entry._sum.amount || 0;
      aggregatedData[day].totalAmount += amount;
    });

    // Conver the aggregatedData object to an array and sort it by date
    const formattedData = Object.values(aggregatedData).sort((a, b) => moment(a.date).diff(moment(b.date)));

    return formattedData;
  } catch (error: any) {
    console.error('Error fetching column chart data:', error);
    // Return default data structure for 7 days
    const defaultData = [];
    const startDate = moment().subtract(6, 'days').startOf('days');
    for (let i = 0; i < 7; i++) {
      const currentDate = startDate.clone().add(i, 'day');
      defaultData.push({
        day: currentDate.format('dddd'),
        date: currentDate.format('YYYY-MM-DD'),
        totalAmount: 0
      });
    }
    return defaultData;
  }
}

import moment from 'moment';
import 'moment/locale/vi';
import prisma from '../libs/prismadb';
import { OrderStatus } from '@prisma/client';

export default async function getColumnChartData() {
  try {
    const startDate = moment().subtract(6, 'days').startOf('days');
    const endDate = moment().endOf('days');

    // Fetch completed orders with return requests to filter out returned orders
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate.toISOString(),
          lte: endDate.toISOString()
        },
        status: OrderStatus.completed
      },
      include: {
        returnRequests: {
          where: {
            status: {
              in: ['APPROVED', 'COMPLETED'] // Only include approved/completed return requests
            }
          }
        }
      }
    });

    // Filter out orders with approved/completed return requests
    const validOrders = orders.filter(order => {
      if (order.returnRequests && order.returnRequests.length > 0) {
        console.log(`🔄 [CHART-DATA] Excluding order ${order.id} from chart data due to return request`);
        return false;
      }
      return true;
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
    // Calculate the total amount for each day from valid orders
    validOrders.forEach(order => {
      const day = moment(order.createdAt).format('dddd');
      const amount = order.amount || 0;
      aggregatedData[day].totalAmount += amount;
    });

    console.log(
      `📊 [CHART-DATA] Chart data calculated from ${validOrders.length} valid orders (excluded ${
        orders.length - validOrders.length
      } returned orders)`
    );

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

import { DeliveryStatus, OrderStatus } from '@prisma/client';
import prisma from '../libs/prismadb';

export async function getTotalRevenue() {
  try {
    // Get completed and delivered orders
    const orders = await prisma.order.findMany({
      where: {
        status: OrderStatus.completed,
        deliveryStatus: DeliveryStatus.delivered
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

    // Calculate revenue excluding orders with approved/completed return requests
    let totalRevenue = 0;

    for (const order of orders) {
      // If order has approved/completed return requests, exclude from revenue
      if (order.returnRequests && order.returnRequests.length > 0) {
        console.log(`🔄 [REVENUE] Excluding order ${order.id} from revenue due to return request`);
        continue;
      }

      totalRevenue += order.amount || 0;
    }

    console.log(
      `💰 [REVENUE] Total revenue calculated: ${totalRevenue} (from ${orders.length} orders, excluded ${
        orders.filter(o => o.returnRequests?.length > 0).length
      } returned orders)`
    );

    return totalRevenue;
  } catch (error) {
    console.error('Error calculating total revenue:', error);
    return 0; // Return 0 instead of undefined
  }
}

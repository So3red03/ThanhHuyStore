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

    // Calculate actual revenue = original revenue - refunded amounts
    let totalRevenue = 0;
    let totalRefunded = 0;
    let ordersWithReturns = 0;

    for (const order of orders) {
      const orderRevenue = order.amount || 0;
      let orderRefunded = 0;

      // Calculate total refunded amount for this order
      if (order.returnRequests && order.returnRequests.length > 0) {
        ordersWithReturns++;

        for (const returnRequest of order.returnRequests) {
          // Only count COMPLETED returns for actual refunds
          if (returnRequest.status === 'COMPLETED' && returnRequest.type === 'RETURN') {
            orderRefunded += returnRequest.refundAmount || 0;
          }
        }

        console.log(
          `🔄 [REVENUE] Order ${order.id}: Original ${orderRevenue}, Refunded ${orderRefunded}, Net ${
            orderRevenue - orderRefunded
          }`
        );
      }

      // Add net revenue (original - refunded) to total
      totalRevenue += Math.max(0, orderRevenue - orderRefunded);
      totalRefunded += orderRefunded;
    }

    console.log(
      `💰 [REVENUE] Revenue calculation complete:
      - Total orders: ${orders.length}
      - Orders with returns: ${ordersWithReturns}
      - Gross revenue: ${orders.reduce((sum, o) => sum + (o.amount || 0), 0)}
      - Total refunded: ${totalRefunded}
      - Net revenue: ${totalRevenue}`
    );

    return totalRevenue;
  } catch (error) {
    console.error('Error calculating total revenue:', error);
    return 0; // Return 0 instead of undefined
  }
}

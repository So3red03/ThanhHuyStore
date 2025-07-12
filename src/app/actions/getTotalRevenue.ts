import { DeliveryStatus, OrderStatus } from '@prisma/client';
import prisma from '../libs/prismadb';

export async function getTotalRevenue() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: OrderStatus.completed,
        deliveryStatus: DeliveryStatus.delivered
      }
    });
    return orders.reduce((total: any, order: any) => total + order.amount, 0);
  } catch (error) {
    console.error('Error calculating total revenue:', error);
    return 0; // Return 0 instead of undefined
  }
}

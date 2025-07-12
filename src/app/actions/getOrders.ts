import prisma from '../libs/prismadb';

export async function getOrders() {
  try {
    const orders = await prisma.order.findMany({
      // Lấy tất cả user liên quan đến order
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return orders || [];
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return []; // Return empty array instead of throwing error
  }
}

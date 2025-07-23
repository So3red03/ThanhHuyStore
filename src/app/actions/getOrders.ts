import prisma from '../libs/prismadb';

export async function getOrders() {
  try {
    const orders = await prisma.order.findMany({
      // Lấy tất cả user và return requests liên quan đến order
      include: {
        user: true,
        returnRequests: {
          where: {
            status: {
              in: ['PENDING', 'APPROVED', 'COMPLETED'] // Include all active return requests
            }
          }
        }
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

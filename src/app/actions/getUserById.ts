import prisma from '../libs/prismadb';

export interface IParams {
  userId: string;
}

export async function getUserById(params: IParams) {
  try {
    const { userId } = params;
    if (!userId) {
      throw new Error('Người dùng không tìm thấy');
    }
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      include: {
        orders: true,
        reviews: {
          include: {
            user: true
          },
          orderBy: {
            createdDate: 'desc'
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    // Serialize date fields to avoid serialization issues
    return {
      ...user,
      createAt: user.createAt.toISOString(),
      updateAt: user.updateAt.toISOString(),
      emailVerified: user.emailVerified?.toString() || null,
      lastLogin: user.lastLogin?.toISOString() || null,
      orders: user.orders.map(order => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        cancelDate: order.cancelDate?.toISOString() || null
      }))
    };
  } catch (error: any) {
    throw new Error(error);
  }
}

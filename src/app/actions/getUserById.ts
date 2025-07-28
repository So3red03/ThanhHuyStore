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
        orders: {
          include: {
            voucher: true
          }
        },
        reviews: {
          include: {
            user: true,
            product: {
              select: {
                id: true,
                name: true,
                thumbnail: true
              }
            }
          },
          orderBy: {
            createdDate: 'desc'
          }
        },
        userVouchers: {
          include: {
            voucher: true
          },
          orderBy: {
            usedAt: 'desc'
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
      })),
      reviews: user.reviews.map(review => ({
        ...review,
        createdDate: review.createdDate.toISOString(),
        updatedAt: review.updatedAt?.toISOString() || null
      })),
      userVouchers: user.userVouchers.map(userVoucher => ({
        ...userVoucher,
        createdAt: userVoucher.createdAt.toISOString(),
        usedAt: userVoucher.usedAt?.toISOString() || null,
        reservedAt: userVoucher.reservedAt?.toISOString() || null,
        voucher: {
          ...userVoucher.voucher,
          createdAt: userVoucher.voucher.createdAt.toISOString(),
          updatedAt: userVoucher.voucher.updatedAt.toISOString(),
          startDate: userVoucher.voucher.startDate.toISOString(),
          endDate: userVoucher.voucher.endDate.toISOString()
        }
      }))
    };
  } catch (error: any) {
    throw new Error(error);
  }
}

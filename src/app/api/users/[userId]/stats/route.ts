import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import { getCurrentUser } from '@/app/actions/getCurrentUser';

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const currentUser = await getCurrentUser();

    // Only admin/staff can access user stats
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user basic info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createAt: true,
        lastLogin: true,
        emailVerified: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get orders count and total spent
    const ordersStats = await prisma.order.aggregate({
      where: {
        userId: userId,
        status: 'completed' // ✅ Chỉ tính đơn hàng đã hoàn thành (đã thanh toán)
      },
      _count: {
        id: true
      },
      _sum: {
        amount: true
      }
    });

    // Get reviews count
    const reviewsCount = await prisma.review.count({
      where: {
        userId: userId
      }
    });

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      where: {
        userId: userId
      },
      select: {
        id: true,
        status: true,
        amount: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Calculate customer type based on orders and spending
    let customerType = 'Khách hàng mới';
    const totalOrders = ordersStats._count?.id || 0;
    const totalSpent = ordersStats._sum?.amount || 0;

    if (totalOrders >= 10 || totalSpent >= 5000000) {
      // 5M VND
      customerType = 'Khách hàng VIP';
    } else if (totalOrders >= 5 || totalSpent >= 2000000) {
      // 2M VND
      customerType = 'Khách hàng thân thiết';
    } else if (totalOrders >= 1) {
      customerType = 'Khách hàng quay lại';
    }

    const stats = {
      user: {
        ...user,
        createAt: user.createAt.toISOString(),
        lastLogin: user.lastLogin?.toISOString() || null,
        emailVerified: user.emailVerified?.toString() || null
      },
      orders: {
        total: totalOrders,
        totalSpent: totalSpent,
        recent: recentOrders.map(order => ({
          ...order,
          createdAt: order.createdAt.toISOString()
        }))
      },
      reviews: {
        total: reviewsCount
      },
      customerType,
      summary: {
        joinDate: user.createAt.toISOString(),
        lastActive: user.lastLogin?.toISOString() || user.createAt.toISOString(),
        isActive: user.lastLogin && new Date().getTime() - new Date(user.lastLogin).getTime() < 30 * 24 * 60 * 60 * 1000 // 30 days
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

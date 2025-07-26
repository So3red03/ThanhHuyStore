import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin/staff can access this endpoint
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status && ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'].includes(status)) {
      where.status = status;
    }

    if (type && ['RETURN', 'EXCHANGE'].includes(type)) {
      where.type = type;
    }

    // Get return requests with pagination
    const [returnRequests, total] = await Promise.all([
      prisma.returnRequest.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              amount: true,
              createdAt: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          approver: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.returnRequest.count({ where })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return NextResponse.json({
      success: true,
      returnRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      }
    });
  } catch (error) {
    console.error('Error fetching admin return requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET stats for admin dashboard
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin/staff can access this endpoint
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { action, days, startDate, endDate } = body;

    if (action === 'stats') {
      // Calculate date range for filtering
      let dateFilter = {};
      if (startDate && endDate) {
        // Custom date range
        dateFilter = {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate + 'T23:59:59.999Z') // End of day
          }
        };
      } else if (days) {
        // Days filter
        const endDateCalc = new Date();
        const startDateCalc = new Date();
        startDateCalc.setDate(endDateCalc.getDate() - days);
        dateFilter = {
          createdAt: {
            gte: startDateCalc,
            lte: endDateCalc
          }
        };
      }

      // Get return request statistics with date filtering
      const [
        totalReturns,
        pendingReturns,
        approvedReturns,
        completedReturns,
        rejectedReturns,
        returnsByType,
        recentReturns
      ] = await Promise.all([
        prisma.returnRequest.count({ where: dateFilter }),
        prisma.returnRequest.count({ where: { ...dateFilter, status: 'PENDING' } }),
        prisma.returnRequest.count({ where: { ...dateFilter, status: 'APPROVED' } }),
        prisma.returnRequest.count({ where: { ...dateFilter, status: 'COMPLETED' } }),
        prisma.returnRequest.count({ where: { ...dateFilter, status: 'REJECTED' } }),
        prisma.returnRequest.groupBy({
          by: ['type'],
          where: dateFilter,
          _count: { type: true }
        }),
        prisma.returnRequest.findMany({
          where: dateFilter,
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            order: {
              select: {
                id: true,
                amount: true
              }
            }
          }
        })
      ]);

      // Calculate refund amounts with date filtering
      const totalRefundAmount = await prisma.returnRequest.aggregate({
        where: {
          ...dateFilter,
          status: 'COMPLETED',
          type: 'RETURN'
        },
        _sum: { refundAmount: true }
      });

      const stats = {
        total: totalReturns,
        pending: pendingReturns,
        approved: approvedReturns,
        completed: completedReturns,
        rejected: rejectedReturns,
        byType: returnsByType.reduce((acc: Record<string, number>, item: any) => {
          acc[item.type || 'UNKNOWN'] = item._count.type;
          return acc;
        }, {} as Record<string, number>),
        totalRefundAmount: totalRefundAmount._sum.refundAmount || 0,
        recent: recentReturns
      };

      return NextResponse.json({
        success: true,
        stats
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching return stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

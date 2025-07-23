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
    const { action } = body;

    if (action === 'stats') {
      // Get return request statistics
      const [
        totalReturns,
        pendingReturns,
        approvedReturns,
        completedReturns,
        rejectedReturns,
        returnsByType,
        recentReturns
      ] = await Promise.all([
        prisma.returnRequest.count(),
        prisma.returnRequest.count({ where: { status: 'PENDING' } }),
        prisma.returnRequest.count({ where: { status: 'APPROVED' } }),
        prisma.returnRequest.count({ where: { status: 'COMPLETED' } }),
        prisma.returnRequest.count({ where: { status: 'REJECTED' } }),
        prisma.returnRequest.groupBy({
          by: ['type'],
          _count: { type: true }
        }),
        prisma.returnRequest.findMany({
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

      // Calculate refund amounts
      const totalRefundAmount = await prisma.returnRequest.aggregate({
        where: { status: 'COMPLETED', type: 'RETURN' },
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

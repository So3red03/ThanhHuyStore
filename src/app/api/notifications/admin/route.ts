import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

// GET - Lấy tất cả notifications cho admin với pagination và filters
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const isRead = searchParams.get('isRead') || '';
    const timeFilter = searchParams.get('timeFilter') || '';
    const onlyDeleted = searchParams.get('onlyDeleted') === 'true';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Handle soft delete filtering - exactly like product API
    if (onlyDeleted) {
      where.isDeleted = true;
    } else {
      where.isDeleted = false;
    }

    // Search in title and message
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filter by type
    if (type && type !== 'all') {
      where.type = type;
    }

    // Filter by read status
    if (isRead && isRead !== 'all') {
      where.isRead = isRead === 'true';
    }

    // Filter by time
    if (timeFilter && timeFilter !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (timeFilter) {
        case '1d':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0); // All time
      }

      where.createdAt = {
        gte: startDate
      };
    }

    // Get notifications with pagination and separate stats
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              thumbnail: true
            }
          },
          fromUser: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      }),
      prisma.notification.count({ where }), // Count with current filters
      prisma.notification.count({
        where: {
          ...where,
          isRead: false
        }
      }) // Unread count with current filters
    ]);

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Tạo notification mới (admin only)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, productId, orderId, messageId, type, title, message, data } = body;

    const notification = await prisma.notification.create({
      data: {
        userId,
        productId,
        orderId,
        messageId,
        fromUserId: currentUser.id,
        type,
        title,
        message,
        data
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            thumbnail: true
          }
        },
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Xóa tất cả notifications (admin only)
export async function DELETE(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const isRead = searchParams.get('isRead');

    const where: any = {};

    if (type && type !== 'all') {
      where.type = type;
    }

    if (isRead && isRead !== 'all') {
      where.isRead = isRead === 'true';
    }

    const result = await prisma.notification.deleteMany({
      where
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count
    });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

// GET - Lấy tin nhắn cho admin
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get recent messages from all chatrooms for admin
    const recentMessages = await prisma.message.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        chatroom: {
          select: {
            id: true,
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true
              }
            }
          }
        }
      },
      where: {
        // Only get messages from chatrooms where admin is involved
        // or messages from customers to admin
        chatroom: {
          users: {
            some: {
              OR: [{ role: 'ADMIN' }, { role: 'STAFF' }]
            }
          }
        }
      }
    });

    // Transform messages for admin notification format
    const notifications = recentMessages.map(message => ({
      id: message.id,
      title: `Tin nhắn từ ${message.sender?.name || 'Khách hàng'}`,
      message: message.body || (message.image ? '📷 Hình ảnh' : 'Tin nhắn mới'),
      createdAt: message.createdAt,
      isRead: message.seenIds.includes(currentUser.id),
      sender: message.sender,
      chatroomId: message.chatroomId,
      body: message.body,
      image: message.image
    }));

    return NextResponse.json({
      notifications,
      total: notifications.length,
      hasMore: notifications.length === limit
    });
  } catch (error) {
    console.error('Error fetching admin messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Mark messages as read
export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mark all messages as seen by current admin user
    await prisma.message.updateMany({
      where: {
        chatroom: {
          users: {
            some: {
              OR: [{ role: 'ADMIN' }, { role: 'STAFF' }]
            }
          }
        },
        NOT: {
          seenIds: {
            has: currentUser.id
          }
        }
      },
      data: {
        seenIds: {
          push: currentUser.id
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

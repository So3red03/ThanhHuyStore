import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

// GET - Lấy danh sách conversations cho admin/staff
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get conversations where admin/staff is involved, ordered by latest message
    const conversations = await prisma.chatRoom.findMany({
      take: limit,
      orderBy: {
        lastMessageAt: 'desc'
      },
      where: {
        users: {
          some: {
            OR: [{ role: 'ADMIN' }, { role: 'STAFF' }]
          }
        }
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        },
        messages: {
          take: 10, // Take more messages to calculate unread count
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
            seen: true
          }
        }
      }
    });

    // Filter out conversations without messages
    const conversationsWithMessages = conversations.filter(conv => conv.messages.length > 0);

    return NextResponse.json({
      conversations: conversationsWithMessages,
      total: conversationsWithMessages.length,
      hasMore: conversationsWithMessages.length === limit
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

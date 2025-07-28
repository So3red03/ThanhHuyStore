import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

// PUT - Mark all messages as read for admin
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

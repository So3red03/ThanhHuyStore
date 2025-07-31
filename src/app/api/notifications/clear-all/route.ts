import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow ADMIN and STAFF to clear all notifications
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all admin/staff user IDs first
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'STAFF']
        }
      },
      select: {
        id: true
      }
    });

    const adminUserIds = adminUsers.map(user => user.id);

    // Delete all notifications for admin users
    const result = await prisma.notification.deleteMany({
      where: {
        userId: {
          in: adminUserIds
        }
      }
    });

    console.log(`🗑️ [CLEAR-ALL] Deleted ${result.count} notifications by ${currentUser.name}`);

    return NextResponse.json({
      success: true,
      message: `Đã xóa ${result.count} thông báo`,
      deletedCount: result.count
    });
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

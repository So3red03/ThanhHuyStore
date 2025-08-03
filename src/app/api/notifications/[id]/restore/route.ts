import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { NotificationService } from '@/app/libs/notifications/notificationService';

/**
 * PUT - Khôi phục notification đã xóa
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Restore notification
    const notification = await NotificationService.restoreNotification(params.id, currentUser.id);

    return NextResponse.json({
      message: 'Notification restored successfully',
      notification
    });
  } catch (error) {
    console.error('Error restoring notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

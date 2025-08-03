import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { NotificationService } from '@/app/libs/notifications/notificationService';

/**
 * GET - Lấy danh sách notifications đã xóa
 */
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const result = await NotificationService.getDeletedNotifications(currentUser.id, page, limit);

    return NextResponse.json({
      notifications: result.notifications,
      total: result.total,
      hasMore: result.hasMore,
      page,
      limit
    });
  } catch (error) {
    console.error('Error fetching deleted notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

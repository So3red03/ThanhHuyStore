import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { NotificationService } from '@/app/libs/notifications/notificationService';

interface Params {
  params: {
    id: string;
  };
}

// PUT - Mark notification as read
export async function PUT(request: Request, { params }: Params) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const notification = await NotificationService.markAsRead(id, currentUser.id);
    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

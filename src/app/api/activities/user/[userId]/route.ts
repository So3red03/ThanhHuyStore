import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { getUserActivities } from '@/app/actions/getActivities';

interface IParams {
  userId: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: IParams }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow users to view their own activities, or admins to view anyone's
    if (currentUser.role !== 'ADMIN' && currentUser.id !== params.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const activities = await getUserActivities(params.userId, limit);

    return NextResponse.json(activities);
  } catch (error: any) {
    console.error('[USER_ACTIVITIES_GET]', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

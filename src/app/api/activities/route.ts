import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import getActivities from '@/app/actions/getActivities';
import createActivity from '@/app/actions/createActivity';
import { ActivityType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const type = searchParams.get('type') as ActivityType || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const activities = await getActivities({
      userId,
      type,
      limit,
      offset
    });

    return NextResponse.json(activities);
  } catch (error: any) {
    console.error('[ACTIVITIES_GET]', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, type, title, description, data } = body;

    // Validate required fields
    if (!userId || !type || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Only allow users to create activities for themselves, or admins to create for anyone
    if (currentUser.role !== 'ADMIN' && currentUser.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const activity = await createActivity({
      userId,
      type,
      title,
      description,
      data
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error: any) {
    console.error('[ACTIVITIES_POST]', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

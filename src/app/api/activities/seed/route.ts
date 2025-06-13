import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { seedActivities, clearAllActivities, getActivityStatistics } from '@/app/actions/seedActivities';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'seed':
        const seeded = await seedActivities();
        return NextResponse.json({
          message: 'Activities seeded successfully',
          count: seeded?.count || 0
        });

      case 'clear':
        const cleared = await clearAllActivities();
        return NextResponse.json({
          message: 'All activities cleared',
          count: cleared?.count || 0
        });

      case 'stats':
        const stats = await getActivityStatistics();
        return NextResponse.json(stats);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[ACTIVITIES_SEED]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

/**
 * GET /api/audit-logs
 * Public endpoint for user activities (non-admin)
 * Used by ActivityTimeline to fetch user's own activities
 */
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Security: Users can only access their own activities
    // Admins can access any user's activities
    if (currentUser.role !== 'ADMIN' && userId !== currentUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build filter conditions
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (category) {
      where.category = category;
    }

    // Only return user activities (not admin/security events)
    if (currentUser.role !== 'ADMIN') {
      where.category = 'BUSINESS'; // User activities are business events
    }

    // Fetch audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
      select: {
        id: true,
        eventType: true,
        category: true,
        severity: true,
        userId: true,
        description: true,
        details: true,
        timestamp: true
      }
    });

    return NextResponse.json({
      success: true,
      auditLogs,
      count: auditLogs.length
    });

  } catch (error) {
    console.error('[AUDIT_LOGS_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

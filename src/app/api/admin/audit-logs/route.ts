import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const eventType = searchParams.get('eventType');
    const category = searchParams.get('category');
    const severity = searchParams.get('severity');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const resourceType = searchParams.get('resourceType');

    // Build filter conditions
    const where: any = {};

    if (eventType && eventType !== 'all') {
      where.eventType = eventType;
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    if (severity && severity !== 'all') {
      where.severity = severity;
    }

    if (userId) {
      where.userId = userId;
    }

    if (resourceType && resourceType !== 'all') {
      where.resourceType = resourceType;
    }

    // Date range filter
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // End of day
        where.timestamp.lte = end;
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.auditLog.count({ where });

    // Get audit logs with pagination
    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    // Note: We don't log "viewed audit logs" as it's not a critical action
    // Only log important admin actions like CRUD operations

    return NextResponse.json({
      auditLogs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST endpoint to create test audit data
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'clearViewLogs') {
      // Clear old "Admin viewed" logs that are not needed
      const result = await prisma.auditLog.deleteMany({
        where: {
          description: { contains: 'Admin viewed' }
        }
      });

      return NextResponse.json({
        message: 'View logs cleared successfully',
        deletedCount: result.count
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in audit logs POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

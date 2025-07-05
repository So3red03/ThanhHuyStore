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
      take: limit,
    });

    // Log this admin action
    await AuditLogger.logAdminAction(
      AuditEventType.ADMIN_LOGIN,
      currentUser.id,
      currentUser.email!,
      `Admin viewed audit logs - Page ${page}`,
      {
        filters: { eventType, severity, userId, startDate, endDate, resourceType },
        resultCount: auditLogs.length
      },
      AuditLogger.getClientIP(request)
    );

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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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

    if (action === 'generateTestData') {
      // Generate test audit data
      const testEvents = [
        {
          eventType: AuditEventType.ADMIN_LOGIN,
          severity: AuditSeverity.LOW,
          userId: currentUser.id,
          userEmail: currentUser.email,
          userRole: 'ADMIN',
          description: 'Admin logged in successfully',
          metadata: { loginMethod: 'email', browser: 'Chrome' }
        },
        {
          eventType: AuditEventType.ORDER_STATUS_CHANGED,
          severity: AuditSeverity.MEDIUM,
          userId: currentUser.id,
          userEmail: currentUser.email,
          userRole: 'ADMIN',
          description: 'Order status changed from pending to processing',
          resourceId: 'test-order-123',
          resourceType: 'ORDER',
          oldValue: { status: 'pending' },
          newValue: { status: 'processing' },
          metadata: { reason: 'Manual update by admin' }
        },
        {
          eventType: AuditEventType.FAILED_LOGIN_ATTEMPT,
          severity: AuditSeverity.HIGH,
          description: 'Failed login attempt with invalid credentials',
          ipAddress: '192.168.1.100',
          metadata: { attemptedEmail: 'hacker@example.com', reason: 'Invalid password' }
        },
        {
          eventType: AuditEventType.PAYMENT_SUCCESS,
          severity: AuditSeverity.MEDIUM,
          userId: 'test-user-456',
          userEmail: 'customer@example.com',
          userRole: 'USER',
          description: 'Payment processed successfully via Stripe',
          resourceId: 'payment-intent-789',
          resourceType: 'PAYMENT',
          metadata: { amount: 150000, currency: 'VND', method: 'stripe' }
        },
        {
          eventType: AuditEventType.SUSPICIOUS_ORDER,
          severity: AuditSeverity.CRITICAL,
          userId: 'suspicious-user-999',
          userEmail: 'suspicious@example.com',
          description: 'Suspicious order detected - unusual quantity and price',
          resourceId: 'order-suspicious-001',
          resourceType: 'ORDER',
          metadata: { 
            suspiciousFactors: ['high_quantity', 'price_manipulation'],
            orderValue: 50000000,
            normalValue: 500000
          }
        },
        {
          eventType: AuditEventType.PRODUCT_UPDATED,
          severity: AuditSeverity.LOW,
          userId: currentUser.id,
          userEmail: currentUser.email,
          userRole: 'ADMIN',
          description: 'Product inventory updated',
          resourceId: 'product-abc-123',
          resourceType: 'PRODUCT',
          oldValue: { inStock: 10 },
          newValue: { inStock: 50 },
          metadata: { reason: 'Inventory restock' }
        },
        {
          eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
          severity: AuditSeverity.HIGH,
          description: 'Rate limit exceeded for payment attempts',
          ipAddress: '10.0.0.1',
          metadata: { 
            endpoint: '/api/create-payment-intent',
            attempts: 15,
            timeWindow: '1 minute'
          }
        }
      ];

      // Create test events with different timestamps
      for (let i = 0; i < testEvents.length; i++) {
        const event = testEvents[i];
        const timestamp = new Date();
        timestamp.setHours(timestamp.getHours() - i); // Spread events over time

        await prisma.auditLog.create({
          data: {
            ...event,
            ipAddress: event.ipAddress || AuditLogger.getClientIP(request),
            userAgent: AuditLogger.getUserAgent(request),
            timestamp,
            metadata: event.metadata || {}
          }
        });
      }

      // Log this admin action
      await AuditLogger.logAdminAction(
        AuditEventType.ADMIN_LOGIN,
        currentUser.id,
        currentUser.email!,
        'Admin generated test audit data',
        { testEventsCount: testEvents.length },
        AuditLogger.getClientIP(request)
      );

      return NextResponse.json({ 
        message: 'Test audit data generated successfully',
        eventsCreated: testEvents.length
      });

    } else if (action === 'clearTestData') {
      // Clear test audit data (keep only real events)
      const result = await prisma.auditLog.deleteMany({
        where: {
          OR: [
            { resourceId: { startsWith: 'test-' } },
            { resourceId: { startsWith: 'payment-intent-' } },
            { resourceId: { startsWith: 'order-suspicious-' } },
            { resourceId: { startsWith: 'product-abc-' } },
            { userEmail: { in: ['customer@example.com', 'suspicious@example.com'] } }
          ]
        }
      });

      // Log this admin action
      await AuditLogger.logAdminAction(
        AuditEventType.ADMIN_LOGIN,
        currentUser.id,
        currentUser.email!,
        'Admin cleared test audit data',
        { deletedCount: result.count },
        AuditLogger.getClientIP(request)
      );

      return NextResponse.json({ 
        message: 'Test audit data cleared successfully',
        deletedCount: result.count
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in audit logs POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

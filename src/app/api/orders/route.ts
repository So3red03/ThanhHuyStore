import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const paymentIntentId = url.searchParams.get('paymentIntentId');

    // If paymentIntentId is provided, get specific order
    if (paymentIntentId) {
      const order = await prisma.order.findUnique({
        where: { paymentIntentId },
        include: {
          user: true
        }
      });

      if (!order) {
        return new NextResponse('Order not found', { status: 404 });
      }

      return NextResponse.json(order);
    }

    // Otherwise, get all orders (admin only)
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.error();
  }

  // Invoking data JSON from request
  const body = await request.json();
  const { id, deliveryStatus } = body;

  // Get old order data for audit trail
  const oldOrder = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true
    }
  });

  if (!oldOrder) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // update order in db by Prisma
  const order = await prisma.order.update({
    where: { id },
    data: { deliveryStatus },
    include: {
      user: true
    }
  });

  // 🎯 AUDIT LOG: Order Delivery Status Changed
  await AuditLogger.log({
    eventType: AuditEventType.ORDER_STATUS_CHANGED,
    severity: AuditSeverity.MEDIUM, // MEDIUM for delivery status only
    userId: currentUser.id,
    userEmail: currentUser.email!,
    userRole: 'ADMIN',
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    description: `Cập nhật trạng thái giao hàng: ${order.id}`,
    details: {
      orderId: order.id,
      customerEmail: order.user.email,
      customerName: order.user.name,
      orderAmount: order.amount,
      endpoint: '/api/orders', // Updated endpoint
      changeType: 'deliveryStatus',
      deliveryStatusChange: {
        old: oldOrder.deliveryStatus,
        new: deliveryStatus
      }
    },
    resourceId: order.id,
    resourceType: 'Order',
    oldValue: {
      deliveryStatus: oldOrder.deliveryStatus
    },
    newValue: {
      deliveryStatus: deliveryStatus
    }
  });

  return NextResponse.json(order);
}

import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.error();
  }

  const body = await request.json();
  const { status, deliveryStatus } = body;

  const updateData: any = {};
  if (status !== undefined) updateData.status = status;
  if (deliveryStatus !== undefined) updateData.deliveryStatus = deliveryStatus;

  try {
    // Get old order data for audit trail
    const oldOrder = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: true
      }
    });

    if (!oldOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: true
      }
    });

    // 🎯 AUDIT LOG: Order Status Changed
    await AuditLogger.log({
      eventType: AuditEventType.ORDER_STATUS_CHANGED,
      severity: AuditSeverity.HIGH, // HIGH because order status affects business operations
      userId: currentUser.id,
      userEmail: currentUser.email!,
      userRole: 'ADMIN',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      description: `Cập nhật trạng thái đơn hàng: ${order.id}`,
      details: {
        orderId: order.id,
        customerEmail: order.user.email,
        customerName: order.user.name,
        orderAmount: order.amount,
        changes: {
          status: status !== undefined ? { old: oldOrder.status, new: status } : null,
          deliveryStatus: deliveryStatus !== undefined ? { old: oldOrder.deliveryStatus, new: deliveryStatus } : null
        },
        paymentMethod: order.paymentMethod,
        orderDate: order.createdAt
      },
      resourceId: order.id,
      resourceType: 'Order',
      oldValue: {
        status: oldOrder.status,
        deliveryStatus: oldOrder.deliveryStatus
      },
      newValue: {
        status: order.status,
        deliveryStatus: order.deliveryStatus
      }
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

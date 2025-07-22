import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';
import { validateOrderStatusTransition, validateDeliveryStatusTransition } from '@/app/utils/orderStatusValidation';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.error();
  }

  const body = await request.json();
  const { status, deliveryStatus, isTest } = body;

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

    // Validate status transition if status is being updated (skip validation if isTest is true)
    if (status !== undefined && !isTest) {
      const validation = validateOrderStatusTransition(oldOrder.status, status, oldOrder.deliveryStatus);
      if (!validation.isValid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }

    // Validate delivery status transition if deliveryStatus is being updated (skip validation if isTest is true)
    if (deliveryStatus !== undefined && !isTest) {
      // Use the new status if it's being updated, otherwise use the old status
      const statusForValidation = status !== undefined ? status : oldOrder.status;
      const validation = validateDeliveryStatusTransition(oldOrder.deliveryStatus, deliveryStatus, statusForValidation);
      if (!validation.isValid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: true
      }
    });

    // Trigger inventory rollback if order is being cancelled
    if (status === 'canceled' && oldOrder.status !== 'canceled') {
      try {
        const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        await fetch(`${baseUrl}/api/orders/rollback-inventory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: params.id,
            reason: `Admin status change: ${oldOrder.status} → canceled`,
            internalCall: true // Bypass auth for internal server-to-server call
          })
        });
      } catch (rollbackError) {
        console.error('Error triggering inventory rollback:', rollbackError);
        // Log error but don't fail the status update operation
      }
    }

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

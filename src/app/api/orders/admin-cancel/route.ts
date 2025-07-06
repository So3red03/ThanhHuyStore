import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';
import { OrderStatus } from '@prisma/client';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, reason } = body;

    if (!orderId || !reason) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Kiểm tra đơn hàng tồn tại
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    });

    if (!existingOrder) {
      return NextResponse.json({ success: false, message: 'Đơn hàng không tồn tại' }, { status: 404 });
    }

    // Kiểm tra đơn hàng đã bị hủy chưa
    if (existingOrder.status === OrderStatus.canceled) {
      return NextResponse.json({ success: false, message: 'Đơn hàng đã bị hủy trước đó' }, { status: 400 });
    }

    // Cập nhật trạng thái đơn hàng
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.canceled,
        cancelReason: reason,
        cancelDate: new Date()
      },
      include: {
        user: true
      }
    });

    // Admin hủy đơn hàng không gửi Discord notification
    // Chỉ log để tracking
    console.log(`✅ Admin ${currentUser.name} cancelled order ${updatedOrder.id} - Reason: ${reason}`);

    // 🎯 AUDIT LOG: Order Cancelled by Admin
    await AuditLogger.log({
      eventType: AuditEventType.ORDER_CANCELLED,
      severity: AuditSeverity.HIGH, // HIGH because admin cancellation is critical business action
      userId: currentUser.id,
      userEmail: currentUser.email!,
      userRole: 'ADMIN',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      description: `Admin hủy đơn hàng: ${updatedOrder.id}`,
      details: {
        orderId: updatedOrder.id,
        customerEmail: updatedOrder.user.email,
        customerName: updatedOrder.user.name,
        orderAmount: updatedOrder.amount,
        cancelReason: reason,
        cancelledBy: 'ADMIN',
        adminName: currentUser.name,
        paymentMethod: updatedOrder.paymentMethod,
        orderDate: updatedOrder.createDate,
        cancelDate: updatedOrder.cancelDate,
        productsCount: updatedOrder.products?.length || 0
      },
      resourceId: updatedOrder.id,
      resourceType: 'Order',
      oldValue: {
        status: existingOrder.status,
        cancelReason: null
      },
      newValue: {
        status: OrderStatus.canceled,
        cancelReason: reason
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Đơn hàng đã được hủy thành công',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Admin cancel order error:', error);
    return NextResponse.json({ success: false, message: 'Có lỗi xảy ra khi hủy đơn hàng' }, { status: 500 });
  }
}

import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';
import { OrderStatus } from '@prisma/client';

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

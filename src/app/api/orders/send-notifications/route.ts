import { NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';
import { NotificationType } from '@prisma/client';
import {
  sendOrderDiscordNotification,
  updateUserPurchasedCategories,
  sendOrderConfirmationEmail,
  createAdminOrderNotifications,
  checkNotificationExists
} from '@/app/utils/orderNotifications';

export async function POST(request: Request) {
  try {
    const { orderId, paymentIntentId } = await request.json();

    if (!orderId && !paymentIntentId) {
      return NextResponse.json({ error: 'Missing orderId or paymentIntentId' }, { status: 400 });
    }

    // Tìm order
    const order = await prisma.order.findFirst({
      where: orderId ? { id: orderId } : { paymentIntentId },
      include: {
        user: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Kiểm tra xem đã gửi notifications chưa
    const notificationExists = await checkNotificationExists(order.id, NotificationType.ORDER_PLACED);
    if (notificationExists) {
      return NextResponse.json({ message: 'Notifications already sent' });
    }

    // Gửi email xác nhận đơn hàng
    await sendOrderConfirmationEmail(order.user.email, 'Bấm vào link kế bên để theo dõi đơn hàng: ');

    // Gửi thông báo Discord
    await sendOrderDiscordNotification(order, order.user);

    // Cập nhật danh mục đã mua cho user
    await updateUserPurchasedCategories(order.user.id, order.products);

    // Tạo notification cho admin
    await createAdminOrderNotifications(order, order.user);

    return NextResponse.json({
      success: true,
      message: 'Notifications sent successfully',
      orderId: order.id
    });
  } catch (error) {
    console.error('Error sending order notifications:', error);
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
  }
}

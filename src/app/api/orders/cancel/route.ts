import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { OrderStatus } from '@prisma/client';
import { sendDiscordNotificationIfEnabled } from '@/app/libs/discord/discordNotificationHelper';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';

// Function để gửi thông báo Discord với format giống đơn hàng mới
const sendDiscordNotification = async (orderData: any, currentUser: any, reason: string) => {
  try {
    const webhookUrl = process.env.DISCORD_ORDER_WEBHOOK_URL;

    if (!webhookUrl) {
      console.log('Discord webhook URL not configured');
      return;
    }

    // Format sản phẩm giống như đơn hàng mới
    const productList = orderData.products
      .map(
        (product: any, index: number) =>
          `${index + 1}. **${product.name}** - Số lượng: ${product.quantity} - Giá: ${product.price.toLocaleString(
            'vi-VN'
          )}₫`
      )
      .join('\n');

    // Tính tổng tiền
    const totalAmount = orderData.amount.toLocaleString('vi-VN');
    const originalAmount = (orderData.originalAmount || orderData.amount).toLocaleString('vi-VN');

    // Format địa chỉ
    const fullAddress = orderData.address
      ? `${orderData.address.line1}, ${orderData.address.city}, ${orderData.address.country}`
      : 'Không có thông tin địa chỉ';

    const embed = {
      title: '🚫 **ĐƠN HÀNG BỊ HỦY**',
      color: 0xff4444, // Màu đỏ
      fields: [
        {
          name: '👤 **Thông tin khách hàng**',
          value: `**Tên:** ${currentUser.name || 'N/A'}\n**Email:** ${currentUser.email}\n**SĐT:** ${
            orderData.phoneNumber || 'N/A'
          }`,
          inline: false
        },
        {
          name: '📍 **Địa chỉ giao hàng**',
          value: fullAddress,
          inline: false
        },
        {
          name: '🛍️ **Sản phẩm đã hủy**',
          value: productList,
          inline: false
        },
        {
          name: '💰 **Thông tin thanh toán**',
          value: `**Tổng tiền hàng:** ${originalAmount}₫\n**Phí ship:** ${(orderData.shippingFee || 0).toLocaleString(
            'vi-VN'
          )}₫\n**Giảm giá:** ${(orderData.discountAmount || 0).toLocaleString(
            'vi-VN'
          )}₫\n**Tổng thanh toán:** ${totalAmount}₫\n**Phương thức:** ${(
            orderData.paymentMethod || 'COD'
          ).toUpperCase()}`,
          inline: false
        },
        {
          name: '❌ **Lý do hủy**',
          value: reason,
          inline: false
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'ThanhHuy Store - Đơn hàng bị hủy'
      }
    };

    // Sử dụng helper function để kiểm tra settings
    await sendDiscordNotificationIfEnabled(webhookUrl, embed);
  } catch (error) {
    console.error('Error sending Discord notification:', error);
  }
};

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, reason, userId } = await request.json();

    if (!orderId || !reason) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Kiểm tra đơn hàng có tồn tại và thuộc về user không
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: currentUser.id
      },
      include: {
        user: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Đơn hàng không tồn tại hoặc bạn không có quyền hủy đơn hàng này' },
        { status: 404 }
      );
    }

    // Kiểm tra trạng thái đơn hàng có thể hủy không
    if (order.status === 'canceled') {
      return NextResponse.json({ success: false, message: 'Đơn hàng đã được hủy trước đó' }, { status: 400 });
    }

    if (order.status === 'completed') {
      return NextResponse.json({ success: false, message: 'Không thể hủy đơn hàng đã hoàn thành' }, { status: 400 });
    }

    // Chỉ cho phép hủy đơn hàng pending hoặc confirmed chưa ship
    if (order.status === 'confirmed' && order.deliveryStatus !== 'not_shipped') {
      return NextResponse.json(
        { success: false, message: 'Không thể hủy đơn hàng đã được vận chuyển' },
        { status: 400 }
      );
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

    // Gửi thông báo Discord (chỉ khi user tự hủy đơn hàng)
    await sendDiscordNotification(updatedOrder, currentUser, reason);

    // 🎯 AUDIT LOG: Order Cancelled by User
    await AuditLogger.log({
      eventType: AuditEventType.ORDER_CANCELLED,
      severity: AuditSeverity.HIGH, // HIGH because cancellation affects business metrics
      userId: currentUser.id,
      userEmail: currentUser.email!,
      userRole: currentUser.role || 'USER',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      description: `Khách hàng hủy đơn hàng: ${updatedOrder.id}`,
      details: {
        orderId: updatedOrder.id,
        customerEmail: updatedOrder.user.email,
        customerName: updatedOrder.user.name,
        orderAmount: updatedOrder.amount,
        cancelReason: reason,
        cancelledBy: 'USER',
        paymentMethod: updatedOrder.paymentMethod,
        orderDate: updatedOrder.createDate,
        cancelDate: updatedOrder.cancelDate,
        productsCount: updatedOrder.products?.length || 0
      },
      resourceId: updatedOrder.id,
      resourceType: 'Order',
      oldValue: {
        status: 'confirmed', // Assuming it was confirmed before cancellation
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
    console.error('Cancel order error:', error);
    return NextResponse.json({ success: false, message: 'Có lỗi xảy ra khi hủy đơn hàng' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import { OrderEmailService } from '@/app/utils/orderEmailService';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';

export async function POST(request: NextRequest) {
  try {
    const { orderId, paymentIntentId } = await request.json();

    if (!orderId || !paymentIntentId) {
      return NextResponse.json({ error: 'Order ID and Payment Intent ID are required' }, { status: 400 });
    }

    // Lấy thông tin đơn hàng
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Confirm voucher usage after successful payment
    if (order.voucherId) {
      try {
        await prisma.userVoucher.updateMany({
          where: {
            userId: order.userId,
            voucherId: order.voucherId,
            reservedForOrderId: order.paymentIntentId
          },
          data: {
            orderId: order.id,
            reservedForOrderId: null, // Clear reservation
            usedAt: new Date()
          }
        });
      } catch (voucherError) {
        throw voucherError;
      }
    }

    // 🚀 MIGRATED: Track payment success với đầy đủ user context
    const user = await prisma.user.findUnique({
      where: { id: order.userId },
      select: { email: true, role: true, name: true }
    });

    if (user) {
      await AuditLogger.log({
        eventType: AuditEventType.PAYMENT_SUCCESS,
        severity: AuditSeverity.LOW,
        userId: order.userId,
        userEmail: user.email!,
        userRole: user.role || 'USER',
        ipAddress: 'system', // Process-payment được gọi từ server
        userAgent: 'system',
        description: `Đã thanh toán đơn hàng #${order.id}`,
        details: {
          orderId: order.id,
          amount: order.amount,
          paymentMethod: order.paymentMethod || 'unknown',
          title: 'Thanh toán thành công',
          uiData: {
            orderId: order.id,
            amount: order.amount,
            paymentMethod: order.paymentMethod
          },
          isUserActivity: true
        },
        resourceId: order.id,
        resourceType: 'Order'
      });
    }

    // Gửi email xác nhận
    try {
      const emailService = new OrderEmailService();
      await emailService.sendOrderConfirmation({
        orderId: order.id,
        paymentIntentId: order.paymentIntentId,
        customerName: order.user.name || 'Khách hàng',
        customerEmail: order.user.email,
        amount: order.amount,
        products: order.products.map((product: any) => ({
          name: product.name,
          quantity: product.quantity,
          price: product.price
        }))
      });

      console.log('Order confirmation email sent successfully');
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Không throw error để không ảnh hưởng đến quá trình thanh toán
    }

    // Gửi notifications (Discord + Admin notifications) - chỉ 1 lần
    try {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      await fetch(`${baseUrl}/api/orders/send-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          paymentIntentId: order.paymentIntentId
        })
      });
      console.log('Order notifications sent successfully');
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError);
      // Không throw error để không ảnh hưởng đến quá trình thanh toán
    }

    return NextResponse.json({
      message: 'Payment processed successfully',
      orderId,
      activityCreated: true,
      emailSent: true
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

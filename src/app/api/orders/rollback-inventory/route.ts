import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { OrderStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, reason } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        products: true,
        status: true,
        userId: true,
        paymentIntentId: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify user permission (admin or order owner)
    if (currentUser.role !== 'ADMIN' && currentUser.id !== order.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow rollback for pending orders
    if (order.status !== OrderStatus.pending) {
      return NextResponse.json(
        {
          error: `Cannot rollback order with status: ${order.status}`
        },
        { status: 400 }
      );
    }

    // Restore inventory and rollback voucher reservations atomically
    await prisma.$transaction(async tx => {
      // Restore inventory for each product
      for (const product of order.products as any[]) {
        await tx.product.update({
          where: { id: product.id },
          data: { inStock: { increment: product.quantity } }
        });

        console.log(`Restored ${product.quantity} units of ${product.name} to inventory`);
      }

      // Rollback voucher reservation if exists
      const voucherReservation = await tx.userVoucher.findFirst({
        where: {
          userId: order.userId,
          reservedForOrderId: order.paymentIntentId
        }
      });

      if (voucherReservation) {
        // Remove the reservation
        await tx.userVoucher.delete({
          where: { id: voucherReservation.id }
        });

        // Restore voucher usage count
        await tx.voucher.update({
          where: { id: voucherReservation.voucherId },
          data: { usedCount: { decrement: 1 } }
        });

        console.log(`Rolled back voucher reservation for order ${order.id}`);
      }

      // Mark order as cancelled
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.canceled,
          cancelReason: reason || 'Payment failed - inventory restored',
          cancelDate: new Date()
        }
      });

      // Create activity log
      await tx.activity.create({
        data: {
          userId: order.userId,
          type: 'ORDER_CANCELLED',
          title: 'Đơn hàng bị hủy',
          description: `Đơn hàng #${order.paymentIntentId.slice(-6).toUpperCase()} đã bị hủy, khôi phục tồn kho${
            voucherReservation ? ' và voucher' : ''
          }`,
          data: {
            orderId: order.id,
            paymentIntentId: order.paymentIntentId,
            reason: reason || 'Payment failed - inventory restored',
            restoredProducts: order.products,
            voucherRolledBack: !!voucherReservation
          }
        }
      });
    });

    console.log(`Successfully rolled back inventory for order ${orderId}`);

    return NextResponse.json({
      success: true,
      message: 'Inventory rollback completed successfully',
      orderId: orderId
    });
  } catch (error) {
    console.error('Inventory rollback failed:', error);
    return NextResponse.json(
      { error: 'Inventory rollback failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { OrderStatus } from '@prisma/client';
import { AuditLogger } from '@/app/utils/auditLogger';

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

    // Allow rollback for pending and confirmed orders (but not shipped)
    if (order.status !== OrderStatus.pending && order.status !== OrderStatus.confirmed) {
      return NextResponse.json(
        {
          error: `Cannot rollback order with status: ${order.status}`
        },
        { status: 400 }
      );
    }

    // Get order with delivery status for additional validation
    const orderWithDelivery = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        products: true,
        status: true,
        userId: true,
        paymentIntentId: true,
        deliveryStatus: true
      }
    });

    // Don't rollback if order is already shipped
    if (orderWithDelivery?.deliveryStatus && orderWithDelivery.deliveryStatus !== 'not_shipped') {
      console.warn(
        `Order ${orderId} already shipped (${orderWithDelivery.deliveryStatus}), skipping inventory rollback`
      );
      return NextResponse.json({
        success: true,
        message: 'Order already shipped, inventory rollback skipped',
        orderId: orderId
      });
    }

    // Use orderWithDelivery for the transaction since it has all needed fields
    const orderToProcess = orderWithDelivery || order;

    // Restore inventory and rollback voucher reservations atomically
    await prisma.$transaction(async tx => {
      // Restore inventory for each product (handle both simple and variant products)
      for (const product of orderToProcess.products as any[]) {
        if (product.variantId) {
          // Handle variant products
          // 1. Restore variant stock
          await tx.productVariant.update({
            where: { id: product.variantId },
            data: { stock: { increment: product.quantity } }
          });

          // 2. Recalculate main product stock (sum of all active variant stocks)
          const totalStock = await tx.productVariant.aggregate({
            where: {
              productId: product.id,
              isActive: true
            },
            _sum: { stock: true }
          });

          await tx.product.update({
            where: { id: product.id },
            data: { inStock: totalStock._sum.stock || 0 }
          });
        } else {
          // Handle simple products
          await tx.product.update({
            where: { id: product.id },
            data: { inStock: { increment: product.quantity } }
          });
        }
      }

      // Rollback voucher reservation if exists
      const voucherReservation = await tx.userVoucher.findFirst({
        where: {
          userId: orderToProcess.userId,
          reservedForOrderId: orderToProcess.paymentIntentId
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

      // 🚀 MIGRATED: Track order cancellation with AuditLogger
      // Note: This runs outside transaction since AuditLogger has its own transaction
      await AuditLogger.trackOrderCancelled(
        orderToProcess.userId,
        orderToProcess.id,
        reason || 'Payment failed - inventory restored'
      );
    });

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

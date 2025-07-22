import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { OrderStatus } from '@prisma/client';
import { AuditLogger } from '@/app/utils/auditLogger';

export async function POST(request: NextRequest) {
  try {
    console.log(`🔄 [ROLLBACK] Starting inventory rollback process...`);

    const { orderId, reason, internalCall } = await request.json();
    console.log(`📋 [ROLLBACK] Request data:`, { orderId, reason, internalCall });

    // For internal calls (server-to-server), skip user authentication
    let currentUser = null;
    if (!internalCall) {
      currentUser = await getCurrentUser();
      if (!currentUser) {
        console.log(`❌ [ROLLBACK] Unauthorized - no current user`);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      console.log(`✅ [ROLLBACK] User authenticated:`, currentUser.id);
    } else {
      console.log(`🔓 [ROLLBACK] Internal call - bypassing auth`);
    }

    if (!orderId) {
      console.log(`❌ [ROLLBACK] Missing order ID`);
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Get order details
    console.log(`🔍 [ROLLBACK] Looking up order: ${orderId}`);
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
      console.log(`❌ [ROLLBACK] Order not found: ${orderId}`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log(`📋 [ROLLBACK] Order found:`, {
      id: order.id,
      status: order.status,
      userId: order.userId,
      productsCount: order.products.length
    });

    // Verify user permission (admin or order owner) - skip for internal calls
    if (!internalCall && currentUser) {
      if (currentUser.role !== 'ADMIN' && currentUser.id !== order.userId) {
        console.log(`❌ [ROLLBACK] Forbidden - user ${currentUser.id} cannot rollback order for user ${order.userId}`);
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      console.log(`✅ [ROLLBACK] Permission check passed`);
    } else {
      console.log(`🔓 [ROLLBACK] Skipping permission check for internal call`);
    }

    // Allow rollback for pending, confirmed, and canceled orders (but not completed)
    // Note: canceled orders need rollback because they were canceled after inventory was reserved
    console.log(`🔍 [ROLLBACK] Checking order status: ${order.status}`);
    if (order.status === OrderStatus.completed) {
      console.log(`❌ [ROLLBACK] Cannot rollback completed order: ${order.status}`);
      return NextResponse.json(
        {
          error: `Cannot rollback completed order with status: ${order.status}`
        },
        { status: 400 }
      );
    }
    console.log(`✅ [ROLLBACK] Order status check passed: ${order.status}`);

    // Get order with delivery status for additional validation
    const orderWithDelivery = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        products: true,
        status: true,
        userId: true,
        paymentIntentId: true,
        deliveryStatus: true,
        cancelReason: true,
        cancelDate: true
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
    console.log(`🔄 [ROLLBACK] Starting transaction to restore inventory...`);
    await prisma.$transaction(async tx => {
      // Restore inventory for each product (handle both simple and variant products)
      console.log(`📦 [ROLLBACK] Processing ${orderToProcess.products.length} products...`);
      for (const product of orderToProcess.products as any[]) {
        console.log(`🔄 [ROLLBACK] Processing product:`, {
          id: product.id,
          name: product.name,
          quantity: product.quantity,
          variantId: product.variantId
        });

        if (product.variantId) {
          // Handle variant products
          console.log(`🔄 [ROLLBACK] Restoring variant product stock...`);
          // 1. Restore variant stock
          await tx.productVariant.update({
            where: { id: product.variantId },
            data: { stock: { increment: product.quantity } }
          });
          console.log(`✅ [ROLLBACK] Variant stock restored: +${product.quantity} for variant ${product.variantId}`);

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
          console.log(
            `✅ [ROLLBACK] Main product stock updated: ${totalStock._sum.stock || 0} for product ${product.id}`
          );
        } else {
          // Handle simple products
          console.log(`🔄 [ROLLBACK] Restoring simple product stock...`);
          await tx.product.update({
            where: { id: product.id },
            data: { inStock: { increment: product.quantity } }
          });
          console.log(`✅ [ROLLBACK] Simple product stock restored: +${product.quantity} for product ${product.id}`);
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

      // Update cancel info if not already set (order might already be canceled)
      const updateData: any = {};
      if (orderToProcess.status !== OrderStatus.canceled) {
        updateData.status = OrderStatus.canceled;
      }
      // Use orderWithDelivery for cancel fields since it has the complete data
      if (orderWithDelivery && !orderWithDelivery.cancelReason) {
        updateData.cancelReason = reason || 'Payment failed - inventory restored';
      }
      if (orderWithDelivery && !orderWithDelivery.cancelDate) {
        updateData.cancelDate = new Date();
      }

      // Only update if there's something to update
      if (Object.keys(updateData).length > 0) {
        await tx.order.update({
          where: { id: orderId },
          data: updateData
        });
      }

      // 🚀 MIGRATED: Track order cancellation with AuditLogger
      // Note: This runs outside transaction since AuditLogger has its own transaction
      await AuditLogger.trackOrderCancelled(
        orderToProcess.userId,
        orderToProcess.id,
        reason || 'Payment failed - inventory restored'
      );
    });

    console.log(`🎉 [ROLLBACK] Inventory rollback completed successfully for order: ${orderId}`);
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

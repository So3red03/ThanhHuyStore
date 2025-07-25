import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { ReturnStatus, OrderReturnStatus } from '@prisma/client';
import { sendReturnStatusEmail } from '@/app/utils/emailService';

// Helper functions for inventory management
async function reserveInventoryForReturn(tx: any, items: any[]) {
  // For returns, we don't actually change stock yet, just mark as reserved
  // This could be implemented with a separate reservation table if needed
  console.log('Reserving inventory for return:', items.length, 'items');
}

async function restoreInventoryFromReturn(tx: any, items: any[], reason: string) {
  console.log(`📦 [RETURN-RESTORE] Processing ${items.length} items for inventory restoration...`);
  console.log(`📦 [RETURN-RESTORE] Return reason: ${reason}`);

  // Don't restore inventory for defective products
  if (reason === 'DEFECTIVE') {
    console.log(`⚠️ [RETURN-RESTORE] Skipping inventory restoration for DEFECTIVE products - items cannot be resold`);
    return;
  }

  for (const item of items) {
    console.log(`🔄 [RETURN-RESTORE] Processing item:`, {
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      name: item.name || 'Unknown'
    });

    if (item.variantId) {
      // Handle variant products (following rollback-inventory pattern)
      console.log(`🔄 [RETURN-RESTORE] Restoring variant product stock...`);

      // 1. Restore variant stock
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } }
      });
      console.log(`✅ [RETURN-RESTORE] Variant stock restored: +${item.quantity} for variant ${item.variantId}`);

      // 2. Recalculate main product stock (sum of all active variant stocks)
      const totalStock = await tx.productVariant.aggregate({
        where: {
          productId: item.productId,
          isActive: true
        },
        _sum: { stock: true }
      });

      await tx.product.update({
        where: { id: item.productId },
        data: { inStock: totalStock._sum.stock || 0 }
      });
      console.log(
        `✅ [RETURN-RESTORE] Main product stock updated: ${totalStock._sum.stock || 0} for product ${item.productId}`
      );
    } else {
      // Handle simple products
      console.log(`🔄 [RETURN-RESTORE] Restoring simple product stock...`);
      await tx.product.update({
        where: { id: item.productId },
        data: { inStock: { increment: item.quantity } }
      });
      console.log(`✅ [RETURN-RESTORE] Simple product stock restored: +${item.quantity} for product ${item.productId}`);
    }
  }

  console.log(`🎉 [RETURN-RESTORE] Inventory restoration completed successfully`);
}

async function unreserveInventoryForReturn(tx: any, items: any[]) {
  // Unreserve inventory if return was rejected after approval
  // For now, this is just logging since we don't have a reservation system
  // In a full implementation, this would release reserved inventory
  console.log('Unreserving inventory for rejected return:', items.length, 'items');

  // If we had a reservation system, we would:
  // 1. Find reservation records for these items
  // 2. Delete or mark them as released
  // 3. Update available inventory counts
}

async function handleExchangeApproval(tx: any, returnRequest: any) {
  console.log(`🔄 [EXCHANGE-APPROVE] Handling exchange approval for request: ${returnRequest.id}`);

  // For exchange approval, we need to:
  // 1. Reserve the items being returned (similar to return approval)
  // 2. Create new order for exchange item
  // 3. Process payment difference if needed

  // Reserve old items (customer will send back)
  await reserveInventoryForReturn(tx, returnRequest.items as any[]);

  // Create new order for exchange item
  if (returnRequest.exchangeToProductId) {
    console.log(`🔄 [EXCHANGE-APPROVE] Creating new order for exchange...`);

    // Get original order details
    const originalOrder = await tx.order.findUnique({
      where: { id: returnRequest.orderId },
      include: { user: true }
    });

    if (!originalOrder) {
      throw new Error('Original order not found');
    }

    // Get exchange product details
    const exchangeProduct = await tx.product.findUnique({
      where: { id: returnRequest.exchangeToProductId },
      include: { variants: true }
    });

    if (!exchangeProduct) {
      throw new Error('Exchange product not found');
    }

    // Determine exchange item details
    let exchangePrice = 0;
    let exchangeVariant = null;

    if (returnRequest.exchangeToVariantId) {
      exchangeVariant = exchangeProduct.variants.find((v: any) => v.id === returnRequest.exchangeToVariantId);
      if (!exchangeVariant) {
        throw new Error('Exchange variant not found');
      }
      // For variant products, use variant price
      exchangePrice = exchangeVariant.price;
      if (typeof exchangePrice !== 'number' || isNaN(exchangePrice)) {
        throw new Error(`Invalid variant price: ${exchangePrice} for variant ${exchangeVariant.id}`);
      }
    } else {
      // For simple products, use product price
      exchangePrice = exchangeProduct.price || 0;
      if (typeof exchangePrice !== 'number' || isNaN(exchangePrice)) {
        throw new Error(`Invalid product price: ${exchangePrice} for product ${exchangeProduct.id}`);
      }
    }

    // Calculate price difference
    const oldItemsTotal = (returnRequest.items as any[]).reduce(
      (total, item) => total + item.unitPrice * item.quantity,
      0
    );
    const priceDifference = exchangePrice - oldItemsTotal;

    // Create new order for exchange
    const newOrder = await tx.order.create({
      data: {
        userId: originalOrder.userId,
        amount: exchangePrice,
        currency: 'VND',
        status: 'confirmed', // Auto-confirm exchange orders
        deliveryStatus: 'not_shipped',
        address: originalOrder.address, // Use same address
        shippingFee: 0, // Free shipping for exchanges
        paymentMethod: priceDifference > 0 ? 'pending_payment' : 'exchange',
        products: [
          {
            id: returnRequest.exchangeToProductId,
            name: exchangeProduct.name,
            description: exchangeProduct.description,
            category: exchangeProduct.category,
            brand: exchangeProduct.brand,
            selectedImg: exchangeProduct.thumbnail || exchangeProduct.images?.[0] || '',
            price: exchangePrice,
            quantity: 1,
            ...(exchangeVariant && {
              variantId: exchangeVariant.id,
              color: exchangeVariant.color,
              size: exchangeVariant.size,
              material: exchangeVariant.material
            })
          }
        ],
        // Link to original order and return request
        orderNote: `Đổi hàng từ đơn #${originalOrder.id} - Return Request #${returnRequest.id}`,
        // Store exchange metadata
        exchangeInfo: {
          originalOrderId: originalOrder.id,
          returnRequestId: returnRequest.id,
          priceDifference: priceDifference,
          exchangeType: 'APPROVED_EXCHANGE'
        }
      }
    });

    console.log(`✅ [EXCHANGE-APPROVE] New order created: ${newOrder.id}`);

    // Cancel original order (mark as exchanged)
    console.log(`🔄 [EXCHANGE-APPROVE] Cancelling original order: ${originalOrder.id}`);
    await tx.order.update({
      where: { id: originalOrder.id },
      data: {
        status: 'canceled',
        cancelReason: `Exchanged to new order #${newOrder.id}`,
        cancelDate: new Date()
      }
    });
    console.log(`✅ [EXCHANGE-APPROVE] Original order cancelled`);

    // Update return request with new order info
    await tx.returnRequest.update({
      where: { id: returnRequest.id },
      data: {
        exchangeOrderId: newOrder.id,
        additionalCost: priceDifference
      }
    });

    // Reduce stock for new exchange item
    if (returnRequest.exchangeToVariantId) {
      // Variant product
      await tx.productVariant.update({
        where: { id: returnRequest.exchangeToVariantId },
        data: { stock: { decrement: 1 } }
      });

      // Recalculate main product stock
      const totalStock = await tx.productVariant.aggregate({
        where: {
          productId: returnRequest.exchangeToProductId,
          isActive: true
        },
        _sum: { stock: true }
      });

      await tx.product.update({
        where: { id: returnRequest.exchangeToProductId },
        data: { inStock: totalStock._sum.stock || 0 }
      });
    } else {
      // Simple product
      await tx.product.update({
        where: { id: returnRequest.exchangeToProductId },
        data: { inStock: { decrement: 1 } }
      });
    }

    console.log(`✅ [EXCHANGE-APPROVE] Stock reduced for exchange item`);
  }

  console.log(`🎉 [EXCHANGE-APPROVE] Exchange approval completed with new order creation`);
}

async function handleExchangeCompletion(tx: any, returnRequest: any) {
  console.log(`🔄 [EXCHANGE-COMPLETE] Handling exchange completion for request: ${returnRequest.id}`);

  // When exchange is completed:
  // 1. Restore the returned items to inventory (customer sent them back)
  // 2. The new item stock was already reduced during approval

  console.log(`🔄 [EXCHANGE-COMPLETE] Restoring returned items to inventory...`);
  // For exchange, always restore returned items (they are being exchanged, not defective)
  await restoreInventoryFromReturn(tx, returnRequest.items as any[], 'EXCHANGE');

  console.log(`🎉 [EXCHANGE-COMPLETE] Exchange completion inventory handling completed`);
}

async function revertExchangeInventory(tx: any, returnRequest: any) {
  console.log(`🔄 [EXCHANGE-REVERT] Reverting exchange inventory for request: ${returnRequest.id}`);

  // When reverting an exchange:
  // 1. Unreserve the old items (they won't be returned now)
  // 2. Cancel the exchange order if it was created
  // 3. Restore stock for the new item (it was reduced during approval)

  await unreserveInventoryForReturn(tx, returnRequest.items as any[]);

  // Cancel exchange order if it exists
  if (returnRequest.exchangeOrderId) {
    console.log(`🔄 [EXCHANGE-REVERT] Cancelling exchange order: ${returnRequest.exchangeOrderId}`);

    await tx.order.update({
      where: { id: returnRequest.exchangeOrderId },
      data: {
        status: 'canceled',
        cancelReason: 'Exchange request rejected',
        cancelDate: new Date()
      }
    });

    console.log(`✅ [EXCHANGE-REVERT] Exchange order cancelled`);

    // Restore original order status (if it was cancelled for exchange)
    const originalOrder = await tx.order.findUnique({
      where: { id: returnRequest.orderId }
    });

    if (
      originalOrder &&
      originalOrder.status === 'canceled' &&
      originalOrder.cancelReason?.includes('Exchanged to new order')
    ) {
      console.log(`🔄 [EXCHANGE-REVERT] Restoring original order: ${returnRequest.orderId}`);

      await tx.order.update({
        where: { id: returnRequest.orderId },
        data: {
          status: 'completed', // Restore to completed status
          cancelReason: null,
          cancelDate: null
        }
      });

      console.log(`✅ [EXCHANGE-REVERT] Original order restored`);
    }
  }

  // Restore stock for the exchange item if specified
  if (returnRequest.exchangeToProductId) {
    console.log(`🔄 [EXCHANGE-REVERT] Restoring stock for exchange item:`, {
      productId: returnRequest.exchangeToProductId,
      variantId: returnRequest.exchangeToVariantId
    });

    if (returnRequest.exchangeToVariantId) {
      // Restore variant stock (following rollback-inventory pattern)
      console.log(`🔄 [EXCHANGE-REVERT] Restoring variant product stock...`);

      // 1. Restore variant stock
      await tx.productVariant.update({
        where: { id: returnRequest.exchangeToVariantId },
        data: { stock: { increment: 1 } } // Assuming quantity 1 for exchange
      });
      console.log(`✅ [EXCHANGE-REVERT] Variant stock restored: +1 for variant ${returnRequest.exchangeToVariantId}`);

      // 2. Recalculate main product stock (sum of all active variant stocks)
      const totalStock = await tx.productVariant.aggregate({
        where: {
          productId: returnRequest.exchangeToProductId,
          isActive: true
        },
        _sum: { stock: true }
      });

      await tx.product.update({
        where: { id: returnRequest.exchangeToProductId },
        data: { inStock: totalStock._sum.stock || 0 }
      });
      console.log(
        `✅ [EXCHANGE-REVERT] Main product stock updated: ${totalStock._sum.stock || 0} for product ${
          returnRequest.exchangeToProductId
        }`
      );
    } else {
      // Restore simple product stock
      console.log(`🔄 [EXCHANGE-REVERT] Restoring simple product stock...`);
      await tx.product.update({
        where: { id: returnRequest.exchangeToProductId },
        data: { inStock: { increment: 1 } }
      });
      console.log(
        `✅ [EXCHANGE-REVERT] Simple product stock restored: +1 for product ${returnRequest.exchangeToProductId}`
      );
    }
  }

  console.log(`🎉 [EXCHANGE-REVERT] Exchange revert inventory handling completed`);
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: params.id },
      include: {
        order: {
          select: {
            id: true,
            amount: true,
            createdAt: true,
            products: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!returnRequest) {
      return NextResponse.json({ error: 'Return request not found' }, { status: 404 });
    }

    // Check access permissions
    const isOwner = returnRequest.userId === currentUser.id;
    const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'STAFF';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      returnRequest
    });
  } catch (error) {
    console.error('Error fetching return request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Admin approve/reject return request
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin/staff can update return requests
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { action, adminNotes } = body;

    if (!action || !['approve', 'reject', 'complete'].includes(action)) {
      return NextResponse.json(
        {
          error: 'Invalid action. Must be approve, reject, or complete'
        },
        { status: 400 }
      );
    }

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: params.id },
      include: {
        order: true,
        user: true
      }
    });

    if (!returnRequest) {
      return NextResponse.json({ error: 'Return request not found' }, { status: 404 });
    }

    // Validate status transitions
    if (action === 'approve' || action === 'reject') {
      if (returnRequest.status !== 'PENDING') {
        return NextResponse.json(
          {
            error: 'Return request has already been processed'
          },
          { status: 400 }
        );
      }
    } else if (action === 'complete') {
      if (returnRequest.status !== 'APPROVED') {
        return NextResponse.json(
          {
            error: 'Return request must be approved before completion'
          },
          { status: 400 }
        );
      }
    }

    let updateData: any = {
      approvedBy: currentUser.id,
      approvedAt: new Date(),
      adminNotes: adminNotes || null
    };

    if (action === 'approve') {
      updateData.status = 'APPROVED';
    } else if (action === 'reject') {
      updateData.status = 'REJECTED';
    } else if (action === 'complete') {
      updateData.status = 'COMPLETED';
    }

    // Handle inventory and order updates based on action
    console.log(
      `🔄 [RETURN-REQUEST] Starting transaction for ${action} action on ${returnRequest.type} request: ${params.id}`
    );

    await prisma.$transaction(async (tx: any) => {
      console.log(`🔄 [RETURN-REQUEST] Updating return request status to: ${updateData.status}`);

      // Update return request
      const updatedReturnRequest = await tx.returnRequest.update({
        where: { id: params.id },
        data: updateData
      });

      console.log(`✅ [RETURN-REQUEST] Return request updated successfully`);
      console.log(`🔄 [RETURN-REQUEST] Processing inventory changes for ${returnRequest.type} ${action}...`);

      // Handle inventory based on action and type
      if (returnRequest.type === 'RETURN') {
        if (action === 'approve') {
          // Reserve inventory when approved (customer will send back)
          await reserveInventoryForReturn(tx, returnRequest.items as any[]);

          // Check if this is a full return and cancel order immediately
          const totalReturnValue = returnRequest.refundAmount || 0;
          const orderAmount = returnRequest.order?.amount || 0;
          const isFullReturn = totalReturnValue >= orderAmount;

          if (isFullReturn) {
            console.log(`🔄 [RETURN-APPROVE] Cancelling order due to full return approval...`);

            await tx.order.update({
              where: { id: returnRequest.orderId! },
              data: {
                status: 'canceled',
                cancelReason: `Trả hàng toàn bộ được duyệt - Yêu cầu #${returnRequest.id}`,
                cancelDate: new Date(),
                returnStatus: OrderReturnStatus.FULL,
                returnedAmount: totalReturnValue
              }
            });

            console.log(`✅ [RETURN-APPROVE] Order cancelled due to full return approval`);
          } else {
            console.log(`🔄 [RETURN-APPROVE] Partial return approved, keeping order active`);
          }
        } else if (action === 'complete') {
          // Actually restore inventory when completed (received goods back)
          // Pass the reason to determine if inventory should be restored
          await restoreInventoryFromReturn(tx, returnRequest.items as any[], returnRequest.reason || 'UNKNOWN');
        } else if (action === 'reject') {
          // If previously approved, unreserve inventory and restore order if needed
          if (returnRequest.status === 'APPROVED') {
            await unreserveInventoryForReturn(tx, returnRequest.items as any[]);

            // If order was cancelled due to this return (either during approval or completion), restore it
            const currentOrder = await tx.order.findUnique({
              where: { id: returnRequest.orderId }
            });

            if (
              currentOrder &&
              currentOrder.status === 'canceled' &&
              currentOrder.cancelReason?.includes(`Yêu cầu #${returnRequest.id}`)
            ) {
              console.log(`🔄 [RETURN-REVERT] Restoring cancelled order: ${returnRequest.orderId}`);

              await tx.order.update({
                where: { id: returnRequest.orderId },
                data: {
                  status: 'completed', // Restore to completed status
                  cancelReason: null,
                  cancelDate: null,
                  returnStatus: OrderReturnStatus.NONE, // Reset return status
                  returnedAmount: 0 // Reset returned amount
                }
              });

              console.log(`✅ [RETURN-REVERT] Order restored to completed status`);
            } else {
              console.log(`ℹ️ [RETURN-REVERT] Order not cancelled by this return or already restored`);
            }
          }
        }
      } else if (returnRequest.type === 'EXCHANGE') {
        if (action === 'approve') {
          // For exchange: reserve old inventory, reduce new inventory
          await handleExchangeApproval(tx, returnRequest);
        } else if (action === 'complete') {
          // Exchange completed: finalize inventory changes
          await handleExchangeCompletion(tx, returnRequest);
        } else if (action === 'reject') {
          // Revert exchange inventory changes if previously approved
          if (returnRequest.status === 'APPROVED') {
            await revertExchangeInventory(tx, returnRequest);
          }
        }
      }

      // Update order return status for completed returns (if not already updated during approval)
      if (action === 'complete' && returnRequest.type === 'RETURN') {
        console.log(`🔄 [RETURN-COMPLETE] Finalizing return completion...`);

        // Check current order status to avoid duplicate updates
        const currentOrder = await tx.order.findUnique({
          where: { id: returnRequest.orderId! }
        });

        const totalReturnValue = returnRequest.refundAmount || 0;
        const orderAmount = returnRequest.order?.amount || 0;
        const isFullReturn = totalReturnValue >= orderAmount;

        // Only update if order wasn't already cancelled during approval
        if (currentOrder && currentOrder.status !== 'canceled') {
          console.log(`🔄 [RETURN-COMPLETE] Updating order status for completion...`);

          const updateData: any = {
            returnStatus: isFullReturn ? OrderReturnStatus.FULL : OrderReturnStatus.PARTIAL,
            returnedAmount: totalReturnValue
          };

          // Cancel order if full return and not already cancelled
          if (isFullReturn) {
            updateData.status = 'canceled';
            updateData.cancelReason = `Trả hàng toàn bộ hoàn tất - Yêu cầu #${returnRequest.id}`;
            updateData.cancelDate = new Date();
            console.log(`🔄 [RETURN-COMPLETE] Cancelling order due to full return completion...`);
          }

          await tx.order.update({
            where: { id: returnRequest.orderId! },
            data: updateData
          });

          console.log(`✅ [RETURN-COMPLETE] Order status updated for ${isFullReturn ? 'full' : 'partial'} return`);
        } else {
          console.log(`ℹ️ [RETURN-COMPLETE] Order already cancelled during approval, skipping update`);
        }
      }

      console.log(`🎉 [RETURN-REQUEST] Transaction completed successfully for ${action} action`);
      return updatedReturnRequest;
    });

    // Send email notification
    try {
      if (returnRequest.user?.email && returnRequest.user?.name) {
        await sendReturnStatusEmail(
          returnRequest.user.email,
          returnRequest.user.name,
          returnRequest,
          action as 'approve' | 'reject' | 'complete'
        );
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the request if email fails
    }

    const updatedReturnRequest = await prisma.returnRequest.findUnique({
      where: { id: params.id },
      include: {
        order: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      returnRequest: updatedReturnRequest,
      message: `Return request ${action}d successfully`
    });
  } catch (error) {
    console.error('Error updating return request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

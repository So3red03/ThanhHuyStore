import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { ReturnStatus, OrderReturnStatus } from '@prisma/client';
import { sendReturnStatusEmail } from '@/app/utils/emailService';

/**
 * ===== API XỬ LÝ YÊU CẦU TRẢ HÀNG / ĐỔI HÀNG =====
 * File này xử lý approve/reject/complete cho cả RETURN và EXCHANGE requests
 * Flow chính: validate → transaction → xử lý inventory → gửi email → trả response
 */

/**
 * ===== 1. CÁC HÀM XỬ LÝ INVENTORY (DÙNG CHUNG CHO TRẢ & ĐỔI HÀNG) =====
 */

/**
 * Đặt trước hàng tồn kho cho việc trả hàng (TRẢ HÀNG & ĐỔI HÀNG)
 * Mục đích: Đánh dấu sản phẩm được reserve khi admin approve yêu cầu
 * Được dùng bởi: handleReturnApprove(), handleExchangeApprove()
 * Luồng: approve → reserve → (complete → khôi phục inventory)
 */
async function reserveInventoryForReturn(tx: any, items: any[]) {
  // For returns, we don't actually change stock yet, just mark as reserved
  // This could be implemented with a separate reservation table if needed
  console.log('Reserving inventory for return:', items.length, 'items');
}

/**
 * Khôi phục hàng tồn kho từ việc trả hàng (TRẢ HÀNG & ĐỔI HÀNG)
 * Mục đích: Cộng lại số lượng vào kho khi khách hàng trả sản phẩm về
 * Được dùng bởi: handleReturnComplete(), handleExchangeCompletion()
 * Luồng: complete → khôi phục inventory (khách đã gửi hàng về)
 * Lưu ý: Không khôi phục hàng lỗi (DEFECTIVE) vì không thể bán lại
 */
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

/**
 * Hủy đặt trước hàng tồn kho (TRẢ HÀNG & ĐỔI HÀNG)
 * Mục đích: Hủy reservation khi admin reject yêu cầu sau khi đã approve
 * Được dùng bởi: handleReturnReject(), handleExchangeReject()
 * Luồng: approve → reserve → reject → unreserve
 */
async function unreserveInventoryForReturn(tx: any, items: any[]) {
  // Unreserve inventory if return was rejected after approval
  // For now, this is just logging since we don't have a reservation system
  // In a full implementation, this would release reserved inventory
  console.log('Unreserving inventory for rejected return:', items.length, 'items');

  // If we had a reservation system, we would:
  // 1. Find reservation records for these items
  // 2. Delete or mark them as released
  // 3. Update available inventory counts
  console.log(`🎉 [UNRESERVE] Inventory unreservation completed`);
}

/**
 * ===== 2. CÁC HÀM XỬ LÝ ĐỔI HÀNG (EXCHANGE) =====
 * Các functions này xử lý logic phức tạp cho đổi hàng bao gồm tạo đơn mới và quản lý inventory
 */

/**
 * Xử lý logic approve ĐỔI HÀNG
 * Mục đích: kiểm tra đây là full exchange hoặc partial exchange để call hàm tương ứng
 * Được dùng bởi: PUT handler khi action=approve và type=EXCHANGE
 * Luồng: approve → tạo đơn mới → cập nhật đơn cũ → quản lý inventory → gửi email
 */
async function handleExchangeApproval(tx: any, returnRequest: any) {
  console.log(`🔄 [EXCHANGE-APPROVE] Handling exchange approval for request: ${returnRequest.id}`);

  // Get original order to determine exchange type
  const originalOrder = await tx.order.findUnique({
    where: { id: returnRequest.orderId },
    include: { user: true, products: true }
  });

  if (!originalOrder) {
    throw new Error(`Original order not found: ${returnRequest.orderId}`);
  }

  // Determine if this is full or partial exchange
  const exchangeItems = returnRequest.items || [];
  const originalProducts = originalOrder.products || [];
  const isFullExchange = exchangeItems.length === originalProducts.length;

  console.log(`🔍 [EXCHANGE-APPROVE] Exchange type analysis:`, {
    exchangeItemsCount: exchangeItems.length,
    originalProductsCount: originalProducts.length,
    isFullExchange
  });

  if (isFullExchange) {
    console.log(`🔄 [EXCHANGE-APPROVE] Processing FULL exchange (existing logic)`);
    await handleFullExchange(tx, returnRequest, originalOrder);
  } else {
    console.log(`🔄 [EXCHANGE-APPROVE] Processing PARTIAL exchange (split logic)`);
    await handlePartialExchange(tx, returnRequest, originalOrder);
  }
}

/**
 * Xử lý đổi hàng toàn phần (CHỈ ĐỔI HÀNG) FULL
 * Mục đích: Hủy đơn hàng gốc hoàn toàn, tạo đơn hàng mới cho sản phẩm đổi
 * Được dùng bởi: handleExchangeApproval() khi isFullExchange=true
 * Luồng: reserve hàng cũ → tạo đơn mới → hủy đơn gốc → cập nhật return request
 */
async function handleFullExchange(tx: any, returnRequest: any, originalOrder: any) {
  console.log(`🔄 [FULL-EXCHANGE] Processing full exchange - cancel old + create new`);

  // Reserve old items (customer will send back)
  await reserveInventoryForReturn(tx, returnRequest.items as any[]);

  // Create new order for exchange item
  if (returnRequest.exchangeToProductId) {
    console.log(`🔄 [FULL-EXCHANGE] Creating new order for exchange...`);

    if (!originalOrder) {
      throw new Error('Original order not found');
    }

    // Get exchange product details
    const exchangeProduct = await tx.product.findUnique({
      where: { id: returnRequest.exchangeToProductId },
      include: {
        variants: true,
        category: true
      }
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
        originalAmount: exchangePrice,
        currency: 'VND',
        status: 'confirmed', // Auto-confirm exchange orders
        deliveryStatus: 'not_shipped',
        paymentIntentId: `exchange_${returnRequest.id}_${Date.now()}`, // Generate unique payment intent ID
        phoneNumber: originalOrder.phoneNumber,
        address: originalOrder.address, // Use same address
        shippingFee: 0, // Free shipping for exchanges (policy: exchange orders always freeship)
        paymentMethod: priceDifference > 0 ? 'pending_payment' : 'exchange',
        discountAmount: 0, // No discount for exchange orders
        salesStaff: 'System Exchange', // Mark as system-generated exchange
        products: [
          {
            id: returnRequest.exchangeToProductId,
            name: exchangeProduct.name,
            description: exchangeProduct.description,
            category: exchangeProduct.category?.name || 'Uncategorized',
            brand: exchangeProduct.brand,
            selectedImg: exchangeProduct.thumbnail || exchangeProduct.images?.[0] || '',
            price: exchangePrice,
            quantity: 1,
            inStock: exchangeVariant ? exchangeVariant.stock : exchangeProduct.inStock,
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

  console.log(`🎉 [FULL-EXCHANGE] Full exchange approval completed with new order creation`);
}

/**
 * Xử lý đổi hàng một phần (CHỈ ĐỔI HÀNG) PARTIAL
 * Mục đích: Tách đơn hàng gốc, tạo đơn hàng mới cho sản phẩm đổi, sửa đơn gốc
 * Được dùng bởi: handleExchangeApproval() khi isFullExchange=false
 * Luồng: reserve hàng cũ → tạo đơn mới → sửa đơn gốc → cập nhật return request
 */
async function handlePartialExchange(tx: any, returnRequest: any, originalOrder: any) {
  console.log(`🔄 [PARTIAL-EXCHANGE] Processing partial exchange - split order logic`);

  // Reserve old items (customer will send back)
  await reserveInventoryForReturn(tx, returnRequest.items as any[]);

  // Step 1: Modify original order - remove exchanged items
  const exchangeItems = returnRequest.items || [];
  const originalProducts = originalOrder.products || [];

  // Filter out exchanged items from original order
  const remainingProducts = originalProducts.filter((product: any) => {
    return !exchangeItems.some(
      (exchangeItem: any) =>
        exchangeItem.productId === product.id &&
        (exchangeItem.variantId || 'simple') === (product.variantId || 'simple')
    );
  });

  // Calculate new amount for remaining products
  const newAmount =
    remainingProducts.reduce((total: number, product: any) => {
      return total + product.price * product.quantity;
    }, 0) + (originalOrder.shippingFee || 0);

  console.log(`🔄 [PARTIAL-EXCHANGE] Modifying original order:`, {
    originalProductsCount: originalProducts.length,
    remainingProductsCount: remainingProducts.length,
    originalAmount: originalOrder.amount,
    newAmount
  });

  // Update original order with remaining products
  await tx.order.update({
    where: { id: originalOrder.id },
    data: {
      products: remainingProducts,
      amount: newAmount,
      originalAmount: newAmount,
      note: originalOrder.note
        ? `${originalOrder.note} | Partial exchange: some items moved to new order`
        : 'Partial exchange: some items moved to new order'
    }
  });

  console.log(`✅ [PARTIAL-EXCHANGE] Original order modified - removed exchanged items`);

  // Step 2: Create new order for exchange item
  if (returnRequest.exchangeToProductId) {
    console.log(`🔄 [PARTIAL-EXCHANGE] Creating new order for exchange item...`);

    // Get exchange product details
    const exchangeProduct = await tx.product.findUnique({
      where: { id: returnRequest.exchangeToProductId },
      include: { category: true }
    });

    if (!exchangeProduct) {
      throw new Error(`Exchange product not found: ${returnRequest.exchangeToProductId}`);
    }

    // Calculate price difference
    const originalItemPrice = exchangeItems.reduce((total: number, item: any) => total + item.price, 0);
    const newItemPrice = exchangeProduct.price;
    const priceDifference = newItemPrice - originalItemPrice;

    console.log(`💰 [PARTIAL-EXCHANGE] Price calculation:`, {
      originalItemPrice,
      newItemPrice,
      priceDifference
    });

    // Create new order for exchange
    const newOrder = await tx.order.create({
      data: {
        userId: originalOrder.userId,
        amount: newItemPrice,
        originalAmount: newItemPrice,
        currency: originalOrder.currency || 'VND',
        status: 'pending',
        deliveryStatus: 'not_shipped',
        paymentIntentId: `exchange_partial_${returnRequest.id}_${Date.now()}`,
        phoneNumber: originalOrder.phoneNumber,
        address: originalOrder.address,
        shippingFee: 0, // Free shipping for exchanges (policy: exchange orders always freeship)
        paymentMethod: originalOrder.paymentMethod,
        discountAmount: 0, // No discount for exchange orders
        salesStaff: 'System Exchange', // Mark as system-generated exchange
        note: `Exchange order from #${originalOrder.id} - Partial exchange`,
        products: [
          {
            id: exchangeProduct.id,
            name: exchangeProduct.name,
            description: exchangeProduct.description,
            category: exchangeProduct.category?.name || 'Uncategorized',
            brand: exchangeProduct.brand,
            selectedImg: exchangeProduct.thumbnail || '',
            price: exchangeProduct.price,
            quantity: 1,
            inStock: exchangeProduct.inStock,
            productType: exchangeProduct.productType
          }
        ],
        // Store exchange metadata with reference to original order
        exchangeInfo: {
          originalOrderId: originalOrder.id,
          returnRequestId: returnRequest.id,
          priceDifference: priceDifference,
          exchangeType: 'PARTIAL_EXCHANGE',
          exchangedItems: exchangeItems.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      }
    });

    console.log(`✅ [PARTIAL-EXCHANGE] New exchange order created: ${newOrder.id}`);

    // Update return request with new order info
    await tx.returnRequest.update({
      where: { id: returnRequest.id },
      data: {
        exchangeOrderId: newOrder.id,
        additionalCost: priceDifference
      }
    });

    // Reduce stock for new exchange item
    if (exchangeProduct.productType === 'simple') {
      await tx.product.update({
        where: { id: returnRequest.exchangeToProductId },
        data: { inStock: { decrement: 1 } }
      });
    } else {
      // Handle variant stock reduction if needed
      await tx.product.update({
        where: { id: returnRequest.exchangeToProductId },
        data: { inStock: { decrement: 1 } }
      });
    }

    console.log(`✅ [PARTIAL-EXCHANGE] Stock reduced for exchange item`);
  }

  console.log(`🎉 [PARTIAL-EXCHANGE] Partial exchange approval completed with order split`);
}

/**
 * Xử lý hoàn tất đổi hàng một phần (CHỈ ĐỔI HÀNG)
 * Mục đích: Restore hàng trả về kho
 * Được dùng bởi: handleExchangeApproval() khi isFullExchange=false
 * Luồng: restore hàng trả về kho
 */
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

/**
 * Dành cho ADMIN để từ chối yêu cầu (DÙNG CHUNG CHO TRẢ & ĐỔI HÀNG)
 * Xử lý hoàn tất đổi hàng (CHỈ ĐỔI HÀNG)
 * Mục đích: Hủy đơn hàng đổi, khôi phục hàng cũ và restore hàng trả về kho
 * Được dùng bởi: PUT handler khi action=complete và type=EXCHANGE
 * Luồng: complete → hủy đơn hàng đổi → khôi phục hàng cũ → restore hàng trả về kho
 */
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

/**
 * ===== 3. CÁC HÀM XỬ LÝ TRẢ HÀNG (RETURN) =====
 * Các functions này xử lý logic đơn giản hơn cho trả hàng
 */

/**
 * ===== 4. MAIN API HANDLERS =====
 * Các endpoints chính của API
 */

/**
 * GET /api/orders/return-request/[id]
 * Mục đích: Lấy chi tiết một yêu cầu trả/đổi hàng cho admin/user
 * Được dùng bởi: Admin panel, trang tài khoản user
 * Trả về: Return request với thông tin order và user
 */
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

/**
 * PUT /api/orders/return-request/[id]
 * Mục đích: Admin approve/reject/complete yêu cầu trả/đổi hàng
 * Được dùng bởi: Admin panel - trang quản lý returns
 * Actions: approve, reject, complete
 * Luồng: validate → transaction → xử lý inventory → gửi email → trả response
 * Hỗ trợ: Cả RETURN và EXCHANGE types
 */
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

          // Update order return status (but keep order active)
          const totalReturnValue = returnRequest.refundAmount || 0;
          const currentReturnedAmount = returnRequest.order?.returnedAmount || 0;
          const newReturnedAmount = currentReturnedAmount + totalReturnValue;

          // Determine if this is full return based on product quantities, not money amount
          // Get all return requests for this order to check total returned quantities
          const allReturnRequests = await tx.returnRequest.findMany({
            where: {
              orderId: returnRequest.orderId,
              status: { in: ['APPROVED', 'COMPLETED'] }
            }
          });

          // Calculate total returned quantities for each product
          const returnedQuantities: { [productId: string]: number } = {};
          allReturnRequests.forEach((req: any) => {
            // items is a JSON field, not a relation
            const items = req.items || [];
            items.forEach((item: any) => {
              const key = `${item.productId}-${item.variantId || 'simple'}`;
              returnedQuantities[key] = (returnedQuantities[key] || 0) + item.quantity;
            });
          });

          // Get original order products to compare
          const orderProducts = returnRequest.order?.products || [];
          let isFullReturn = true;

          // Check if all products in order have been fully returned
          for (const product of orderProducts) {
            const key = `${product.id}-${product.variantId || 'simple'}`;
            const returnedQty = returnedQuantities[key] || 0;
            const originalQty = product.quantity || 0;

            if (returnedQty < originalQty) {
              isFullReturn = false;
              break;
            }
          }

          console.log(`🔍 [RETURN-APPROVE] Return analysis:`, {
            returnedQuantities,
            orderProducts: orderProducts.map(p => ({ id: p.id, quantity: p.quantity })),
            isFullReturn
          });

          console.log(`🔄 [RETURN-APPROVE] Updating return status for ${isFullReturn ? 'full' : 'partial'} return...`);

          await tx.order.update({
            where: { id: returnRequest.orderId! },
            data: {
              // Keep order status as 'completed' - do NOT cancel
              returnStatus: isFullReturn ? OrderReturnStatus.FULL : OrderReturnStatus.PARTIAL,
              returnedAmount: newReturnedAmount
            }
          });

          console.log(
            `✅ [RETURN-APPROVE] Order updated with ${
              isFullReturn ? 'FULL' : 'PARTIAL'
            } return status, amount: ${newReturnedAmount}`
          );
          console.log(`ℹ️ [RETURN-APPROVE] Order remains active (status: completed) for proper business tracking`);
        } else if (action === 'complete') {
          // Actually restore inventory when completed (received goods back)
          // Pass the reason to determine if inventory should be restored
          await restoreInventoryFromReturn(tx, returnRequest.items as any[], returnRequest.reason || 'UNKNOWN');
        } else if (action === 'reject') {
          // If previously approved, unreserve inventory and restore order if needed
          if (returnRequest.status === 'APPROVED') {
            await unreserveInventoryForReturn(tx, returnRequest.items as any[]);

            // Reset order return status (order was never cancelled, just reset return tracking)
            console.log(`🔄 [RETURN-REVERT] Resetting return status for order: ${returnRequest.orderId}`);

            // Recalculate return status after removing this return request
            const totalReturnValue = returnRequest.refundAmount || 0;
            const currentOrder = await tx.order.findUnique({
              where: { id: returnRequest.orderId },
              include: { products: true }
            });

            if (currentOrder) {
              const newReturnedAmount = Math.max(0, (currentOrder.returnedAmount || 0) - totalReturnValue);

              // Get remaining return requests (excluding the one being rejected)
              const remainingReturnRequests = await tx.returnRequest.findMany({
                where: {
                  orderId: returnRequest.orderId,
                  status: { in: ['APPROVED', 'COMPLETED'] },
                  id: { not: returnRequest.id } // Exclude current request being rejected
                }
              });

              // Calculate remaining returned quantities
              const remainingReturnedQuantities: { [productId: string]: number } = {};
              remainingReturnRequests.forEach((req: any) => {
                // items is a JSON field, not a relation
                const items = req.items || [];
                items.forEach((item: any) => {
                  const key = `${item.productId}-${item.variantId || 'simple'}`;
                  remainingReturnedQuantities[key] = (remainingReturnedQuantities[key] || 0) + item.quantity;
                });
              });

              // Check if any products are still returned
              let hasAnyReturns = false;
              for (const product of currentOrder.products) {
                const key = `${product.id}-${product.variantId || 'simple'}`;
                if (remainingReturnedQuantities[key] > 0) {
                  hasAnyReturns = true;
                  break;
                }
              }

              const newReturnStatus = hasAnyReturns ? OrderReturnStatus.PARTIAL : OrderReturnStatus.NONE;

              await tx.order.update({
                where: { id: returnRequest.orderId },
                data: {
                  // Order status remains 'completed' - never changed
                  returnStatus: newReturnStatus,
                  returnedAmount: newReturnedAmount
                }
              });

              console.log(
                `✅ [RETURN-REVERT] Order return status reset: ${newReturnStatus}, amount: ${newReturnedAmount}`
              );
            } else {
              console.log(`⚠️ [RETURN-REVERT] Order not found: ${returnRequest.orderId}`);
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

      // Return completion - inventory already restored above, no order status changes needed
      if (action === 'complete' && returnRequest.type === 'RETURN') {
        console.log(`🔄 [RETURN-COMPLETE] Return completion processed - inventory restored`);
        console.log(
          `ℹ️ [RETURN-COMPLETE] Order status remains 'completed' with return tracking via returnStatus field`
        );

        // Note: Order return status was already updated during approval
        // No additional order updates needed for completion
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

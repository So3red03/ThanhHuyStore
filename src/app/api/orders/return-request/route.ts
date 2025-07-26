import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { ReturnType, OrderStatus } from '@prisma/client';
import { SimpleReturnCalculator } from '../../../../../utils/shipping/calculator';

/**
 * ===== RETURN REQUEST CREATION API =====
 * This file handles creating new return/exchange requests from customers
 * Used by: Customer-facing return request modal
 * Supports: Both RETURN and EXCHANGE types
 */

interface ReturnItem {
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  reason: string;
}

interface CreateReturnRequest {
  orderId: string;
  type: 'RETURN' | 'EXCHANGE';
  items: ReturnItem[];
  reason: string;
  description?: string;
  images?: string[];
  // For exchanges
  exchangeToProductId?: string;
  exchangeToVariantId?: string;
}

/**
 * POST /api/orders/return-request
 * Purpose: Create new return/exchange request from customer
 * Used by: Customer return request modal
 * Flow: validate → calculate costs → create request → return response
 * Supports: Both RETURN and EXCHANGE types with shipping calculations
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateReturnRequest = await request.json();
    const { orderId, type, items, reason, description, images, exchangeToProductId, exchangeToVariantId } = body;

    // Validate required fields
    if (!orderId || !type || !items || items.length === 0 || !reason) {
      return NextResponse.json(
        {
          error: 'Missing required fields: orderId, type, items, reason'
        },
        { status: 400 }
      );
    }

    // Validate return type
    if (!['RETURN', 'EXCHANGE'].includes(type)) {
      return NextResponse.json(
        {
          error: 'Invalid return type. Must be RETURN or EXCHANGE'
        },
        { status: 400 }
      );
    }

    // Validate reason
    const validReasons = ['DEFECTIVE', 'WRONG_ITEM', 'CHANGE_MIND'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        {
          error: 'Invalid reason. Must be DEFECTIVE, WRONG_ITEM, or CHANGE_MIND'
        },
        { status: 400 }
      );
    }

    // Get order and verify ownership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        returnRequests: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.userId !== currentUser.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check for existing pending/approved return requests for the same items
    const existingReturns = await prisma.returnRequest.findMany({
      where: {
        orderId,
        status: {
          in: ['PENDING', 'APPROVED']
        }
      }
    });

    // Check if any items are already being returned
    for (const item of items) {
      for (const existingReturn of existingReturns) {
        const existingItems = existingReturn.items as any[];
        const conflictingItem = existingItems.find(
          (existing: any) => existing.productId === item.productId && existing.variantId === item.variantId
        );

        if (conflictingItem) {
          return NextResponse.json(
            {
              error: `Sản phẩm ${item.productId.substring(0, 8)}... đã có yêu cầu đổi/trả đang xử lý`
            },
            { status: 400 }
          );
        }
      }
    }

    // Check if order is eligible for return/exchange
    // Must be completed AND delivered
    if (order.status !== OrderStatus.completed) {
      return NextResponse.json(
        {
          error: 'Đơn hàng phải hoàn thành mới có thể đổi/trả'
        },
        { status: 400 }
      );
    }

    if ((order as any).deliveryStatus !== 'delivered') {
      return NextResponse.json(
        {
          error: 'Đơn hàng phải được giao thành công mới có thể đổi/trả'
        },
        { status: 400 }
      );
    }

    // Check if order is within return period (7 days)
    const orderDate = new Date(order.createdAt);
    const currentDate = new Date();
    const daysDifference = Math.floor((currentDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDifference > 7) {
      return NextResponse.json(
        {
          error: 'Return/exchange period has expired (7 days limit)'
        },
        { status: 400 }
      );
    }

    // Check customer return limit (3 returns per month)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const recentReturns = await prisma.returnRequest.count({
      where: {
        userId: currentUser.id,
        createdAt: { gte: oneMonthAgo }
      }
    });

    // if (recentReturns >= 3) {
    //   return NextResponse.json(
    //     {
    //       error: 'Monthly return limit exceeded (3 returns per month)'
    //     },
    //     { status: 400 }
    //   );
    // }

    // Validate items exist in order
    const orderProducts = order.products as any[];
    for (const item of items) {
      const orderProduct = orderProducts.find(
        p => p.id === item.productId && (item.variantId ? p.variantId === item.variantId : !p.variantId)
      );

      if (!orderProduct) {
        return NextResponse.json(
          {
            error: `Product ${item.productId} not found in order`
          },
          { status: 400 }
        );
      }

      if (item.quantity > orderProduct.quantity) {
        return NextResponse.json(
          {
            error: `Return quantity exceeds ordered quantity for product ${item.productId}`
          },
          { status: 400 }
        );
      }
    }

    // Get admin settings for shipping calculation
    const settings = await prisma.adminSettings.findFirst();
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 500 });
    }

    // Calculate refund amount with shipping
    let refundAmount = 0;
    let additionalCost = 0;
    let shippingBreakdown = null;

    if (type === 'RETURN') {
      // Use SimpleReturnCalculator for accurate calculation
      const returnRequestData = {
        reason,
        items: items.map(item => ({
          id: item.productId,
          name: item.productId, // Will be replaced with actual name in calculator
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      };

      const calculation = SimpleReturnCalculator.calculate(returnRequestData, order, settings);
      refundAmount = calculation.totalRefund;
      shippingBreakdown = {
        returnShippingFee: calculation.returnShippingFee,
        customerShippingFee: calculation.customerShippingFee,
        shopShippingFee: calculation.shopShippingFee,
        processingFee: calculation.processingFee,
        customerPaysShipping: calculation.policy.customerPaysShipping,
        requiresApproval: calculation.requiresApproval
      };
    } else if (type === 'EXCHANGE') {
      // For exchange, calculate price difference
      if (exchangeToProductId) {
        const newProduct = await prisma.product.findUnique({
          where: { id: exchangeToProductId },
          include: { variants: true }
        });

        if (!newProduct) {
          return NextResponse.json(
            {
              error: 'Exchange product not found'
            },
            { status: 400 }
          );
        }

        let newPrice = newProduct.price || 0;
        if (exchangeToVariantId) {
          const variant = newProduct.variants.find((v: any) => v.id === exchangeToVariantId);
          if (!variant) {
            return NextResponse.json(
              {
                error: 'Exchange variant not found'
              },
              { status: 400 }
            );
          }
          newPrice = variant.price || 0;
        }

        const oldPrice = items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
        additionalCost = newPrice - oldPrice; // Can be negative (refund) or positive (additional payment)
      }
    }

    // Prepare items data for JSON storage
    const itemsData = items.map(item => ({
      productId: item.productId,
      variantId: item.variantId || null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      reason: item.reason,
      ...(type === 'EXCHANGE' &&
        exchangeToProductId && {
          exchangeToProductId,
          exchangeToVariantId: exchangeToVariantId || null
        })
    }));

    // Create return request
    const returnRequest = await prisma.returnRequest.create({
      data: {
        orderId,
        userId: currentUser.id,
        type: type as ReturnType,
        items: itemsData,
        reason,
        description: description || null,
        images: images || [],
        refundAmount: refundAmount > 0 ? refundAmount : null,
        additionalCost: additionalCost !== 0 ? additionalCost : null,
        shippingBreakdown: shippingBreakdown,
        // Exchange specific fields
        ...(type === 'EXCHANGE' &&
          exchangeToProductId && {
            exchangeToProductId,
            exchangeToVariantId: exchangeToVariantId || null
          })
      },
      include: {
        order: {
          select: {
            id: true,
            amount: true,
            createdAt: true
          }
        },
        user: {
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
      returnRequest,
      message: 'Return request created successfully'
    });
  } catch (error) {
    console.error('Error creating return request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/orders/return-request
 * Purpose: List all return requests for current user
 * Used by: Customer account page - returns section
 * Returns: Array of user's return requests with order details
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    const where: any = {
      userId: currentUser.id
    };

    if (orderId) {
      where.orderId = orderId;
    }

    const returnRequests = await prisma.returnRequest.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            amount: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      returnRequests
    });
  } catch (error) {
    console.error('Error fetching return requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';
import { OrderStatus, DeliveryStatus } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      userId,
      amount,
      originalAmount,
      currency,
      status,
      deliveryStatus,
      paymentIntentId,
      products,
      phoneNumber,
      address,
      shippingFee,
      paymentMethod,
      discountAmount
    } = body;

    // Validate required fields
    if (!userId || !amount || !currency || !paymentIntentId || !products || products.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate products exist and have sufficient stock
    for (const product of products) {
      const dbProduct = await prisma.product.findUnique({
        where: { id: product.id }
      });

      if (!dbProduct) {
        return NextResponse.json({ error: `Product ${product.name} not found` }, { status: 404 });
      }

      if (dbProduct.inStock !== null && dbProduct.inStock < product.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name}. Available: ${dbProduct.inStock}, Requested: ${product.quantity}`
          },
          { status: 400 }
        );
      }
    }

    // Create order in transaction
    const order = await prisma.$transaction(async tx => {
      // Map address to Prisma Address format
      const mappedAddress = address
        ? {
            city: address.city,
            country: address.country || 'Vietnam',
            line1: address.street,
            line2: address.state || null,
            postal_code: address.postalCode || ''
          }
        : null;

      // Create the order
      const newOrder = await tx.order.create({
        data: {
          userId,
          amount,
          originalAmount: originalAmount || amount,
          currency,
          status: status || OrderStatus.pending,
          deliveryStatus: deliveryStatus || DeliveryStatus.not_shipped,
          paymentIntentId,
          products,
          phoneNumber,
          address: mappedAddress,
          shippingFee: shippingFee || 0,
          paymentMethod: paymentMethod || 'cod',
          discountAmount: discountAmount || 0
        },
        include: {
          user: true
        }
      });

      // Update product stock
      for (const product of products) {
        await tx.product.update({
          where: { id: product.id },
          data: {
            inStock: {
              decrement: product.quantity
            }
          }
        });
      }

      return newOrder;
    });

    // 🎯 AUDIT LOG: Admin Created Order
    await AuditLogger.log({
      eventType: AuditEventType.ORDER_CREATED,
      severity: AuditSeverity.HIGH,
      userId: currentUser.id,
      userEmail: currentUser.email!,
      userRole: 'ADMIN',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      description: `Admin tạo đơn hàng mới cho khách hàng: ${user.email}`,
      details: {
        orderId: order.id,
        customerEmail: user.email,
        customerName: user.name,
        orderAmount: order.amount,
        paymentMethod: order.paymentMethod,
        productCount: products.length,
        products: products.map((p: any) => ({
          id: p.id,
          name: p.name,
          quantity: p.quantity,
          price: p.price
        })),
        createdBy: 'ADMIN',
        adminId: currentUser.id,
        adminEmail: currentUser.email
      },
      resourceId: order.id,
      resourceType: 'Order',
      newValue: {
        orderId: order.id,
        status: order.status,
        amount: order.amount,
        customerId: userId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Error creating admin order:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

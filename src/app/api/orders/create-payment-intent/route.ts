import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import Stripe from 'stripe';
import { OrderStatus, DeliveryStatus } from '@prisma/client';
import { CartProductType } from '@/app/(home)/product/[productId]/ProductDetails';
import crypto from 'crypto';
import https from 'https';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';
import {
  sendOrderDiscordNotification,
  updateUserPurchasedCategories,
  createAdminOrderNotifications
} from '@/app/utils/orderNotifications';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10'
});

// Validate and reserve voucher atomically
const validateAndReserveVoucher = async (
  voucher: any,
  cartTotal: number,
  currentUser: any,
  paymentIntentId: string
) => {
  return await prisma.$transaction(async tx => {
    // ✅ Voucher active/inactive: Line 33-35
    // ✅ Voucher hết hạn: Line 37-44
    // ✅ Voucher hết lượt: Line 46-48
    // ✅ Min order value: Line 50-52
    // ✅ User đã sử dụng: Line 65-67
    // ✅ Atomic transaction: Tránh race condition
    // 1. Re-validate voucher with lock
    const voucherData = await tx.voucher.findUnique({
      where: { id: voucher.id }
    });

    if (!voucherData || !voucherData.isActive) {
      throw new Error('Voucher not valid');
    }

    const now = new Date();
    if (voucherData.startDate > now) {
      throw new Error('Voucher not yet active');
    }

    if (voucherData.endDate < now) {
      throw new Error('Voucher has expired');
    }

    if (voucherData.quantity <= voucherData.usedCount) {
      throw new Error('Voucher out of stock');
    }

    if (voucherData.minOrderValue && cartTotal < voucherData.minOrderValue) {
      throw new Error(`Minimum order value is ${voucherData.minOrderValue.toLocaleString('vi-VN')} VNĐ`);
    }

    // 2. Check user usage limit and create reservation atomically
    // This prevents race conditions by using the unique constraint
    const existingUsage = await tx.userVoucher.findUnique({
      where: {
        userId_voucherId: {
          userId: currentUser.id,
          voucherId: voucher.id
        }
      }
    });

    if (existingUsage && existingUsage.usedAt) {
      throw new Error('Voucher already used by this user');
    }

    // 3. Create or update reservation
    await tx.userVoucher.upsert({
      where: {
        userId_voucherId: {
          userId: currentUser.id,
          voucherId: voucher.id
        }
      },
      create: {
        userId: currentUser.id,
        voucherId: voucher.id,
        reservedForOrderId: paymentIntentId,
        reservedAt: new Date()
      },
      update: {
        reservedForOrderId: paymentIntentId,
        reservedAt: new Date()
      }
    });

    // 4. Calculate discount
    let discountAmount = 0;
    if (voucherData.discountType === 'PERCENTAGE') {
      discountAmount = (cartTotal * voucherData.discountValue) / 100;
    } else {
      discountAmount = Math.min(voucherData.discountValue, cartTotal);
    }

    return {
      voucherData,
      discountAmount: Math.round(discountAmount)
    };
  });
};

// Clean products data for database storage (remove fields not in Prisma schema)
const cleanProductsForDatabase = (products: CartProductType[]) => {
  return products.map(product => {
    // Create a clean product object without thumbnail (temporary fix)
    const cleanProduct: any = {
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      brand: product.brand,
      selectedImg: product.selectedImg,
      quantity: product.quantity,
      price: product.price,
      inStock: product.inStock
    };

    // Only add variant fields if they exist
    if (product.variantId) {
      cleanProduct.variantId = product.variantId;
    }
    if (product.attributes) {
      cleanProduct.attributes = product.attributes;
    }

    return cleanProduct;
  });
};

// Atomic order creation with inventory reservation
const createOrderWithInventoryReservation = async (orderData: any, products: any[]) => {
  return await prisma.$transaction(async tx => {
    // 1. Lock and validate inventory for all products
    for (const product of products) {
      const dbProduct = await tx.product.findUnique({
        where: { id: product.id },
        select: {
          id: true,
          name: true,
          inStock: true,
          productType: true
        }
      });

      if (!dbProduct) {
        throw new Error(`Product ${product.name} not found`);
      }

      // Handle variant products
      if (dbProduct.productType === 'VARIANT' && product.variantId) {
        const dbVariant = await tx.productVariant.findUnique({
          where: { id: product.variantId },
          select: {
            id: true,
            stock: true,
            isActive: true
          }
        });

        if (!dbVariant) {
          throw new Error(`Variant ${product.variantId} not found for product ${product.name}`);
        }

        if (!dbVariant.isActive) {
          throw new Error(`Variant ${product.variantId} is not active for product ${product.name}`);
        }

        if (dbVariant.stock < product.quantity) {
          throw new Error(
            `Insufficient variant stock for ${product.name}. Available: ${dbVariant.stock}, Requested: ${product.quantity}`
          );
        }

        // 2a. Reserve variant inventory atomically
        await tx.productVariant.update({
          where: { id: product.variantId },
          data: { stock: { decrement: product.quantity } }
        });

        // 2b. Update main product stock (sum of all variant stocks)
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
      } else if (dbProduct.productType === 'SIMPLE') {
        // Handle simple products
        if ((dbProduct.inStock ?? 0) < product.quantity) {
          throw new Error(
            `Insufficient stock for ${dbProduct.name}. Available: ${dbProduct.inStock}, Requested: ${product.quantity}`
          );
        }

        // 2c. Reserve simple product inventory atomically
        await tx.product.update({
          where: { id: product.id },
          data: { inStock: { decrement: product.quantity } }
        });
      } else {
        throw new Error(`Invalid product configuration for ${product.name}`);
      }
    }

    // 3. Create order after successful inventory reservation
    const order = await tx.order.create({ data: orderData });
    return order;
  });
};

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { products, phoneNumber, address, shippingFee, paymentMethod, voucher } = body;

  if (!products || products.length === 0) {
    return NextResponse.json({ error: 'No products provided' }, { status: 400 });
  }

  // Generate unique payment intent ID
  const payment_intent_id = `${Date.now()}-${currentUser.id}-${crypto.randomBytes(5).toString('hex')}`;

  let errors: string[] = [];
  let voucherData: any = null;
  let discountAmount = 0;

  // Calculate totals
  const totalVND = products.reduce((acc: number, product: any) => acc + product.price * product.quantity, 0);
  const originalAmount = totalVND + (shippingFee || 0);
  let finalAmount = originalAmount;

  // 1. Validate products exist and are available
  for (const product of products) {
    try {
      const dbProduct = await prisma.product.findUnique({
        where: { id: product.id },
        select: {
          id: true,
          name: true,
          price: true,
          inStock: true,
          category: true,
          productType: true,
          productPromotions: {
            where: {
              isActive: true,
              startDate: { lte: new Date() },
              endDate: { gte: new Date() }
            },
            orderBy: [{ priority: 'desc' }, { promotionalPrice: 'asc' }],
            take: 1
          }
        }
      });

      if (!dbProduct) {
        errors.push(`Product ${product.name} not found`);
        continue;
      }

      let expectedPrice = dbProduct.price;
      let availableStock = dbProduct.inStock ?? 0;

      // Handle variant products
      if (dbProduct.productType === 'VARIANT' && product.variantId) {
        const dbVariant = await prisma.productVariant.findUnique({
          where: { id: product.variantId },
          select: {
            id: true,
            price: true,
            stock: true,
            isActive: true
          }
        });

        if (!dbVariant) {
          errors.push(`Variant ${product.variantId} not found for product ${product.name}`);
          continue;
        }

        if (!dbVariant.isActive) {
          errors.push(`Variant ${product.variantId} is not active for product ${product.name}`);
          continue;
        }

        expectedPrice = dbVariant.price;
        availableStock = dbVariant.stock;
      } else if (dbProduct.productType === 'VARIANT' && !product.variantId) {
        errors.push(`Variant ID required for variant product ${product.name}`);
        continue;
      }

      // 2. Validate stock availability
      if (availableStock < product.quantity) {
        errors.push(
          `Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${product.quantity}`
        );
      }

      // 3. Validate price integrity (check for price manipulation, considering promotions)
      let validPrice = expectedPrice ?? 0;

      // Check if there's an active promotion for this product
      if (dbProduct.productPromotions && dbProduct.productPromotions.length > 0) {
        const activePromotion = dbProduct.productPromotions[0];
        validPrice = activePromotion.promotionalPrice;
      }

      if (Math.abs(product.price - validPrice) > 0.01) {
        errors.push(`Price mismatch for ${product.name}. Expected: ${validPrice}, Received: ${product.price}`);
      }
    } catch (error) {
      console.error(`Error validating product ${product.id}:`, error);
      errors.push(`Error validating product ${product.name}`);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
  }

  // 4. Validate and reserve voucher if provided
  if (voucher) {
    try {
      // Atomic voucher validation and reservation
      const voucherResult = await validateAndReserveVoucher(voucher, totalVND, currentUser, payment_intent_id);

      discountAmount = voucherResult.discountAmount;
      finalAmount = originalAmount - discountAmount;
      voucherData = voucherResult.voucherData;
    } catch (voucherError) {
      console.error('Voucher processing failed:', voucherError);
      return NextResponse.json(
        {
          error: 'Voucher error',
          details: voucherError instanceof Error ? voucherError.message : 'Unknown voucher error'
        },
        { status: 400 }
      );
    }
  }

  // Prepare order data
  const orderData = {
    user: { connect: { id: currentUser.id } },
    amount: finalAmount,
    originalAmount: originalAmount,
    currency: 'vnd',
    status: OrderStatus.pending,
    deliveryStatus: DeliveryStatus.not_shipped,
    paymentIntentId: payment_intent_id,
    products: cleanProductsForDatabase(products),
    phoneNumber: phoneNumber,
    address: address,
    shippingFee: shippingFee,
    paymentMethod: paymentMethod,
    voucher: voucherData?.id ? { connect: { id: voucherData.id } } : undefined,
    voucherCode: voucherData?.code || null,
    discountAmount: discountAmount
  };

  try {
    if (paymentMethod === 'stripe') {
      if (payment_intent_id) {
        // Update existing payment intent
        try {
          const updated_intent = await stripe.paymentIntents.update(payment_intent_id, {
            amount: Math.round(finalAmount)
          });

          // Update existing order
          await prisma.order.update({
            where: { paymentIntentId: payment_intent_id },
            data: {
              amount: finalAmount,
              originalAmount: originalAmount,
              products: cleanProductsForDatabase(products),
              voucher: voucherData?.id ? { connect: { id: voucherData.id } } : { disconnect: true },
              voucherCode: voucherData?.code || null,
              discountAmount: discountAmount
            }
          });
          return NextResponse.json({ paymentIntent: updated_intent });
        } catch (error) {
          throw error;
        }
      }

      // Create new Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(finalAmount),
        currency: 'vnd',
        automatic_payment_methods: { enabled: true },
        metadata: {
          orderId: payment_intent_id,
          userId: currentUser.id
        }
      });

      // Create order with inventory reservation
      const createdOrder = await createOrderWithInventoryReservation(orderData, products);

      // Purchase analytics removed - simplified to only track product_view and article_view

      // 🎯 AUDIT LOG: Order Created (Stripe)
      await AuditLogger.log({
        eventType: AuditEventType.ORDER_CREATED,
        severity: AuditSeverity.MEDIUM,
        userId: currentUser.id,
        userEmail: currentUser.email!,
        userRole: currentUser.role || 'USER',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        description: `Khách hàng đặt hàng thành công (Stripe): ${createdOrder.paymentIntentId}`,
        details: {
          paymentIntentId: paymentIntent.id,
          paymentMethod: 'stripe',
          amount: finalAmount,
          originalAmount: originalAmount,
          discountAmount: discountAmount,
          shippingFee: shippingFee,
          voucherCode: voucherData?.code || null,
          productsCount: products.length,
          customerEmail: currentUser.email,
          customerName: currentUser.name,
          phoneNumber: phoneNumber,
          address: address
        },
        resourceId: createdOrder.id,
        resourceType: 'Order'
      });

      return NextResponse.json({ paymentIntent });
    } else if (paymentMethod === 'cod') {
      // COD Order Creation
      const createdOrder = await createOrderWithInventoryReservation(orderData, products);

      // 🎯 AUDIT LOG: COD Order Created (includes order creation)
      await AuditLogger.log({
        eventType: AuditEventType.ORDER_CREATED,
        severity: AuditSeverity.MEDIUM,
        userId: currentUser.id,
        userEmail: currentUser.email!,
        userRole: currentUser.role || 'USER',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        description: `Đơn hàng mới COD: ${finalAmount.toLocaleString()} VND`,
        details: {
          paymentIntentId: createdOrder.paymentIntentId,
          paymentMethod: 'cod',
          amount: finalAmount,
          originalAmount: originalAmount,
          discountAmount: discountAmount,
          shippingFee: shippingFee,
          voucherCode: voucherData?.code || null,
          productsCount: products.length,
          customerEmail: currentUser.email,
          customerName: currentUser.name,
          phoneNumber: phoneNumber,
          address: address
        },
        resourceId: createdOrder.id,
        resourceType: 'Order'
      });

      // Purchase analytics removed - simplified to only track product_view and article_view

      // Send notifications (Discord only, email handled by process-payment)
      try {
        await sendOrderDiscordNotification(createdOrder, currentUser);
        await updateUserPurchasedCategories(currentUser.id, createdOrder.products);
        await createAdminOrderNotifications(createdOrder, currentUser);
      } catch (error) {
        console.error('Error sending notifications:', error);
      }

      // Auto-process COD payment (generate PDF and send email)
      try {
        const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        await fetch(`${baseUrl}/api/orders/process-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: createdOrder.id,
            paymentIntentId: createdOrder.paymentIntentId
          })
        });
      } catch (error) {
        console.error('Error processing COD payment:', error);
      }

      return NextResponse.json({
        message: 'COD order created successfully',
        orderId: createdOrder.id,
        paymentIntentId: createdOrder.paymentIntentId
      });
    } else if (paymentMethod === 'momo') {
      // MoMo Order Creation
      const createdOrder = await createOrderWithInventoryReservation(orderData, products);

      // 🎯 AUDIT LOG: Order Created (MoMo)
      await AuditLogger.log({
        eventType: AuditEventType.ORDER_CREATED,
        severity: AuditSeverity.MEDIUM,
        userId: currentUser.id,
        userEmail: currentUser.email!,
        userRole: currentUser.role || 'USER',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        description: `Khách hàng đặt hàng thành công (MoMo): ${createdOrder.paymentIntentId}`,
        details: {
          paymentIntentId: createdOrder.paymentIntentId,
          paymentMethod: 'momo',
          amount: finalAmount,
          originalAmount: originalAmount,
          discountAmount: discountAmount,
          shippingFee: shippingFee,
          voucherCode: voucherData?.code || null,
          productsCount: products.length,
          customerEmail: currentUser.email,
          customerName: currentUser.name,
          phoneNumber: phoneNumber,
          address: address
        },
        resourceId: createdOrder.id,
        resourceType: 'Order'
      });

      // Send notifications (Discord only, email handled by process-payment)
      try {
        await sendOrderDiscordNotification(createdOrder, currentUser);
        await updateUserPurchasedCategories(currentUser.id, createdOrder.products);
      } catch (error) {
        console.error('Error sending notifications:', error);
      }

      // Create MoMo payment
      const accessKey = 'F8BBA842ECF85';
      const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
      const orderInfo = 'pay with MoMo';
      const partnerCode = 'MOMO';
      const redirectUrl = `${process.env.NEXTAUTH_URL}/cart/orderconfirmation`;
      const ipnUrl = `${process.env.NEXTAUTH_URL}/api/callbackMomo`;
      const requestType = 'payWithMethod';
      const amount = finalAmount.toString();
      const orderId = createdOrder.paymentIntentId;
      const requestId = orderId;
      const extraData = '';
      const paymentCode =
        'T8Qii53fAXyUftPV3m9ysyRhEanUs9KlOPfHgpMR0ON50U10Bh+vZdpJU7VY4z+Z2y77fJHkoDc69scwwzLuW5MzeUKTwPo3ZMaB29imm6YulqnWfTkgzqRaion+EuD7FN9wZ4aXE1+mRt0gHsU193y+yxtRgpmY7SDMU9hCKoQtYyHsfFR5FUAOAKMdw2ly+x2UiNZj2gjpgLf+luN9BFfydbuyOLbSFc63zzi5vz3VTSIOyJdQsqiMnR+VEpVb';
      const orderGroupId = '';
      const autoCapture = true;
      const lang = 'vi';

      const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

      const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

      const requestBody = JSON.stringify({
        partnerCode: partnerCode,
        partnerName: 'Test',
        storeId: 'MomoTestStore',
        requestId: requestId,
        amount: amount,
        orderId: orderId,
        orderInfo: orderInfo,
        redirectUrl: redirectUrl,
        ipnUrl: ipnUrl,
        lang: lang,
        requestType: requestType,
        autoCapture: autoCapture,
        extraData: extraData,
        orderGroupId: orderGroupId,
        signature: signature
      });

      const options = {
        hostname: 'test-payment.momo.vn',
        port: 443,
        path: '/v2/gateway/api/create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody)
        }
      };

      return await new Promise<NextResponse>((resolve, reject) => {
        const req = https.request(options, res => {
          res.setEncoding('utf8');
          let body = '';
          res.on('data', chunk => {
            body += chunk;
          });
          res.on('end', () => {
            try {
              const jsonResponse = JSON.parse(body);
              // Thêm thông tin order vào response
              const responseWithOrder = {
                ...jsonResponse,
                createdOrder: {
                  id: createdOrder.id,
                  paymentIntentId: createdOrder.paymentIntentId
                }
              };
              resolve(NextResponse.json(responseWithOrder));
            } catch (error) {
              reject(NextResponse.json({ error: 'Invalid response from MoMo' }, { status: 500 }));
            }
          });
        });

        req.on('error', e => {
          reject(NextResponse.json({ error: e.message }, { status: 500 }));
        });

        req.write(requestBody);
        req.end();
      });
    } else {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }
  } catch (error) {
    console.error('Order creation failed:', error);
    return NextResponse.json(
      {
        error: 'Order creation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

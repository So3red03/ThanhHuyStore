import Stripe from 'stripe';
import prisma from '../../libs/prismadb';
import { CartProductType } from '@/app/(home)/product/[productId]/ProductDetails';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { OrderStatus, DeliveryStatus } from '@prisma/client';
import { NotificationService } from '@/app/libs/notificationService';
import { sendDiscordNotificationIfEnabled } from '@/app/libs/discordNotificationHelper';
import crypto from 'crypto';
import https from 'https';
import axios from 'axios';
const nodemailer = require('nodemailer');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10'
});

const calculateOrderAmount = (items: CartProductType[]) => {
  const totalPrice = items.reduce((acc, item) => {
    const itemTotal = item.price * item.quantity;
    return acc + itemTotal;
  }, 0);
  return totalPrice;
};

// Enhanced validation functions for security
const validateOrderData = async (products: CartProductType[], currentUser: any) => {
  const errors: string[] = [];

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
          category: true
        }
      });

      if (!dbProduct) {
        errors.push(`Product ${product.name} not found`);
        continue;
      }

      // 2. Validate stock availability
      if (dbProduct.inStock < product.quantity) {
        errors.push(
          `Insufficient stock for ${product.name}. Available: ${dbProduct.inStock}, Requested: ${product.quantity}`
        );
      }

      // 3. Validate price integrity (check for price manipulation)
      let expectedPrice = dbProduct.price;

      // Note: Promotion logic removed as promotion fields don't exist in current Product model
      // TODO: Implement promotion logic when ProductPromotion table is ready

      if (Math.abs(product.price - expectedPrice) > 0.01) {
        errors.push(`Price mismatch for ${product.name}. Expected: ${expectedPrice}, Received: ${product.price}`);
      }

      // 4. Validate quantity limits
      if (product.quantity <= 0) {
        errors.push(`Invalid quantity for ${product.name}: ${product.quantity}`);
      }

      if (product.quantity > 10) {
        // Max 10 items per product
        errors.push(`Quantity limit exceeded for ${product.name}. Max: 10, Requested: ${product.quantity}`);
      }
    } catch (error) {
      errors.push(`Error validating product ${product.name}: ${error}`);
    }
  }

  // 5. Validate cart total limits
  const totalAmount = calculateOrderAmount(products);
  if (totalAmount > 99000000) {
    // 99M VND limit
    errors.push(`Order total exceeds limit: ${totalAmount} VND`);
  }

  if (totalAmount < 1000) {
    // Minimum order 1K VND
    errors.push(`Order total below minimum: ${totalAmount} VND`);
  }

  // 6. Validate user permissions
  if (!currentUser || !currentUser.id) {
    errors.push('Invalid user authentication');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// Rate limiting check
const checkRateLimit = async (userId: string) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const recentOrders = await prisma.order.count({
    where: {
      userId: userId,
      createDate: {
        gte: oneHourAgo
      }
    }
  });

  return recentOrders < 5; // Max 5 orders per hour
};

// Function để gửi thông báo Discord
const sendDiscordNotification = async (orderData: any, currentUser: any) => {
  try {
    const webhookUrl = process.env.DISCORD_ORDER_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('Discord webhook URL not configured');
      return;
    }

    // Format sản phẩm
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
    const originalAmount = orderData.originalAmount.toLocaleString('vi-VN');

    // Format địa chỉ
    const fullAddress = `${orderData.address.line1}, ${orderData.address.city}, ${orderData.address.country}`;

    const embed = {
      title: '🛒 **ĐƠN HÀNG MỚI**',
      color: 0x00ff00, // Màu xanh lá
      fields: [
        {
          name: '👤 **Thông tin khách hàng**',
          value: `**Tên:** ${currentUser.name || 'N/A'}\n**Email:** ${currentUser.email}\n**SĐT:** ${
            orderData.phoneNumber
          }`,
          inline: false
        },
        {
          name: '📍 **Địa chỉ giao hàng**',
          value: fullAddress,
          inline: false
        },
        {
          name: '🛍️ **Sản phẩm đặt mua**',
          value: productList,
          inline: false
        },
        {
          name: '💰 **Thông tin thanh toán**',
          value: `**Tổng tiền hàng:** ${originalAmount}₫\n**Phí ship:** ${orderData.shippingFee.toLocaleString(
            'vi-VN'
          )}₫\n**Giảm giá:** ${orderData.discountAmount.toLocaleString(
            'vi-VN'
          )}₫\n**Tổng thanh toán:** ${totalAmount}₫\n**Phương thức:** ${orderData.paymentMethod.toUpperCase()}`,
          inline: false
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'ThanhHuy Store - Đơn hàng mới'
      }
    };

    // Sử dụng helper function để kiểm tra settings
    await sendDiscordNotificationIfEnabled(webhookUrl, embed);
  } catch (error) {
    console.error('Error sending Discord notification:', error);
  }
};

// Function để cập nhật danh mục đã mua của user
const updateUserPurchasedCategories = async (userId: string, products: CartProductType[]) => {
  try {
    // Lấy danh mục từ các sản phẩm đã mua
    const categories = products.map(product => product.category);
    const uniqueCategories = [...new Set(categories)];

    // Lấy danh mục đã mua trước đó của user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { purchasedCategories: true }
    });

    if (user) {
      // Gộp danh mục mới với danh mục cũ
      const allCategories = [...new Set([...user.purchasedCategories, ...uniqueCategories])];

      // Cập nhật user
      await prisma.user.update({
        where: { id: userId },
        data: { purchasedCategories: allCategories }
      });

      console.log(`Updated purchased categories for user ${userId}:`, allCategories);
    }
  } catch (error) {
    console.error('Error updating user purchased categories:', error);
  }
};

// Function để gửi notifications và email một lần duy nhất
const sendOrderNotifications = async (orderData: any, currentUser: any, paymentMethod: string) => {
  try {
    // 1. Gửi email xác nhận đơn hàng (chỉ 1 lần)
    await sendEmail(currentUser.email, 'Bấm vào link kế bên để theo dõi đơn hàng: ');

    // 2. Gửi thông báo Discord (chỉ 1 lần)
    await sendDiscordNotification(orderData, currentUser);

    // 3. Cập nhật danh mục đã mua cho user
    await updateUserPurchasedCategories(currentUser.id, orderData.products);

    // 4. Tạo notification cho admin (chỉ 1 lần)
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    });

    for (const admin of admins) {
      await NotificationService.createNotification({
        userId: admin.id,
        orderId: orderData.id,
        fromUserId: currentUser.id,
        type: 'ORDER_PLACED',
        title: `Đơn hàng mới (${paymentMethod.toUpperCase()})`,
        message: `${currentUser.name} vừa đặt đơn hàng ${paymentMethod.toUpperCase()}`,
        data: { orderId: orderData.id, paymentMethod }
      });
    }

    console.log(`✅ Order notifications sent for ${paymentMethod} order ${orderData.id}`);
  } catch (error) {
    console.error('Error sending order notifications:', error);
  }
};

export async function POST(request: Request): Promise<Response> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { products, phoneNumber, address, payment_intent_id, shippingFee, paymentMethod, voucher } = body;

  // SECURITY VALIDATION LAYER
  try {
    // 1. Rate limiting check
    const isWithinRateLimit = await checkRateLimit(currentUser.id);
    if (!isWithinRateLimit) {
      return NextResponse.json(
        {
          error: 'Too many orders. Please wait before placing another order.'
        },
        { status: 429 }
      );
    }

    // 2. Validate input data
    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'Invalid products data' }, { status: 400 });
    }

    if (!phoneNumber || !address || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required order information' }, { status: 400 });
    }

    if (!['cod', 'stripe', 'momo'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    // 3. Comprehensive order validation
    const validation = await validateOrderData(products, currentUser);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Order validation failed',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    console.log(`Order validation passed for user ${currentUser.id}`);
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      {
        error: 'Internal validation error'
      },
      { status: 500 }
    );
  }

  const totalVND = calculateOrderAmount(products);
  const originalAmount = totalVND + shippingFee;
  let finalAmount = originalAmount;
  let discountAmount = 0;
  let voucherData = null;

  // Handle voucher if provided
  if (voucher) {
    try {
      // Validate voucher - sử dụng URL tuyệt đối hoặc relative
      const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:${process.env.PORT || 3001}`;
      const voucherValidation = await fetch(`${baseUrl}/api/voucher/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucherId: voucher.id,
          cartTotal: totalVND
        })
      });

      if (voucherValidation.ok) {
        const validationResult = await voucherValidation.json();
        discountAmount = validationResult.discountAmount;
        finalAmount = originalAmount - discountAmount;
        voucherData = voucher;
      } else {
        console.error('Voucher validation failed:', await voucherValidation.text());
      }
    } catch (error) {
      console.error('Error validating voucher:', error);
      // Tiếp tục xử lý đơn hàng mà không áp dụng voucher
    }
  }

  const orderData = {
    user: { connect: { id: currentUser.id } },
    amount: finalAmount,
    originalAmount: originalAmount,
    currency: 'vnd',
    status: OrderStatus.pending,
    deliveryStatus: DeliveryStatus.not_shipped,
    paymentIntentId: payment_intent_id,
    products: products,
    phoneNumber: phoneNumber,
    address: address,
    shippingFee: shippingFee,
    paymentMethod: paymentMethod,
    voucherId: voucherData?.id || null,
    voucherCode: voucherData?.code || null,
    discountAmount: discountAmount
  };

  try {
    if (paymentMethod === 'stripe') {
      if (payment_intent_id) {
        const current_intent = await stripe.paymentIntents.retrieve(payment_intent_id);
        // Webhook
        if (current_intent && current_intent.status !== 'succeeded') {
          const updated_intent = await stripe.paymentIntents.update(payment_intent_id, { amount: finalAmount });
          // Update order
          const existing_order = await prisma.order.findFirst({
            where: { paymentIntentId: payment_intent_id }
          });
          if (!existing_order) {
            return NextResponse.json({ error: 'Lỗi không tìm thấy đơn hàng trong db' }, { status: 404 });
          }
          await prisma.order.update({
            where: { paymentIntentId: payment_intent_id },
            data: {
              amount: finalAmount,
              originalAmount: originalAmount,
              products: products,
              voucherId: voucherData?.id || null,
              voucherCode: voucherData?.code || null,
              discountAmount: discountAmount
            }
          });
          return NextResponse.json({ paymentIntent: updated_intent });
        }
      } else {
        // Create intent bên stripe
        const paymentIntent = await stripe.paymentIntents.create({
          amount: finalAmount,
          currency: 'vnd',
          automatic_payment_methods: { enabled: true }
        });

        if (!paymentIntent || !paymentIntent.id) {
          return NextResponse.json({ error: 'Lỗi khi tạo thanh toán.' }, { status: 500 });
        }

        orderData.paymentIntentId = paymentIntent.id;
        // Tạo đơn hàng trong db
        const createdOrder = await prisma.order.create({
          data: orderData
        });

        if (!createdOrder) {
          return NextResponse.json({ error: 'Lỗi khi tạo đơn hàng.' }, { status: 500 });
        }

        // Tạo ORDER_CREATED activity
        try {
          await prisma.activity.create({
            data: {
              userId: currentUser.id,
              type: 'ORDER_CREATED',
              title: 'Đơn hàng được tạo',
              description: `Tài khoản vừa tạo đơn hàng #${createdOrder.paymentIntentId.slice(-6).toUpperCase()}`,
              data: {
                orderId: createdOrder.id,
                paymentIntentId: createdOrder.paymentIntentId,
                amount: createdOrder.amount,
                paymentMethod: 'stripe',
                products: products.slice(0, 3).map((product: any) => ({
                  id: product.id,
                  name: product.name,
                  image: product.selectedImg?.images?.[0] || '/placeholder.png'
                }))
              }
            }
          });
        } catch (error) {
          console.error('Error creating ORDER_CREATED activity:', error);
        }

        // Record voucher usage if voucher was used
        if (voucherData) {
          try {
            const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:${process.env.PORT || 3001}`;
            await fetch(`${baseUrl}/api/voucher/use`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                voucherId: voucherData.id,
                orderId: createdOrder.id
              })
            });
          } catch (error) {
            console.error('Error recording voucher usage:', error);
          }
        }

        // Chỉ gửi notifications cho Stripe vì các method khác sẽ được xử lý trong webhook/callback
        // Stripe payment sẽ được confirm trong webhook, không gửi notifications ở đây

        return NextResponse.json({ paymentIntent });
      }
    } else if (paymentMethod === 'cod') {
      try {
        orderData.paymentIntentId = `${Date.now()}`;

        const createdOrder = await prisma.order.create({
          data: orderData
        });

        if (!createdOrder) {
          return NextResponse.json({ error: 'Lỗi khi tạo đơn hàng.' }, { status: 500 });
        }

        // Tạo ORDER_CREATED activity cho COD
        try {
          await prisma.activity.create({
            data: {
              userId: currentUser.id,
              type: 'ORDER_CREATED',
              title: 'Đơn hàng được tạo',
              description: `Tài khoản vừa tạo đơn hàng COD #${createdOrder.paymentIntentId.slice(-6).toUpperCase()}`,
              data: {
                orderId: createdOrder.id,
                paymentIntentId: createdOrder.paymentIntentId,
                amount: createdOrder.amount,
                paymentMethod: 'cod',
                products: products.slice(0, 3).map((product: any) => ({
                  id: product.id,
                  name: product.name,
                  image: product.selectedImg?.images?.[0] || '/placeholder.png'
                }))
              }
            }
          });
        } catch (error) {
          console.error('Error creating ORDER_CREATED activity for COD:', error);
        }

        // Record voucher usage if voucher was used
        if (voucherData) {
          try {
            const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:${process.env.PORT || 3001}`;
            await fetch(`${baseUrl}/api/voucher/use`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                voucherId: voucherData.id,
                orderId: createdOrder.id
              })
            });
          } catch (error) {
            console.error('Error recording voucher usage:', error);
          }
        }

        // Gửi notifications và email cho COD
        await sendOrderNotifications(orderData, currentUser, 'cod');

        // Tự động tạo PDF và gửi email cho COD
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

        return NextResponse.json({ createdOrder });
      } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Đã xảy ra lỗi khi xử lý đơn hàng hoặc gửi email.' }, { status: 500 });
      }
    } else if (paymentMethod === 'momo') {
      orderData.paymentIntentId = `${Date.now()}`;
      const createdOrder = await prisma.order.create({
        data: orderData
      });

      if (!createdOrder) {
        return NextResponse.json({ error: 'Lỗi khi tạo đơn hàng trong db.' }, { status: 500 });
      }

      // Tạo ORDER_CREATED activity cho MoMo
      try {
        await prisma.activity.create({
          data: {
            userId: currentUser.id,
            type: 'ORDER_CREATED',
            title: 'Đơn hàng được tạo',
            description: `Tài khoản vừa tạo đơn hàng MoMo #${createdOrder.paymentIntentId.slice(-6).toUpperCase()}`,
            data: {
              orderId: createdOrder.id,
              paymentIntentId: createdOrder.paymentIntentId,
              amount: createdOrder.amount,
              paymentMethod: 'momo',
              products: products.slice(0, 3).map((product: any) => ({
                id: product.id,
                name: product.name,
                image: product.selectedImg?.images?.[0] || '/placeholder.png'
              }))
            }
          }
        });
      } catch (error) {
        console.error('Error creating ORDER_CREATED activity for MoMo:', error);
      }

      // Record voucher usage if voucher was used
      if (voucherData) {
        try {
          const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:${process.env.PORT || 3001}`;
          await fetch(`${baseUrl}/api/voucher/use`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              voucherId: voucherData.id,
              orderId: createdOrder.id
            })
          });
        } catch (error) {
          console.error('Error recording voucher usage:', error);
        }
      }

      // Gửi notifications và email cho MoMo
      await sendOrderNotifications(orderData, currentUser, 'momo');

      // Tạo thanh toán momo
      const accessKey = 'F8BBA842ECF85';
      const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
      const partnerCode = 'MOMO';
      const partnerName = 'Test';
      const storeId = 'MomoTestStore';
      const redirectUrl = 'localhost:3000/cart/orderconfirmation';
      const ipnUrl = 'localhost:3000/cart/orderconfirmation';
      const orderInfo = 'pay with MoMo';
      const requestType = 'payWithMethod';
      const amount = finalAmount;
      const orderId = createdOrder.id;
      const requestId = orderId;
      const extraData = '';
      const orderGroupId = '';
      const autoCapture = true;
      const lang = 'vi';

      // Tạo raw signature
      const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

      // Tạo signature sử dụng HMAC SHA256
      const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

      // JSON object gửi đến MoMo endpoint
      const requestBody = JSON.stringify({
        partnerCode: partnerCode,
        partnerName: partnerName,
        storeId: storeId,
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

      // Tùy chọn của request
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

      // Sử dụng Promises để thực hiện HTTPS request
      return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
          let data = '';

          res.on('data', chunk => {
            data += chunk;
          });

          res.on('end', () => {
            const jsonResponse = JSON.parse(data);
            if (res.statusCode === 200) {
              resolve(NextResponse.json({ payUrl: jsonResponse.payUrl, createdOrder: createdOrder }));
            } else {
              resolve(NextResponse.json({ error: jsonResponse }, { status: res.statusCode }));
            }
          });
        });

        req.on('error', e => {
          reject(NextResponse.json({ error: e.message }, { status: 500 }));
        });

        // Gửi request body
        req.write(requestBody);
        req.end();
      });
    } else {
      // Đảm bảo trả về một Response nếu không khớp với bất kỳ paymentMethod nào
      return NextResponse.json({ error: 'Lỗi không chọn phương thức thanh toán' }, { status: 400 });
    }

    //Lỗi 500
    // Tạo thông báo nếu đặt hàng thành công
    // await prisma.notification.create({
    // 	data: {
    // 		userId: currentUser.id, // ID của người đặt hàng
    // 		productId: products.map((product: any) => product.productId),
    // 		type: 'ORDER_PLACED',
    // 		message: `Đơn hàng của bạn đã được đặt thành công`,
    // 	},
    // });
    return NextResponse.json({ error: 'Đơn hàng được tạo thành công' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
function sendEmail(email: string, content: string) {
  try {
    // Cấu hình transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    const redirectLink = `http://localhost:3000/account/orders`;

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Đặt hàng thành công từ ThanhHuy Store',
      text: `${content} ${redirectLink}`
    };

    // Gửi email
    transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Lỗi khi gửi email:', error);
    throw new Error('Gửi email thất bại');
  }
}

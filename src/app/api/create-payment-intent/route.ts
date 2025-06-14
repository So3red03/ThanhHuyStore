import Stripe from 'stripe';
import prisma from '../../libs/prismadb';
import { CartProductType } from '@/app/(home)/product/[productId]/ProductDetails';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
// import { OrderStatus, DeliveryStatus } from '@prisma/client';
import { NotificationService } from '@/app/libs/notificationService';
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

// Function để gửi thông báo Discord
const sendDiscordNotification = async (orderData: any, currentUser: any) => {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('Discord webhook URL not configured');
      return;
    }

    // Format sản phẩm
    const productList = orderData.products.map((product: any, index: number) =>
      `${index + 1}. **${product.name}** - Số lượng: ${product.quantity} - Giá: ${product.price.toLocaleString('vi-VN')}₫`
    ).join('\n');

    // Tính tổng tiền
    const totalAmount = orderData.amount.toLocaleString('vi-VN');
    const originalAmount = orderData.originalAmount.toLocaleString('vi-VN');

    // Format địa chỉ
    const fullAddress = `${orderData.address.line1}, ${orderData.address.city}, ${orderData.address.country}`;

    const embed = {
      title: "🛒 **ĐƠN HÀNG MỚI**",
      color: 0x00ff00, // Màu xanh lá
      fields: [
        {
          name: "👤 **Thông tin khách hàng**",
          value: `**Tên:** ${currentUser.name || 'N/A'}\n**Email:** ${currentUser.email}\n**SĐT:** ${orderData.phoneNumber}`,
          inline: false
        },
        {
          name: "📍 **Địa chỉ giao hàng**",
          value: fullAddress,
          inline: false
        },
        {
          name: "🛍️ **Sản phẩm đặt mua**",
          value: productList,
          inline: false
        },
        {
          name: "💰 **Thông tin thanh toán**",
          value: `**Tổng tiền hàng:** ${originalAmount}₫\n**Phí ship:** ${orderData.shippingFee.toLocaleString('vi-VN')}₫\n**Giảm giá:** ${orderData.discountAmount.toLocaleString('vi-VN')}₫\n**Tổng thanh toán:** ${totalAmount}₫\n**Phương thức:** ${orderData.paymentMethod.toUpperCase()}`,
          inline: false
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: "ThanhHuy Store - Đơn hàng mới"
      }
    };

    await axios.post(webhookUrl, {
      embeds: [embed]
    });

    console.log('Discord notification sent successfully');
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

export async function POST(request: Request): Promise<Response> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { products, phoneNumber, address, payment_intent_id, shippingFee, paymentMethod, voucher } = body;

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
    status: 'pending',
    deliveryStatus: 'not_shipped',
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

        // Gửi email xác nhận đơn hàng
        await sendEmail(currentUser.email, 'Bấm vào link kế bên để theo dỗi đơn hàng: ');

        // Gửi thông báo Discord
        await sendDiscordNotification(orderData, currentUser);

        // Cập nhật danh mục đã mua cho user
        await updateUserPurchasedCategories(currentUser.id, products);

        // Tạo notification cho admin (sẽ gửi cho tất cả admin)
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' }
        });

        for (const admin of admins) {
          await NotificationService.createNotification({
            userId: admin.id,
            fromUserId: currentUser.id,
            type: 'ORDER_PLACED',
            title: 'Đơn hàng mới',
            message: `${currentUser.name} vừa đặt đơn hàng mới`,
            data: { paymentIntentId: payment_intent_id }
          });
        }

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

        await sendEmail(currentUser.email, 'Bấm vào link kế bên để theo dỗi đơn hàng: ');

        // Gửi thông báo Discord
        await sendDiscordNotification(orderData, currentUser);

        // Cập nhật danh mục đã mua cho user
        await updateUserPurchasedCategories(currentUser.id, products);

        // Tạo notification cho admin
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' }
        });

        for (const admin of admins) {
          await NotificationService.createNotification({
            userId: admin.id,
            orderId: createdOrder.id,
            fromUserId: currentUser.id,
            type: 'ORDER_PLACED',
            title: 'Đơn hàng mới (COD)',
            message: `${currentUser.name} vừa đặt đơn hàng COD`,
            data: { orderId: createdOrder.id, paymentMethod: 'cod' }
          });
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

      // Gửi email xác nhận đơn hàng
      await sendEmail(currentUser.email, 'Bấm vào link kế bên để theo dõi đơn hàng: ');

      // Gửi thông báo Discord
      await sendDiscordNotification(orderData, currentUser);

      // Cập nhật danh mục đã mua cho user
      await updateUserPurchasedCategories(currentUser.id, products);

      // Tạo notification cho admin
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' }
      });

      for (const admin of admins) {
        await NotificationService.createNotification({
          userId: admin.id,
          orderId: createdOrder.id,
          fromUserId: currentUser.id,
          type: 'ORDER_PLACED',
          title: 'Đơn hàng mới (MoMo)',
          message: `${currentUser.name} vừa đặt đơn hàng MoMo`,
          data: { orderId: createdOrder.id, paymentMethod: 'momo' }
        });
      }

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

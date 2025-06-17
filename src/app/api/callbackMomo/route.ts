import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';
import { OrderStatus } from '@prisma/client';
import crypto from 'crypto';

// MoMo signature verification
const verifyMoMoSignature = (data: any, signature: string) => {
  const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
  const {
    partnerCode,
    orderId,
    requestId,
    amount,
    orderInfo,
    orderType,
    transId,
    resultCode,
    message,
    payType,
    responseTime,
    extraData
  } = data;

  const rawSignature = `accessKey=F8BBA842ECF85&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

  const expectedSignature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

  return signature === expectedSignature;
};

export async function POST(req: any) {
  try {
    const body = await req.json();
    const { orderId, resultCode, signature, ...otherData } = body;

    console.log('MoMo Callback Received:', body);

    // SECURITY: Verify signature
    if (!signature || !verifyMoMoSignature(body, signature)) {
      console.error('Invalid MoMo signature');
      return NextResponse.json(
        {
          error: 'Invalid signature'
        },
        { status: 400 }
      );
    }

    // SECURITY: Validate orderId
    if (!orderId) {
      return NextResponse.json(
        {
          error: 'Missing orderId'
        },
        { status: 400 }
      );
    }

    if (resultCode === 0) {
      // Thanh toán thành công
      // SECURITY: Check if order exists and is in correct state
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true, amount: true, paymentIntentId: true }
      });

      if (!existingOrder) {
        console.error(`Order not found: ${orderId}`);
        return NextResponse.json(
          {
            error: 'Order not found'
          },
          { status: 404 }
        );
      }

      if (existingOrder.status === 'completed') {
        console.log(`Order already completed: ${orderId}`);
        return NextResponse.json({
          success: true,
          message: 'Order already processed'
        });
      }

      // SECURITY: Validate amount if provided
      if (otherData.amount && Math.abs(otherData.amount - existingOrder.amount) > 0.01) {
        console.error(
          `Amount mismatch for order ${orderId}: expected ${existingOrder.amount}, got ${otherData.amount}`
        );
        return NextResponse.json(
          {
            error: 'Amount mismatch'
          },
          { status: 400 }
        );
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.completed
        }
      });

      // Tự động tạo PDF và gửi email
      try {
        const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        await fetch(`${baseUrl}/api/orders/process-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: updatedOrder.id,
            paymentIntentId: updatedOrder.paymentIntentId
          })
        });
      } catch (error) {
        console.error('Error processing payment in MoMo callback:', error);
      }

      return NextResponse.json({ success: true, updatedOrder });
    } else {
      // SECURITY: Update order status to failed for failed payments
      try {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.canceled }
        });
      } catch (error) {
        console.error('Error updating failed order status:', error);
      }

      return NextResponse.json({
        success: false,
        message: 'Payment failed',
        resultCode: resultCode
      });
    }
  } catch (error) {
    console.error('MoMo callback error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

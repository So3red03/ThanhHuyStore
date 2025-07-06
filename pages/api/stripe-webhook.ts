import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { OrderStatus } from '@prisma/client';
import prisma from '../../src/app/libs/prismadb';
import { AuditLogger, AuditEventType, AuditSeverity } from '../../src/app/utils/auditLogger';

// Tránh parse dữ liệu vì bắt buộc dữ liệu là raw để xác minh chữ kí của stripe
export const config = {
  api: {
    bodyParser: false
  }
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10'
});

// Middleware lookalike
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  // Xác minh chữ ký
  if (!sig) {
    return res.status(400).send('Missing the stripe signature');
  }

  let event: Stripe.Event;
  // Phân tích dữ liệu sự kiện. Nếu chữ ký không hợp lệ hoặc có lỗi thì ném ra một status http.
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return res.status(400).send('Webhook error');
  }

  // Webhook event
  switch (event.type) {
    //Khi thanh toán thành công update status and address order in db
    case 'charge.succeeded':
      const charge: any = event.data.object as Stripe.Charge;

      if (typeof charge.payment_intent === 'string') {
        const updatedOrder = await prisma?.order.update({
          where: { paymentIntentId: charge.payment_intent },
          data: { status: OrderStatus.completed },
          include: {
            user: true
          }
        });

        // 🎯 AUDIT LOG: Stripe Payment Success
        if (updatedOrder) {
          await AuditLogger.log({
            eventType: AuditEventType.PAYMENT_SUCCESS,
            severity: AuditSeverity.HIGH, // HIGH because payment success is critical business event
            userId: updatedOrder.user.id,
            userEmail: updatedOrder.user.email!,
            userRole: updatedOrder.user.role || 'USER',
            ipAddress: 'stripe-webhook', // Special identifier for webhook
            userAgent: 'stripe-webhook',
            description: `Thanh toán Stripe thành công: ${updatedOrder.amount.toLocaleString()} VND`,
            details: {
              paymentIntentId: charge.payment_intent,
              orderId: updatedOrder.id,
              paymentMethod: 'stripe',
              amount: updatedOrder.amount,
              chargeId: charge.id,
              customerEmail: updatedOrder.user.email,
              customerName: updatedOrder.user.name,
              webhookEvent: 'charge.succeeded',
              processedAt: new Date()
            },
            resourceId: updatedOrder.id,
            resourceType: 'Order'
          });
        }

        // Tự động tạo PDF và gửi email
        if (updatedOrder) {
          try {
            const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const response = await fetch(`${baseUrl}/api/orders/process-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: updatedOrder.id,
                paymentIntentId: charge.payment_intent
              })
            });

            if (!response.ok) {
              console.error('Failed to process payment:', await response.text());
            } else {
              console.log('Payment processed successfully in webhook');
            }
          } catch (error) {
            console.error('Error processing payment in webhook:', error);
          }
        }
      }
      break;
    default:
      console.log('Unhandled event type: ' + event.type);
  }
  // Gửi phản hồi JSON về cho Stripe để xác nhận rằng webhook đã được nhận và xử lý thành công
  res.json({ received: true });
}

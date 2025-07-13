import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';
import { OrderStatus } from '@prisma/client';
import { MoMoSecurity } from '@/app/utils/momoSecurity';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';

export async function POST(req: any) {
  try {
    const body = await req.json();
    const { orderId, resultCode, signature, amount, requestId } = body;


    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // SECURITY: Rate limiting check
    if (!MoMoSecurity.checkRateLimit(clientIP)) {
      MoMoSecurity.logSecurityEvent('RATE_LIMIT_EXCEEDED', { clientIP, orderId });
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // SECURITY: Validate required fields
    const fieldValidation = MoMoSecurity.validateRequiredFields(body);
    if (!fieldValidation.isValid) {
      MoMoSecurity.logSecurityEvent('MISSING_REQUIRED_FIELDS', {
        missingFields: fieldValidation.missingFields,
        orderId,
        clientIP
      });
      return NextResponse.json(
        { error: 'Missing required fields', details: fieldValidation.missingFields },
        { status: 400 }
      );
    }

    // SECURITY: Verify signature
    if (!MoMoSecurity.verifySignature(body, signature)) {
      MoMoSecurity.logSecurityEvent('INVALID_SIGNATURE', {
        receivedSignature: signature,
        orderId,
        clientIP
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // SECURITY: Check for replay attacks
    const isReplay = await MoMoSecurity.checkReplayAttack(requestId, orderId);
    if (isReplay) {
      MoMoSecurity.logSecurityEvent('REPLAY_ATTACK_DETECTED', {
        requestId,
        orderId,
        clientIP
      });
      return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
    }

    if (resultCode === 0) {
      // Thanh toán thành công
      MoMoSecurity.logSecurityEvent('PAYMENT_SUCCESS_CALLBACK', {
        orderId,
        requestId,
        amount,
        clientIP
      });

      // SECURITY: Check if order exists and is in correct state
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true, amount: true, paymentIntentId: true }
      });

      if (!existingOrder) {
        MoMoSecurity.logSecurityEvent('ORDER_NOT_FOUND', {
          orderId,
          requestId,
          clientIP
        });
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      if (existingOrder.status === 'completed') {
        MoMoSecurity.logSecurityEvent('DUPLICATE_PAYMENT_CALLBACK', {
          orderId,
          requestId,
          existingStatus: existingOrder.status,
          clientIP
        });
        return NextResponse.json({
          success: true,
          message: 'Order already processed'
        });
      }

      // SECURITY: Validate amount
      if (amount && !MoMoSecurity.validateAmount(existingOrder.amount, amount)) {
        MoMoSecurity.logSecurityEvent('AMOUNT_MISMATCH', {
          orderId,
          requestId,
          expectedAmount: existingOrder.amount,
          receivedAmount: amount,
          clientIP
        });
        return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.completed
        },
        include: {
          user: true
        }
      });

      // 🎯 AUDIT LOG: MoMo Payment Success
      await AuditLogger.log({
        eventType: AuditEventType.PAYMENT_SUCCESS,
        severity: AuditSeverity.HIGH, // HIGH because payment success is critical business event
        userId: updatedOrder.user.id,
        userEmail: updatedOrder.user.email!,
        userRole: updatedOrder.user.role || 'USER',
        ipAddress: clientIP,
        userAgent: 'momo-callback',
        description: `Thanh toán MoMo thành công: ${updatedOrder.amount.toLocaleString()} VND`,
        details: {
          orderId,
          requestId,
          paymentMethod: 'momo',
          amount: updatedOrder.amount,
          resultCode: 0,
          customerEmail: updatedOrder.user.email,
          customerName: updatedOrder.user.name,
          callbackEvent: 'payment_success',
          processedAt: new Date()
        },
        resourceId: updatedOrder.id,
        resourceType: 'Order'
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

      MoMoSecurity.logSecurityEvent('PAYMENT_PROCESSED_SUCCESSFULLY', {
        orderId,
        requestId,
        amount,
        clientIP
      });

      return NextResponse.json({ success: true, updatedOrder });
    } else {
      // Payment failed
      MoMoSecurity.logSecurityEvent('PAYMENT_FAILED', {
        orderId,
        requestId,
        resultCode,
        amount,
        clientIP
      });

      // Update order status to failed and rollback inventory/vouchers
      try {
        const failedOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.canceled,
            cancelReason: `MoMo payment failed - Result code: ${resultCode}`,
            cancelDate: new Date()
          },
          include: {
            user: true
          }
        });

        // 🎯 AUDIT LOG: MoMo Payment Failed
        await AuditLogger.log({
          eventType: AuditEventType.PAYMENT_FAILED,
          severity: AuditSeverity.HIGH, // HIGH because payment failure affects business
          userId: failedOrder.user.id,
          userEmail: failedOrder.user.email!,
          userRole: failedOrder.user.role || 'USER',
          ipAddress: clientIP,
          userAgent: 'momo-callback',
          description: `Thanh toán MoMo thất bại: ${failedOrder.amount.toLocaleString()} VND`,
          details: {
            orderId,
            requestId,
            paymentMethod: 'momo',
            amount: failedOrder.amount,
            resultCode,
            failureReason: `MoMo payment failed - Result code: ${resultCode}`,
            customerEmail: failedOrder.user.email,
            customerName: failedOrder.user.name,
            callbackEvent: 'payment_failed',
            processedAt: new Date()
          },
          resourceId: failedOrder.id,
          resourceType: 'Order'
        });

        // Trigger inventory and voucher rollback
        try {
          const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
          await fetch(`${baseUrl}/api/orders/rollback-inventory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              reason: `MoMo payment failed - Result code: ${resultCode}`
            })
          });
        } catch (rollbackError) {
          console.error('Error triggering rollback:', rollbackError);
          MoMoSecurity.logSecurityEvent('ROLLBACK_FAILED', {
            orderId,
            requestId,
            error: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
            clientIP
          });
        }
      } catch (error) {
        console.error('Error updating failed order status:', error);
        MoMoSecurity.logSecurityEvent('ORDER_UPDATE_FAILED', {
          orderId,
          requestId,
          error: error instanceof Error ? error.message : String(error),
          clientIP
        });
      }

      return NextResponse.json({
        success: false,
        message: 'Payment failed',
        resultCode: resultCode
      });
    }
  } catch (error) {
    console.error('MoMo callback error:', error);

    MoMoSecurity.logSecurityEvent('CALLBACK_ERROR', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      clientIP: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

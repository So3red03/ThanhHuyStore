import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import { PDFGenerator } from '@/app/services/pdfGenerator';
import MongoService from '@/app/services/mongoService';
import EmailService from '@/app/services/emailService';
import { AuditLogger } from '@/app/utils/auditLogger';

export async function POST(request: NextRequest) {
  try {
    const { orderId, paymentIntentId } = await request.json();

    if (!orderId || !paymentIntentId) {
      return NextResponse.json({ error: 'Order ID and Payment Intent ID are required' }, { status: 400 });
    }

    // Lấy thông tin đơn hàng
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Confirm voucher usage after successful payment
    if (order.voucherId) {
      try {
        await prisma.userVoucher.updateMany({
          where: {
            userId: order.userId,
            voucherId: order.voucherId,
            reservedForOrderId: order.paymentIntentId
          },
          data: {
            orderId: order.id,
            reservedForOrderId: null, // Clear reservation
            usedAt: new Date()
          }
        });
        console.log(`Voucher usage confirmed for order ${order.id}`);
      } catch (voucherError) {
        console.error('Error confirming voucher usage:', voucherError);
        // Don't fail the payment process for voucher confirmation errors
      }
    }

    // Kiểm tra xem PDF đã tồn tại chưa
    const pdfExists = await MongoService.pdfExists(orderId, 'invoice');
    let pdfFileId: string | null = null;

    if (!pdfExists) {
      try {
        // Tạo PDF
        const pdfGenerator = new PDFGenerator();
        const pdfBuffer = await pdfGenerator.generateOrderInvoice({
          id: order.id,
          amount: order.amount,
          createDate: order.createdAt,
          paymentIntentId: order.paymentIntentId,
          phoneNumber: order.phoneNumber || undefined,
          address: order.address
            ? {
                line1: order.address.line1,
                line2: order.address.line2 || undefined,
                city: order.address.city,
                postal_code: order.address.postal_code,
                country: order.address.country
              }
            : undefined,
          paymentMethod: order.paymentMethod || undefined,
          shippingFee: order.shippingFee || undefined,
          discountAmount: order.discountAmount || undefined,
          originalAmount: order.originalAmount || undefined,
          voucherCode: order.voucherCode || undefined,
          user: {
            name: order.user.name || 'Unknown',
            email: order.user.email
          },
          products: (order.products || []).map((product: any) => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            quantity: product.quantity,
            selectedImg: product.selectedImg
          }))
        });

        // Lưu PDF vào MongoDB
        const fileId = await MongoService.savePDF(pdfBuffer, orderId, order.paymentIntentId, order.userId, 'invoice');

        pdfFileId = fileId.toString();

        console.log('PDF created successfully:', pdfFileId);
      } catch (pdfError) {
        console.error('Error creating PDF:', pdfError);
        // Tiếp tục xử lý mà không có PDF
      }
    } else {
      // Lấy PDF đã tồn tại
      const existingPdfs = await MongoService.getPDFsByOrderId(orderId);
      if (existingPdfs.length > 0) {
        pdfFileId = existingPdfs[0]._id?.toString() || null;
      }
    }

    // 🚀 MIGRATED: Track payment success with AuditLogger
    await AuditLogger.trackPaymentSuccess(order.userId, order.id, order.amount, 'stripe');

    // 🚀 MIGRATED: PDF tracking now handled in AuditLog details
    // PDF file ID is automatically included in payment success tracking

    // Gửi email xác nhận với PDF đính kèm
    try {
      const emailService = new EmailService();
      await emailService.sendOrderConfirmationWithPDF({
        orderId: order.id,
        paymentIntentId: order.paymentIntentId,
        customerName: order.user.name || 'Khách hàng',
        customerEmail: order.user.email,
        amount: order.amount,
        products: order.products.map((product: any) => ({
          name: product.name,
          quantity: product.quantity,
          price: product.price
        })),
        pdfFileId: pdfFileId || undefined
      });

      console.log('Order confirmation email sent successfully');
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Không throw error để không ảnh hưởng đến quá trình thanh toán
    }

    // Gửi notifications (Discord + Admin notifications) - chỉ 1 lần
    try {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      await fetch(`${baseUrl}/api/orders/send-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          paymentIntentId: order.paymentIntentId
        })
      });
      console.log('Order notifications sent successfully');
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError);
      // Không throw error để không ảnh hưởng đến quá trình thanh toán
    }

    return NextResponse.json({
      message: 'Payment processed successfully',
      orderId,
      pdfFileId,
      activityCreated: true,
      emailSent: true
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

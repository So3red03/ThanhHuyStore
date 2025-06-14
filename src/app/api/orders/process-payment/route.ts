import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import { PDFGenerator } from '@/app/services/pdfGenerator';
import MongoService from '@/app/services/mongoService';
import EmailService from '@/app/services/emailService';

export async function POST(request: NextRequest) {
  try {
    const { orderId, paymentIntentId } = await request.json();

    if (!orderId || !paymentIntentId) {
      return NextResponse.json(
        { error: 'Order ID and Payment Intent ID are required' },
        { status: 400 }
      );
    }

    // Lấy thông tin đơn hàng
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
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
          createDate: order.createDate,
          paymentIntentId: order.paymentIntentId,
          phoneNumber: order.phoneNumber || undefined,
          address: order.address || undefined,
          paymentMethod: order.paymentMethod || undefined,
          shippingFee: order.shippingFee || undefined,
          discountAmount: order.discountAmount || undefined,
          originalAmount: order.originalAmount || undefined,
          voucherCode: order.voucherCode || undefined,
          user: {
            name: order.user.name || 'Unknown',
            email: order.user.email,
          },
          products: order.products || [],
        });

        // Lưu PDF vào MongoDB
        const fileId = await MongoService.savePDF(
          pdfBuffer,
          orderId,
          order.paymentIntentId,
          order.userId,
          'invoice'
        );

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

    // Tạo activity log cho payment success
    await prisma.activity.create({
      data: {
        userId: order.userId,
        type: 'PAYMENT_SUCCESS',
        title: 'Thanh toán thành công',
        description: `Đơn hàng #${order.paymentIntentId.slice(-6).toUpperCase()} đã được thanh toán thành công`,
        data: {
          orderId: order.id,
          paymentIntentId: order.paymentIntentId,
          amount: order.amount,
          ...(pdfFileId && { pdfFileId }),
        },
      },
    });

    // Cập nhật activity ORDER_CREATED để thêm pdfFileId nếu có
    if (pdfFileId) {
      try {
        const orderCreatedActivity = await prisma.activity.findFirst({
          where: {
            userId: order.userId,
            type: 'ORDER_CREATED',
            data: {
              path: ['orderId'],
              equals: order.id,
            },
          },
        });

        if (orderCreatedActivity) {
          await prisma.activity.update({
            where: { id: orderCreatedActivity.id },
            data: {
              data: {
                ...orderCreatedActivity.data,
                pdfFileId,
              },
            },
          });
        }
      } catch (error) {
        console.error('Error updating ORDER_CREATED activity:', error);
        // Không throw error để không ảnh hưởng đến quá trình chính
      }
    }

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
          price: product.price,
        })),
        pdfFileId: pdfFileId || undefined,
      });

      console.log('Order confirmation email sent successfully');
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Không throw error để không ảnh hưởng đến quá trình thanh toán
    }

    return NextResponse.json({
      message: 'Payment processed successfully',
      orderId,
      pdfFileId,
      activityCreated: true,
      emailSent: true,
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

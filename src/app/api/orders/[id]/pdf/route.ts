import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { PDFGenerator } from '@/app/services/pdfGenerator';
import MongoService from '@/app/services/mongoService';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = params.id;

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

    // Kiểm tra quyền truy cập (admin hoặc chủ đơn hàng)
    if (currentUser.role !== 'ADMIN' && currentUser.id !== order.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Kiểm tra xem PDF đã tồn tại chưa
    const existingPdfs = await MongoService.getPDFsByOrderId(orderId);
    let pdfBuffer: Buffer;

    if (existingPdfs.length > 0) {
      // Lấy PDF đã tồn tại
      const { buffer } = await MongoService.getPDF(existingPdfs[0]._id!.toString());
      pdfBuffer = buffer;
    } else {
      // Tạo PDF mới
      const pdfGenerator = new PDFGenerator();
      pdfBuffer = await pdfGenerator.generateOrderInvoice({
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

      // Lưu PDF vào MongoDB để lần sau không phải tạo lại
      await MongoService.savePDF(pdfBuffer, orderId, order.paymentIntentId, order.userId, 'invoice');
    }

    // Trả về PDF để download
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${order.paymentIntentId.slice(-6).toUpperCase()}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Error creating PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

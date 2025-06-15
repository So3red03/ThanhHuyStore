import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { PDFGenerator } from '@/app/services/pdfGenerator';
import MongoService from '@/app/services/mongoService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Kiểm tra quyền truy cập (admin hoặc chủ đơn hàng)
    if (currentUser.role !== 'ADMIN' && currentUser.id !== order.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Kiểm tra xem PDF đã tồn tại chưa
    const pdfExists = await MongoService.pdfExists(orderId, 'invoice');
    if (pdfExists) {
      return NextResponse.json({ 
        message: 'PDF already exists',
        orderId 
      });
    }

    // Tạo PDF
    const pdfGenerator = new PDFGenerator();
    const pdfBuffer = await pdfGenerator.generateOrderInvoice({
      id: order.id,
      amount: order.amount,
      createDate: order.createDate,
      paymentIntentId: order.paymentIntentId,
      phoneNumber: order.phoneNumber || undefined,
      address: order.address ? {
        line1: order.address.line1,
        line2: order.address.line2 || undefined,
        city: order.address.city,
        postal_code: order.address.postal_code,
        country: order.address.country,
      } : undefined,
      paymentMethod: order.paymentMethod || undefined,
      shippingFee: order.shippingFee || undefined,
      discountAmount: order.discountAmount || undefined,
      originalAmount: order.originalAmount || undefined,
      voucherCode: order.voucherCode || undefined,
      user: {
        name: order.user.name || 'Unknown',
        email: order.user.email,
      },
      products: (order.products || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        quantity: product.quantity,
        selectedImg: product.selectedImg,
      })),
    });

    // Lưu PDF vào MongoDB
    const fileId = await MongoService.savePDF(
      pdfBuffer,
      orderId,
      order.paymentIntentId,
      order.userId,
      'invoice'
    );

    // Tạo activity log
    await prisma.activity.create({
      data: {
        userId: order.userId,
        type: 'PAYMENT_SUCCESS',
        title: 'Hóa đơn đã được tạo',
        description: `Hóa đơn PDF cho đơn hàng #${order.paymentIntentId.slice(-6).toUpperCase()} đã được tạo`,
        data: {
          orderId: order.id,
          paymentIntentId: order.paymentIntentId,
          pdfFileId: fileId.toString(),
          amount: order.amount,
        },
      },
    });

    return NextResponse.json({
      message: 'PDF created successfully',
      orderId,
      fileId: fileId.toString(),
    });

  } catch (error) {
    console.error('Error creating PDF:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Kiểm tra quyền truy cập
    if (currentUser.role !== 'ADMIN' && currentUser.id !== order.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Lấy danh sách PDF của đơn hàng
    const pdfs = await MongoService.getPDFsByOrderId(orderId);

    return NextResponse.json({
      orderId,
      pdfs: pdfs.map(pdf => ({
        id: pdf._id?.toString(),
        filename: pdf.filename,
        size: pdf.size,
        uploadDate: pdf.uploadDate,
        type: pdf.metadata?.type,
      })),
    });

  } catch (error) {
    console.error('Error getting PDFs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { PDFGenerator } from '@/app/services/pdfGenerator';
import MongoService from '@/app/services/mongoService';
import EmailService from '@/app/services/emailService';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Lấy đơn hàng đầu tiên để test
    const testOrder = await prisma.order.findFirst({
      include: {
        user: true,
      },
      orderBy: {
        createDate: 'desc',
      },
    });

    if (!testOrder) {
      return NextResponse.json({ error: 'No orders found for testing' }, { status: 404 });
    }

    console.log('Testing with order:', testOrder.id);

    // Test 1: PDF Generation
    console.log('Step 1: Testing PDF generation...');
    const pdfGenerator = new PDFGenerator();
    const pdfBuffer = await pdfGenerator.generateOrderInvoice({
      id: testOrder.id,
      amount: testOrder.amount,
      createDate: testOrder.createDate,
      paymentIntentId: testOrder.paymentIntentId,
      phoneNumber: testOrder.phoneNumber || undefined,
      address: testOrder.address || undefined,
      paymentMethod: testOrder.paymentMethod || undefined,
      shippingFee: testOrder.shippingFee || undefined,
      discountAmount: testOrder.discountAmount || undefined,
      originalAmount: testOrder.originalAmount || undefined,
      voucherCode: testOrder.voucherCode || undefined,
      user: {
        name: testOrder.user.name || 'Test User',
        email: testOrder.user.email,
      },
      products: testOrder.products || [],
    });
    console.log('✅ PDF generated successfully, size:', pdfBuffer.length);

    // Test 2: MongoDB Storage
    console.log('Step 2: Testing MongoDB storage...');
    const fileId = await MongoService.savePDF(
      pdfBuffer,
      testOrder.id,
      testOrder.paymentIntentId,
      testOrder.userId,
      'invoice'
    );
    console.log('✅ PDF saved to MongoDB, fileId:', fileId.toString());

    // Test 3: PDF Retrieval
    console.log('Step 3: Testing PDF retrieval...');
    const { buffer: retrievedBuffer, metadata } = await MongoService.getPDF(fileId.toString());
    console.log('✅ PDF retrieved successfully, size:', retrievedBuffer.length);
    console.log('Metadata:', metadata.metadata);

    // Test 4: Activity Creation
    console.log('Step 4: Testing activity creation...');
    const activity = await prisma.activity.create({
      data: {
        userId: testOrder.userId,
        type: 'PAYMENT_SUCCESS',
        title: 'Test PDF Generation',
        description: `Test PDF cho đơn hàng #${testOrder.paymentIntentId.slice(-6).toUpperCase()}`,
        data: {
          orderId: testOrder.id,
          paymentIntentId: testOrder.paymentIntentId,
          pdfFileId: fileId.toString(),
          amount: testOrder.amount,
          isTest: true,
        },
      },
    });
    console.log('✅ Activity created successfully, id:', activity.id);

    // Test 5: Email Service (without actually sending)
    console.log('Step 5: Testing email service (dry run)...');
    const emailService = new EmailService();
    const emailHTML = (emailService as any).generateOrderEmailHTML({
      orderId: testOrder.id,
      paymentIntentId: testOrder.paymentIntentId,
      customerName: testOrder.user.name || 'Test User',
      customerEmail: testOrder.user.email,
      amount: testOrder.amount,
      products: testOrder.products.map((product: any) => ({
        name: product.name,
        quantity: product.quantity,
        price: product.price,
      })),
      pdfFileId: fileId.toString(),
    });
    console.log('✅ Email HTML generated successfully, length:', emailHTML.length);

    // Test 6: PDF List
    console.log('Step 6: Testing PDF list retrieval...');
    const pdfList = await MongoService.getPDFsByOrderId(testOrder.id);
    console.log('✅ PDF list retrieved, count:', pdfList.length);

    return NextResponse.json({
      success: true,
      message: 'All tests passed successfully!',
      results: {
        orderId: testOrder.id,
        pdfFileId: fileId.toString(),
        pdfSize: pdfBuffer.length,
        activityId: activity.id,
        emailHTMLLength: emailHTML.length,
        pdfCount: pdfList.length,
      },
      testSteps: [
        '✅ PDF Generation',
        '✅ MongoDB Storage',
        '✅ PDF Retrieval',
        '✅ Activity Creation',
        '✅ Email HTML Generation',
        '✅ PDF List Retrieval',
      ],
    });

  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json(
      { 
        error: 'Test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'PDF Test Endpoint',
    usage: 'POST to this endpoint to run comprehensive PDF system tests',
    requirements: 'Must be logged in as ADMIN',
  });
}

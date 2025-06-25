import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get a sample order for testing
    const sampleOrder = await prisma.order.findFirst({
      include: {
        user: true,
      },
      orderBy: {
        createDate: 'desc',
      },
    });

    if (!sampleOrder) {
      return NextResponse.json({ error: 'No orders found' }, { status: 404 });
    }

    // Return sample data for testing
    return NextResponse.json({
      orderId: sampleOrder.id,
      orderCode: sampleOrder.paymentIntentId.slice(-6).toUpperCase(),
      shippingCode: sampleOrder.shippingCode || 'GHN123456', // Use real shipping code if exists
      paymentIntentId: sampleOrder.paymentIntentId,
      status: sampleOrder.status,
      deliveryStatus: sampleOrder.deliveryStatus,
      amount: sampleOrder.amount,
      createDate: sampleOrder.createDate,
      user: {
        name: sampleOrder.user.name,
        email: sampleOrder.user.email
      }
    });
  } catch (error) {
    console.error('Error fetching sample order:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

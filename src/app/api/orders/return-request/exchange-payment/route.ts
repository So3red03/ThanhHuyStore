import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

interface ExchangePaymentRequest {
  returnRequestId: string;
  paymentMethod: 'cod' | 'momo';
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ExchangePaymentRequest = await request.json();
    const { returnRequestId, paymentMethod } = body;

    if (!returnRequestId || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: returnRequestId, paymentMethod' },
        { status: 400 }
      );
    }

    // Get return request with exchange order
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: {
        order: true
      }
    });

    if (!returnRequest) {
      return NextResponse.json({ error: 'Return request not found' }, { status: 404 });
    }

    if (returnRequest.type !== 'EXCHANGE') {
      return NextResponse.json({ error: 'Not an exchange request' }, { status: 400 });
    }

    if (!returnRequest.exchangeOrderId) {
      return NextResponse.json({ error: 'Exchange order not found' }, { status: 400 });
    }

    // Get exchange order
    const exchangeOrder = await prisma.order.findUnique({
      where: { id: returnRequest.exchangeOrderId }
    });

    if (!exchangeOrder) {
      return NextResponse.json({ error: 'Exchange order not found' }, { status: 404 });
    }

    const priceDifference = returnRequest.additionalCost || 0;

    if (priceDifference <= 0) {
      return NextResponse.json(
        { error: 'No additional payment required' },
        { status: 400 }
      );
    }

    // Update exchange order with payment method
    const updatedOrder = await prisma.order.update({
      where: { id: returnRequest.exchangeOrderId },
      data: {
        paymentMethod: paymentMethod,
        status: paymentMethod === 'cod' ? 'confirmed' : 'pending'
      }
    });

    if (paymentMethod === 'momo') {
      // TODO: Integrate with MoMo payment for additional cost
      // For now, just return success
      return NextResponse.json({
        success: true,
        message: 'MoMo payment integration coming soon',
        order: updatedOrder,
        paymentRequired: priceDifference
      });
    } else {
      // COD - confirm immediately
      return NextResponse.json({
        success: true,
        message: 'Exchange payment method updated to COD',
        order: updatedOrder,
        paymentRequired: priceDifference
      });
    }

  } catch (error) {
    console.error('Exchange payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET method to check payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const returnRequestId = searchParams.get('returnRequestId');

    if (!returnRequestId) {
      return NextResponse.json(
        { error: 'Missing returnRequestId parameter' },
        { status: 400 }
      );
    }

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: {
        order: true
      }
    });

    if (!returnRequest) {
      return NextResponse.json({ error: 'Return request not found' }, { status: 404 });
    }

    const exchangeOrder = returnRequest.exchangeOrderId 
      ? await prisma.order.findUnique({
          where: { id: returnRequest.exchangeOrderId }
        })
      : null;

    return NextResponse.json({
      success: true,
      returnRequest,
      exchangeOrder,
      priceDifference: returnRequest.additionalCost || 0,
      paymentRequired: (returnRequest.additionalCost || 0) > 0,
      paymentStatus: exchangeOrder?.status || 'pending'
    });

  } catch (error) {
    console.error('Exchange payment status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

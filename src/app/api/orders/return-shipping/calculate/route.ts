import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb';
import { SimpleReturnCalculator } from '../../../../../../utils/shipping/calculator';

interface ReturnShippingCalculationRequest {
  orderId: string;
  reason: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: ReturnShippingCalculationRequest = await request.json();
    const { orderId, reason, items } = body;

    // Validate required fields
    if (!orderId || !reason || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, reason, and items' },
        { status: 400 }
      );
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get admin settings
    const settings = await prisma.adminSettings.findFirst();
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 500 });
    }

    // Create return request object for calculation
    const returnRequest = {
      reason,
      items
    };

    // Calculate return shipping breakdown
    const breakdown = SimpleReturnCalculator.getReturnShippingBreakdown(
      returnRequest,
      order,
      settings
    );

    // Get detailed calculation
    const calculation = SimpleReturnCalculator.calculate(
      returnRequest,
      order,
      settings
    );

    return NextResponse.json({
      success: true,
      breakdown,
      calculation,
      order: {
        id: order.id,
        originalShippingFee: order.shippingFee || 0,
        address: order.address
      },
      settings: {
        returnShippingPolicy: settings.returnShippingPolicy,
        baseShippingFee: settings.baseShippingFee
      }
    });
  } catch (error) {
    console.error('Return shipping calculation error:', error);
    return NextResponse.json(
      { 
        error: 'Return shipping calculation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// GET method for testing purposes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const reason = searchParams.get('reason') || 'CHANGE_MIND';

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get admin settings
    const settings = await prisma.adminSettings.findFirst();
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 500 });
    }

    // Create mock return request for testing
    const mockReturnRequest = {
      reason,
      items: (order.products as any[]).map(product => ({
        id: product.id,
        name: product.name,
        quantity: product.quantity,
        unitPrice: product.price
      }))
    };

    // Calculate return shipping breakdown
    const breakdown = SimpleReturnCalculator.getReturnShippingBreakdown(
      mockReturnRequest,
      order,
      settings
    );

    return NextResponse.json({
      success: true,
      testParams: { orderId, reason },
      breakdown,
      order: {
        id: order.id,
        originalShippingFee: order.shippingFee || 0,
        address: order.address
      }
    });
  } catch (error) {
    console.error('Return shipping test error:', error);
    return NextResponse.json(
      { 
        error: 'Test endpoint error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

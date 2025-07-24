import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb';
import { SimpleShippingCalculator } from '../../../../../../utils/shipping/calculator';

interface ShippingCalculationRequest {
  customerAddress: {
    province: string;
    district: string;
    ward: string;
  };
  orderValue: number;
  shippingType?: 'standard' | 'fast';
  totalWeight?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ShippingCalculationRequest = await request.json();
    const { customerAddress, orderValue, shippingType, totalWeight } = body;

    // Validate required fields
    if (!customerAddress || !customerAddress.province || orderValue === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: customerAddress.province and orderValue' },
        { status: 400 }
      );
    }

    // Get admin settings
    const settings = await prisma.adminSettings.findFirst();
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 500 });
    }

    // Note: Removed delivery distance validation - all locations supported

    // Calculate shipping options
    const shippingOptions = SimpleShippingCalculator.calculate(
      {
        customerAddress,
        orderValue,
        totalWeight
      },
      settings
    );

    // Get detailed breakdown
    const breakdown = SimpleShippingCalculator.getShippingBreakdown(
      {
        customerAddress,
        orderValue,
        totalWeight
      },
      settings
    );

    // Find selected option if shippingType is specified
    const selectedOption = shippingType ? shippingOptions.find((opt: any) => opt.type === shippingType) : null;

    return NextResponse.json({
      success: true,
      shippingOptions,
      selectedOption,
      breakdown: {
        distance: breakdown.distance,
        baseShipping: breakdown.baseShipping,
        distanceFee: breakdown.distanceFee,
        totalFee: breakdown.totalFee,
        isFreeShipping: breakdown.isFreeShipping,
        freeShippingThreshold: breakdown.freeShippingThreshold
      },
      settings: {
        freeShippingThreshold: settings.freeShippingThreshold,
        shopLocation: {
          province: settings.shopProvince,
          district: settings.shopDistrict,
          ward: settings.shopWard
        }
      }
    });
  } catch (error) {
    console.error('Shipping calculation error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error during shipping calculation',
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
    const province = searchParams.get('province') || 'TP. Hồ Chí Minh';
    const district = searchParams.get('district') || 'Quận 3';
    const ward = searchParams.get('ward') || 'Phường 1';
    const orderValue = Number(searchParams.get('orderValue')) || 300000;

    const settings = await prisma.adminSettings.findFirst();
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 500 });
    }

    const customerAddress = { province, district, ward };
    const shippingOptions = SimpleShippingCalculator.calculate(
      {
        customerAddress,
        orderValue
      },
      settings
    );

    const breakdown = SimpleShippingCalculator.getShippingBreakdown(
      {
        customerAddress,
        orderValue
      },
      settings
    );

    return NextResponse.json({
      success: true,
      testParams: { province, district, ward, orderValue },
      shippingOptions,
      breakdown,
      settings: {
        shopLocation: {
          province: settings.shopProvince,
          district: settings.shopDistrict,
          ward: settings.shopWard
        },
        freeShippingThreshold: settings.freeShippingThreshold,
        baseShippingFee: settings.baseShippingFee,
        shippingPerKm: settings.shippingPerKm
      }
    });
  } catch (error) {
    console.error('Shipping test error:', error);
    return NextResponse.json(
      { error: 'Test endpoint error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

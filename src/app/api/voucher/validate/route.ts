import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import { getCurrentUser } from '@/app/actions/getCurrentUser';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { voucherId, cartTotal } = body;

    if (!voucherId || !cartTotal) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get voucher details
    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId }
    });

    if (!voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    // Validate voucher
    const now = new Date();
    
    if (!voucher.isActive) {
      return NextResponse.json({ error: 'Voucher is not active' }, { status: 400 });
    }

    if (voucher.startDate > now) {
      return NextResponse.json({ error: 'Voucher has not started yet' }, { status: 400 });
    }

    if (voucher.endDate < now) {
      return NextResponse.json({ error: 'Voucher has expired' }, { status: 400 });
    }

    if (voucher.quantity <= voucher.usedCount) {
      return NextResponse.json({ error: 'Voucher is out of stock' }, { status: 400 });
    }

    if (voucher.minOrderValue && cartTotal < voucher.minOrderValue) {
      return NextResponse.json({ 
        error: `Minimum order value is ${voucher.minOrderValue.toLocaleString('vi-VN')} VNĐ` 
      }, { status: 400 });
    }

    // Check user usage limit
    const userVoucherUsage = await prisma.userVoucher.count({
      where: {
        userId: currentUser.id,
        voucherId: voucher.id
      }
    });

    if (userVoucherUsage >= voucher.maxUsagePerUser) {
      return NextResponse.json({ 
        error: 'You have reached the maximum usage limit for this voucher' 
      }, { status: 400 });
    }

    // Calculate discount
    let discountAmount = 0;
    if (voucher.discountType === 'PERCENTAGE') {
      discountAmount = (cartTotal * voucher.discountValue) / 100;
      if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
        discountAmount = voucher.maxDiscount;
      }
    } else {
      discountAmount = voucher.discountValue;
    }

    return NextResponse.json({
      valid: true,
      voucher,
      discountAmount,
      finalAmount: cartTotal - discountAmount
    });

  } catch (error) {
    console.error('Error validating voucher:', error);
    return NextResponse.json({ error: 'Failed to validate voucher' }, { status: 500 });
  }
}

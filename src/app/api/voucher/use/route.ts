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
    const { voucherId, orderId } = body;

    if (!voucherId || !orderId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if voucher exists and is valid
    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId }
    });

    if (!voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    // Check if user has already used this voucher
    const existingUsage = await prisma.userVoucher.findFirst({
      where: {
        userId: currentUser.id,
        voucherId: voucherId
      }
    });

    if (existingUsage) {
      return NextResponse.json({ error: 'Voucher already used' }, { status: 400 });
    }

    // Check user usage limit
    const userUsageCount = await prisma.userVoucher.count({
      where: {
        userId: currentUser.id,
        voucherId: voucherId
      }
    });

    if (userUsageCount >= voucher.maxUsagePerUser) {
      return NextResponse.json({ error: 'User has reached maximum usage limit' }, { status: 400 });
    }

    // Record voucher usage
    await prisma.userVoucher.create({
      data: {
        userId: currentUser.id,
        voucherId: voucherId,
        usedAt: new Date()
      }
    });

    // Update voucher used count
    await prisma.voucher.update({
      where: { id: voucherId },
      data: {
        usedCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json({ success: true, message: 'Voucher usage recorded successfully' });
  } catch (error) {
    console.error('Error recording voucher usage:', error);
    return NextResponse.json({ error: 'Failed to record voucher usage' }, { status: 500 });
  }
}

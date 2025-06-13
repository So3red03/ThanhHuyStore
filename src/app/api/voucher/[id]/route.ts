import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    code,
    description,
    image,
    discountType,
    discountValue,
    minOrderValue,
    maxDiscount,
    quantity,
    maxUsagePerUser,
    startDate,
    endDate,
    isActive,
    voucherType,
    targetUserIds
  } = body;

  try {
    const voucher = await prisma.voucher.update({
      where: { id: params.id },
      data: {
        code,
        description,
        image,
        discountType,
        discountValue: parseFloat(discountValue),
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        quantity: parseInt(quantity),
        maxUsagePerUser: maxUsagePerUser ? parseInt(maxUsagePerUser) : 1,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
        voucherType,
        targetUserIds: targetUserIds || []
      }
    });
    return NextResponse.json(voucher);
  } catch (error) {
    console.error('Error updating voucher:', error);
    return NextResponse.json({ error: 'Failed to update voucher' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.voucher.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ message: 'Voucher deleted successfully' });
  } catch (error) {
    console.error('Error deleting voucher:', error);
    return NextResponse.json({ error: 'Failed to delete voucher' }, { status: 500 });
  }
}

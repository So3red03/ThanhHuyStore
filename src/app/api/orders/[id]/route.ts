import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.error();
  }

  const body = await request.json();
  const { status, deliveryStatus } = body;

  const updateData: any = {};
  if (status !== undefined) updateData.status = status;
  if (deliveryStatus !== undefined) updateData.deliveryStatus = deliveryStatus;

  try {
    const order = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: true
      }
    });
    
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

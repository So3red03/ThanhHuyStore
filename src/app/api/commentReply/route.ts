import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';

export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Không đủ quyền' }, { status: 403 });
    }

    const body = await request.json();
    const { id, reply } = body;

    if (!id || !reply) {
      return NextResponse.json({ message: 'Thiếu thông tin cần thiết' }, { status: 400 });
    }

    const review = await prisma.review.update({
      where: { id },
      data: { reply }
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error updating review reply:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}

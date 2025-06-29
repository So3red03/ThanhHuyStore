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
    const { id, edit } = body;

    if (!id || !edit) {
      return NextResponse.json({ message: 'Thiếu thông tin cần thiết' }, { status: 400 });
    }

    // Kiểm tra xem review có tồn tại và đã có reply chưa
    const existingReview = await prisma.review.findUnique({
      where: { id }
    });

    if (!existingReview) {
      return NextResponse.json({ message: 'Không tìm thấy đánh giá' }, { status: 404 });
    }

    if (!existingReview.reply) {
      return NextResponse.json({ message: 'Chưa có phản hồi để sửa' }, { status: 400 });
    }

    const review = await prisma.review.update({
      where: { id },
      data: { reply: edit }
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error updating review edit:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}

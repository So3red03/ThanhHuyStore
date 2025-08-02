import { Review } from '@prisma/client';
import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { NotificationService } from '../../libs/notifications/notificationService';

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  const body = await request.json();
  const { comment, rating, product, userId } = body;

  if (!currentUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const userReview = await product.reviews.find((review: Review) => {
    return review.userId === currentUser?.id;
  });

  if (userReview) {
    return NextResponse.error();
  }

  const review = await prisma.review.create({
    data: {
      comment,
      rating,
      productId: product.id,
      userId
    }
  });

  // Gửi thông báo với đầy đủ thông tin sử dụng NotificationService
  try {
    // Chỉ gửi cho admin chính để tránh duplicate
    const mainAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true }
    });

    if (mainAdmin) {
      await NotificationService.createCommentNotification(product.id, mainAdmin.id, currentUser.id, {
        content: comment,
        rating: rating
      });
    }
  } catch (error) {
    console.error('Error creating comment notification:', error);
  }

  return NextResponse.json(review);
}

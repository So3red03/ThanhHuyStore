import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { NotificationService } from '../../libs/notifications/notificationService';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();
    const { articleId, comment, parentId, rating } = body;

    if (!currentUser) {
      return NextResponse.json({ error: 'Không tìm thấy user' }, { status: 404 });
    }

    const review = await prisma.articleReview.create({
      data: {
        articleId,
        userId: currentUser.id,
        comment: comment || null,
        parentId: parentId || null,
        rating: rating || null
      }
    });

    // Gửi thông báo cho admin khi có comment mới trên article
    if (comment) {
      try {
        // Lấy thông tin article
        const article = await prisma.article.findUnique({
          where: { id: articleId },
          select: { title: true, image: true }
        });

        // Chỉ gửi cho admin chính để tránh duplicate
        const mainAdmin = await prisma.user.findFirst({
          where: { role: 'ADMIN' },
          select: { id: true }
        });

        if (mainAdmin) {
          await NotificationService.createNotification({
            userId: mainAdmin.id,
            fromUserId: currentUser.id,
            type: 'COMMENT_RECEIVED',
            title: 'Bình luận mới trên bài viết',
            message: `${currentUser.name || 'Khách hàng'} vừa bình luận trên bài viết "${
              article?.title || 'Bài viết'
            }"`,
            data: {
              eventType: 'ARTICLE_COMMENT_CREATED',
              timestamp: new Date().toISOString(),
              articleId: articleId,
              articleTitle: article?.title,
              userName: currentUser.name,
              userImage: currentUser.image,
              commentContent: comment,
              articleThumbnail: article?.image
            }
          });
        }
      } catch (error) {
        console.error('Error creating article comment notification:', error);
      }
    }

    return NextResponse.json(review);
  } catch (error) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  }
}

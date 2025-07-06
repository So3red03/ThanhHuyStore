import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.error();
  }

  // Get article data before deletion for audit trail
  const articleToDelete = await prisma.article.findUnique({
    where: { id: params.id },
    include: { category: true }
  });

  if (!articleToDelete) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  const article = await prisma.article.delete({
    where: { id: params.id }
  });

  // 🎯 AUDIT LOG: Article Deleted
  await AuditLogger.log({
    eventType: AuditEventType.ARTICLE_DELETED,
    severity: AuditSeverity.MEDIUM,
    userId: currentUser.id,
    userEmail: currentUser.email!,
    userRole: 'ADMIN',
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    description: `Xóa bài viết: ${articleToDelete.title}`,
    details: {
      articleTitle: articleToDelete.title,
      categoryName: articleToDelete.category?.name || 'No category',
      viewCount: articleToDelete.viewCount,
      contentLength: articleToDelete.content?.length || 0,
      deletedAt: new Date()
    },
    resourceId: params.id,
    resourceType: 'Article',
    oldValue: {
      title: articleToDelete.title,
      categoryId: articleToDelete.categoryId,
      viewCount: articleToDelete.viewCount,
      contentLength: articleToDelete.content?.length || 0
    }
  });

  return NextResponse.json(article);
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!params.id) {
      return NextResponse.json({ error: 'Không có bài viết' }, { status: 400 });
    }

    // Lấy tham số query từ request
    const url = new URL(request.url);
    const offset = parseInt(url.searchParams.get('offset') || '0'); // Lấy giá trị offset, mặc định là 0
    const take = 2; // Số bình luận mỗi lần lấy

    // Truy vấn bài viết cùng với các bình luận và phản hồi
    const article = await prisma.article.findUnique({
      where: {
        id: params.id
      },
      include: {
        reviews: {
          // take: take, // Lấy tối đa 2 bình luận mỗi lần
          // skip: offset, // Bỏ qua số lượng bình luận đã tải trước đó
          include: {
            user: { select: { id: true, name: true, image: true } }, // Lấy thông tin user
            replies: {
              include: {
                user: { select: { id: true, name: true, image: true } } // Lấy thông tin user của phản hồi
              }
            }
          },
          orderBy: {
            createdDate: 'desc' // Sắp xếp bình luận theo thời gian giảm dần
          }
        },
        category: true
      }
    });

    return NextResponse.json(article);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi truy vấn', message: error }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.error();
  }

  const body = await request.json();
  const { title, image, content, categoryId } = body;

  // Get old article data for audit trail
  const oldArticle = await prisma.article.findUnique({
    where: { id: params.id }
  });

  if (!oldArticle) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  const article = await prisma.article.update({
    where: { id: params.id },
    data: { userId: currentUser.id, title, image, content, categoryId }
  });

  // 🎯 AUDIT LOG: Article Updated
  await AuditLogger.log({
    eventType: AuditEventType.ARTICLE_UPDATED,
    severity: AuditSeverity.LOW,
    userId: currentUser.id,
    userEmail: currentUser.email!,
    userRole: 'ADMIN',
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    description: `Cập nhật bài viết: ${title}`,
    details: {
      articleTitle: title,
      changes: {
        title: { old: oldArticle.title, new: title },
        categoryId: { old: oldArticle.categoryId, new: categoryId },
        contentChanged: oldArticle.content !== content,
        imageChanged: oldArticle.image !== image
      }
    },
    resourceId: article.id,
    resourceType: 'Article',
    oldValue: {
      title: oldArticle.title,
      categoryId: oldArticle.categoryId,
      contentLength: oldArticle.content?.length || 0
    },
    newValue: {
      title,
      categoryId,
      contentLength: content?.length || 0
    }
  });

  return NextResponse.json(article);
}

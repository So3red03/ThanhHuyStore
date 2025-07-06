import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Không đủ quyền' }, { status: 403 });
  }

  const body = await request.json();
  const { title, image, content, categoryId } = body;

  // create new article in db by Prisma
  const article = await prisma.article.create({
    data: {
      userId: currentUser.id,
      title,
      image,
      content,
      categoryId
    }
  });

  // 🎯 AUDIT LOG: Article Created
  await AuditLogger.log({
    eventType: AuditEventType.ARTICLE_CREATED,
    severity: AuditSeverity.LOW,
    userId: currentUser.id,
    userEmail: currentUser.email!,
    userRole: 'ADMIN',
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    description: `Tạo bài viết: ${title}`,
    details: {
      articleTitle: title,
      categoryId,
      contentLength: content?.length || 0,
      hasImage: !!image
    },
    resourceId: article.id,
    resourceType: 'Article'
  });

  return NextResponse.json(article);
}

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json(articles);
  } catch (error) {
    return NextResponse.json({ message: 'Không thể lấy danh sách bài viết' }, { status: 500 });
  }
}

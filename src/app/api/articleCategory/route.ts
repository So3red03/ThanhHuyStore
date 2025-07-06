import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.error();
  }

  const body = await request.json();
  const { name, slug, icon, description, isActive } = body;

  const articleCategory = await prisma.articleCategory.create({
    data: {
      name,
      slug,
      icon,
      description,
      isActive
    }
  });

  // 🎯 AUDIT LOG: Article Category Created
  await AuditLogger.log({
    eventType: AuditEventType.CATEGORY_CREATED,
    severity: AuditSeverity.LOW,
    userId: currentUser.id,
    userEmail: currentUser.email!,
    userRole: 'ADMIN',
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    description: `Tạo danh mục bài viết: ${name}`,
    details: {
      categoryName: name,
      slug,
      description,
      isActive,
      hasIcon: !!icon
    },
    resourceId: articleCategory.id,
    resourceType: 'ArticleCategory'
  });

  return NextResponse.json(articleCategory);
}

export async function GET() {
  try {
    const articles = await prisma.articleCategory.findMany();
    return NextResponse.json(articles);
  } catch (error) {
    return NextResponse.json({ message: 'Không thể lấy danh sách danh mục bài viết' }, { status: 500 });
  }
}

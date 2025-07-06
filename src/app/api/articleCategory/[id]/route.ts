import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.error();
  }

  // Get category data before deletion for audit trail
  const categoryToDelete = await prisma.articleCategory.findUnique({
    where: { id: params.id },
    include: { Article: { select: { id: true, title: true } } }
  });

  if (!categoryToDelete) {
    return NextResponse.json({ error: 'Article category not found' }, { status: 404 });
  }

  const articleCategory = await prisma.articleCategory.delete({
    where: { id: params.id }
  });

  // 🎯 AUDIT LOG: Article Category Deleted
  await AuditLogger.log({
    eventType: AuditEventType.CATEGORY_DELETED,
    severity: AuditSeverity.MEDIUM,
    userId: currentUser.id,
    userEmail: currentUser.email!,
    userRole: 'ADMIN',
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    description: `Xóa danh mục bài viết: ${categoryToDelete.name}`,
    details: {
      categoryName: categoryToDelete.name,
      slug: categoryToDelete.slug,
      articlesCount: categoryToDelete.Article.length,
      deletedAt: new Date()
    },
    resourceId: params.id,
    resourceType: 'ArticleCategory',
    oldValue: {
      name: categoryToDelete.name,
      slug: categoryToDelete.slug,
      isActive: categoryToDelete.isActive,
      articlesCount: categoryToDelete.Article.length
    }
  });

  return NextResponse.json(articleCategory);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.error();
  }

  const body = await request.json();
  const { name, description, icon, isActive, slug } = body;

  // Get old category data for audit trail
  const oldCategory = await prisma.articleCategory.findUnique({
    where: { id: params.id }
  });

  if (!oldCategory) {
    return NextResponse.json({ error: 'Article category not found' }, { status: 404 });
  }

  const articleCategory = await prisma.articleCategory.update({
    where: { id: params.id },
    data: { name, description, icon, isActive, slug }
  });

  // 🎯 AUDIT LOG: Article Category Updated
  await AuditLogger.log({
    eventType: AuditEventType.CATEGORY_UPDATED,
    severity: AuditSeverity.LOW,
    userId: currentUser.id,
    userEmail: currentUser.email!,
    userRole: 'ADMIN',
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    description: `Cập nhật danh mục bài viết: ${name}`,
    details: {
      categoryName: name,
      changes: {
        name: { old: oldCategory.name, new: name },
        slug: { old: oldCategory.slug, new: slug },
        isActive: { old: oldCategory.isActive, new: isActive },
        descriptionChanged: oldCategory.description !== description,
        iconChanged: oldCategory.icon !== icon
      }
    },
    resourceId: articleCategory.id,
    resourceType: 'ArticleCategory',
    oldValue: {
      name: oldCategory.name,
      slug: oldCategory.slug,
      isActive: oldCategory.isActive
    },
    newValue: {
      name,
      slug,
      isActive
    }
  });

  return NextResponse.json(articleCategory);
}

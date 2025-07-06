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
  const categoryToDelete = await prisma.category.findUnique({
    where: { id: params.id },
    include: {
      products: { select: { id: true, name: true } },
      subcategories: { select: { id: true, name: true } },
      parent: { select: { id: true, name: true } }
    }
  });

  if (!categoryToDelete) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  const category = await prisma.category.delete({
    where: { id: params.id }
  });

  // 🎯 AUDIT LOG: Product Category Deleted
  await AuditLogger.log({
    eventType: AuditEventType.CATEGORY_DELETED,
    severity: AuditSeverity.HIGH, // HIGH because deleting categories affects products
    userId: currentUser.id,
    userEmail: currentUser.email!,
    userRole: 'ADMIN',
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    description: `Xóa danh mục sản phẩm: ${categoryToDelete.name}`,
    details: {
      categoryName: categoryToDelete.name,
      slug: categoryToDelete.slug,
      productsCount: categoryToDelete.products.length,
      subcategoriesCount: categoryToDelete.subcategories.length,
      parentCategory: categoryToDelete.parent?.name || null,
      affectedProducts: categoryToDelete.products.map(p => ({ id: p.id, name: p.name })),
      affectedSubcategories: categoryToDelete.subcategories.map(s => ({ id: s.id, name: s.name })),
      deletedAt: new Date()
    },
    resourceId: params.id,
    resourceType: 'ProductCategory',
    oldValue: {
      name: categoryToDelete.name,
      slug: categoryToDelete.slug,
      parentId: categoryToDelete.parentId,
      productsCount: categoryToDelete.products.length,
      subcategoriesCount: categoryToDelete.subcategories.length
    }
  });

  return NextResponse.json(category);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.error();
  }

  const body = await request.json();
  const { name, image, icon, description, slug, parentId } = body;

  // Get old category data for audit trail
  const oldCategory = await prisma.category.findUnique({
    where: { id: params.id },
    include: {
      products: { select: { id: true, name: true } },
      subcategories: { select: { id: true, name: true } }
    }
  });

  if (!oldCategory) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  const category = await prisma.category.update({
    where: { id: params.id },
    data: { name, image, icon, description, slug, parentId }
  });

  // 🎯 AUDIT LOG: Product Category Updated
  await AuditLogger.log({
    eventType: AuditEventType.CATEGORY_UPDATED,
    severity: AuditSeverity.LOW,
    userId: currentUser.id,
    userEmail: currentUser.email!,
    userRole: 'ADMIN',
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    description: `Cập nhật danh mục sản phẩm: ${name}`,
    details: {
      categoryName: name,
      changes: {
        name: { old: oldCategory.name, new: name },
        slug: { old: oldCategory.slug, new: slug },
        parentId: { old: oldCategory.parentId, new: parentId },
        descriptionChanged: oldCategory.description !== description,
        imageChanged: oldCategory.image !== image,
        iconChanged: oldCategory.icon !== icon
      },
      productsCount: oldCategory.products.length,
      subcategoriesCount: oldCategory.subcategories.length
    },
    resourceId: category.id,
    resourceType: 'ProductCategory',
    oldValue: {
      name: oldCategory.name,
      slug: oldCategory.slug,
      parentId: oldCategory.parentId
    },
    newValue: {
      name,
      slug,
      parentId
    }
  });

  return NextResponse.json(category);
}

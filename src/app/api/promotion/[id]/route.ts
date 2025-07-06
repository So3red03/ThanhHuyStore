import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    description,
    discountType,
    discountValue,
    maxDiscount,
    startDate,
    endDate,
    isActive,
    applyToAll,
    productIds,
    categoryIds
  } = body;

  try {
    // Get old promotion data for audit trail
    const oldPromotion = await prisma.promotion.findUnique({
      where: { id: params.id }
    });

    if (!oldPromotion) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 });
    }

    const promotion = await prisma.promotion.update({
      where: { id: params.id },
      data: {
        title,
        description,
        discountType,
        discountValue: parseFloat(discountValue),
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
        applyToAll: applyToAll || false,
        productIds: productIds || [],
        categoryIds: categoryIds || []
      }
    });

    // 🎯 AUDIT LOG: Promotion Updated
    await AuditLogger.log({
      eventType: AuditEventType.PROMOTION_UPDATED,
      severity: AuditSeverity.MEDIUM,
      userId: currentUser.id,
      userEmail: currentUser.email!,
      userRole: 'ADMIN',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      description: `Cập nhật khuyến mãi: ${title}`,
      details: {
        promotionTitle: title,
        changes: {
          title: { old: oldPromotion.title, new: title },
          discountValue: { old: oldPromotion.discountValue, new: parseFloat(discountValue) },
          isActive: { old: oldPromotion.isActive, new: isActive },
          applyToAll: { old: oldPromotion.applyToAll, new: applyToAll || false }
        }
      },
      resourceId: promotion.id,
      resourceType: 'Promotion',
      oldValue: {
        title: oldPromotion.title,
        discountValue: oldPromotion.discountValue,
        isActive: oldPromotion.isActive
      },
      newValue: {
        title,
        discountValue: parseFloat(discountValue),
        isActive
      }
    });

    return NextResponse.json(promotion);
  } catch (error) {
    console.error('Error updating promotion:', error);
    return NextResponse.json({ error: 'Failed to update promotion' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get promotion data before deletion for audit trail
    const promotionToDelete = await prisma.promotion.findUnique({
      where: { id: params.id }
    });

    if (!promotionToDelete) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 });
    }

    await prisma.promotion.delete({
      where: { id: params.id }
    });

    // 🎯 AUDIT LOG: Promotion Deleted
    await AuditLogger.log({
      eventType: AuditEventType.PROMOTION_DELETED,
      severity: AuditSeverity.HIGH, // HIGH because deleting promotions affects business
      userId: currentUser.id,
      userEmail: currentUser.email!,
      userRole: 'ADMIN',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      description: `Xóa khuyến mãi: ${promotionToDelete.title}`,
      details: {
        promotionTitle: promotionToDelete.title,
        discountType: promotionToDelete.discountType,
        discountValue: promotionToDelete.discountValue,
        applyToAll: promotionToDelete.applyToAll,
        productsCount: promotionToDelete.productIds?.length || 0,
        categoriesCount: promotionToDelete.categoryIds?.length || 0,
        wasActive: promotionToDelete.isActive,
        deletedAt: new Date()
      },
      resourceId: params.id,
      resourceType: 'Promotion',
      oldValue: {
        title: promotionToDelete.title,
        discountValue: promotionToDelete.discountValue,
        isActive: promotionToDelete.isActive,
        applyToAll: promotionToDelete.applyToAll
      }
    });

    return NextResponse.json({ message: 'Promotion deleted successfully' });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    return NextResponse.json({ error: 'Failed to delete promotion' }, { status: 500 });
  }
}

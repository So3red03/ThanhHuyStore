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
    code,
    description,
    image,
    discountType,
    discountValue,
    minOrderValue,
    quantity,
    maxUsagePerUser,
    startDate,
    endDate,
    isActive,
    voucherType,
    targetUserIds
  } = body;

  try {
    // Get old voucher data for audit trail
    const oldVoucher = await prisma.voucher.findUnique({
      where: { id: params.id }
    });

    if (!oldVoucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    const voucher = await prisma.voucher.update({
      where: { id: params.id },
      data: {
        code,
        description,
        image,
        discountType,
        discountValue: parseFloat(discountValue),
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : null,
        quantity: parseInt(quantity),
        maxUsagePerUser: maxUsagePerUser ? parseInt(maxUsagePerUser) : 1,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
        voucherType,
        targetUserIds: targetUserIds || []
      }
    });

    // 🎯 AUDIT LOG: Voucher Updated
    await AuditLogger.log({
      eventType: AuditEventType.VOUCHER_UPDATED,
      severity: AuditSeverity.LOW,
      userId: currentUser.id,
      userEmail: currentUser.email!,
      userRole: 'ADMIN',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      description: `Cập nhật voucher: ${code}`,
      details: {
        voucherCode: code,
        changes: {
          discountValue: { old: oldVoucher.discountValue, new: parseFloat(discountValue) },
          quantity: { old: oldVoucher.quantity, new: parseInt(quantity) },
          isActive: { old: oldVoucher.isActive, new: isActive }
        }
      },
      resourceId: voucher.id,
      resourceType: 'Voucher',
      oldValue: {
        code: oldVoucher.code,
        discountValue: oldVoucher.discountValue,
        quantity: oldVoucher.quantity,
        isActive: oldVoucher.isActive
      },
      newValue: {
        code,
        discountValue: parseFloat(discountValue),
        quantity: parseInt(quantity),
        isActive
      }
    });

    return NextResponse.json(voucher);
  } catch (error) {
    console.error('Error updating voucher:', error);
    return NextResponse.json({ error: 'Failed to update voucher' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get voucher data before deletion for audit trail
    const voucherToDelete = await prisma.voucher.findUnique({
      where: { id: params.id }
    });

    if (!voucherToDelete) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    await prisma.voucher.delete({
      where: { id: params.id }
    });

    // 🎯 AUDIT LOG: Voucher Deleted
    await AuditLogger.log({
      eventType: AuditEventType.VOUCHER_DELETED,
      severity: AuditSeverity.MEDIUM,
      userId: currentUser.id,
      userEmail: currentUser.email!,
      userRole: 'ADMIN',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      description: `Xóa voucher: ${voucherToDelete.code}`,
      details: {
        voucherCode: voucherToDelete.code,
        discountValue: voucherToDelete.discountValue,
        quantity: voucherToDelete.quantity,
        usedCount: voucherToDelete.usedCount,
        deletedAt: new Date()
      },
      resourceId: params.id,
      resourceType: 'Voucher',
      oldValue: {
        code: voucherToDelete.code,
        discountValue: voucherToDelete.discountValue,
        quantity: voucherToDelete.quantity,
        isActive: voucherToDelete.isActive
      }
    });

    return NextResponse.json({ message: 'Voucher deleted successfully' });
  } catch (error) {
    console.error('Error deleting voucher:', error);
    return NextResponse.json({ error: 'Failed to delete voucher' }, { status: 500 });
  }
}

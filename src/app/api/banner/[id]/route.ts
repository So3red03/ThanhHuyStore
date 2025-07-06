import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.error();
  }

  // Get banner data before deletion for audit trail
  const bannerToDelete = await prisma.banner.findUnique({
    where: { id: params.id }
  });

  if (!bannerToDelete) {
    return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
  }

  const banner = await prisma.banner.delete({
    where: { id: params.id }
  });

  // 🎯 AUDIT LOG: Banner Deleted
  await AuditLogger.log({
    eventType: AuditEventType.BANNER_DELETED,
    severity: AuditSeverity.MEDIUM,
    userId: currentUser.id,
    userEmail: currentUser.email!,
    userRole: 'ADMIN',
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    description: `Xóa banner: ${bannerToDelete.name}`,
    details: {
      bannerName: bannerToDelete.name,
      status: bannerToDelete.status,
      hasImage: !!bannerToDelete.image,
      deletedAt: new Date()
    },
    resourceId: params.id,
    resourceType: 'Banner',
    oldValue: {
      name: bannerToDelete.name,
      status: bannerToDelete.status
    }
  });

  return NextResponse.json(banner);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.error();
  }

  const body = await request.json();
  const { name, description, status, image } = body;

  // Get old banner data for audit trail
  const oldBanner = await prisma.banner.findUnique({
    where: { id: params.id }
  });

  if (!oldBanner) {
    return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
  }

  const banner = await prisma.banner.update({
    where: { id: params.id },
    data: { name: name, description: description, status: status, image: image }
  });

  // 🎯 AUDIT LOG: Banner Updated
  await AuditLogger.log({
    eventType: AuditEventType.BANNER_UPDATED,
    severity: AuditSeverity.LOW,
    userId: currentUser.id,
    userEmail: currentUser.email!,
    userRole: 'ADMIN',
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    description: `Cập nhật banner: ${name}`,
    details: {
      bannerName: name,
      changes: {
        name: { old: oldBanner.name, new: name },
        status: { old: oldBanner.status, new: status },
        descriptionChanged: oldBanner.description !== description,
        imageChanged: oldBanner.image !== image
      }
    },
    resourceId: banner.id,
    resourceType: 'Banner',
    oldValue: {
      name: oldBanner.name,
      status: oldBanner.status
    },
    newValue: {
      name,
      status
    }
  });

  return NextResponse.json(banner);
}

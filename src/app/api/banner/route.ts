import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.error();
  }

  // Invoking data JSON from request
  const body = await request.json();
  const { name, description, status, startDate, endDate, image, imageResponsive } = body;

  // create new banner in db by Prisma
  const banner = await prisma.banner.create({
    data: {
      name,
      description,
      status,
      startDate,
      endDate,
      image,
      imageResponsive
    }
  });

  // 🎯 AUDIT LOG: Banner Created
  await AuditLogger.log({
    eventType: AuditEventType.BANNER_CREATED,
    severity: AuditSeverity.LOW,
    userId: currentUser.id,
    userEmail: currentUser.email!,
    userRole: 'ADMIN',
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    description: `Tạo banner: ${name}`,
    details: {
      bannerName: name,
      status,
      hasImage: !!image,
      hasResponsiveImage: !!imageResponsive,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    },
    resourceId: banner.id,
    resourceType: 'Banner'
  });

  return NextResponse.json(banner);
}

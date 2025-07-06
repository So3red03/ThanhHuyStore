import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';

export async function POST(request: Request) {
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
    voucherType,
    targetUserIds
  } = body;

  try {
    const voucher = await prisma.voucher.create({
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
        voucherType,
        targetUserIds: targetUserIds || []
      }
    });

    // 🎯 AUDIT LOG: Voucher Created
    await AuditLogger.log({
      eventType: AuditEventType.VOUCHER_CREATED,
      severity: AuditSeverity.LOW,
      userId: currentUser.id,
      userEmail: currentUser.email!,
      userRole: 'ADMIN',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      description: `Tạo voucher: ${code}`,
      details: {
        voucherCode: code,
        discountType,
        discountValue: parseFloat(discountValue),
        quantity: parseInt(quantity),
        voucherType,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      },
      resourceId: voucher.id,
      resourceType: 'Voucher'
    });

    return NextResponse.json(voucher);
  } catch (error) {
    console.error('Error creating voucher:', error);
    return NextResponse.json({ error: 'Failed to create voucher' }, { status: 500 });
  }
}

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const vouchers = await prisma.voucher.findMany({
      include: {
        userVouchers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json(vouchers);
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    return NextResponse.json({ error: 'Failed to fetch vouchers' }, { status: 500 });
  }
}

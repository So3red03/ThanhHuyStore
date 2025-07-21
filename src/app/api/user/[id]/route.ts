import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../pages/api/auth/[...nextauth]';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.error();
  }

  // Get user data before deletion for audit trail
  const userToDelete = await prisma.user.findUnique({
    where: { id: params.id },
    include: { orders: { select: { id: true, status: true } } }
  });

  if (!userToDelete) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const user = await prisma.user.delete({
    where: { id: params.id }
  });

  // 🎯 AUDIT LOG: User Deleted by Admin
  await AuditLogger.log({
    eventType: AuditEventType.USER_DELETED,
    severity: AuditSeverity.HIGH, // HIGH because deleting users is critical
    userId: currentUser.id,
    userEmail: currentUser.email!,
    userRole: 'ADMIN',
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    description: `Xóa người dùng: ${userToDelete.name} (${userToDelete.email})`,
    details: {
      deletedUserName: userToDelete.name,
      deletedUserEmail: userToDelete.email,
      deletedUserRole: userToDelete.role,
      ordersCount: userToDelete.orders.length,
      accountAge: Math.floor((new Date().getTime() - userToDelete.createAt.getTime()) / (1000 * 60 * 60 * 24)),
      deletedAt: new Date()
    },
    resourceId: params.id,
    resourceType: 'User',
    oldValue: {
      name: userToDelete.name,
      email: userToDelete.email,
      role: userToDelete.role,
      ordersCount: userToDelete.orders.length
    }
  });

  return NextResponse.json(user);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.error();
  }

  // Invoking data JSON from request
  const body = await request.json();
  const { name, newPassword, role } = body;

  // Get old user data for audit trail
  const oldUser = await prisma.user.findUnique({
    where: { id: params.id }
  });

  if (!oldUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { name, hashedPassword, role }
  });

  // 🎯 AUDIT LOG: User Updated by Admin
  await AuditLogger.log({
    eventType: AuditEventType.USER_UPDATED,
    severity: AuditSeverity.HIGH, // HIGH because role changes are critical
    userId: currentUser.id,
    userEmail: currentUser.email!,
    userRole: 'ADMIN',
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    description: `Cập nhật người dùng: ${name} (${oldUser.email})`,
    details: {
      targetUserName: name,
      targetUserEmail: oldUser.email,
      changes: {
        name: { old: oldUser.name, new: name },
        role: { old: oldUser.role, new: role },
        passwordChanged: !!newPassword
      }
    },
    resourceId: user.id,
    resourceType: 'User',
    oldValue: {
      name: oldUser.name,
      role: oldUser.role
    },
    newValue: {
      name,
      role
    }
  });

  return NextResponse.json(user);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { orders: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...currentUser,
      createAt: currentUser.createAt.toISOString(),
      updateAt: currentUser.updateAt.toISOString(),
      emailVerified: currentUser.emailVerified?.toString() || null
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getCurrentUserForAdmin } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { AuditLogger, AuditEventType, AuditCategory, AuditSeverity } from '@/app/utils/auditLogger';

interface IParams {
  id?: string;
}

// POST - Khóa tài khoản người dùng
export async function POST(request: Request, { params }: { params: IParams }) {
  try {
    const currentUser = await getCurrentUserForAdmin();

    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = params;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Block reason is required' }, { status: 400 });
    }

    // Kiểm tra user tồn tại
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBlocked: true
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Không cho phép khóa ADMIN (trừ khi người thực hiện cũng là ADMIN)
    if (targetUser.role === 'ADMIN' && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Cannot block admin user' }, { status: 403 });
    }

    // Không cho phép tự khóa chính mình
    if (targetUser.id === currentUser.id) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 403 });
    }

    // Kiểm tra đã bị khóa chưa
    if (targetUser.isBlocked) {
      return NextResponse.json({ error: 'User is already blocked' }, { status: 400 });
    }

    // Khóa tài khoản
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isBlocked: true,
        blockedAt: new Date(),
        blockedBy: currentUser.id,
        blockReason: reason.trim()
      },
      select: {
        id: true,
        email: true,
        name: true,
        isBlocked: true,
        blockedAt: true,
        blockReason: true
      }
    });

    // Ghi audit log
    await AuditLogger.log({
      eventType: AuditEventType.USER_BLOCKED,
      category: AuditCategory.ADMIN,
      severity: AuditSeverity.HIGH,
      userId: currentUser.id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      description: `Khóa tài khoản người dùng: ${targetUser.email}`,
      resourceId: userId,
      resourceType: 'USER',
      metadata: {
        targetUserEmail: targetUser.email,
        targetUserName: targetUser.name,
        targetUserRole: targetUser.role,
        blockReason: reason.trim(),
        blockedBy: currentUser.email
      }
    });

    return NextResponse.json({
      message: 'User blocked successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error blocking user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Mở khóa tài khoản người dùng
export async function DELETE(request: Request, { params }: { params: IParams }) {
  try {
    const currentUser = await getCurrentUserForAdmin();

    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = params;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Kiểm tra user tồn tại
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBlocked: true,
        blockReason: true
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Kiểm tra đã bị khóa chưa
    if (!targetUser.isBlocked) {
      return NextResponse.json({ error: 'User is not blocked' }, { status: 400 });
    }

    // Mở khóa tài khoản
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isBlocked: false,
        blockedAt: null,
        blockedBy: null,
        blockReason: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        isBlocked: true
      }
    });

    // Ghi audit log
    await AuditLogger.log({
      eventType: AuditEventType.USER_UNBLOCKED,
      category: AuditCategory.ADMIN,
      severity: AuditSeverity.MEDIUM,
      userId: currentUser.id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      description: `Mở khóa tài khoản người dùng: ${targetUser.email}`,
      resourceId: userId,
      resourceType: 'USER',
      metadata: {
        targetUserEmail: targetUser.email,
        targetUserName: targetUser.name,
        targetUserRole: targetUser.role,
        previousBlockReason: targetUser.blockReason,
        unblockedBy: currentUser.email
      }
    });

    return NextResponse.json({
      message: 'User unblocked successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error unblocking user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

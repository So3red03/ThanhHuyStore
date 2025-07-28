import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../../libs/prismadb';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    // Validation
    if (!name || !email) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Người dùng không tồn tại' }, { status: 404 });
    }

    // Check if email is already taken by another user
    const emailCheck = await prisma.user.findUnique({
      where: { email }
    });

    if (emailCheck && emailCheck.id !== params.id) {
      return NextResponse.json({ error: 'Email đã được sử dụng bởi người dùng khác' }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
      role
    };

    // Hash new password if provided
    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' }, { status: 400 });
      }
      updateData.hashedPassword = await bcrypt.hash(password, 12);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createAt: true,
        updateAt: true,
        emailVerified: true,
        isBlocked: true
      }
    });

    // 🚀 AUDIT LOG: Track user update
    await AuditLogger.log({
      eventType: AuditEventType.USER_UPDATED,
      userId: currentUser.id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      severity: AuditSeverity.MEDIUM,
      description: `Cập nhật thông tin người dùng: ${updatedUser.name} (${updatedUser.email})`,
      metadata: {
        targetUserId: updatedUser.id,
        targetUserEmail: updatedUser.email,
        updatedFields: Object.keys(updateData),
        oldRole: existingUser.role,
        newRole: updatedUser.role
      }
    });

    // Serialize dates
    const serializedUser = {
      ...updatedUser,
      createAt: updatedUser.createAt.toISOString(),
      updateAt: updatedUser.updateAt.toISOString(),
      emailVerified: updatedUser.emailVerified?.toString() || null
    };

    return NextResponse.json(serializedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user exists
    const userToDelete = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        orders: { select: { id: true, status: true } },
        reviews: { select: { id: true } }
      }
    });

    if (!userToDelete) {
      return NextResponse.json({ error: 'Người dùng không tồn tại' }, { status: 404 });
    }

    // Prevent self-deletion
    if (userToDelete.id === currentUser.id) {
      return NextResponse.json({ error: 'Không thể xóa chính mình' }, { status: 400 });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: params.id }
    });

    // 🚀 AUDIT LOG: Track user deletion
    await AuditLogger.log({
      eventType: AuditEventType.USER_DELETED,
      userId: currentUser.id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      severity: AuditSeverity.HIGH,
      description: `Xóa người dùng: ${userToDelete.name} (${userToDelete.email})`,
      metadata: {
        deletedUserId: userToDelete.id,
        deletedUserEmail: userToDelete.email,
        deletedUserRole: userToDelete.role,
        orderCount: userToDelete.orders.length,
        reviewCount: userToDelete.reviews.length
      }
    });

    return NextResponse.json({ message: 'Xóa người dùng thành công' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createAt: true,
        updateAt: true,
        lastLogin: true,
        emailVerified: true,
        phoneNumber: true,
        isBlocked: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Người dùng không tồn tại' }, { status: 404 });
    }

    // Serialize dates
    const serializedUser = {
      ...user,
      createAt: user.createAt.toISOString(),
      updateAt: user.updateAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString() || null,
      emailVerified: user.emailVerified?.toString() || null
    };

    return NextResponse.json(serializedUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

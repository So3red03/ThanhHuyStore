import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import bcrypt from 'bcrypt';
import { hasPermission } from '@/app/utils/admin/permissionUtils';
import { PERMISSIONS } from '@/app/utils/admin/permissions';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';

// GET - Get specific staff user
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || !hasPermission(currentUser.role, PERMISSIONS.STAFF_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const staffUser = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: {
          in: ['STAFF', 'ADMIN']
        }
      },
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
        phoneNumber: true
      }
    });

    if (!staffUser) {
      return NextResponse.json({ error: 'Staff user not found' }, { status: 404 });
    }

    return NextResponse.json(staffUser);
  } catch (error) {
    console.error('Error fetching staff user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT - Update staff user
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || !hasPermission(currentUser.role, PERMISSIONS.STAFF_UPDATE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, role, phoneNumber } = body;

    // Get existing user
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is trying to modify their own role
    if (params.id === currentUser.id && role && role !== currentUser.role) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 403 });
    }

    // Only ADMIN can modify ADMIN users or promote to ADMIN
    if ((existingUser.role === 'ADMIN' || role === 'ADMIN') && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admin can modify admin users' }, { status: 403 });
    }

    // Check email uniqueness if email is being changed
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;

    // Hash new password if provided
    if (password) {
      updateData.hashedPassword = await bcrypt.hash(password, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData
    });

    // Audit log
    await AuditLogger.log({
      eventType: AuditEventType.USER_UPDATED,
      severity: AuditSeverity.MEDIUM,
      userId: currentUser.id,
      userEmail: currentUser.email!,
      userRole: currentUser.role || 'USER',
      description: `Cập nhật thông tin ${existingUser.role.toLowerCase()}: ${existingUser.name}`,
      details: {
        targetUserId: params.id,
        targetUserEmail: existingUser.email,
        targetUserRole: existingUser.role,
        updatedBy: currentUser.name,
        changes: updateData
      },
      resourceId: params.id,
      resourceType: 'User'
    });

    // Remove password from response
    const { hashedPassword: _, ...userResponse } = updatedUser;

    return NextResponse.json(userResponse);
  } catch (error) {
    console.error('Error updating staff user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE - Delete staff user
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || !hasPermission(currentUser.role, PERMISSIONS.STAFF_DELETE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing user
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Cannot delete yourself
    if (params.id === currentUser.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 403 });
    }

    // Only ADMIN can delete ADMIN users
    if (existingUser.role === 'ADMIN' && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admin can delete admin users' }, { status: 403 });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: params.id }
    });

    // Audit log
    await AuditLogger.log({
      eventType: AuditEventType.USER_DELETED,
      severity: AuditSeverity.HIGH,
      userId: currentUser.id,
      userEmail: currentUser.email!,
      userRole: currentUser.role || 'USER',
      description: `Xóa tài khoản ${existingUser.role.toLowerCase()}: ${existingUser.name}`,
      details: {
        targetUserId: params.id,
        targetUserEmail: existingUser.email,
        targetUserRole: existingUser.role,
        deletedBy: currentUser.name
      },
      resourceId: params.id,
      resourceType: 'User'
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import bcrypt from 'bcryptjs';
import { hasPermission } from '@/app/utils/admin/permissionUtils';
import { PERMISSIONS } from '@/app/utils/admin/permissions';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';

// GET - Get all staff users
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || !hasPermission(currentUser.role, PERMISSIONS.STAFF_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const staffUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['STAFF', 'ADMIN']
        }
      },
      orderBy: {
        createAt: 'desc'
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

    return NextResponse.json(staffUsers);
  } catch (error) {
    console.error('Error fetching staff users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST - Create new staff user
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || !hasPermission(currentUser.role, PERMISSIONS.STAFF_CREATE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, role, phoneNumber } = body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate role
    if (!['STAFF', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Only ADMIN can create other ADMIN users
    if (role === 'ADMIN' && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admin can create admin users' }, { status: 403 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        role,
        phoneNumber,
        emailVerified: true // Staff accounts are pre-verified
      }
    });

    // Audit log
    await AuditLogger.log({
      eventType: AuditEventType.USER_CREATED,
      severity: AuditSeverity.MEDIUM,
      userId: currentUser.id,
      userEmail: currentUser.email!,
      userRole: currentUser.role || 'USER',
      description: `Tạo tài khoản ${role.toLowerCase()}: ${name}`,
      details: {
        targetUserId: newUser.id,
        targetUserEmail: email,
        targetUserRole: role,
        createdBy: currentUser.name
      },
      resourceId: newUser.id,
      resourceType: 'User'
    });

    // Remove password from response
    const { hashedPassword: _, ...userResponse } = newUser;

    return NextResponse.json(userResponse, { status: 201 });
  } catch (error) {
    console.error('Error creating staff user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

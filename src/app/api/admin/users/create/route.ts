import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, role = 'USER' } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email đã tồn tại' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        role,
        emailVerified: true // Auto verify for admin-created users
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createAt: true,
        emailVerified: true
      }
    });

    return NextResponse.json({
      message: 'Tạo người dùng thành công',
      user
    });
  } catch (error: any) {
    console.error('[USER_CREATE]', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

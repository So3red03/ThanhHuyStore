import bcrypt from 'bcrypt';
import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import crypto from 'crypto';
import { sendVerificationEmail } from '../../utils/emailVerification';
import { AuditLogger, AuditEventType, AuditSeverity } from '../../utils/auditLogger';

export async function POST(request: Request) {
  try {
    // Invoking data JSON from request(payload)
    const body = await request.json();
    const { name, email, password } = body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Email đã tồn tại' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo token xác thực email
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date();
    emailVerificationExpires.setMinutes(emailVerificationExpires.getMinutes() + 5); // Token hết hạn sau 5 phút

    // create new user in db by Prisma với emailVerified = false
    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        emailVerified: false,
        emailVerificationToken,
        emailVerificationExpires
      }
    });

    // Gửi email xác thực sử dụng shared utility
    const emailResult = await sendVerificationEmail(email, emailVerificationToken, name);

    // Log audit cho user registration
    await AuditLogger.log({
      eventType: AuditEventType.USER_CREATED,
      description: `Người dùng mới đăng ký tài khoản: ${email}`,
      details: {
        userId: user.id,
        email: email,
        name: name,
        emailSent: emailResult.success,
        timestamp: new Date().toISOString()
      },
      userId: user.id,
      userEmail: email,
      severity: AuditSeverity.MEDIUM
    });

    return NextResponse.json({
      message: 'Tài khoản đã được tạo thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
      success: true,
      requiresVerification: true,
      emailSent: emailResult.success
    });
  } catch (error) {
    console.error('Lỗi trong user registration API:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.error();
    }
    // Invoking data JSON from request
    const body = await request.json();
    const { name, phone, gender, dateOfBirth, image } = body;

    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        name,
        phoneNumber: phone,
        image
        // Note: gender and dateOfBirth fields need to be added to Prisma schema if needed
      }
    });
    return NextResponse.json(user);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

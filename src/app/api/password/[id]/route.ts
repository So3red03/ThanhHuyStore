import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

// GET: Validate token
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id: token } = params;

  if (!token) {
    return NextResponse.json({ message: 'Token không hợp lệ' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date() // Kiểm tra thời gian hết hạn
        }
      }
    });

    if (!user) {
      return NextResponse.json({ message: 'Token không hợp lệ hoặc đã hết hạn' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Token hợp lệ', valid: true }, { status: 200 });
  } catch (error) {
    console.error('Error validating token:', error);
    return NextResponse.json({ message: 'Lỗi server' }, { status: 500 });
  }
}

// POST: Reset password
export async function POST(request: Request, { params }: { params: { id: string } }) {
  // Lấy token từ params
  const { id } = params;

  if (!id) {
    return NextResponse.json({ message: 'Token không hợp lệ' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: id,
        resetPasswordExpires: {
          gt: new Date() // Kiểm tra thời gian hết hạn
        }
      }
    });

    if (!user) {
      return NextResponse.json({ message: 'Token không hợp lệ hoặc đã hết hạn' }, { status: 404 });
    }

    // Lấy mật khẩu mới từ request
    const body = await request.json();

    const { newPassword } = body;
    // Mã hóa mk bằng hàm băm
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu mới và xóa token, thời gian token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    return NextResponse.json({ message: 'Thay đổi mật khẩu thành công' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Token không hợp lệ hoặc đã hết hạn' }, { status: 404 });
  }
}

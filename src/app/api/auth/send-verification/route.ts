import { NextResponse } from 'next/server';
import { createVerificationToken, sendVerificationEmail } from '../../../utils/emailVerification';
import { AuditLogger, AuditEventType, AuditSeverity } from '../../../utils/auditLogger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, isResend = false } = body;

    if (!email) {
      return NextResponse.json({ message: 'Email là bắt buộc' }, { status: 400 });
    }

    // Tạo verification token (handle cả send và resend)
    const result = await createVerificationToken(email, isResend);
    const { token, user } = result;

    // Gửi email xác thực
    const emailResult = await sendVerificationEmail(email, token, user.name || 'Khách hàng');

    // Log audit cho email verification
    await AuditLogger.log({
      eventType: isResend ? AuditEventType.USER_UPDATED : AuditEventType.USER_CREATED,
      description: `Email verification ${isResend ? 'resent' : 'sent'} to ${email}`,
      details: {
        email: email,
        action: isResend ? 'resend' : 'send',
        timestamp: new Date().toISOString()
      },
      userId: user.id,
      userEmail: email,
      severity: AuditSeverity.LOW
    });

    if (emailResult.success) {
      return NextResponse.json({
        message: isResend
          ? 'Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.'
          : 'Email xác thực đã được gửi. Vui lòng kiểm tra hộp thư của bạn.',
        success: true
      });
    } else {
      return NextResponse.json(
        {
          message: 'Có lỗi khi gửi email. Vui lòng thử lại sau.',
          error: emailResult.error
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Lỗi trong send-verification API:', error);

    // Trả về error message cụ thể
    if (error.message.includes('Email không tồn tại')) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error.message.includes('Email đã được xác thực')) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (error.message.includes('Vui lòng đợi')) {
      return NextResponse.json({ message: error.message }, { status: 429 });
    }

    return NextResponse.json({ message: 'Có lỗi xảy ra khi gửi email xác thực' }, { status: 500 });
  }
}

import prisma from '../libs/prismadb';
import crypto from 'crypto';
const nodemailer = require('nodemailer');

export interface EmailVerificationResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Gửi email xác thực cho user
 * @param email - Email của user
 * @param token - Token xác thực
 * @param userName - Tên user
 * @returns Promise<EmailVerificationResult>
 */
export async function sendVerificationEmail(
  email: string, 
  token: string, 
  userName: string
): Promise<EmailVerificationResult> {
  try {
    // Cấu hình transporter (match với create-payment-intent)
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    const verificationLink = `${
      process.env.NEXTAUTH_URL || 'http://localhost:3000'
    }/api/auth/verify-email?token=${token}`;

    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xác thực email - ThanhHuy Store</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #0066CC, #004499); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
          .content { padding: 40px 30px; }
          .content h2 { color: #333; margin-bottom: 20px; font-size: 24px; }
          .content p { margin-bottom: 20px; font-size: 16px; }
          .button { display: inline-block; background: linear-gradient(135deg, #0066CC, #004499); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; transition: all 0.3s ease; }
          .button:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,102,204,0.4); }
          .info-box { background-color: #f8f9fa; border-left: 4px solid #0066CC; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .warning { color: #e74c3c; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛍️ ThanhHuy Store</h1>
          </div>
          <div class="content">
            <h2>Xác thực tài khoản của bạn</h2>
            <p>Xin chào <strong>${userName}</strong>,</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại ThanhHuy Store! Để hoàn tất quá trình đăng ký, vui lòng xác thực địa chỉ email của bạn.</p>
            
            <div style="text-align: center;">
              <a href="${verificationLink}" class="button">✅ Xác thực email ngay</a>
            </div>
            
            <div class="info-box">
              <p><strong>📋 Lưu ý quan trọng:</strong></p>
              <ul>
                <li>Link xác thực sẽ <span class="warning">hết hạn sau 5 phút</span></li>
                <li>Nếu không thấy email, vui lòng kiểm tra thư mục spam/junk</li>
                <li>Bạn cần xác thực email trước khi đăng nhập</li>
              </ul>
            </div>
            
            <p>Nếu bạn không yêu cầu tạo tài khoản này, vui lòng bỏ qua email này.</p>
            
            <p>Trân trọng,<br><strong>Đội ngũ ThanhHuy Store</strong></p>
          </div>
          <div class="footer">
            <p>© 2024 ThanhHuy Store. Tất cả quyền được bảo lưu.</p>
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: '✅ Xác thực tài khoản - ThanhHuy Store',
      text: `Xác thực tài khoản ThanhHuy Store\n\nXin chào ${userName},\n\nCảm ơn bạn đã đăng ký tài khoản tại ThanhHuy Store!\n\nVui lòng nhấp vào link sau để xác thực email: ${verificationLink}\n\nLưu ý: Link này sẽ hết hạn sau 5 phút.\n\nNếu bạn không yêu cầu tạo tài khoản này, vui lòng bỏ qua email này.\n\nTrân trọng,\nThanhHuy Store`,
      html: htmlTemplate
    };

    // Gửi email (không dùng await như create-payment-intent)
    return new Promise((resolve) => {
      transporter.sendMail(mailOptions, (error: any, info: any) => {
        if (error) {
          console.error('Lỗi khi gửi email xác thực:', error);
          resolve({
            success: false,
            message: 'Có lỗi khi gửi email xác thực',
            error: error.message
          });
        } else {
          console.log(`Verification email sent to ${email}:`, info.response);
          resolve({
            success: true,
            message: 'Email xác thực đã được gửi thành công'
          });
        }
      });
    });
  } catch (error) {
    console.error('Lỗi khi gửi email xác thực:', error);
    return {
      success: false,
      message: 'Gửi email thất bại',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Tạo và cập nhật token xác thực cho user
 * @param email - Email của user
 * @param isResend - Có phải là resend không (để check rate limiting)
 * @returns Promise<{token: string, user: any} | null>
 */
export async function createVerificationToken(email: string, isResend: boolean = false) {
  try {
    // Tìm user với email này
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (!existingUser) {
      throw new Error('Email không tồn tại');
    }

    // Kiểm tra nếu email đã được xác thực
    if (existingUser.emailVerified) {
      throw new Error('Email đã được xác thực');
    }

    // Kiểm tra rate limiting cho resend (1 phút)
    if (isResend && existingUser.emailVerificationExpires) {
      const now = new Date();
      const lastSent = new Date(existingUser.emailVerificationExpires.getTime() - 5 * 60 * 1000); // 5 phút trước expiry
      const timeDiff = now.getTime() - lastSent.getTime();
      const oneMinute = 60 * 1000;

      if (timeDiff < oneMinute) {
        const remainingSeconds = Math.ceil((oneMinute - timeDiff) / 1000);
        throw new Error(`Vui lòng đợi ${remainingSeconds} giây trước khi gửi lại email`);
      }
    }

    // Tạo token xác thực mới
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 5); // Token hết hạn sau 5 phút

    // Cập nhật user với token xác thực mới
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        emailVerificationToken: token,
        emailVerificationExpires: expires
      }
    });

    return { token, user: updatedUser };
  } catch (error) {
    console.error('Lỗi khi tạo verification token:', error);
    throw error;
  }
}

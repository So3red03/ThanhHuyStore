import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';
const nodemailer = require('nodemailer');
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    // Lấy dữ liệu JSON từ request
    const body = await request.json();
    const { email } = body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (!existingUser) {
      return NextResponse.json({ message: 'Email không tồn tại' }, { status: 404 });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 5); // Token hết hạn sau 5 phút

    await prisma.user.update({
      where: { email: email },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires
      }
    });

    // Gửi email
    try {
      // Cấu hình transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      });

      const redirectLink = `http://localhost:3000/passwordrecovery/${token}`;

      // Create beautiful HTML email template
      const htmlTemplate = `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Khôi phục mật khẩu - ThanhHuy Store</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f8fafc;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 8px;
            }
            .header p {
              font-size: 16px;
              opacity: 0.9;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              color: #2d3748;
              margin-bottom: 20px;
            }
            .message {
              font-size: 16px;
              color: #4a5568;
              margin-bottom: 30px;
              line-height: 1.7;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white !important;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              text-align: center;
              transition: transform 0.2s ease;
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }
            .cta-button:hover {
              transform: translateY(-2px);
            }
            .warning-box {
              background-color: #fef5e7;
              border: 1px solid #f6ad55;
              border-radius: 8px;
              padding: 20px;
              margin: 30px 0;
            }
            .warning-box h3 {
              color: #c05621;
              font-size: 16px;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
            }
            .warning-box p {
              color: #744210;
              font-size: 14px;
              margin: 0;
            }
            .footer {
              background-color: #f7fafc;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer p {
              color: #718096;
              font-size: 14px;
              margin-bottom: 10px;
            }
            .footer a {
              color: #667eea;
              text-decoration: none;
            }
            .security-tips {
              background-color: #edf2f7;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .security-tips h3 {
              color: #2d3748;
              font-size: 16px;
              margin-bottom: 12px;
            }
            .security-tips ul {
              color: #4a5568;
              font-size: 14px;
              padding-left: 20px;
            }
            .security-tips li {
              margin-bottom: 6px;
            }
            @media (max-width: 600px) {
              .container {
                margin: 0 10px;
              }
              .header, .content, .footer {
                padding: 20px;
              }
              .header h1 {
                font-size: 24px;
              }
              .cta-button {
                display: block;
                text-align: center;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Khôi phục mật khẩu</h1>
              <p>ThanhHuy Store - Hệ thống bảo mật</p>
            </div>

            <div class="content">
              <div class="greeting">
                Xin chào,
              </div>

              <div class="message">
                Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong>ThanhHuy Store</strong>.
                Để bảo mật tài khoản của bạn, vui lòng nhấp vào nút bên dưới để tạo mật khẩu mới.
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${redirectLink}" class="cta-button">
                  Bấm vào để đặt lại mật khẩu
                </a>
              </div>

              <div class="warning-box">
                <h3>⚠️ Lưu ý quan trọng:</h3>
                <p>Link này sẽ <strong>hết hạn sau 5 phút</strong> kể từ khi email được gửi. Nếu bạn không thực hiện trong thời gian này, vui lòng yêu cầu link mới.</p>
              </div>

              <div class="security-tips">
                <h3>💡 Mẹo bảo mật:</h3>
                <ul>
                  <li>Sử dụng mật khẩu mạnh với ít nhất 8 ký tự</li>
                  <li>Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</li>
                  <li>Không chia sẻ mật khẩu với bất kỳ ai</li>
                  <li>Thay đổi mật khẩu định kỳ để bảo mật tối ưu</li>
                </ul>
              </div>

              <div class="message" style="margin-top: 30px; font-size: 14px; color: #718096;">
                Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
                Tài khoản của bạn vẫn an toàn và không có thay đổi nào được thực hiện.
              </div>
            </div>

            <div class="footer">
              <p>Email này được gửi từ hệ thống tự động của <strong>ThanhHuy Store</strong></p>
              <p>Nếu bạn cần hỗ trợ, vui lòng liên hệ: <a href="mailto:support@thanhhuystore.com">support@thanhhuystore.com</a></p>
              <p style="margin-top: 15px; font-size: 12px;">
                © 2024 ThanhHuy Store. Tất cả quyền được bảo lưu.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: '🔐 Khôi phục mật khẩu - ThanhHuy Store',
        text: `Khôi phục mật khẩu ThanhHuy Store\n\nXin chào,\n\nChúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.\n\nVui lòng nhấp vào link sau để đặt lại mật khẩu: ${redirectLink}\n\nLưu ý: Link này sẽ hết hạn sau 5 phút.\n\nNếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.\n\nTrân trọng,\nThanhHuy Store`,
        html: htmlTemplate
      };

      // Gửi email
      transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Lỗi khi gửi email:', error);
      throw new Error('Gửi email thất bại');
    }

    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ message: 'Failed to send email' }, { status: 500 });
  }
}

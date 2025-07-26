// Email service for return/exchange notifications
// This is a demo implementation - in production, integrate with actual email service

interface EmailData {
  to: string;
  subject: string;
  html: string;
}

import nodemailer from 'nodemailer';

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || process.env.GMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.GMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

export const sendReturnStatusEmail = async (
  userEmail: string,
  userName: string,
  returnRequest: any,
  action: 'approve' | 'reject' | 'complete'
) => {
  try {
    console.log(`📧 [EMAIL] Sending ${action} notification to ${userEmail}...`);

    const transporter = createTransporter();
    const subject = getEmailSubject(returnRequest.type, action);
    const htmlContent = getEmailContent(userName, returnRequest, action);

    // Verify transporter configuration
    await transporter.verify();
    console.log('📧 [EMAIL] SMTP connection verified successfully');

    // Send email
    const info = await transporter.sendMail({
      from: `"ThanhHuy Store" <${process.env.SMTP_USER || process.env.GMAIL_USER}>`,
      to: userEmail,
      subject: subject,
      html: htmlContent,
      // Optional: Add text version
      text: getEmailTextContent(userName, returnRequest, action)
    });

    console.log('📧 [EMAIL] Email sent successfully:', {
      messageId: info.messageId,
      to: userEmail,
      subject: subject
    });

    return {
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    };
  } catch (error) {
    console.error('📧 [EMAIL] Error sending email:', error);

    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error('📧 [EMAIL] Error details:', {
        message: error.message,
        stack: error.stack
      });
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    };
  }
};

const getEmailSubject = (type: 'RETURN' | 'EXCHANGE', action: string) => {
  const typeText = type === 'RETURN' ? 'trả hàng' : 'đổi hàng';

  switch (action) {
    case 'approve':
      return `✅ Yêu cầu ${typeText} đã được duyệt - ThanhHuy Store`;
    case 'reject':
      return `❌ Yêu cầu ${typeText} bị từ chối - ThanhHuy Store`;
    case 'complete':
      return `🎉 Yêu cầu ${typeText} đã hoàn tất - ThanhHuy Store`;
    default:
      return `📋 Cập nhật yêu cầu ${typeText} - ThanhHuy Store`;
  }
};

const getEmailContent = (userName: string, returnRequest: any, action: string) => {
  const typeText = returnRequest.type === 'RETURN' ? 'trả hàng' : 'đổi hàng';
  const requestId = returnRequest.id.substring(0, 8);

  let content = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">ThanhHuy Store</h1>
        <p style="color: white; margin: 5px 0;">Cập nhật yêu cầu ${typeText}</p>
      </div>
      
      <div style="padding: 20px; background: #f9f9f9;">
        <h2>Xin chào ${userName},</h2>
  `;

  switch (action) {
    case 'approve':
      content += `
        <p>Yêu cầu ${typeText} #${requestId} của bạn đã được <strong style="color: #10b981;">duyệt</strong>.</p>
        
        <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
          <h3 style="color: #065f46; margin-top: 0;">Bước tiếp theo:</h3>
          ${
            returnRequest.type === 'RETURN'
              ? `<p style="color: #065f46;">• Vui lòng gửi sản phẩm về địa chỉ: <strong>123 Đường ABC, Quận XYZ, TP.HCM</strong></p>
               <p style="color: #065f46;">• Phương thức: Nhận tại cửa hàng hoặc gửi qua bưu điện</p>
               <p style="color: #065f46;">• Sau khi chúng tôi nhận được hàng, tiền hoàn sẽ được chuyển trong 3-5 ngày</p>`
              : `<p style="color: #065f46;">• Sản phẩm mới sẽ được gửi đến địa chỉ của bạn trong 2-3 ngày</p>
               <p style="color: #065f46;">• Vui lòng gửi sản phẩm cũ về sau khi nhận hàng mới</p>`
          }
        </div>
      `;
      break;

    case 'reject':
      content += `
        <p>Rất tiếc, yêu cầu ${typeText} #${requestId} của bạn đã bị <strong style="color: #ef4444;">từ chối</strong>.</p>
        
        <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
          <h3 style="color: #991b1b; margin-top: 0;">Lý do từ chối:</h3>
          <p style="color: #991b1b;">${returnRequest.adminNotes || 'Không đáp ứng điều kiện đổi/trả'}</p>
        </div>
        
        <p>Nếu bạn có thắc mắc, vui lòng liên hệ với chúng tôi qua:</p>
        <p>• Hotline: 1900-xxxx</p>
        <p>• Email: support@thanhhuystore.com</p>
      `;
      break;

    case 'complete':
      content += `
        <p>Yêu cầu ${typeText} #${requestId} của bạn đã được <strong style="color: #10b981;">hoàn tất</strong>!</p>
        
        <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
          <h3 style="color: #065f46; margin-top: 0;">Thông tin hoàn tất:</h3>
          ${
            returnRequest.type === 'RETURN'
              ? `<p style="color: #065f46;">• Số tiền hoàn: <strong>${formatPrice(
                  returnRequest.refundAmount || 0
                )}</strong></p>
               <p style="color: #065f46;">• Tiền sẽ được chuyển về tài khoản trong 3-5 ngày làm việc</p>`
              : `<p style="color: #065f46;">• Đổi hàng thành công</p>
               <p style="color: #065f46;">• Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi</p>`
          }
        </div>
      `;
      break;
  }

  content += `
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Chi tiết yêu cầu:</h3>
          <p><strong>Mã yêu cầu:</strong> #${requestId}</p>
          <p><strong>Loại:</strong> ${typeText}</p>
          <p><strong>Số lượng sản phẩm:</strong> ${returnRequest.items?.length || 0}</p>
          ${returnRequest.adminNotes ? `<p><strong>Ghi chú:</strong> ${returnRequest.adminNotes}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/account/returns" 
             style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Xem chi tiết yêu cầu
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <div style="text-align: center; color: #6b7280; font-size: 14px;">
          <p>Cảm ơn bạn đã tin tưởng ThanhHuy Store!</p>
          <p>Nếu có thắc mắc, vui lòng liên hệ: support@thanhhuystore.com | 1900-xxxx</p>
          <p style="margin-top: 20px;">
            <a href="#" style="color: #6b7280; margin: 0 10px;">Facebook</a>
            <a href="#" style="color: #6b7280; margin: 0 10px;">Instagram</a>
            <a href="#" style="color: #6b7280; margin: 0 10px;">Website</a>
          </p>
        </div>
      </div>
    </div>
  `;

  return content;
};

// Text version of email content (for email clients that don't support HTML)
const getEmailTextContent = (userName: string, returnRequest: any, action: string) => {
  const typeText = returnRequest.type === 'RETURN' ? 'trả hàng' : 'đổi hàng';
  const requestId = returnRequest.id.substring(0, 8);

  let content = `
ThanhHuy Store - Cập nhật yêu cầu ${typeText}

Xin chào ${userName},

`;

  switch (action) {
    case 'approve':
      content += `Yêu cầu ${typeText} #${requestId} của bạn đã được DUYỆT.

Bước tiếp theo:
${
  returnRequest.type === 'RETURN'
    ? `• Vui lòng gửi sản phẩm về địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM
• Phương thức: Nhận tại cửa hàng hoặc gửi qua bưu điện
• Sau khi chúng tôi nhận được hàng, tiền hoàn sẽ được chuyển trong 3-5 ngày`
    : `• Sản phẩm mới sẽ được gửi đến địa chỉ của bạn trong 2-3 ngày
• Vui lòng gửi sản phẩm cũ về sau khi nhận hàng mới`
}`;
      break;

    case 'reject':
      content += `Yêu cầu ${typeText} #${requestId} của bạn đã bị TỪ CHỐI.

Lý do từ chối:
${returnRequest.adminNotes || 'Không đáp ứng điều kiện đổi/trả hàng'}

Nếu bạn có thắc mắc, vui lòng liên hệ bộ phận chăm sóc khách hàng.`;
      break;

    case 'complete':
      content += `Yêu cầu ${typeText} #${requestId} của bạn đã được HOÀN TẤT!

Thông tin hoàn tất:
${
  returnRequest.type === 'RETURN'
    ? `• Số tiền hoàn: ${formatPrice(returnRequest.refundAmount || 0)}
• Tiền sẽ được chuyển về tài khoản trong 3-5 ngày làm việc`
    : `• Đổi hàng thành công
• Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi`
}`;
      break;
  }

  content += `

Chi tiết yêu cầu:
• Mã yêu cầu: #${requestId}
• Loại: ${typeText}
• Số lượng sản phẩm: ${returnRequest.items?.length || 0}
${returnRequest.adminNotes ? `• Ghi chú: ${returnRequest.adminNotes}` : ''}

Xem chi tiết tại: ${process.env.NEXTAUTH_URL}/account/returns

---
Cảm ơn bạn đã tin tưởng ThanhHuy Store!
Liên hệ: support@thanhhuystore.com | 1900-xxxx
Website: ${process.env.NEXTAUTH_URL}
`;

  return content;
};

// Helper function to format price
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};

// Test function to send a simple email (for testing email service)
export const sendTestEmail = async (toEmail: string, testMessage: string = 'Test email from ThanhHuy Store') => {
  try {
    console.log(`📧 [EMAIL-TEST] Sending test email to ${toEmail}...`);

    const transporter = createTransporter();

    // Verify transporter configuration
    await transporter.verify();
    console.log('📧 [EMAIL-TEST] SMTP connection verified successfully');

    // Send test email
    const info = await transporter.sendMail({
      from: `"ThanhHuy Store" <${process.env.SMTP_USER || process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: '🧪 Test Email - ThanhHuy Store',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🧪 ThanhHuy Store</h1>
            <p style="color: white; margin: 5px 0;">Email Service Test</p>
          </div>

          <div style="padding: 20px; background: #f9f9f9;">
            <h2>Email Service Working! ✅</h2>
            <p><strong>Message:</strong> ${testMessage}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString('vi-VN')}</p>
            <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>

            <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
              <p style="color: #065f46; margin: 0;">✅ SMTP Configuration is working correctly!</p>
            </div>

            <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
              <p>This is a test email from ThanhHuy Store email service.</p>
            </div>
          </div>
        </div>
      `,
      text: `
ThanhHuy Store - Email Service Test

Email Service Working! ✅

Message: ${testMessage}
Time: ${new Date().toLocaleString('vi-VN')}
Environment: ${process.env.NODE_ENV || 'development'}

✅ SMTP Configuration is working correctly!

This is a test email from ThanhHuy Store email service.
      `
    });

    console.log('📧 [EMAIL-TEST] Test email sent successfully:', {
      messageId: info.messageId,
      to: toEmail
    });

    return {
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId
    };
  } catch (error) {
    console.error('📧 [EMAIL-TEST] Error sending test email:', error);

    if (error instanceof Error) {
      console.error('📧 [EMAIL-TEST] Error details:', {
        message: error.message,
        stack: error.stack
      });
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send test email'
    };
  }
};

export default {
  sendReturnStatusEmail,
  sendTestEmail
};

// Email service for return/exchange notifications
// This is a demo implementation - in production, integrate with actual email service

interface EmailData {
  to: string;
  subject: string;
  html: string;
}

export const sendReturnStatusEmail = async (
  userEmail: string,
  userName: string,
  returnRequest: any,
  action: 'approve' | 'reject' | 'complete'
) => {
  try {
    // Demo: Log email instead of actually sending
    console.log('📧 DEMO EMAIL NOTIFICATION:');
    console.log('To:', userEmail);
    console.log('Subject:', getEmailSubject(returnRequest.type, action));
    console.log('Content:', getEmailContent(userName, returnRequest, action));
    
    // In production, you would integrate with:
    // - Nodemailer
    // - SendGrid
    // - AWS SES
    // - Mailgun
    // etc.
    
    return { success: true, message: 'Email sent successfully (demo)' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Failed to send email' };
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
          ${returnRequest.type === 'RETURN' 
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
          ${returnRequest.type === 'RETURN' 
            ? `<p style="color: #065f46;">• Số tiền hoàn: <strong>${formatPrice(returnRequest.refundAmount || 0)}</strong></p>
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

// Helper function to format price (demo)
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};

export default {
  sendReturnStatusEmail
};

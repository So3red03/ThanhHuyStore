import nodemailer from 'nodemailer';
import MongoService from './mongoService';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface OrderEmailData {
  orderId: string;
  paymentIntentId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  products: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  pdfFileId?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Cấu hình email transporter (có thể dùng Gmail, SendGrid, etc.)
    const emailConfig: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

    this.transporter = nodemailer.createTransporter(emailConfig);
  }

  async sendOrderConfirmationWithPDF(orderData: OrderEmailData): Promise<void> {
    try {
      let attachments: any[] = [];

      // Nếu có PDF, thêm vào attachments
      if (orderData.pdfFileId) {
        try {
          const { buffer, metadata } = await MongoService.getPDF(orderData.pdfFileId);
          attachments.push({
            filename: metadata.filename || 'invoice.pdf',
            content: buffer,
            contentType: 'application/pdf',
          });
        } catch (error) {
          console.error('Error getting PDF for email:', error);
          // Tiếp tục gửi email mà không có PDF
        }
      }

      const mailOptions = {
        from: `"ThanhHuyStore" <${process.env.SMTP_USER}>`,
        to: orderData.customerEmail,
        subject: `Xác nhận đơn hàng #${orderData.paymentIntentId.slice(-6).toUpperCase()} - ThanhHuyStore`,
        html: this.generateOrderEmailHTML(orderData),
        attachments,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Order confirmation email sent successfully');
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      throw error;
    }
  }

  private generateOrderEmailHTML(orderData: OrderEmailData): string {
    const productsHTML = orderData.products
      .map(
        (product) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${product.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">x${product.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${this.formatPrice(product.price)}</td>
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Xác nhận đơn hàng</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px 0; }
          .order-details { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .products-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .products-table th { background-color: #e9ecef; padding: 12px; text-align: left; }
          .products-table td { padding: 10px; border-bottom: 1px solid #eee; }
          .total { font-weight: bold; font-size: 18px; color: #28a745; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #28a745; margin: 0;">ThanhHuyStore</h1>
            <p style="margin: 10px 0 0 0;">Cảm ơn bạn đã đặt hàng!</p>
          </div>
          
          <div class="content">
            <h2>Xin chào ${orderData.customerName},</h2>
            <p>Chúng tôi đã nhận được đơn hàng của bạn và đang xử lý. Dưới đây là chi tiết đơn hàng:</p>
            
            <div class="order-details">
              <h3>Thông tin đơn hàng</h3>
              <p><strong>Mã đơn hàng:</strong> #${orderData.paymentIntentId.slice(-6).toUpperCase()}</p>
              <p><strong>Ngày đặt:</strong> ${new Date().toLocaleDateString('vi-VN')}</p>
              <p><strong>Email:</strong> ${orderData.customerEmail}</p>
            </div>
            
            <h3>Chi tiết sản phẩm</h3>
            <table class="products-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th style="text-align: center;">Số lượng</th>
                  <th style="text-align: right;">Giá</th>
                </tr>
              </thead>
              <tbody>
                ${productsHTML}
              </tbody>
            </table>
            
            <div style="text-align: right; margin-top: 20px;">
              <p class="total">Tổng cộng: ${this.formatPrice(orderData.amount)}</p>
            </div>
            
            ${orderData.pdfFileId ? `
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>📄 Hóa đơn điện tử:</strong> Hóa đơn PDF đã được đính kèm trong email này.</p>
            </div>
            ` : ''}
            
            <p>Chúng tôi sẽ thông báo cho bạn khi đơn hàng được giao. Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
          </div>
          
          <div class="footer">
            <p>Cảm ơn bạn đã mua sắm tại ThanhHuyStore!</p>
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  }

  async sendNewProductNotification(
    userEmail: string,
    userName: string,
    products: Array<{
      name: string;
      price: number;
      image: string;
      category: string;
    }>
  ): Promise<void> {
    try {
      const productsHTML = products
        .map(
          (product) => `
          <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 10px 0;">
            <img src="${product.image}" alt="${product.name}" style="width: 100%; max-width: 200px; height: auto; border-radius: 4px;">
            <h3 style="margin: 10px 0;">${product.name}</h3>
            <p style="color: #28a745; font-weight: bold; font-size: 18px;">${this.formatPrice(product.price)}</p>
            <p style="color: #666;">Danh mục: ${product.category}</p>
          </div>
        `
        )
        .join('');

      const mailOptions = {
        from: `"ThanhHuyStore" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: 'Sản phẩm mới trong danh mục bạn quan tâm - ThanhHuyStore',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Sản phẩm mới</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="color: #28a745; margin: 0;">ThanhHuyStore</h1>
                <p style="margin: 10px 0 0 0;">Sản phẩm mới dành cho bạn!</p>
              </div>
              
              <div style="padding: 20px 0;">
                <h2>Xin chào ${userName},</h2>
                <p>Chúng tôi có những sản phẩm mới trong danh mục bạn đã mua trước đây. Hãy xem ngay!</p>
                
                ${productsHTML}
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}" 
                     style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Xem tất cả sản phẩm
                  </a>
                </div>
              </div>
              
              <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
                <p>Cảm ơn bạn đã tin tưởng ThanhHuyStore!</p>
                <p>Nếu không muốn nhận email này, vui lòng liên hệ với chúng tôi.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('New product notification email sent successfully');
    } catch (error) {
      console.error('Error sending new product notification email:', error);
      throw error;
    }
  }
}

export default EmailService;

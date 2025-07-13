import nodemailer from 'nodemailer';

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
}

export class OrderEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Cấu hình email transporter (có thể dùng Gmail, SendGrid, etc.)
    const emailConfig: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    };

    this.transporter = nodemailer.createTransport(emailConfig);
  }

  async sendOrderConfirmation(orderData: OrderEmailData): Promise<void> {
    try {
      const mailOptions = {
        from: `"ThanhHuyStore" <${process.env.SMTP_USER}>`,
        to: orderData.customerEmail,
        subject: `Xác nhận đơn hàng #${orderData.paymentIntentId.slice(-6).toUpperCase()} - ThanhHuyStore`,
        html: this.generateOrderEmailHTML(orderData)
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw error;
    }
  }

  private generateOrderEmailHTML(orderData: OrderEmailData): string {
    const productsHTML = orderData.products
      .map(
        product => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${product.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${product.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${this.formatPrice(
            product.price
          )}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${this.formatPrice(
            product.price * product.quantity
          )}</td>
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Xác nhận đơn hàng - ThanhHuyStore</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background-color: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #007bff;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #007bff;
              margin-bottom: 10px;
            }
            .order-info {
              background-color: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .products-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .products-table th {
              background-color: #007bff;
              color: white;
              padding: 12px;
              text-align: left;
            }
            .products-table th:last-child,
            .products-table td:last-child {
              text-align: right;
            }
            .total {
              font-size: 18px;
              font-weight: bold;
              color: #007bff;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">ThanhHuyStore</div>
              <p>Cảm ơn bạn đã đặt hàng!</p>
            </div>
            
            <h2>Xác nhận đơn hàng #${orderData.paymentIntentId.slice(-6).toUpperCase()}</h2>
            
            <div class="order-info">
              <p><strong>Khách hàng:</strong> ${orderData.customerName}</p>
              <p><strong>Email:</strong> ${orderData.customerEmail}</p>
              <p><strong>Mã đơn hàng:</strong> ${orderData.paymentIntentId}</p>
            </div>
            
            <h3>Chi tiết đơn hàng:</h3>
            <table class="products-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th style="text-align: center;">Số lượng</th>
                  <th style="text-align: right;">Đơn giá</th>
                  <th style="text-align: right;">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${productsHTML}
              </tbody>
            </table>
            
            <div style="text-align: right; margin-top: 20px;">
              <p class="total">Tổng cộng: ${this.formatPrice(orderData.amount)}</p>
            </div>
            
            <p>Chúng tôi sẽ thông báo cho bạn khi đơn hàng được giao. Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
          </div>
          
          <div class="footer">
            <p>ThanhHuyStore - Cửa hàng điện tử uy tín</p>
            <p>Email: support@thanhhuystore.com | Hotline: 1900-xxxx</p>
          </div>
        </body>
      </html>
    `;
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
    try {
      const mailOptions = {
        from: `"ThanhHuyStore" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: 'Chào mừng bạn đến với ThanhHuyStore!',
        html: this.generateWelcomeEmailHTML(userName)
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw error;
    }
  }

  private generateWelcomeEmailHTML(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Chào mừng - ThanhHuyStore</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background-color: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #007bff;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #007bff;
              margin-bottom: 10px;
            }
            .welcome-message {
              background-color: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">ThanhHuyStore</div>
              <p>Chào mừng bạn đến với gia đình ThanhHuyStore!</p>
            </div>
            
            <div class="welcome-message">
              <h2>Xin chào ${userName}!</h2>
              <p>Cảm ơn bạn đã đăng ký tài khoản tại ThanhHuyStore. Chúng tôi rất vui mừng được chào đón bạn!</p>
              <p>Bạn có thể bắt đầu mua sắm ngay bây giờ và khám phá những sản phẩm tuyệt vời của chúng tôi.</p>
            </div>
            
            <p>Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với đội ngũ hỗ trợ của chúng tôi.</p>
          </div>
          
          <div class="footer">
            <p>ThanhHuyStore - Cửa hàng điện tử uy tín</p>
            <p>Email: support@thanhhuystore.com | Hotline: 1900-xxxx</p>
          </div>
        </body>
      </html>
    `;
  }

  private formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }
}

export default OrderEmailService;

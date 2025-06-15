import PDFDocument from 'pdfkit';

// Helper function to format price
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

interface OrderData {
  id: string;
  amount: number;
  createDate: Date;
  paymentIntentId: string;
  phoneNumber?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    postal_code: string;
    country: string;
  };
  paymentMethod?: string;
  shippingFee?: number;
  discountAmount?: number;
  originalAmount?: number;
  voucherCode?: string;
  user: {
    name: string;
    email: string;
  };
  products: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    quantity: number;
    selectedImg: {
      color: string;
      colorCode: string;
      images: string[];
    };
  }>;
}

export class PDFGenerator {
  private doc: PDFKit.PDFDocument;

  constructor() {
    this.doc = new PDFDocument({ margin: 50 });
  }

  async generateOrderInvoice(orderData: OrderData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const buffers: Buffer[] = [];

      this.doc.on('data', (buffer) => buffers.push(buffer));
      this.doc.on('end', () => resolve(Buffer.concat(buffers)));
      this.doc.on('error', reject);

      try {
        this.buildInvoice(orderData);
        this.doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private buildInvoice(orderData: OrderData) {
    // Header
    this.generateHeader();
    
    // Customer Information
    this.generateCustomerInformation(orderData);
    
    // Order Details Table
    this.generateOrderTable(orderData);
    
    // Footer
    this.generateFooter();
  }

  private generateHeader() {
    this.doc
      .fontSize(20)
      .text('ThanhHuyStore', 50, 45)
      .fontSize(10)
      .text('Cảm ơn bạn đã đặt hàng', 50, 70, { align: 'left' })
      .text(`${new Date().toLocaleDateString('vi-VN')}, ${new Date().toLocaleTimeString('vi-VN')}`, 50, 85, { align: 'left' })
      .moveDown();
  }

  private generateCustomerInformation(orderData: OrderData) {
    const customerInformationTop = 150;

    this.doc
      .fontSize(12)
      .text('Thông tin mua hàng', 50, customerInformationTop)
      .font('Helvetica-Bold')
      .text(orderData.user.name, 50, customerInformationTop + 20)
      .font('Helvetica')
      .text(orderData.user.email, 50, customerInformationTop + 35)
      .text(orderData.phoneNumber || '', 50, customerInformationTop + 50)
      .moveDown();

    // Shipping Address
    if (orderData.address) {
      this.doc
        .fontSize(12)
        .text('Địa chỉ nhận hàng', 300, customerInformationTop)
        .font('Helvetica-Bold')
        .text(orderData.user.name, 300, customerInformationTop + 20)
        .font('Helvetica')
        .text(orderData.address.line1, 300, customerInformationTop + 35);
      
      if (orderData.address.line2) {
        this.doc.text(orderData.address.line2, 300, customerInformationTop + 50);
      }
      
      this.doc.text(
        `${orderData.address.city}, ${orderData.address.postal_code}, ${orderData.address.country}`,
        300,
        customerInformationTop + 65
      );
      this.doc.text(orderData.phoneNumber || '', 300, customerInformationTop + 80);
    }

    // Payment & Shipping Method
    this.doc
      .fontSize(12)
      .text('Phương thức thanh toán', 50, customerInformationTop + 120)
      .text(orderData.paymentMethod || 'Thanh toán khi giao hàng (Cash on Delivery)', 50, customerInformationTop + 135)
      .text('Phương thức vận chuyển', 300, customerInformationTop + 120)
      .text('Free delivery for orders over 500,000 VND', 300, customerInformationTop + 135);
  }

  private generateOrderTable(orderData: OrderData) {
    let i;
    const invoiceTableTop = 330;

    // Order ID
    this.doc
      .fontSize(14)
      .text(`Đơn hàng ${orderData.paymentIntentId.slice(-6).toUpperCase()}`, 50, invoiceTableTop - 30);

    // Table Header
    this.doc
      .fontSize(10)
      .text('Sản phẩm', 50, invoiceTableTop)
      .text('Số lượng', 350, invoiceTableTop, { width: 90, align: 'center' })
      .text('Giá', 450, invoiceTableTop, { width: 90, align: 'right' });

    // Draw header line
    this.doc
      .strokeColor('#aaaaaa')
      .lineWidth(1)
      .moveTo(50, invoiceTableTop + 15)
      .lineTo(550, invoiceTableTop + 15)
      .stroke();

    // Table Rows
    let position = invoiceTableTop + 30;
    
    for (i = 0; i < orderData.products.length; i++) {
      const item = orderData.products[i];
      
      this.doc
        .fontSize(10)
        .text(item.name, 50, position)
        .text(`x ${item.quantity}`, 350, position, { width: 90, align: 'center' })
        .text(formatPrice(item.price), 450, position, { width: 90, align: 'right' });

      position += 25;
    }

    // Summary section
    const subtotalPosition = position + 20;
    
    // Subtotal
    const subtotal = orderData.originalAmount || orderData.amount;
    this.doc
      .fontSize(10)
      .text('Tạm tính', 350, subtotalPosition)
      .text(formatPrice(subtotal), 450, subtotalPosition, { width: 90, align: 'right' });

    // Shipping fee
    if (orderData.shippingFee && orderData.shippingFee > 0) {
      this.doc
        .text('Phí vận chuyển', 350, subtotalPosition + 20)
        .text(formatPrice(orderData.shippingFee), 450, subtotalPosition + 20, { width: 90, align: 'right' });
    } else {
      this.doc
        .text('Phí vận chuyển', 350, subtotalPosition + 20)
        .text('Miễn phí', 450, subtotalPosition + 20, { width: 90, align: 'right' });
    }

    // Discount
    if (orderData.discountAmount && orderData.discountAmount > 0) {
      this.doc
        .text(`Giảm giá${orderData.voucherCode ? ` (${orderData.voucherCode})` : ''}`, 350, subtotalPosition + 40)
        .text(`-${formatPrice(orderData.discountAmount)}`, 450, subtotalPosition + 40, { width: 90, align: 'right' });
    }

    // Total line
    const totalPosition = subtotalPosition + (orderData.discountAmount ? 60 : 40);
    this.doc
      .strokeColor('#aaaaaa')
      .lineWidth(1)
      .moveTo(350, totalPosition)
      .lineTo(550, totalPosition)
      .stroke();

    // Total
    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Tổng cộng', 350, totalPosition + 10)
      .text(formatPrice(orderData.amount), 450, totalPosition + 10, { width: 90, align: 'right' });
  }

  private generateFooter() {
    this.doc
      .fontSize(10)
      .text(
        'Một email xác nhận đã được gửi tới ' + 'email của bạn.',
        50,
        700,
        { align: 'center', width: 500 }
      )
      .text('Xin vui lòng kiểm tra email của bạn', 50, 715, { align: 'center', width: 500 });
  }
}

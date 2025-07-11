const PDFDocument = require('pdfkit');

// Helper function to format price
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};

// Helper function to format date
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
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
    selectedImg:
      | string
      | {
          color: string;
          colorCode: string;
          images: string[];
        };
    attributes?: Record<string, string>; // For variant products
  }>;
}

export class PDFGenerator {
  constructor() {
    // PDFKit-based PDF generator
  }

  async generateOrderInvoice(orderData: OrderData): Promise<Buffer> {
    try {
      console.log('Starting PDF generation for order:', orderData.id);

      return new Promise((resolve, reject) => {
        try {
          const doc = new PDFDocument({ margin: 50 });
          const chunks: Buffer[] = [];
          console.log('PDFDocument created successfully');

          // Collect PDF data
          doc.on('data', (chunk: Buffer) => {
            console.log('PDF chunk received, size:', chunk.length);
            chunks.push(chunk);
          });

          doc.on('end', () => {
            const finalBuffer = Buffer.concat(chunks as any);
            console.log('PDF generation completed, total size:', finalBuffer.length);
            console.log('PDF buffer starts with:', finalBuffer.subarray(0, 10).toString());

            // Validate PDF header
            if (finalBuffer.subarray(0, 4).toString() === '%PDF') {
              console.log('✅ Valid PDF header detected');
            } else {
              console.log('❌ Invalid PDF header:', finalBuffer.subarray(0, 10).toString());
            }

            resolve(finalBuffer);
          });

          doc.on('error', (error: any) => {
            console.error('PDF generation error:', error);
            reject(error);
          });

          try {
            // Simple test content first
            console.log('Adding simple test content...');
            doc.fontSize(20).text('Test PDF Document', 100, 100);
            doc.fontSize(12).text('This is a test PDF to verify generation works.', 100, 150);
            doc.text(`Order ID: ${orderData.id}`, 100, 200);
            doc.text(`Amount: ${orderData.amount}`, 100, 220);

            console.log('PDF content added, finalizing...');

            // Finalize the PDF
            doc.end();
          } catch (contentError) {
            console.error('Error generating PDF content:', contentError);
            reject(contentError);
          }
        } catch (docError) {
          console.error('Error creating PDFDocument:', docError);
          reject(docError);
        }
      });
    } catch (error) {
      console.error('Error in generateOrderInvoice:', error);
      throw new Error('Failed to generate PDF invoice');
    }
  }

  private generatePDFContent(doc: any, orderData: OrderData): void {
    let yPosition = 50;

    // Header - Company Info
    doc.fontSize(20).font('Helvetica-Bold').text('THANHHUY STORE', 50, yPosition, { align: 'center' });
    yPosition += 30;
    doc.fontSize(16).font('Helvetica').text('HÓA ĐƠN BÁN HÀNG', 50, yPosition, { align: 'center' });
    yPosition += 40;

    // Order Info
    doc.fontSize(12).font('Helvetica-Bold').text('THÔNG TIN ĐƠN HÀNG', 50, yPosition);
    yPosition += 20;
    doc
      .font('Helvetica')
      .text(`Ngày tạo: ${formatDate(orderData.createDate)}`, 50, yPosition)
      .text(`Mã đơn hàng: ${orderData.paymentIntentId}`, 300, yPosition);
    yPosition += 40;

    // Customer Info
    doc.font('Helvetica-Bold').text('THÔNG TIN KHÁCH HÀNG', 50, yPosition);
    yPosition += 20;
    doc.font('Helvetica').text(`Tên khách hàng: ${orderData.user.name}`, 50, yPosition);
    yPosition += 15;
    doc.text(`Email: ${orderData.user.email}`, 50, yPosition);
    yPosition += 15;
    doc.text(`Số điện thoại: ${orderData.phoneNumber || 'Không có'}`, 50, yPosition);
    yPosition += 15;

    // Address if available
    if (orderData.address) {
      doc.text('Địa chỉ giao hàng:', 50, yPosition);
      yPosition += 15;
      doc.text(`${orderData.address.line1}`, 70, yPosition);
      yPosition += 15;
      if (orderData.address.line2) {
        doc.text(`${orderData.address.line2}`, 70, yPosition);
        yPosition += 15;
      }
      doc.text(`${orderData.address.city}, ${orderData.address.postal_code}`, 70, yPosition);
      yPosition += 15;
      doc.text(`${orderData.address.country}`, 70, yPosition);
      yPosition += 15;
    }
    yPosition += 20;

    // Products Header
    doc.font('Helvetica-Bold').text('CHI TIẾT ĐƠN HÀNG', 50, yPosition);
    yPosition += 20;

    // Table Header
    doc.rect(50, yPosition, 500, 20).fillAndStroke('#f0f0f0', '#000000');
    doc
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .text('STT', 60, yPosition + 5, { width: 40 })
      .text('Sản phẩm', 100, yPosition + 5, { width: 200 })
      .text('Màu sắc', 300, yPosition + 5, { width: 80 })
      .text('SL', 380, yPosition + 5, { width: 40 })
      .text('Đơn giá', 420, yPosition + 5, { width: 60 })
      .text('Thành tiền', 480, yPosition + 5, { width: 70 });
    yPosition += 25;

    // Products
    orderData.products.forEach((product, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      // Get variant info for display
      const getVariantInfo = () => {
        if (product.attributes) {
          const attributeValues = Object.values(product.attributes).filter(Boolean);
          return attributeValues.length > 0 ? attributeValues.join(' - ') : '-';
        } else if (typeof product.selectedImg === 'object' && product.selectedImg.color) {
          return product.selectedImg.color;
        }
        return '-';
      };

      doc
        .font('Helvetica')
        .text(`${index + 1}`, 60, yPosition, { width: 40 })
        .text(product.name, 100, yPosition, { width: 200 })
        .text(getVariantInfo(), 300, yPosition, { width: 80 })
        .text(`${product.quantity}`, 380, yPosition, { width: 40 })
        .text(formatPrice(product.price), 420, yPosition, { width: 60 })
        .text(formatPrice(product.price * product.quantity), 480, yPosition, { width: 70 });
      yPosition += 20;
    });

    yPosition += 20;

    // Summary
    doc.font('Helvetica-Bold').text('TỔNG KẾT', 50, yPosition);
    yPosition += 20;

    if (orderData.originalAmount) {
      doc.font('Helvetica').text(`Tổng tiền hàng: ${formatPrice(orderData.originalAmount)}`, 350, yPosition);
      yPosition += 15;
    }
    if (orderData.discountAmount) {
      doc.text(`Giảm giá: -${formatPrice(orderData.discountAmount)}`, 350, yPosition);
      yPosition += 15;
    }
    if (orderData.voucherCode) {
      doc.text(`Mã voucher: ${orderData.voucherCode}`, 350, yPosition);
      yPosition += 15;
    }
    if (orderData.shippingFee) {
      doc.text(`Phí vận chuyển: ${formatPrice(orderData.shippingFee)}`, 350, yPosition);
      yPosition += 15;
    }

    // Total
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .text(`TỔNG THANH TOÁN: ${formatPrice(orderData.amount)}`, 350, yPosition);
    yPosition += 25;

    doc
      .font('Helvetica')
      .fontSize(12)
      .text(`Phương thức thanh toán: ${orderData.paymentMethod || 'Không xác định'}`, 50, yPosition);
    yPosition += 40;

    // Footer
    doc.font('Helvetica-Bold').text('THÔNG TIN LIÊN HỆ', 50, yPosition);
    yPosition += 20;
    doc
      .font('Helvetica')
      .text('ThanhHuy Store', 50, yPosition)
      .text('Website: thanhhuystore.com', 50, yPosition + 15)
      .text('Email: support@thanhhuystore.com', 50, yPosition + 30)
      .text('Hotline: 1900-xxxx', 50, yPosition + 45);

    yPosition += 80;
    doc.text('Cảm ơn bạn đã mua hàng tại ThanhHuy Store!', 50, yPosition, { align: 'center' });
  }
}

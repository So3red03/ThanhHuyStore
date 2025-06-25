// Simple PDF generator using HTML template approach
// More reliable and free alternative to complex PDF libraries

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
    selectedImg: {
      color: string;
      colorCode: string;
      images: string[];
    };
  }>;
}

export class PDFGenerator {
  constructor() {
    // Simple HTML-based PDF generator
  }

  async generateOrderInvoice(orderData: OrderData): Promise<Buffer> {
    try {
      // Generate simple text-based invoice content
      const invoiceContent = this.generateInvoiceContent(orderData);

      // Return as buffer (in production, you could use puppeteer to convert HTML to PDF)
      return Buffer.from(invoiceContent, 'utf-8');
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF invoice');
    }
  }

  private generateInvoiceContent(orderData: OrderData): string {
    const content = `
===========================================
           THANHHUY STORE
        HÓA ĐƠN BÁN HÀNG
===========================================

Ngày tạo: ${formatDate(orderData.createDate)}
Mã đơn hàng: ${orderData.paymentIntentId}

-------------------------------------------
THÔNG TIN KHÁCH HÀNG
-------------------------------------------
Tên khách hàng: ${orderData.user.name}
Email: ${orderData.user.email}
Số điện thoại: ${orderData.phoneNumber || 'Không có'}
${
  orderData.address
    ? `
Địa chỉ giao hàng:
${orderData.address.line1}
${orderData.address.line2 || ''}
${orderData.address.city}, ${orderData.address.postal_code}
${orderData.address.country}
`
    : ''
}

-------------------------------------------
CHI TIẾT ĐƠN HÀNG
-------------------------------------------
${orderData.products
  .map(
    (product, index) => `
${index + 1}. ${product.name}
   Màu sắc: ${product.selectedImg.color}
   Số lượng: ${product.quantity}
   Đơn giá: ${formatPrice(product.price)}
   Thành tiền: ${formatPrice(product.price * product.quantity)}
`
  )
  .join('')}

-------------------------------------------
TỔNG KẾT
-------------------------------------------
${orderData.originalAmount ? `Tổng tiền hàng: ${formatPrice(orderData.originalAmount)}` : ''}
${orderData.discountAmount ? `Giảm giá: -${formatPrice(orderData.discountAmount)}` : ''}
${orderData.voucherCode ? `Mã voucher: ${orderData.voucherCode}` : ''}
${orderData.shippingFee ? `Phí vận chuyển: ${formatPrice(orderData.shippingFee)}` : ''}
TỔNG THANH TOÁN: ${formatPrice(orderData.amount)}

Phương thức thanh toán: ${orderData.paymentMethod || 'Không xác định'}

-------------------------------------------
THÔNG TIN LIÊN HỆ
-------------------------------------------
ThanhHuy Store
Website: thanhhuystore.com
Email: support@thanhhuystore.com
Hotline: 1900-xxxx

Cảm ơn bạn đã mua hàng tại ThanhHuy Store!
===========================================
`;

    return content;
  }
}

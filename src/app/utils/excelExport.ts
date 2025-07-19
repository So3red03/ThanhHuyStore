import * as XLSX from 'xlsx';
import { formatPrice } from '../../../utils/formatPrice';

interface ExcelReportData {
  orders: any[];
  users: any[];
  paymentData: any;
  totalRevenue: number;
  timeFilter: string;
}

export class ExcelExportService {
  /**
   * Xuất báo cáo tổng quan ra Excel
   */
  static exportOverviewReport(data: ExcelReportData) {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Tổng quan
    const overviewData = [
      ['BÁO CÁO TỔNG QUAN THANHHUYSSTORE'],
      ['Thời gian:', this.getTimeFilterLabel(data.timeFilter)],
      ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
      [],
      ['THỐNG KÊ TỔNG QUAN'],
      ['Tổng đơn hàng:', data.orders.length],
      ['Tổng doanh thu:', formatPrice(data.totalRevenue)],
      ['Tổng khách hàng:', data.users.length],
      ['Đơn hàng thành công:', data.orders.filter(o => o.status === 'completed').length],
      ['Đơn hàng đang xử lý:', data.orders.filter(o => o.status === 'pending').length],
      ['Đơn hàng đã hủy:', data.orders.filter(o => o.status === 'cancelled').length]
    ];

    const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Tổng quan');

    // Sheet 2: Chi tiết đơn hàng
    const orderHeaders = [
      'Mã đơn hàng',
      'Khách hàng',
      'Email',
      'Số điện thoại',
      'Tổng tiền',
      'Phương thức thanh toán',
      'Trạng thái',
      'Ngày tạo',
      'Địa chỉ'
    ];

    const orderData = data.orders.map(order => [
      order.id,
      order.user?.name || 'N/A',
      order.user?.email || 'N/A',
      order.phoneNumber || 'N/A',
      formatPrice(order.amount),
      this.getPaymentMethodLabel(order.paymentMethod),
      this.getOrderStatusLabel(order.status),
      new Date(order.createdAt).toLocaleDateString('vi-VN'),
      this.formatAddress(order.address)
    ]);

    const orderSheet = XLSX.utils.aoa_to_sheet([orderHeaders, ...orderData]);
    XLSX.utils.book_append_sheet(workbook, orderSheet, 'Chi tiết đơn hàng');

    // Sheet 3: Phương thức thanh toán
    if (data.paymentData?.data) {
      const paymentHeaders = ['Phương thức', 'Số đơn hàng', 'Doanh thu', 'Tỷ lệ (%)'];
      const paymentRows = data.paymentData.data.map((item: any) => [
        item.label,
        item.count,
        formatPrice(item.amount),
        item.percentage
      ]);

      const paymentSheet = XLSX.utils.aoa_to_sheet([paymentHeaders, ...paymentRows]);
      XLSX.utils.book_append_sheet(workbook, paymentSheet, 'Phương thức thanh toán');
    }

    // Sheet 4: Khách hàng
    const customerHeaders = [
      'Tên khách hàng',
      'Email',
      'Số điện thoại',
      'Vai trò',
      'Ngày đăng ký',
      'Số đơn hàng',
      'Tổng chi tiêu'
    ];

    const customerData = data.users.map(user => {
      const userOrders = data.orders.filter(o => o.userId === user.id);
      const totalSpent = userOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.amount, 0);

      return [
        user.name || 'N/A',
        user.email,
        user.phoneNumber || 'N/A',
        this.getRoleLabel(user.role),
        new Date(user.createAt).toLocaleDateString('vi-VN'),
        userOrders.length,
        formatPrice(totalSpent)
      ];
    });

    const customerSheet = XLSX.utils.aoa_to_sheet([customerHeaders, ...customerData]);
    XLSX.utils.book_append_sheet(workbook, customerSheet, 'Khách hàng');

    // Xuất file
    const fileName = `BaoCao_ThanhHuyStore_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    return fileName;
  }

  /**
   * Xuất báo cáo sản phẩm bán chạy
   */
  static exportProductReport(products: any[], timeFilter: string) {
    const workbook = XLSX.utils.book_new();

    const headers = ['Tên sản phẩm', 'Danh mục', 'Giá', 'Số lượng bán', 'Doanh thu', 'Tồn kho', 'Trạng thái'];

    const data = products.map(product => [
      product.name,
      product.category,
      formatPrice(product.price || 0),
      product.soldQuantity || 0,
      formatPrice((product.price || 0) * (product.soldQuantity || 0)),
      product.inStock || 0,
      product.inStock > 0 ? 'Còn hàng' : 'Hết hàng'
    ]);

    const sheet = XLSX.utils.aoa_to_sheet([
      [`BÁO CÁO SẢN PHẨM BÁN CHẠY - ${this.getTimeFilterLabel(timeFilter)}`],
      [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`],
      [],
      headers,
      ...data
    ]);

    XLSX.utils.book_append_sheet(workbook, sheet, 'Sản phẩm bán chạy');

    const fileName = `BaoCao_SanPham_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    return fileName;
  }

  // Helper methods
  private static getTimeFilterLabel(filter: string): string {
    switch (filter) {
      case '1d':
        return '24 giờ qua';
      case '7d':
        return '7 ngày qua';
      case '30d':
        return '30 ngày qua';
      case '90d':
        return '90 ngày qua';
      default:
        return '7 ngày qua';
    }
  }

  private static getPaymentMethodLabel(method: string): string {
    switch (method) {
      case 'cod':
        return 'Thanh toán khi nhận hàng (COD)';
      case 'stripe':
        return 'Thẻ tín dụng (Stripe)';
      case 'momo':
        return 'Ví MoMo';
      default:
        return method || 'Không xác định';
    }
  }

  private static getOrderStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'Đang xử lý';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status || 'Không xác định';
    }
  }

  private static getRoleLabel(role: string): string {
    switch (role) {
      case 'ADMIN':
        return 'Quản trị viên';
      case 'STAFF':
        return 'Nhân viên';
      case 'USER':
        return 'Khách hàng';
      default:
        return role || 'Không xác định';
    }
  }

  private static formatAddress(address: any): string {
    if (!address) return 'N/A';
    if (typeof address === 'string') return address;

    const parts = [
      address.line1,
      address.line2,
      address.city,
      address.state,
      address.postal_code,
      address.country
    ].filter(Boolean);

    return parts.join(', ') || 'N/A';
  }
}

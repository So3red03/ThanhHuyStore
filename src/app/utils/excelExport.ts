import * as XLSX from 'xlsx';
import { formatPrice } from './formatPrice';

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

  /**
   * Xuất danh sách sản phẩm đầy đủ (cho ManageProductsClient)
   */
  static exportProductsReport(products: any[]) {
    const workbook = XLSX.utils.book_new();

    const headers = [
      'ID',
      'Tên sản phẩm',
      'Loại sản phẩm',
      'Danh mục',
      'Giá',
      'Tồn kho',
      'Thương hiệu',
      'Mô tả',
      'Trạng thái',
      'Ngày tạo',
      'Ngày cập nhật',
      'Ưu tiên',
      'Số lượng biến thể',
      'Số đánh giá',
      'Điểm trung bình'
    ];

    const data = products.map(product => [
      product.id,
      product.name || 'N/A',
      product.productType === 'SIMPLE' ? 'Sản phẩm đơn giản' : 'Sản phẩm biến thể',
      product.category?.name || 'Không xác định',
      product.price ? formatPrice(product.price) : 'N/A',
      product.inStock || 0,
      product.brand || 'N/A',
      product.description ? product.description.substring(0, 100) + '...' : 'N/A',
      product.isDeleted ? 'Đã xóa' : 'Hoạt động',
      new Date(product.createdAt).toLocaleDateString('vi-VN'),
      new Date(product.updatedAt).toLocaleDateString('vi-VN'),
      product.priority || 0,
      product.variants?.length || 0,
      product.reviews?.length || 0,
      product.reviews?.length > 0
        ? (product.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / product.reviews.length).toFixed(1)
        : 'N/A'
    ]);

    const sheet = XLSX.utils.aoa_to_sheet([
      ['DANH SÁCH SẢN PHẨM - THANHHUYSSTORE'],
      [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`],
      [`Tổng số sản phẩm: ${products.length}`],
      [],
      headers,
      ...data
    ]);

    // Auto-fit columns
    const colWidths = headers.map((_, i) => ({
      wch: Math.max(headers[i].length, ...data.map(row => String(row[i] || '').length))
    }));
    sheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, sheet, 'Danh sách sản phẩm');

    const fileName = `DanhSach_SanPham_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    return fileName;
  }

  /**
   * Xuất danh sách đơn hàng đầy đủ (cho ManageOrdersClient)
   */
  static exportOrdersReport(orders: any[]) {
    const workbook = XLSX.utils.book_new();

    const headers = [
      'ID',
      'Mã đơn hàng',
      'Khách hàng',
      'Email',
      'Số điện thoại',
      'Tổng tiền',
      'Phương thức thanh toán',
      'Trạng thái',
      'Ngày tạo',
      'Ngày cập nhật',
      'Địa chỉ giao hàng',
      'Ghi chú',
      'Mã giảm giá',
      'Số lượng sản phẩm',
      'Chi tiết sản phẩm'
    ];

    const data = orders.map(order => [
      order.id,
      order.id.substring(0, 8).toUpperCase(),
      order.user?.name || 'N/A',
      order.user?.email || 'N/A',
      order.phoneNumber || 'N/A',
      formatPrice(order.amount),
      this.getPaymentMethodLabel(order.paymentMethod),
      this.getOrderStatusLabel(order.status),
      new Date(order.createdAt).toLocaleDateString('vi-VN'),
      new Date(order.updatedAt).toLocaleDateString('vi-VN'),
      this.formatAddress(order.address),
      order.notes || 'N/A',
      order.voucherCode || 'N/A',
      order.products?.length || 0,
      order.products?.map((p: any) => `${p.name} (x${p.quantity})`).join('; ') || 'N/A'
    ]);

    const sheet = XLSX.utils.aoa_to_sheet([
      ['DANH SÁCH ĐỚN HÀNG - THANHHUYSSTORE'],
      [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`],
      [`Tổng số đơn hàng: ${orders.length}`],
      [`Tổng doanh thu: ${formatPrice(orders.reduce((sum, o) => sum + (o.status === 'completed' ? o.amount : 0), 0))}`],
      [],
      headers,
      ...data
    ]);

    // Auto-fit columns
    const colWidths = headers.map((_, i) => ({
      wch: Math.max(headers[i].length, ...data.map(row => String(row[i] || '').length))
    }));
    sheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, sheet, 'Danh sách đơn hàng');

    // Sheet 2: Thống kê theo trạng thái
    const statusStats = [['THỐNG KÊ THEO TRẠNG THÁI'], [], ['Trạng thái', 'Số lượng', 'Tỷ lệ (%)', 'Doanh thu']];

    const statusGroups = orders.reduce((acc: any, order) => {
      const status = order.status;
      if (!acc[status]) {
        acc[status] = { count: 0, revenue: 0 };
      }
      acc[status].count++;
      if (status === 'completed') {
        acc[status].revenue += order.amount;
      }
      return acc;
    }, {});

    Object.entries(statusGroups).forEach(([status, data]: [string, any]) => {
      statusStats.push([
        this.getOrderStatusLabel(status),
        data.count,
        ((data.count / orders.length) * 100).toFixed(1) + '%',
        formatPrice(data.revenue)
      ]);
    });

    const statusSheet = XLSX.utils.aoa_to_sheet(statusStats);
    XLSX.utils.book_append_sheet(workbook, statusSheet, 'Thống kê trạng thái');

    const fileName = `DanhSach_DonHang_${new Date().toISOString().split('T')[0]}.xlsx`;
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

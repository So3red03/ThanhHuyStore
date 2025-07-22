import prisma from '../prismadb';

interface ReportData {
  totalOrders: number;
  totalRevenue: number;
  successfulOrders: number;
  lowStockProducts: any[];
  topProducts: any[];
  newCustomers: number;
  conversionRate: number;
  period: string;
}

export class DiscordReportService {
  private static DISCORD_ORDER_WEBHOOK_URL = process.env.DISCORD_REPORT_WEBHOOK_URL || '';

  // Lấy dữ liệu báo cáo enhanced
  static async getReportData(hours: number = 24): Promise<
    ReportData & {
      cancelledOrders: number;
      pendingOrders: number;
      vouchersUsed: number;
      topViewedProducts: any[];
    }
  > {
    const now = new Date();
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);

    try {
      // Tổng số đơn hàng
      const totalOrders = await prisma.order.count({
        where: {
          createdAt: {
            gte: startTime
          }
        }
      });

      // Tổng doanh thu
      const revenueResult = await prisma.order.aggregate({
        where: {
          createdAt: {
            gte: startTime
          },
          status: {
            in: ['completed', 'confirmed']
          }
        },
        _sum: {
          amount: true
        }
      });

      // Đơn hàng thành công
      const successfulOrders = await prisma.order.count({
        where: {
          createdAt: {
            gte: startTime
          },
          status: 'completed'
        }
      });

      // Đơn hàng bị hủy
      const cancelledOrders = await prisma.order.count({
        where: {
          createdAt: {
            gte: startTime
          },
          status: 'canceled'
        }
      });

      // Đơn hàng đang chờ
      const pendingOrders = await prisma.order.count({
        where: {
          createdAt: {
            gte: startTime
          },
          status: 'pending'
        }
      });

      // Sản phẩm sắp hết hàng (stock < 10)
      const lowStockProducts = await prisma.product.findMany({
        where: {
          inStock: {
            lt: 10
          }
        },
        select: {
          name: true,
          inStock: true
        },
        take: 5
      });

      // Top sản phẩm bán chạy từ Order.products (chỉ tính completed)
      const ordersWithProducts = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: startTime
          },
          status: 'completed' // Chỉ tính orders completed, không tính canceled
        },
        select: {
          products: true
        }
      });

      // Tính tổng quantity cho mỗi sản phẩm
      const productQuantityMap = new Map<string, { name: string; quantity: number }>();

      ordersWithProducts.forEach(order => {
        order.products.forEach(product => {
          const existing = productQuantityMap.get(product.id);
          if (existing) {
            existing.quantity += product.quantity;
          } else {
            productQuantityMap.set(product.id, {
              name: product.name,
              quantity: product.quantity
            });
          }
        });
      });

      // Sắp xếp và lấy top 5
      const topProductsWithDetails = Array.from(productQuantityMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Khách hàng mới
      const newCustomers = await prisma.user.count({
        where: {
          createAt: {
            gte: startTime
          }
        }
      });

      // Voucher được sử dụng
      const vouchersUsed = await prisma.order.count({
        where: {
          createdAt: {
            gte: startTime
          },
          discountAmount: {
            gt: 0
          }
        }
      });

      // Top sản phẩm được xem nhiều từ AnalyticsEvent
      const topViewedProductsData = await prisma.analyticsEvent.groupBy({
        by: ['entityId'],
        where: {
          eventType: 'PRODUCT_VIEW',
          entityType: 'product',
          entityId: { not: null },
          timestamp: {
            gte: startTime
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 5
      });

      // Lấy thông tin chi tiết sản phẩm được xem nhiều
      const viewedProductIds = topViewedProductsData.map(item => item.entityId).filter(Boolean) as string[];
      const viewedProducts = await prisma.product.findMany({
        where: {
          id: { in: viewedProductIds }
        },
        select: {
          id: true,
          name: true
        }
      });

      const topViewedProducts = topViewedProductsData.map(item => {
        const product = viewedProducts.find(p => p.id === item.entityId);
        return {
          name: product?.name || 'Unknown Product',
          views: item._count.id
        };
      });

      const totalRevenue = revenueResult._sum?.amount || 0;
      const conversionRate = totalOrders > 0 ? (successfulOrders / totalOrders) * 100 : 0;

      return {
        totalOrders,
        totalRevenue,
        successfulOrders,
        cancelledOrders,
        pendingOrders,
        lowStockProducts,
        topProducts: topProductsWithDetails,
        topViewedProducts,
        newCustomers,
        vouchersUsed,
        conversionRate,
        period: `${hours}h`
      };
    } catch (error) {
      console.error('Error getting report data:', error);
      throw error;
    }
  }

  // Tạo embed Discord cho báo cáo
  static createReportEmbed(
    data: ReportData & {
      cancelledOrders: number;
      pendingOrders: number;
      vouchersUsed: number;
      topViewedProducts: any[];
    }
  ) {
    const embed = {
      title: 'Báo cáo kinh doanh ThanhHuyStore',
      description: `Báo cáo ${data.period} - ${new Date().toLocaleString('vi-VN')}`,
      color: 0x3b82f6,
      fields: [
        {
          name: '💰 Doanh thu',
          value: `${data.totalRevenue.toLocaleString()} VND`,
          inline: true
        },
        {
          name: '📦 Tổng đơn hàng',
          value: data.totalOrders.toString(),
          inline: true
        },
        {
          name: '✅ Đơn thành công',
          value: data.successfulOrders.toString(),
          inline: true
        },
        {
          name: '❌ Đơn bị hủy',
          value: data.cancelledOrders.toString(),
          inline: true
        },
        {
          name: '⏳ Đơn chờ xử lý',
          value: data.pendingOrders.toString(),
          inline: true
        },
        {
          name: '🎟️ Voucher sử dụng',
          value: data.vouchersUsed.toString(),
          inline: true
        },
        {
          name: '👥 Khách hàng mới',
          value: data.newCustomers.toString(),
          inline: true
        }
      ],
      timestamp: new Date().toISOString()
    };

    // Thêm sản phẩm bán chạy
    if (data.topProducts.length > 0) {
      embed.fields.push({
        name: '🔥 Top sản phẩm bán chạy',
        value:
          data.topProducts.map((p, i) => `${i + 1}. ${p.name} (${p.quantity} sp)`).join('\n') || 'Không có dữ liệu',
        inline: false
      });
    }

    // Thêm sản phẩm sắp hết hàng
    if (data.lowStockProducts.length > 0) {
      embed.fields.push({
        name: '⚠️ Sản phẩm sắp hết hàng',
        value: data.lowStockProducts.map(p => `• ${p.name} (còn ${p.inStock})`).join('\n'),
        inline: false
      });
    }

    // Thêm sản phẩm được xem nhiều
    if (data.topViewedProducts.length > 0) {
      embed.fields.push({
        name: '👀 Sản phẩm được xem nhiều',
        value: data.topViewedProducts.map((p, i) => `${i + 1}. ${p.name} (${p.views} lượt xem)`).join('\n'),
        inline: false
      });
    }

    return embed;
  }

  // Gửi báo cáo qua Discord
  static async sendReport(hours: number = 24): Promise<void> {
    try {
      // Kiểm tra xem Discord reports có được bật không
      const settings = await prisma.adminSettings.findFirst();
      if (!settings?.dailyReports) {
        return;
      }

      if (!this.DISCORD_ORDER_WEBHOOK_URL) {
        return;
      }

      const reportData = await this.getReportData(hours);
      const embed = this.createReportEmbed(reportData);

      const response = await fetch(this.DISCORD_ORDER_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          embeds: [embed]
        })
      });

      if (!response.ok) {
        throw new Error(`Discord webhook failed: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      throw new Error('Error sending Discord report');
    }
  }
}

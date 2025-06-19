import prisma from './prismadb';

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
  private static DISCORD_WEBHOOK_URL = process.env.DISCORD_REPORT_WEBHOOK_URL || 
    'https://discord.com/api/webhooks/1385111738994655365/_ZsbRTu_u91HXI5oGXKKf9coRg0lGJjia6QB3y3R48hFNz8NfhOzeT7P0ixNKRg86lOd';

  // Lấy dữ liệu báo cáo
  static async getReportData(hours: number = 24): Promise<ReportData> {
    const now = new Date();
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);

    try {
      // Tổng số đơn hàng
      const totalOrders = await prisma.order.count({
        where: {
          createdDate: {
            gte: startTime
          }
        }
      });

      // Tổng doanh thu
      const revenueResult = await prisma.order.aggregate({
        where: {
          createdDate: {
            gte: startTime
          },
          status: {
            in: ['complete', 'dispatched']
          }
        },
        _sum: {
          amount: true
        }
      });

      // Đơn giao thành công
      const successfulOrders = await prisma.order.count({
        where: {
          createdDate: {
            gte: startTime
          },
          status: 'complete'
        }
      });

      // Sản phẩm sắp hết hàng (≤10)
      const lowStockProducts = await prisma.product.findMany({
        where: {
          inStock: {
            lte: 10,
            gt: 0
          }
        },
        select: {
          name: true,
          inStock: true
        },
        take: 5
      });

      // Top sản phẩm bán chạy
      const topProducts = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            createdDate: {
              gte: startTime
            }
          }
        },
        _sum: {
          quantity: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 5
      });

      // Lấy thông tin chi tiết sản phẩm
      const topProductsWithDetails = await Promise.all(
        topProducts.map(async (item) => {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { name: true }
          });
          return {
            name: product?.name || 'Unknown',
            quantity: item._sum.quantity || 0
          };
        })
      );

      // Khách hàng mới
      const newCustomers = await prisma.user.count({
        where: {
          createdAt: {
            gte: startTime
          },
          role: 'USER'
        }
      });

      // Tỷ lệ chuyển đổi (đơn thành công / tổng đơn)
      const conversionRate = totalOrders > 0 ? (successfulOrders / totalOrders) * 100 : 0;

      return {
        totalOrders,
        totalRevenue: revenueResult._sum.amount || 0,
        successfulOrders,
        lowStockProducts,
        topProducts: topProductsWithDetails,
        newCustomers,
        conversionRate: Math.round(conversionRate * 100) / 100,
        period: hours === 24 ? '24 giờ qua' : `${hours} giờ qua`
      };
    } catch (error) {
      console.error('Error getting report data:', error);
      throw error;
    }
  }

  // Tạo embed Discord
  static createDiscordEmbed(data: ReportData) {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount);
    };

    return {
      embeds: [
        {
          title: `📊 Báo cáo kinh doanh - ${data.period}`,
          color: 0x00ff00, // Green color
          timestamp: new Date().toISOString(),
          fields: [
            {
              name: '🛒 Tổng đơn hàng',
              value: data.totalOrders.toString(),
              inline: true
            },
            {
              name: '💰 Doanh thu',
              value: formatCurrency(data.totalRevenue),
              inline: true
            },
            {
              name: '✅ Đơn thành công',
              value: data.successfulOrders.toString(),
              inline: true
            },
            {
              name: '👥 Khách hàng mới',
              value: data.newCustomers.toString(),
              inline: true
            },
            {
              name: '📈 Tỷ lệ chuyển đổi',
              value: `${data.conversionRate}%`,
              inline: true
            },
            {
              name: '🔥 Top sản phẩm bán chạy',
              value: data.topProducts.length > 0 
                ? data.topProducts.map((p, i) => `${i + 1}. ${p.name} (${p.quantity})`).join('\n')
                : 'Không có dữ liệu',
              inline: false
            },
            {
              name: '⚠️ Sản phẩm sắp hết hàng',
              value: data.lowStockProducts.length > 0
                ? data.lowStockProducts.map(p => `• ${p.name} (còn ${p.inStock})`).join('\n')
                : 'Tất cả sản phẩm đều đủ hàng',
              inline: false
            }
          ],
          footer: {
            text: 'ThanhHuy Store - Hệ thống báo cáo tự động',
            icon_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
          }
        }
      ]
    };
  }

  // Gửi báo cáo qua Discord
  static async sendReport(hours: number = 24): Promise<boolean> {
    try {
      const reportData = await this.getReportData(hours);
      const embed = this.createDiscordEmbed(reportData);

      const response = await fetch(this.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(embed)
      });

      if (!response.ok) {
        throw new Error(`Discord webhook failed: ${response.status}`);
      }

      console.log(`✅ Báo cáo ${hours}h đã được gửi thành công qua Discord`);
      return true;
    } catch (error) {
      console.error('❌ Lỗi gửi báo cáo Discord:', error);
      return false;
    }
  }

  // Test gửi báo cáo (cho admin test)
  static async sendTestReport(): Promise<boolean> {
    try {
      const testEmbed = {
        embeds: [
          {
            title: '🧪 Test Báo cáo hệ thống',
            description: 'Đây là tin nhắn test để kiểm tra kết nối Discord webhook',
            color: 0x0099ff,
            timestamp: new Date().toISOString(),
            fields: [
              {
                name: '✅ Trạng thái',
                value: 'Hệ thống hoạt động bình thường',
                inline: true
              },
              {
                name: '🕐 Thời gian',
                value: new Date().toLocaleString('vi-VN'),
                inline: true
              }
            ],
            footer: {
              text: 'ThanhHuy Store - Test Report',
              icon_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
            }
          }
        ]
      };

      const response = await fetch(this.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testEmbed)
      });

      return response.ok;
    } catch (error) {
      console.error('Test report failed:', error);
      return false;
    }
  }
}

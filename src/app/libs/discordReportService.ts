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
          createDate: {
            gte: startTime
          }
        }
      });

      // Tổng doanh thu
      const revenueResult = await prisma.order.aggregate({
        where: {
          createDate: {
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

      // Đơn giao thành công
      const successfulOrders = await prisma.order.count({
        where: {
          createDate: {
            gte: startTime
          },
          status: 'completed'
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

      // Top sản phẩm bán chạy - sử dụng Order với products
      const topProductsData = await prisma.order.findMany({
        where: {
          createDate: {
            gte: startTime
          },
          status: {
            in: ['completed', 'confirmed']
          }
        },
        select: {
          products: {
            select: {
              id: true,
              name: true,
              quantity: true
            }
          }
        }
      });

      // Tính tổng quantity cho mỗi sản phẩm
      const productQuantityMap = new Map<string, { name: string; quantity: number }>();

      topProductsData.forEach(order => {
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
          },
          role: 'USER'
        }
      });

      // Tỷ lệ chuyển đổi (đơn thành công / tổng đơn)
      const conversionRate = totalOrders > 0 ? (successfulOrders / totalOrders) * 100 : 0;

      // Đơn bị hủy
      const cancelledOrders = await prisma.order.count({
        where: {
          createDate: {
            gte: startTime,
            lte: now
          },
          status: 'canceled'
        }
      });

      // Đơn đang xử lý (pending + confirmed chưa giao)
      const pendingOrders = await prisma.order.count({
        where: {
          createDate: {
            gte: startTime,
            lte: now
          },
          status: {
            in: ['pending', 'confirmed']
          },
          deliveryStatus: {
            in: ['not_shipped', 'in_transit']
          }
        }
      });

      // Voucher đã sử dụng
      const vouchersUsed = await prisma.order.count({
        where: {
          createDate: {
            gte: startTime,
            lte: now
          },
          voucherId: {
            not: null
          }
        }
      });

      // Top sản phẩm được xem nhiều (từ analytics events)
      const topViewedProducts = await prisma.analyticsEvent.groupBy({
        by: ['entityId'],
        where: {
          eventType: 'PRODUCT_VIEW',
          timestamp: {
            gte: startTime,
            lte: now
          },
          entityId: {
            not: null
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
      const topViewedProductsWithDetails = await Promise.all(
        topViewedProducts.map(async item => {
          const product = await prisma.product.findUnique({
            where: { id: item.entityId! },
            select: { name: true, price: true }
          });
          return {
            name: product?.name || 'Unknown Product',
            views: item._count.id,
            price: product?.price || 0
          };
        })
      );

      return {
        totalOrders,
        totalRevenue: revenueResult._sum?.amount || 0,
        successfulOrders,
        lowStockProducts,
        topProducts: topProductsWithDetails,
        newCustomers,
        conversionRate: Math.round(conversionRate * 100) / 100,
        period: hours === 24 ? '24 giờ qua' : `${hours} giờ qua`,
        // New fields
        cancelledOrders,
        pendingOrders,
        vouchersUsed,
        topViewedProducts: topViewedProductsWithDetails
      };
    } catch (error) {
      console.error('Error getting report data:', error);
      throw error;
    }
  }

  // Enhanced Discord embed - Business Owner & Analyst Perspective
  static createDiscordEmbed(data: any) {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount);
    };

    // Calculate key business metrics
    const avgOrderValue = data.totalOrders > 0 ? data.totalRevenue / data.totalOrders : 0;
    const successRate = data.totalOrders > 0 ? (data.successfulOrders / data.totalOrders) * 100 : 0;
    const cancelRate = data.totalOrders > 0 ? (data.cancelledOrders / data.totalOrders) * 100 : 0;

    // Determine performance status and color
    const getPerformanceData = () => {
      if (data.totalRevenue > 50000000) return { emoji: '🚀', color: 0x00ff00, status: 'XUẤT SẮC' };
      if (data.totalRevenue > 20000000) return { emoji: '📈', color: 0x32cd32, status: 'TỐT' };
      if (data.totalRevenue > 5000000) return { emoji: '📊', color: 0xffa500, status: 'TRUNG BÌNH' };
      return { emoji: '⚠️', color: 0xff4500, status: 'CẦN CHÚ Ý' };
    };

    const performance = getPerformanceData();

    return {
      embeds: [
        {
          title: `${performance.emoji} THANHHUSTORE - BÁO CÁO KINH DOANH`,
          description: `**${data.period.toUpperCase()}** | Hiệu suất: **${
            performance.status
          }**\n📅 ${new Date().toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}`,
          color: performance.color,
          timestamp: new Date().toISOString(),
          fields: [
            // CRITICAL BUSINESS METRICS - First Priority (Business Owner Focus)
            {
              name: '💰 **DOANH THU TỔNG**',
              value: `**${formatCurrency(data.totalRevenue)}**\n📊 TB/đơn: ${formatCurrency(avgOrderValue)}`,
              inline: true
            },
            {
              name: '📦 **TỔNG ĐƠN HÀNG**',
              value: `**${data.totalOrders} đơn**\n✅ Thành công: ${data.successfulOrders} (${successRate.toFixed(
                1
              )}%)`,
              inline: true
            },
            {
              name: '📈 **TỶ LỆ CHUYỂN ĐỔI**',
              value: `**${data.conversionRate}%**\n👥 KH mới: ${data.newCustomers} người`,
              inline: true
            },

            // ORDER STATUS ANALYSIS - Second Priority (Operations Focus)
            {
              name: '❌ **ĐƠN BỊ HỦY**',
              value: `**${data.cancelledOrders} đơn** (${cancelRate.toFixed(1)}%)`,
              inline: true
            },
            {
              name: '⏳ **ĐƠN ĐANG XỬ LÝ**',
              value: `**${data.pendingOrders} đơn**`,
              inline: true
            },
            {
              name: '🎫 **VOUCHER ĐÃ DÙNG**',
              value: `**${data.vouchersUsed} lượt**`,
              inline: true
            },

            // PRODUCT INSIGHTS - Third Priority (Marketing & Inventory Focus)
            {
              name: '👁️ **SẢN PHẨM ĐƯỢC XEM NHIỀU**',
              value:
                data.topViewedProducts && data.topViewedProducts.length > 0
                  ? data.topViewedProducts
                      .slice(0, 3)
                      .map((p: any, index: number) => `${index + 1}. **${p.name}** - ${p.views} lượt xem`)
                      .join('\n')
                  : '📊 Chưa có dữ liệu tracking',
              inline: false
            },
            {
              name: '🏆 **TOP SẢN PHẨM BÁN CHẠY**',
              value:
                data.topProducts.length > 0
                  ? data.topProducts
                      .slice(0, 3)
                      .map((p: any, index: number) => `${index + 1}. **${p.name}** - ${p.quantity} đã bán`)
                      .join('\n')
                  : '📊 Chưa có dữ liệu bán hàng',
              inline: false
            },
            {
              name: '⚠️ **CẢNH BÁO TỒN KHO**',
              value:
                data.lowStockProducts.length > 0
                  ? `🚨 **${data.lowStockProducts.length} sản phẩm** sắp hết:\n` +
                    data.lowStockProducts
                      .slice(0, 3)
                      .map((p: any) => `• **${p.name}**: ${p.inStock} còn lại`)
                      .join('\n')
                  : '✅ Tất cả sản phẩm đều đủ hàng',
              inline: false
            }
          ],
          footer: {
            text: `ThanhHuyStore Analytics • Cập nhật mỗi ${data.period === '24 giờ qua' ? '24h' : data.period}`,
            icon_url: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
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

      const response = await fetch(this.DISCORD_ORDER_WEBHOOK_URL, {
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

      const response = await fetch(this.DISCORD_ORDER_WEBHOOK_URL, {
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

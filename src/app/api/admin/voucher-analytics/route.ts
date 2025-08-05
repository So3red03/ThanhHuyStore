import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Calculate date range
    let endDate = new Date();
    let startDate = new Date();
    let useTimeFilter = true;

    if (startDateParam && endDateParam) {
      // Custom date range
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      // Ensure endDate is end of day
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Use days parameter
      const days = parseInt(daysParam || '30');
      if (days <= 0) {
        // If days is 0 or negative, get all data
        useTimeFilter = false;
        startDate = new Date(0); // Beginning of time
      } else {
        startDate.setDate(endDate.getDate() - days);
      }
    }

    // Create conditional filters
    const userVoucherFilter = useTimeFilter
      ? {
          usedAt: {
            gte: startDate,
            lte: endDate,
            not: null
          }
        }
      : {
          usedAt: {
            not: null
          }
        };

    const orderFilter = useTimeFilter
      ? {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          status: 'completed' as const // Chỉ tính orders completed
        }
      : {
          status: 'completed' as const // Chỉ tính orders completed
        };

    // Get voucher usage statistics
    const voucherStats = await prisma.voucher.findMany({
      include: {
        userVouchers: {
          where: userVoucherFilter,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        orders: {
          where: orderFilter,
          select: {
            id: true,
            amount: true,
            discountAmount: true,
            originalAmount: true,
            products: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        usedCount: 'desc'
      }
    });

    // Calculate detailed statistics for each voucher
    const voucherAnalytics = voucherStats.map((voucher: any) => {
      const usageInPeriod = voucher.userVouchers.length;
      const ordersInPeriod = voucher.orders.length;

      // Calculate total revenue generated
      const totalRevenue = voucher.orders.reduce((sum: number, order: any) => sum + order.amount, 0);
      const totalDiscount = voucher.orders.reduce((sum: number, order: any) => sum + (order.discountAmount || 0), 0);

      // Get products that used this voucher
      const productsUsed = voucher.orders.reduce((acc: any[], order: any) => {
        const orderProducts = order.products as any[];
        orderProducts.forEach((product: any) => {
          const existingProduct = acc.find((p: any) => p.id === product.id);
          if (existingProduct) {
            existingProduct.quantity += product.quantity;
            existingProduct.orderCount += 1;
          } else {
            acc.push({
              id: product.id,
              name: product.name,
              quantity: product.quantity,
              orderCount: 1,
              price: product.price
            });
          }
        });
        return acc;
      }, []);

      // Sort products by quantity used
      productsUsed.sort((a: any, b: any) => b.quantity - a.quantity);

      return {
        id: voucher.id,
        code: voucher.code,
        description: voucher.description,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        totalUsageCount: voucher.usedCount,
        usageInPeriod,
        ordersInPeriod,
        totalRevenue,
        totalDiscount,
        averageOrderValue: ordersInPeriod > 0 ? totalRevenue / ordersInPeriod : 0,
        conversionRate: voucher.quantity > 0 ? (voucher.usedCount / voucher.quantity) * 100 : 0,
        topProducts: productsUsed.slice(0, 5),
        recentUsers: voucher.userVouchers.slice(0, 5).map((uv: any) => ({
          name: uv.user.name,
          email: uv.user.email,
          usedAt: uv.usedAt
        })),
        isActive: voucher.isActive,
        startDate: voucher.startDate,
        endDate: voucher.endDate
      };
    });

    // Calculate summary statistics
    const summary = {
      totalVouchers: voucherStats.length,
      activeVouchers: voucherStats.filter(v => v.isActive).length,
      totalUsage: voucherAnalytics.reduce((sum, v) => sum + v.usageInPeriod, 0),
      totalRevenue: voucherAnalytics.reduce((sum, v) => sum + v.totalRevenue, 0),
      totalDiscount: voucherAnalytics.reduce((sum, v) => sum + v.totalDiscount, 0),
      averageUsagePerVoucher:
        voucherStats.length > 0
          ? voucherAnalytics.reduce((sum, v) => sum + v.usageInPeriod, 0) / voucherStats.length
          : 0
    };

    // Get most popular products across all vouchers
    const allProducts = voucherAnalytics.reduce((acc: any[], voucher) => {
      voucher.topProducts.forEach((product: any) => {
        const existingProduct = acc.find(p => p.id === product.id);
        if (existingProduct) {
          existingProduct.quantity += product.quantity;
          existingProduct.orderCount += product.orderCount;
          existingProduct.voucherCount += 1;
        } else {
          acc.push({
            ...product,
            voucherCount: 1
          });
        }
      });
      return acc;
    }, []);

    allProducts.sort((a, b) => b.quantity - a.quantity);

    return NextResponse.json({
      vouchers: voucherAnalytics,
      summary,
      topProducts: allProducts.slice(0, 10),
      period: {
        days: daysParam
          ? parseInt(daysParam)
          : Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Voucher analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

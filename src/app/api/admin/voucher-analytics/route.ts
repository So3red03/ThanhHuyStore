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
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Get voucher usage statistics
    const voucherStats = await prisma.voucher.findMany({
      include: {
        userVouchers: {
          where: {
            usedAt: {
              gte: startDate,
              lte: endDate,
              not: null
            }
          },
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
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            },
            status: 'completed' // Chỉ tính orders completed
          },
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
    const voucherAnalytics = voucherStats.map(voucher => {
      const usageInPeriod = voucher.userVouchers.length;
      const ordersInPeriod = voucher.orders.length;

      // Calculate total revenue generated
      const totalRevenue = voucher.orders.reduce((sum, order) => sum + order.amount, 0);
      const totalDiscount = voucher.orders.reduce((sum, order) => sum + (order.discountAmount || 0), 0);

      // Get products that used this voucher
      const productsUsed = voucher.orders.reduce((acc: any[], order) => {
        const orderProducts = order.products as any[];
        orderProducts.forEach(product => {
          const existingProduct = acc.find(p => p.id === product.id);
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
      productsUsed.sort((a, b) => b.quantity - a.quantity);

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
        recentUsers: voucher.userVouchers.slice(0, 5).map(uv => ({
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
      voucher.topProducts.forEach(product => {
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
        days,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Voucher analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

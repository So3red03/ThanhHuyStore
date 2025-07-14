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
    const days = parseInt(searchParams.get('days') || '7');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Get payment method statistics - include all orders with paymentMethod
    const paymentStats = await prisma.order.groupBy({
      by: ['paymentMethod'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        paymentMethod: {
          not: null // Only include orders with payment method
        },
        status: {
          in: ['pending', 'confirmed', 'completed'] // Include more statuses
        }
      },
      _count: {
        id: true
      },
      _sum: {
        amount: true
      }
    });

    // Format data for chart
    const chartData = paymentStats.map(stat => ({
      method: stat.paymentMethod,
      count: stat._count.id,
      amount: stat._sum.amount || 0,
      label:
        stat.paymentMethod === 'cod'
          ? 'COD'
          : stat.paymentMethod === 'stripe'
          ? 'Stripe'
          : stat.paymentMethod === 'momo'
          ? 'MoMo'
          : stat.paymentMethod || 'Khác'
    }));

    // Calculate totals
    const totalOrders = chartData.reduce((sum, item) => sum + item.count, 0);
    const totalAmount = chartData.reduce((sum, item) => sum + item.amount, 0);

    // Add percentage
    const dataWithPercentage = chartData.map(item => ({
      ...item,
      percentage: totalOrders > 0 ? ((item.count / totalOrders) * 100).toFixed(1) : '0'
    }));

    // If no data, return empty but valid structure
    if (dataWithPercentage.length === 0) {
      return NextResponse.json({
        data: [],
        summary: {
          totalOrders: 0,
          totalAmount: 0,
          methodCount: 0
        },
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
    }

    return NextResponse.json({
      data: dataWithPercentage,
      summary: {
        totalOrders,
        totalAmount,
        methodCount: chartData.length
      },
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Payment method analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

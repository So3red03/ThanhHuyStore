import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Get top 5 promotions by usage
    const promotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: {
          lte: endDate
        },
        endDate: {
          gte: startDate
        }
      },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get orders that used promotions in the date range
    const promotionUsage = await Promise.all(
      promotions.map(async promotion => {
        // Count orders that might have used this promotion
        // Since we don't have direct promotion tracking in orders,
        // we'll simulate based on discount amounts and dates
        const ordersInRange = await prisma.order.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            },
            discountAmount: {
              gt: 0
            }
          }
        });

        // Simulate usage based on discount type and value
        let usageCount = 0;
        let totalDiscount = 0;

        ordersInRange.forEach(order => {
          if (order.discountAmount && order.discountAmount > 0) {
            if (promotion.discountType === 'PERCENTAGE') {
              const expectedDiscount = (order.originalAmount || order.amount) * (promotion.discountValue / 100);
              if (Math.abs((order.discountAmount || 0) - expectedDiscount) < 1) {
                usageCount++;
                totalDiscount += order.discountAmount;
              }
            } else if (promotion.discountType === 'FIXED') {
              if (Math.abs((order.discountAmount || 0) - promotion.discountValue) < 1) {
                usageCount++;
                totalDiscount += order.discountAmount;
              }
            }
          }
        });

        return {
          id: promotion.id,
          title: promotion.title,
          description: promotion.description,
          discountType: promotion.discountType,
          discountValue: promotion.discountValue,
          usageCount,
          totalDiscount,
          startDate: promotion.startDate,
          endDate: promotion.endDate,
          isActive: promotion.isActive
        };
      })
    );

    // Sort by usage count
    const sortedPromotions = promotionUsage.sort((a, b) => b.usageCount - a.usageCount);

    return NextResponse.json({
      data: sortedPromotions,
      summary: {
        totalPromotions: promotions.length,
        totalUsage: sortedPromotions.reduce((sum, p) => sum + p.usageCount, 0),
        totalDiscount: sortedPromotions.reduce((sum, p) => sum + p.totalDiscount, 0)
      },
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Promotion analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

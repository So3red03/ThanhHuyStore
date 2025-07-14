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

    // Get top 5 vouchers by usage (using voucher instead of promotion)
    const vouchers = await prisma.voucher.findMany({
      where: {
        isActive: true,
        startDate: {
          lte: endDate
        },
        endDate: {
          gte: startDate
        }
      },
      include: {
        userVouchers: {
          where: {
            usedAt: {
              gte: startDate,
              lte: endDate,
              not: null
            }
          }
        }
      },
      take: 5,
      orderBy: {
        usedCount: 'desc'
      }
    });

    // Calculate voucher usage statistics
    const voucherUsage = vouchers.map(voucher => {
      const usageCount = voucher.userVouchers.length;
      
      // Calculate total discount from orders that used this voucher
      const totalDiscount = voucher.userVouchers.reduce((sum, userVoucher) => {
        // For now, estimate discount based on voucher type and value
        if (voucher.discountType === 'PERCENTAGE') {
          // Estimate based on average order value
          return sum + (voucher.discountValue * 1000000) / 100; // Rough estimate
        } else {
          return sum + voucher.discountValue;
        }
      }, 0);

      return {
        id: voucher.id,
        title: voucher.code, // Use code as title
        description: voucher.description,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        usageCount,
        totalDiscount,
        startDate: voucher.startDate,
        endDate: voucher.endDate,
        isActive: voucher.isActive,
        maxUsagePerUser: voucher.maxUsagePerUser,
        quantity: voucher.quantity,
        usedCount: voucher.usedCount
      };
    });

    // Sort by usage count
    const sortedVouchers = voucherUsage.sort((a, b) => b.usageCount - a.usageCount);

    return NextResponse.json({
      data: sortedVouchers,
      summary: {
        totalVouchers: vouchers.length,
        totalUsage: sortedVouchers.reduce((sum, p) => sum + p.usageCount, 0),
        totalDiscount: sortedVouchers.reduce((sum, p) => sum + p.totalDiscount, 0)
      },
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

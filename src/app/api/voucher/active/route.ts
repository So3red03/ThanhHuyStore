import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import { getCurrentUser } from '@/app/actions/getCurrentUser';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const currentUser = await getCurrentUser();

    // Get all active vouchers
    const vouchers = await prisma.voucher.findMany({
      where: {
        isActive: true,
        startDate: {
          lte: now
        },
        endDate: {
          gte: now
        },
        quantity: {
          gt: 0
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // If user is logged in, filter out vouchers they've already used
    if (currentUser) {
      const usedVoucherIds = await prisma.userVoucher.findMany({
        where: {
          userId: currentUser.id,
          usedAt: {
            not: null // Only count actually used vouchers (not just reserved)
          }
        },
        select: {
          voucherId: true
        }
      });

      const usedVoucherIdSet = new Set(usedVoucherIds.map(uv => uv.voucherId));

      // Filter out used vouchers
      const availableVouchers = vouchers.filter(voucher => !usedVoucherIdSet.has(voucher.id));

      return NextResponse.json(availableVouchers, {
        headers: {
          // Reduce cache time for logged-in users since it's personalized
          'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=600'
        }
      });
    }

    // For non-logged-in users, return all vouchers
    return NextResponse.json(vouchers, {
      headers: {
        // Cache for 30 minutes - vouchers don't change frequently
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600'
      }
    });
  } catch (error) {
    console.error('Error fetching active vouchers:', error);
    return NextResponse.json({ error: 'Failed to fetch vouchers' }, { status: 500 });
  }
}

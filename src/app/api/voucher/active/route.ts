import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    
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

    return NextResponse.json(vouchers);
  } catch (error) {
    console.error('Error fetching active vouchers:', error);
    return NextResponse.json({ error: 'Failed to fetch vouchers' }, { status: 500 });
  }
}

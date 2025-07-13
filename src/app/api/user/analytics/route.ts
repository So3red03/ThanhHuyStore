import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Lấy analytics data của user trong 30 ngày gần nhất
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const analyticsData = await prisma.analyticsEvent.findMany({
      where: {
        userId: currentUser.id,
        eventType: 'PRODUCT_VIEW',
        timestamp: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        entityId: true,
        metadata: true,
        timestamp: true
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 50 // Giới hạn 50 records gần nhất
    });

    // Transform data và loại bỏ duplicate productId (giữ lại lần xem gần nhất)
    const seenProductIds = new Set<string>();
    const viewHistory = analyticsData
      .filter(event => {
        if (!event.entityId || seenProductIds.has(event.entityId)) {
          return false; // Skip duplicate hoặc null entityId
        }
        seenProductIds.add(event.entityId);
        return true;
      })
      .map(event => ({
        productId: event.entityId!,
        category: (event.metadata as any)?.category || '',
        brand: (event.metadata as any)?.brand || 'Apple',
        viewedAt: event.timestamp.getTime()
      }));

    return NextResponse.json({ viewHistory });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

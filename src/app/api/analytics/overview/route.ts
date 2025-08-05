import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { EventType } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    // Create date filter - if days is 0, get all data
    const dateFilter =
      days > 0
        ? {
            timestamp: {
              gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            }
          }
        : {};

    // Get total events count
    const totalEvents = await prisma.analyticsEvent.count({
      where: dateFilter
    });

    // Page views removed from analytics

    // Get product views
    const productViews = await prisma.analyticsEvent.count({
      where: {
        eventType: EventType.PRODUCT_VIEW,
        ...dateFilter
      }
    });

    // Get article views
    const articleViews = await prisma.analyticsEvent.count({
      where: {
        eventType: EventType.ARTICLE_VIEW,
        ...dateFilter
      }
    });

    // Removed metrics: unique visitors, searches, purchases

    // Get daily trends
    const dailyTrends = await prisma.analyticsEvent.groupBy({
      by: ['timestamp'],
      where: dateFilter,
      _count: {
        id: true
      }
    });

    // Process daily trends data
    const trendsMap = new Map();
    dailyTrends.forEach(trend => {
      const date = trend.timestamp.toISOString().split('T')[0];
      trendsMap.set(date, (trendsMap.get(date) || 0) + trend._count.id);
    });

    const trends = Array.from(trendsMap.entries())
      .map(([date, count]) => ({
        date,
        count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const startDate = days > 0 ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : new Date(0);

    return NextResponse.json({
      overview: {
        totalEvents,
        productViews,
        articleViews
      },
      trends,
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('[ANALYTICS_OVERVIEW]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

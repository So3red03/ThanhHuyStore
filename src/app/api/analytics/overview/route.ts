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

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get total events count
    const totalEvents = await prisma.analyticsEvent.count({
      where: {
        timestamp: {
          gte: startDate
        }
      }
    });

    // Page views removed from analytics

    // Get product views
    const productViews = await prisma.analyticsEvent.count({
      where: {
        eventType: EventType.PRODUCT_VIEW,
        timestamp: {
          gte: startDate
        }
      }
    });

    // Get article views
    const articleViews = await prisma.analyticsEvent.count({
      where: {
        eventType: EventType.ARTICLE_VIEW,
        timestamp: {
          gte: startDate
        }
      }
    });

    // Removed metrics: unique visitors, searches, purchases

    // Get daily trends
    const dailyTrends = await prisma.analyticsEvent.groupBy({
      by: ['timestamp'],
      where: {
        timestamp: {
          gte: startDate
        }
      },
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

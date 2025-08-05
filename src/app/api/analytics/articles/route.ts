import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { EventType } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Create date filter - if days is 0, get all data
    const dateFilter =
      days > 0
        ? {
            timestamp: {
              gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            }
          }
        : {};

    // Get top viewed articles
    const topViewedArticles = await prisma.analyticsEvent.groupBy({
      by: ['entityId'],
      where: {
        eventType: EventType.ARTICLE_VIEW,
        entityType: 'article',
        entityId: { not: null },
        ...dateFilter
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: limit
    });

    // Get article details
    const articleIds = topViewedArticles.map(a => a.entityId).filter(Boolean) as string[];
    const articles = await prisma.article.findMany({
      where: {
        id: { in: articleIds }
      },
      include: {
        category: true
      }
    });

    // Combine data
    const topArticles = topViewedArticles.map(item => {
      const article = articles.find(a => a.id === item.entityId);
      return {
        id: item.entityId,
        title: article?.title || 'Unknown Article',
        category: article?.category?.name || 'Uncategorized',
        image: article?.image || '',
        views: item._count.id,
        originalViews: article?.viewCount || 0,
        createdAt: article?.createdAt,
        updatedAt: article?.updatedAt
      };
    });

    // Get article views by category
    const categoryViews = await prisma.analyticsEvent.groupBy({
      by: ['metadata'],
      where: {
        eventType: EventType.ARTICLE_VIEW,
        entityType: 'article',
        ...dateFilter
      },
      _count: {
        id: true
      }
    });

    // Get daily article views trend
    const dailyArticleViews = await prisma.analyticsEvent.groupBy({
      by: ['timestamp'],
      where: {
        eventType: EventType.ARTICLE_VIEW,
        ...dateFilter
      },
      _count: {
        id: true
      }
    });

    // Process daily trends data
    const trendsMap = new Map();
    dailyArticleViews.forEach(trend => {
      const date = trend.timestamp.toISOString().split('T')[0];
      trendsMap.set(date, (trendsMap.get(date) || 0) + trend._count.id);
    });

    const articleTrends = Array.from(trendsMap.entries())
      .map(([date, count]) => ({
        date,
        count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get total article analytics
    const totalArticleViews = await prisma.analyticsEvent.count({
      where: {
        eventType: EventType.ARTICLE_VIEW,
        ...dateFilter
      }
    });

    const uniqueArticleReaders = await prisma.analyticsEvent.groupBy({
      by: ['userId', 'sessionId'],
      where: {
        eventType: EventType.ARTICLE_VIEW,
        ...dateFilter
      }
    });

    return NextResponse.json({
      topArticles,
      categoryViews,
      articleTrends,
      summary: {
        totalViews: totalArticleViews,
        uniqueReaders: uniqueArticleReaders.length,
        averageViewsPerReader:
          uniqueArticleReaders.length > 0 ? (totalArticleViews / uniqueArticleReaders.length).toFixed(1) : 0
      },
      period: {
        days,
        startDate: (days > 0 ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : new Date(0)).toISOString(),
        endDate: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('[ANALYTICS_ARTICLES]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { EventType } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, count = 100 } = body;

    if (action === 'seed') {
      // Get some existing products and articles for realistic data
      const products = await prisma.product.findMany({ take: 10 });
      const articles = await prisma.article.findMany({ take: 10 });
      const users = await prisma.user.findMany({ take: 20 });

      const events = [];
      const now = new Date();

      // Generate sample data for the last 30 days
      for (let i = 0; i < count; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const timestamp = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        
        // Random event type
        const eventTypes = [
          EventType.PAGE_VIEW,
          EventType.PRODUCT_VIEW,
          EventType.PRODUCT_CLICK,
          EventType.SEARCH,
          EventType.PURCHASE,
          EventType.ARTICLE_VIEW
        ];
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        
        // Random user (some anonymous)
        const user = Math.random() > 0.3 ? users[Math.floor(Math.random() * users.length)] : null;
        const sessionId = user ? null : `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        let entityType = null;
        let entityId = null;
        let metadata = {};
        let path = '/';

        switch (eventType) {
          case EventType.PRODUCT_VIEW:
          case EventType.PRODUCT_CLICK:
            if (products.length > 0) {
              const product = products[Math.floor(Math.random() * products.length)];
              entityType = 'product';
              entityId = product.id;
              path = `/product/${product.id}`;
              metadata = {
                productName: product.name,
                productPrice: product.price,
                category: product.categoryId
              };
            }
            break;
          
          case EventType.ARTICLE_VIEW:
            if (articles.length > 0) {
              const article = articles[Math.floor(Math.random() * articles.length)];
              entityType = 'article';
              entityId = article.id;
              path = `/article/${article.id}`;
              metadata = {
                articleTitle: article.title,
                category: article.categoryId
              };
            }
            break;
          
          case EventType.SEARCH:
            const searchTerms = ['iPhone', 'MacBook', 'iPad', 'Apple Watch', 'AirPods', 'iMac'];
            const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
            path = '/search';
            metadata = {
              searchTerm,
              resultCount: Math.floor(Math.random() * 50) + 1
            };
            break;
          
          case EventType.PURCHASE:
            path = '/checkout';
            metadata = {
              amount: Math.floor(Math.random() * 50000000) + 1000000, // 1M - 50M VND
              currency: 'VND'
            };
            break;
          
          case EventType.PAGE_VIEW:
            const pages = ['/', '/products', '/news', '/about', '/contact'];
            path = pages[Math.floor(Math.random() * pages.length)];
            break;
        }

        events.push({
          userId: user?.id || null,
          sessionId,
          eventType,
          entityType,
          entityId,
          metadata,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          referrer: Math.random() > 0.5 ? 'https://google.com' : null,
          path,
          timestamp
        });
      }

      // Batch insert events
      const result = await prisma.analyticsEvent.createMany({
        data: events
      });

      return NextResponse.json({
        message: `Successfully seeded ${result.count} analytics events`,
        count: result.count
      });

    } else if (action === 'clear') {
      const result = await prisma.analyticsEvent.deleteMany({});
      return NextResponse.json({
        message: `Cleared ${result.count} analytics events`,
        count: result.count
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "seed" or "clear"' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('[ANALYTICS_SEED]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

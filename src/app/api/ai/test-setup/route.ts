import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { EventType, OrderStatus } from '@prisma/client';

/**
 * API để setup test data cho AI system
 * POST /api/ai/test-setup
 * 
 * Tạo sample data để test AI recommendations:
 * - Products cũ (>30 ngày)
 * - AnalyticsEvent với PRODUCT_VIEW
 * - Orders với ít sales
 * - Reviews cho rating-based recommendations
 */
export async function POST(request: Request) {
  try {
    // Kiểm tra quyền admin
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admin can setup test data' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action = 'setup' } = body;

    if (action === 'setup') {
      console.log('🧪 Setting up AI test data...');

      // 1. Lấy existing products
      const products = await prisma.product.findMany({
        take: 5,
        include: { category: true }
      });

      if (products.length === 0) {
        return NextResponse.json({
          error: 'No products found. Please create some products first.',
          suggestion: 'Go to admin/manage-products and create a few products'
        }, { status: 400 });
      }

      // 2. Update một số products để có createdAt cũ (>30 ngày)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 45); // 45 ngày trước

      await prisma.product.updateMany({
        where: {
          id: { in: products.slice(0, 3).map(p => p.id) }
        },
        data: {
          createdAt: oldDate,
          inStock: 100, // High stock để test marketing suggestions
          priority: 0   // Low priority để test priority boost
        }
      });

      // 3. Tạo AnalyticsEvent cho products
      const analyticsEvents = [];
      const now = new Date();

      for (const product of products) {
        // Tạo views cho 30 ngày qua
        for (let i = 0; i < 30; i++) {
          const daysAgo = Math.floor(Math.random() * 30);
          const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          
          // Random số lượng views (1-10 per day)
          const viewsPerDay = Math.floor(Math.random() * 10) + 1;
          
          for (let j = 0; j < viewsPerDay; j++) {
            analyticsEvents.push({
              userId: Math.random() > 0.5 ? currentUser.id : null,
              sessionId: Math.random() > 0.5 ? `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}` : null,
              eventType: EventType.PRODUCT_VIEW,
              entityType: 'product',
              entityId: product.id,
              metadata: {
                productName: product.name,
                productPrice: product.price,
                category: product.categoryId
              },
              userAgent: 'Mozilla/5.0 (Test Agent)',
              ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
              path: `/product/${product.id}`,
              timestamp: new Date(timestamp.getTime() + j * 60000) // Spread throughout the day
            });
          }
        }
      }

      // Batch insert analytics events
      await prisma.analyticsEvent.createMany({
        data: analyticsEvents,
        skipDuplicates: true
      });

      // 4. Tạo một số orders với ít sales để simulate "sản phẩm ế"
      const testOrders = [];
      for (let i = 0; i < 3; i++) {
        const product = products[i];
        const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity (ít)
        
        testOrders.push({
          userId: currentUser.id,
          amount: product.price! * quantity,
          currency: 'vnd',
          status: OrderStatus.confirmed,
          paymentIntentId: `test_pi_${Date.now()}_${i}`,
          products: [{
            id: product.id,
            name: product.name,
            description: product.description,
            category: product.category.name,
            brand: product.brand,
            selectedImg: '/noavatar.png',
            thumbnail: '/noavatar.png',
            quantity: quantity,
            price: product.price!,
            inStock: product.inStock!
          }],
          createdAt: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random trong 30 ngày
        });
      }

      for (const orderData of testOrders) {
        await prisma.order.create({
          data: orderData
        });
      }

      // 5. Tạo một số reviews
      const reviews = [];
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const rating = i < 2 ? 5 : Math.floor(Math.random() * 3) + 3; // First 2 products get 5 stars
        
        reviews.push({
          userId: currentUser.id,
          productId: product.id,
          rating: rating,
          comment: `Test review for ${product.name}`,
          createdDate: new Date()
        });
      }

      await prisma.review.createMany({
        data: reviews,
        skipDuplicates: true
      });

      console.log('✅ AI test data setup completed');

      return NextResponse.json({
        success: true,
        message: 'AI test data setup completed successfully',
        data: {
          productsUpdated: 3,
          analyticsEventsCreated: analyticsEvents.length,
          ordersCreated: testOrders.length,
          reviewsCreated: reviews.length,
          nextSteps: [
            '1. Go to admin panel',
            '2. Click "🤖 AI Analysis" button',
            '3. Wait for notifications to appear',
            '4. Check for AI recommendations'
          ]
        }
      });

    } else if (action === 'cleanup') {
      // Cleanup test data
      console.log('🧹 Cleaning up AI test data...');

      // Delete test analytics events (those with Test Agent)
      const deletedAnalytics = await prisma.analyticsEvent.deleteMany({
        where: {
          userAgent: 'Mozilla/5.0 (Test Agent)'
        }
      });

      // Delete test orders (those with test payment intent)
      const deletedOrders = await prisma.order.deleteMany({
        where: {
          paymentIntentId: {
            startsWith: 'test_pi_'
          }
        }
      });

      // Delete test reviews
      const deletedReviews = await prisma.review.deleteMany({
        where: {
          comment: {
            startsWith: 'Test review for'
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Test data cleanup completed',
        data: {
          analyticsEventsDeleted: deletedAnalytics.count,
          ordersDeleted: deletedOrders.count,
          reviewsDeleted: deletedReviews.count
        }
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "setup" or "cleanup"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ AI test setup error:', error);
    
    return NextResponse.json(
      { 
        error: 'AI test setup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint để check current test data status
 */
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check current data status
    const stats = {
      totalProducts: await prisma.product.count(),
      oldProducts: await prisma.product.count({
        where: {
          createdAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      totalAnalyticsEvents: await prisma.analyticsEvent.count(),
      productViewEvents: await prisma.analyticsEvent.count({
        where: {
          eventType: EventType.PRODUCT_VIEW,
          entityType: 'product'
        }
      }),
      totalOrders: await prisma.order.count(),
      confirmedOrders: await prisma.order.count({
        where: {
          status: { in: [OrderStatus.confirmed, OrderStatus.completed] }
        }
      }),
      totalReviews: await prisma.review.count()
    };

    return NextResponse.json({
      success: true,
      data: stats,
      recommendations: {
        needsSetup: stats.oldProducts === 0 || stats.productViewEvents === 0,
        readyForAI: stats.oldProducts > 0 && stats.productViewEvents > 0 && stats.confirmedOrders > 0
      }
    });

  } catch (error) {
    console.error('❌ AI test status check error:', error);
    return NextResponse.json({ error: 'Failed to check test status' }, { status: 500 });
  }
}

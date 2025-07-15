import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user basic info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createAt: true,
        purchasedCategories: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's orders with products
    const orders = await prisma.order.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20 // Limit to recent 20 orders
    });

    // Process orders to get unique products and categories
    const purchasedProducts = new Map();
    const categoryStats = new Map();

    orders.forEach(order => {
      order.products.forEach(product => {
        // Track unique products
        if (!purchasedProducts.has(product.id)) {
          purchasedProducts.set(product.id, {
            id: product.id,
            name: product.name,
            category: product.category || 'Không có danh mục',
            thumbnail: product.thumbnail,
            price: product.price,
            firstPurchased: order.createdAt,
            totalQuantity: product.quantity
          });
        } else {
          // Update total quantity
          const existing = purchasedProducts.get(product.id);
          existing.totalQuantity += product.quantity;
        }

        // Track category stats
        const categoryName = product.category || 'Không có danh mục';
        if (!categoryStats.has(categoryName)) {
          categoryStats.set(categoryName, {
            name: categoryName,
            productCount: 1,
            totalSpent: (product.price || 0) * product.quantity,
            lastPurchased: order.createdAt
          });
        } else {
          const existing = categoryStats.get(categoryName);
          existing.productCount += 1;
          existing.totalSpent += (product.price || 0) * product.quantity;
          if (order.createdAt > existing.lastPurchased) {
            existing.lastPurchased = order.createdAt;
          }
        }
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...user,
          totalOrders: orders.length,
          totalSpent: orders.reduce((sum, order) => sum + (order.amount || 0), 0)
        },
        products: Array.from(purchasedProducts.values()),
        categories: Array.from(categoryStats.values()),
        recentOrders: orders.slice(0, 5).map(order => ({
          id: order.id,
          createdAt: order.createdAt,
          amount: order.amount,
          status: order.status,
          productCount: order.products.length
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching customer detail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    // Get user's orders with products (chỉ tính completed orders)
    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
        status: 'completed' // Chỉ tính orders completed
      },
      orderBy: { createdAt: 'desc' }
      // Remove limit to get all orders
    });

    // Get all categories to resolve parent categories
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        parentId: true,
        parent: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Create category lookup map
    const categoryMap = new Map();
    categories.forEach(cat => {
      categoryMap.set(cat.id, cat);
    });

    // Helper function to get parent category name
    const getParentCategoryName = (categoryId: string) => {
      const category = categoryMap.get(categoryId);
      //return giá trị chuỗi để tránh lỗi react render
      if (!category) return 'Không có danh mục';

      // If has parent, return parent name, otherwise return current category name
      return category.parent ? category.parent.name : category.name;
    };

    // Process orders to get unique products and categories
    const purchasedProducts = new Map();
    const parentCategoryStats = new Map();

    orders.forEach(order => {
      order.products.forEach(product => {
        // Get parent category name
        const parentCategoryName = getParentCategoryName(product.category);

        // Track unique products
        if (!purchasedProducts.has(product.id)) {
          purchasedProducts.set(product.id, {
            id: product.id,
            name: product.name,
            category: parentCategoryName,
            thumbnail: product.thumbnail || product.selectedImg || null,
            price: product.price,
            firstPurchased: order.createdAt,
            totalQuantity: product.quantity,
            orderId: order.id
          });
        } else {
          // Update total quantity and latest purchase
          const existing = purchasedProducts.get(product.id);
          existing.totalQuantity += product.quantity;
          if (order.createdAt > existing.firstPurchased) {
            existing.firstPurchased = order.createdAt;
            existing.orderId = order.id;
          }
        }

        // Track parent category stats
        if (!parentCategoryStats.has(parentCategoryName)) {
          parentCategoryStats.set(parentCategoryName, {
            name: parentCategoryName,
            productCount: 1,
            totalSpent: (product.price || 0) * product.quantity,
            lastPurchased: order.createdAt
          });
        } else {
          const existing = parentCategoryStats.get(parentCategoryName);
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
          totalSpent: orders.reduce((sum, order) => sum + (order.amount || 0), 0),
          lastOrderDate: orders.length > 0 ? orders[0].createdAt : null
        },
        products: Array.from(purchasedProducts.values()).sort(
          (a, b) => new Date(b.firstPurchased).getTime() - new Date(a.firstPurchased).getTime()
        ),
        categories: Array.from(parentCategoryStats.values()),
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

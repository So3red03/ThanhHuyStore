import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users who have made at least one completed order
    const usersWithOrders = await prisma.user.findMany({
      where: {
        orders: {
          some: {
            status: 'completed' // ✅ Chỉ tính khách hàng có đơn hàng đã hoàn thành
          }
        },
        email: { not: '' }
      },
      select: {
        id: true,
        name: true,
        email: true,
        createAt: true,
        orders: {
          where: {
            status: 'completed' // ✅ Chỉ lấy đơn hàng đã hoàn thành
          },
          select: {
            id: true,
            amount: true,
            createdAt: true,
            products: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    // Get all categories to resolve names
    const allCategories = await prisma.category.findMany({
      select: {
        id: true,
        name: true
      }
    });

    const categoryIdToName = new Map();
    allCategories.forEach(cat => {
      categoryIdToName.set(cat.id, cat.name);
    });

    // Process each user to extract category information and purchase stats
    const customersWithStats = usersWithOrders.map(user => {
      const orders = user.orders;
      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + order.amount, 0);

      // Extract categories from all products in all orders
      const categoryMap = new Map();
      const productMap = new Map();

      orders.forEach(order => {
        order.products.forEach((product: any) => {
          if (product.category) {
            // Resolve category name (handle both ObjectId and string cases)
            let categoryName = product.category;
            if (categoryIdToName.has(product.category)) {
              categoryName = categoryIdToName.get(product.category);
            }

            // Track category stats
            if (!categoryMap.has(categoryName)) {
              categoryMap.set(categoryName, {
                name: categoryName,
                productCount: 0,
                totalSpent: 0,
                lastPurchased: order.createdAt
              });
            }

            const categoryStats = categoryMap.get(categoryName);
            categoryStats.productCount += product.quantity;
            categoryStats.totalSpent += product.price * product.quantity;

            // Update last purchased date if this order is more recent
            if (new Date(order.createdAt) > new Date(categoryStats.lastPurchased)) {
              categoryStats.lastPurchased = order.createdAt;
            }
          }

          // Track unique products
          if (product.id && !productMap.has(product.id)) {
            // Resolve category name for product
            let productCategoryName = product.category;
            if (categoryIdToName.has(product.category)) {
              productCategoryName = categoryIdToName.get(product.category);
            }

            productMap.set(product.id, {
              id: product.id,
              name: product.name,
              category: productCategoryName,
              thumbnail: product.thumbnail || product.selectedImg,
              lastPurchased: order.createdAt,
              quantity: product.quantity,
              price: product.price
            });
          }
        });
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        joinDate: user.createAt,
        totalOrders,
        totalSpent,
        categories: Array.from(categoryMap.values()),
        products: Array.from(productMap.values()),
        lastOrderDate: orders[0]?.createdAt || null
      };
    });

    return NextResponse.json({
      success: true,
      data: customersWithStats
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

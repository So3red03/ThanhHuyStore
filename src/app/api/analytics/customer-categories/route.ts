import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import { getCurrentUser } from '@/app/actions/getCurrentUser';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Lấy tất cả danh mục với cấu trúc phân tầng
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
        },
        subcategories: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Phân loại parent categories và subcategories
    const parentCategories = categories.filter(cat => !cat.parentId);
    const subcategories = categories.filter(cat => cat.parentId);

    // Lấy số lượng khách hàng theo danh mục
    const categoryStats = await Promise.all(
      categories.map(async category => {
        const userCount = await prisma.user.count({
          where: {
            purchasedCategories: {
              has: category.id
            }
          }
        });

        // Lấy thêm thông tin về thời gian mua hàng gần nhất và danh sách khách hàng
        const recentUsers = await prisma.user.findMany({
          where: {
            purchasedCategories: {
              has: category.id
            }
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            orders: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 1,
              select: {
                createdAt: true
              }
            }
          },
          take: 100 // Giới hạn để tránh quá tải
        });

        // Phân tích thời gian mua hàng
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const recentUserCount = recentUsers.filter(user => {
          if (user.orders.length === 0) return false;
          const orderDate = new Date(user.orders[0].createdAt);
          return orderDate >= thirtyDaysAgo;
        }).length;

        const mediumUserCount = recentUsers.filter(user => {
          if (user.orders.length === 0) return false;
          const orderDate = new Date(user.orders[0].createdAt);
          return orderDate >= ninetyDaysAgo && orderDate < thirtyDaysAgo;
        }).length;

        // Phân loại khách hàng theo thời gian mua hàng
        const recentCustomers = recentUsers.filter(user => {
          if (user.orders.length === 0) return false;
          const orderDate = new Date(user.orders[0].createdAt);
          return orderDate >= thirtyDaysAgo;
        });

        const mediumCustomers = recentUsers.filter(user => {
          if (user.orders.length === 0) return false;
          const orderDate = new Date(user.orders[0].createdAt);
          return orderDate >= ninetyDaysAgo && orderDate < thirtyDaysAgo;
        });

        const olderCustomers = recentUsers.filter(user => {
          if (user.orders.length === 0) return false;
          const orderDate = new Date(user.orders[0].createdAt);
          return orderDate < ninetyDaysAgo;
        });

        return {
          categoryId: category.id,
          categoryName: category.name,
          parentId: category.parentId,
          parentName: category.parent?.name,
          isParent: !category.parentId,
          userCount,
          recentUserCount,
          mediumUserCount,
          olderUserCount: userCount - recentUserCount - mediumUserCount,
          customers: {
            recent: recentCustomers.map(user => ({
              id: user.id,
              name: user.name || 'Khách hàng',
              email: user.email,
              role: user.role,
              lastOrderDate: user.orders[0]?.createdAt || null
            })),
            medium: mediumCustomers.map(user => ({
              id: user.id,
              name: user.name || 'Khách hàng',
              email: user.email,
              role: user.role,
              lastOrderDate: user.orders[0]?.createdAt || null
            })),
            older: olderCustomers.map(user => ({
              id: user.id,
              name: user.name || 'Khách hàng',
              email: user.email,
              role: user.role,
              lastOrderDate: user.orders[0]?.createdAt || null
            }))
          }
        };
      })
    );

    // Tổ chức dữ liệu theo cấu trúc phân tầng
    const hierarchicalData = parentCategories.map(parent => {
      const parentStats = categoryStats.find(stat => stat.categoryId === parent.id);
      const childStats = categoryStats.filter(stat => stat.parentId === parent.id);

      // Tính tổng cho parent category
      const totalUserCount =
        childStats.reduce((sum, child) => sum + child.userCount, 0) + (parentStats?.userCount || 0);
      const totalRecentUserCount =
        childStats.reduce((sum, child) => sum + child.recentUserCount, 0) + (parentStats?.recentUserCount || 0);
      const totalMediumUserCount =
        childStats.reduce((sum, child) => sum + child.mediumUserCount, 0) + (parentStats?.mediumUserCount || 0);
      const totalOlderUserCount =
        childStats.reduce((sum, child) => sum + child.olderUserCount, 0) + (parentStats?.olderUserCount || 0);

      return {
        categoryId: parent.id,
        categoryName: parent.name,
        isParent: true,
        userCount: totalUserCount,
        recentUserCount: totalRecentUserCount,
        mediumUserCount: totalMediumUserCount,
        olderUserCount: totalOlderUserCount,
        subcategories: childStats
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        hierarchical: hierarchicalData,
        flat: categoryStats,
        summary: {
          totalParentCategories: parentCategories.length,
          totalSubcategories: subcategories.length,
          totalCategories: categories.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching customer categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

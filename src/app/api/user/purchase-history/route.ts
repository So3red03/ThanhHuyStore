import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { OrderStatus } from '@prisma/client';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Lấy lịch sử đơn hàng của người dùng (chỉ những đơn đã hoàn thành)
    const orders = await prisma.order.findMany({
      where: {
        userId: currentUser.id,
        status: OrderStatus.completed
      },
      select: {
        id: true,
        products: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Lấy 20 đơn hàng gần nhất
    });

    // Trích xuất thông tin sản phẩm và danh mục
    const purchaseHistory = orders.map(order => ({
      orderId: order.id,
      orderDate: order.createdAt,
      products: order.products.map((product: any) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        brand: product.brand,
        quantity: product.quantity
      }))
    }));

    return NextResponse.json(purchaseHistory);
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

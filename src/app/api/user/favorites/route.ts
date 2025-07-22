import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

// GET - Lấy danh sách sản phẩm yêu thích
export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Lấy user với danh sách sản phẩm yêu thích
    const userWithFavorites = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        favoriteProductIds: true
      }
    });

    if (!userWithFavorites) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Lấy thông tin chi tiết các sản phẩm yêu thích
    const favoriteProducts = await prisma.product.findMany({
      where: {
        id: { in: userWithFavorites.favoriteProductIds },
        isDeleted: false
      },
      include: {
        category: true,
        reviews: {
          select: {
            rating: true
          }
        },
        variants: {
          where: { isActive: true },
          select: {
            id: true,
            price: true,
            stock: true
          }
        }
      }
    });

    // Tính toán rating trung bình cho mỗi sản phẩm
    const productsWithRating = favoriteProducts.map(product => {
      const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = product.reviews.length > 0 ? totalRating / product.reviews.length : 0;
      
      return {
        ...product,
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: product.reviews.length
      };
    });

    return NextResponse.json({
      favorites: productsWithRating,
      count: productsWithRating.length
    });

  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Thêm/xóa sản phẩm khỏi danh sách yêu thích
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, action } = body;

    if (!productId || !action) {
      return NextResponse.json({ error: 'Missing productId or action' }, { status: 400 });
    }

    if (!['add', 'remove'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use "add" or "remove"' }, { status: 400 });
    }

    // Kiểm tra sản phẩm có tồn tại không
    const product = await prisma.product.findUnique({
      where: { id: productId, isDeleted: false }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Lấy danh sách yêu thích hiện tại
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { favoriteProductIds: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let updatedFavorites = [...(user.favoriteProductIds || [])];

    if (action === 'add') {
      // Thêm vào danh sách yêu thích nếu chưa có
      if (!updatedFavorites.includes(productId)) {
        updatedFavorites.push(productId);
      }
    } else if (action === 'remove') {
      // Xóa khỏi danh sách yêu thích
      updatedFavorites = updatedFavorites.filter(id => id !== productId);
    }

    // Cập nhật database
    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        favoriteProductIds: updatedFavorites
      }
    });

    return NextResponse.json({
      message: action === 'add' ? 'Product added to favorites' : 'Product removed from favorites',
      isFavorite: action === 'add',
      favoriteCount: updatedFavorites.length
    });

  } catch (error) {
    console.error('Error updating favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

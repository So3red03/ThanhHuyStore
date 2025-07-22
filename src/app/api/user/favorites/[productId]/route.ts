import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

interface IParams {
  productId?: string;
}

// GET - Kiểm tra sản phẩm có trong danh sách yêu thích không
export async function GET(request: Request, { params }: { params: IParams }) {
  try {
    const { productId } = params;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ isFavorite: false });
    }

    // Lấy danh sách yêu thích của user
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { favoriteProductIds: true }
    });

    if (!user) {
      return NextResponse.json({ isFavorite: false });
    }

    const isFavorite = user.favoriteProductIds?.includes(productId) || false;

    return NextResponse.json({ 
      isFavorite,
      favoriteCount: user.favoriteProductIds?.length || 0
    });

  } catch (error) {
    console.error('Error checking favorite status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

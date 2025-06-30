import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.error();
  }

  const body = await request.json();
  const { quantity } = body;
  // Lấy số lượng tồn kho hiện tại của sản phẩm từ database
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: { inStock: true }
  });

  if (!product) {
    return NextResponse.error();
  }

  // Cập nhật số lượng tồn kho mới
  const updatedProduct = await prisma.product.update({
    where: { id: params.id },
    data: {
      inStock: (product.inStock ?? 0) - quantity
    }
  });

  return NextResponse.json(updatedProduct);
}

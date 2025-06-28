import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.error();
  }

  // TODO: Implement soft delete after database update
  // For now, use hard delete
  const product = await prisma.product.delete({
    where: { id: params.id }
  });
  return NextResponse.json(product);
}

// TODO: PATCH: Restore sản phẩm đã xóa (soft delete) - implement after database update
// export async function PATCH(request: Request, { params }: { params: { id: string } }) {
//   const currentUser = await getCurrentUser();

//   if (!currentUser || currentUser.role !== 'ADMIN') {
//     return NextResponse.error();
//   }

//   const body = await request.json();
//   const { action } = body;

//   if (action === 'restore') {
//     // Restore sản phẩm đã xóa
//     const product = await prisma.product.update({
//       where: { id: params.id },
//       data: {
//         isDeleted: false,
//         deletedAt: null,
//         deletedBy: null
//       }
//     });
//     return NextResponse.json(product);
//   }

//   return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
// }

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.error();
  }

  const body = await request.json();
  const { name, description, price, inStock, categoryId } = body;

  const product = await prisma.product.update({
    where: { id: params.id },
    data: { name, description, price, inStock, categoryId }
  });
  return NextResponse.json(product);
}

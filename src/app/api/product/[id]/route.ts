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
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('PUT request body:', body); // Debug log

    const { name, description, price, basePrice, inStock, categoryId, images = [], productType = 'SIMPLE' } = body;

    // Validation
    if (!name || !description || !categoryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      name,
      description,
      categoryId,
      productType,
      images: images || []
    };

    // Handle pricing based on product type
    if (productType === 'SIMPLE') {
      updateData.price = parseFloat(price) || 0;
      updateData.inStock = parseInt(inStock) || 0;
    } else if (productType === 'VARIANT') {
      updateData.basePrice = parseFloat(basePrice) || parseFloat(price) || 0;
      // For variant products, stock is managed at variant level
      updateData.inStock = 0;
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

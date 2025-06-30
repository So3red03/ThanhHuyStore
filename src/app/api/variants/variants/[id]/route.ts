import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { NextResponse } from 'next/server';

interface IParams {
  id: string;
}

/**
 * GET: Fetch a specific variant
 */
export async function GET(request: Request, { params }: { params: IParams }) {
  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id: params.id },
      include: {
        product: {
          include: {
            category: true,
            productAttributes: {
              include: {
                values: true
              }
            }
          }
        }
      }
    });

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    return NextResponse.json(variant);
  } catch (error) {
    console.error('Error fetching variant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT: Update a specific variant
 */
export async function PUT(request: Request, { params }: { params: IParams }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sku, attributes, price, stock, images, isActive } = body;

    // Check if variant exists
    const existingVariant = await prisma.productVariant.findUnique({
      where: { id: params.id }
    });

    if (!existingVariant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    // Update the variant
    const updatedVariant = await prisma.productVariant.update({
      where: { id: params.id },
      data: {
        sku,
        attributes,
        price: price ? parseFloat(price) : undefined,
        stock: stock !== undefined ? parseInt(stock) : undefined,
        images,
        isActive,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedVariant,
      message: 'Variant updated successfully'
    });
  } catch (error) {
    console.error('Error updating variant:', error);

    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE: Delete a specific variant
 */
export async function DELETE(request: Request, { params }: { params: IParams }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if variant exists
    const variant = await prisma.productVariant.findUnique({
      where: { id: params.id }
    });

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    // Delete the variant
    await prisma.productVariant.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Variant deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting variant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

// GET - Lấy danh sách variants của một product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const variants = await prisma.productVariant.findMany({
      where: {
        productId: productId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(variants);
  } catch (error) {
    console.error('Error fetching variants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Tạo variant mới
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, sku, price, stock, attributes, images, isActive } = body;

    // Validate required fields
    if (!productId || !sku || price === undefined || stock === undefined) {
      return NextResponse.json(
        {
          error: 'Missing required fields: productId, sku, price, stock'
        },
        { status: 400 }
      );
    }

    // Check if SKU already exists
    const existingSku = await prisma.productVariant.findUnique({
      where: { sku }
    });

    if (existingSku) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
    }

    // Prepare images array in the correct format for schema
    const variantImages =
      images && images.length > 0
        ? images.map((imageUrl: string) => ({
            color: 'default',
            colorCode: '#000000',
            images: [imageUrl]
          }))
        : [];

    // Create the variant
    const variant = await prisma.productVariant.create({
      data: {
        productId,
        sku,
        price: parseFloat(price),
        stock: parseInt(stock),
        attributes: attributes || {},
        thumbnail: body.thumbnail || null,
        galleryImages: body.galleryImages || [],
        isActive: isActive !== false
      }
    });

    return NextResponse.json(variant, { status: 201 });
  } catch (error) {
    console.error('Error creating variant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Cập nhật variant
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, sku, price, stock, attributes, images, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Variant ID is required' }, { status: 400 });
    }

    // Prepare images array in the correct format for schema
    const variantImages =
      images && images.length > 0
        ? images.map((imageUrl: string) => ({
            images: [imageUrl]
          }))
        : undefined;

    // Update the variant
    const updateData: any = {};
    if (sku) updateData.sku = sku;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (attributes !== undefined) updateData.attributes = attributes;
    if (variantImages !== undefined) updateData.images = variantImages;
    if (isActive !== undefined) updateData.isActive = isActive;

    const variant = await prisma.productVariant.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(variant);
  } catch (error) {
    console.error('Error updating variant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Xóa variant
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Variant ID is required' }, { status: 400 });
    }

    // Delete variant with transaction (cascade delete will handle relations)
    await prisma.productVariant.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Variant deleted successfully' });
  } catch (error) {
    console.error('Error deleting variant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

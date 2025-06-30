import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { NextResponse } from 'next/server';

interface IParams {
  id: string;
}

/**
 * GET: Fetch all attributes for a specific product
 */
export async function GET(request: Request, { params }: { params: IParams }) {
  try {
    const attributes = await prisma.productAttribute.findMany({
      where: { productId: params.id },
      include: {
        values: {
          orderBy: { position: 'asc' }
        }
      },
      orderBy: { position: 'asc' }
    });

    return NextResponse.json(attributes);
  } catch (error) {
    console.error('Error fetching product attributes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST: Add a new attribute to a product
 */
export async function POST(request: Request, { params }: { params: IParams }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      label,
      type,
      displayType = 'BUTTON',
      isRequired = true,
      isVariation = true,
      description,
      values = []
    } = body;

    // Validation
    if (!name || !label || !type) {
      return NextResponse.json({ error: 'Missing required fields: name, label, type' }, { status: 400 });
    }

    // Check if product exists and is variant type
    const product = await prisma.product.findUnique({
      where: {
        id: params.id,
        productType: 'VARIANT',
        isDeleted: false
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get current max position
    const maxPosition = await prisma.productAttribute.findFirst({
      where: { productId: params.id },
      orderBy: { position: 'desc' },
      select: { position: true }
    });

    const nextPosition = (maxPosition?.position || -1) + 1;

    // Create attribute with values in transaction
    const result = await prisma.$transaction(async tx => {
      // Create the attribute
      const attribute = await tx.productAttribute.create({
        data: {
          productId: params.id,
          name,
          label,
          type,
          displayType,
          isRequired,
          isVariation,
          position: nextPosition,
          description
        }
      });

      // Create attribute values
      const createdValues = [];
      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        const createdValue = await tx.attributeValue.create({
          data: {
            attributeId: attribute.id,
            value: value.value,
            label: value.label,
            description: value.description,
            colorCode: value.colorCode,
            imageUrl: value.imageUrl,
            priceAdjustment: parseFloat(value.priceAdjustment || '0'),
            position: i
          }
        });
        createdValues.push(createdValue);
      }

      return {
        ...attribute,
        values: createdValues
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Attribute created successfully'
    });
  } catch (error) {
    console.error('Error creating product attribute:', error);

    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Attribute name already exists for this product' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT: Reorder attributes for a product
 */
export async function PUT(request: Request, { params }: { params: IParams }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { attributeIds } = body;

    if (!Array.isArray(attributeIds)) {
      return NextResponse.json({ error: 'attributeIds must be an array' }, { status: 400 });
    }

    // Update positions in transaction
    await prisma.$transaction(async tx => {
      for (let i = 0; i < attributeIds.length; i++) {
        await tx.productAttribute.update({
          where: {
            id: attributeIds[i],
            productId: params.id
          },
          data: { position: i }
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Attributes reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering attributes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

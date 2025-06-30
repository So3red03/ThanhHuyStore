import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { NextResponse } from 'next/server';

interface IParams {
  id: string;
}

/**
 * GET: Fetch a specific attribute with its values
 */
export async function GET(request: Request, { params }: { params: IParams }) {
  try {
    const attribute = await prisma.productAttribute.findUnique({
      where: { id: params.id },
      include: {
        values: {
          orderBy: { position: 'asc' }
        },
        product: {
          select: { id: true, name: true }
        }
      }
    });

    if (!attribute) {
      return NextResponse.json({ error: 'Attribute not found' }, { status: 404 });
    }

    return NextResponse.json(attribute);
  } catch (error) {
    console.error('Error fetching attribute:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT: Update an attribute
 */
export async function PUT(request: Request, { params }: { params: IParams }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, label, type, displayType, isRequired, isVariation, description, values } = body;

    // Check if attribute exists
    const existingAttribute = await prisma.productAttribute.findUnique({
      where: { id: params.id }
    });

    if (!existingAttribute) {
      return NextResponse.json({ error: 'Attribute not found' }, { status: 404 });
    }

    // Update in transaction
    const result = await prisma.$transaction(async tx => {
      // Update the attribute
      const updatedAttribute = await tx.productAttribute.update({
        where: { id: params.id },
        data: {
          name,
          label,
          type,
          displayType,
          isRequired,
          isVariation,
          description,
          updatedAt: new Date()
        }
      });

      // If values are provided, update them
      if (values) {
        // Delete existing values
        await tx.attributeValue.deleteMany({
          where: { attributeId: params.id }
        });

        // Create new values
        const createdValues = [];
        for (let i = 0; i < values.length; i++) {
          const value = values[i];
          const createdValue = await tx.attributeValue.create({
            data: {
              attributeId: params.id,
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
          ...updatedAttribute,
          values: createdValues
        };
      }

      return updatedAttribute;
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Attribute updated successfully'
    });
  } catch (error) {
    console.error('Error updating attribute:', error);

    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Attribute name already exists for this product' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE: Delete an attribute and all its values
 */
export async function DELETE(request: Request, { params }: { params: IParams }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if attribute exists
    const attribute = await prisma.productAttribute.findUnique({
      where: { id: params.id },
      include: {
        product: {
          select: { id: true }
        }
      }
    });

    if (!attribute) {
      return NextResponse.json({ error: 'Attribute not found' }, { status: 404 });
    }

    // Delete in transaction (cascade will handle values and update variant positions)
    await prisma.$transaction(async tx => {
      // Delete attribute values first
      await tx.attributeValue.deleteMany({
        where: { attributeId: params.id }
      });

      // Delete the attribute
      await tx.productAttribute.delete({
        where: { id: params.id }
      });

      // Reorder remaining attributes
      const remainingAttributes = await tx.productAttribute.findMany({
        where: { productId: attribute.product.id },
        orderBy: { position: 'asc' }
      });

      for (let i = 0; i < remainingAttributes.length; i++) {
        await tx.productAttribute.update({
          where: { id: remainingAttributes[i].id },
          data: { position: i }
        });
      }

      // Delete variants that use this attribute (business logic decision)
      // Alternative: You could mark variants as inactive instead
      await tx.productVariant.deleteMany({
        where: { productId: attribute.product.id }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Attribute deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attribute:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

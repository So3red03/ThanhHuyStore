import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../../../libs/prismadb';
import { NextResponse } from 'next/server';
import { AuditLogger, AuditEventType, AuditSeverity } from '../../../../../utils/auditLogger';

interface IParams {
  id: string;
}

/**
 * GET: Fetch specific variant
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
                values: {
                  orderBy: { position: 'asc' }
                }
              },
              orderBy: { position: 'asc' }
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
 * PUT: Update specific variant
 */
export async function PUT(request: Request, { params }: { params: IParams }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sku, price, stock, isActive, thumbnail, galleryImages, attributes } = body;

    // Check if variant exists
    const existingVariant = await prisma.productVariant.findUnique({
      where: { id: params.id },
      include: { product: true }
    });

    if (!existingVariant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    // Validation
    if (sku && sku !== existingVariant.sku) {
      // Check if new SKU already exists
      const existingSku = await prisma.productVariant.findFirst({
        where: {
          sku,
          id: { not: params.id }
        }
      });

      if (existingSku) {
        return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
      }
    }

    // Update variant
    const updatedVariant = await prisma.productVariant.update({
      where: { id: params.id },
      data: {
        sku: sku || existingVariant.sku,
        price: price !== undefined ? parseFloat(price) : existingVariant.price,
        stock: stock !== undefined ? parseInt(stock) : existingVariant.stock,
        isActive: isActive !== undefined ? isActive : existingVariant.isActive,
        thumbnail: thumbnail !== undefined ? thumbnail : existingVariant.thumbnail,
        galleryImages: galleryImages !== undefined ? galleryImages : existingVariant.galleryImages,
        attributes: attributes !== undefined ? attributes : existingVariant.attributes,
        updatedAt: new Date()
      }
    });

    // Update product total stock if stock changed
    if (stock !== undefined) {
      const totalStock = await prisma.productVariant.aggregate({
        where: { 
          productId: existingVariant.productId,
          isActive: true 
        },
        _sum: { stock: true }
      });

      await prisma.product.update({
        where: { id: existingVariant.productId },
        data: { inStock: totalStock._sum.stock || 0 }
      });
    }

    // Update product min price if price changed
    if (price !== undefined) {
      const minPrice = await prisma.productVariant.aggregate({
        where: { 
          productId: existingVariant.productId,
          isActive: true 
        },
        _min: { price: true }
      });

      if (minPrice._min.price) {
        await prisma.product.update({
          where: { id: existingVariant.productId },
          data: { price: minPrice._min.price }
        });
      }
    }

    // Audit log
    await AuditLogger.log({
      eventType: AuditEventType.PRODUCT_UPDATED,
      severity: AuditSeverity.LOW,
      userId: currentUser.id,
      userEmail: currentUser.email!,
      userRole: 'ADMIN',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      description: `Cập nhật variant: ${updatedVariant.sku}`,
      details: {
        variantSku: updatedVariant.sku,
        productName: existingVariant.product.name,
        changes: {
          price: { old: existingVariant.price, new: updatedVariant.price },
          stock: { old: existingVariant.stock, new: updatedVariant.stock },
          isActive: { old: existingVariant.isActive, new: updatedVariant.isActive }
        }
      },
      resourceId: params.id,
      resourceType: 'ProductVariant'
    });

    return NextResponse.json(updatedVariant);
  } catch (error) {
    console.error('Error updating variant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE: Delete specific variant (soft delete)
 */
export async function DELETE(request: Request, { params }: { params: IParams }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if variant exists
    const existingVariant = await prisma.productVariant.findUnique({
      where: { id: params.id },
      include: { product: true }
    });

    if (!existingVariant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    await prisma.productVariant.update({
      where: { id: params.id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    // Update product total stock
    const totalStock = await prisma.productVariant.aggregate({
      where: { 
        productId: existingVariant.productId,
        isActive: true 
      },
      _sum: { stock: true }
    });

    await prisma.product.update({
      where: { id: existingVariant.productId },
      data: { inStock: totalStock._sum.stock || 0 }
    });

    // Audit log
    await AuditLogger.log({
      eventType: AuditEventType.PRODUCT_DELETED,
      severity: AuditSeverity.MEDIUM,
      userId: currentUser.id,
      userEmail: currentUser.email!,
      userRole: 'ADMIN',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      description: `Xóa variant: ${existingVariant.sku}`,
      details: {
        variantSku: existingVariant.sku,
        productName: existingVariant.product.name,
        price: existingVariant.price,
        stock: existingVariant.stock
      },
      resourceId: params.id,
      resourceType: 'ProductVariant'
    });

    return NextResponse.json({ message: 'Variant deleted successfully' });
  } catch (error) {
    console.error('Error deleting variant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

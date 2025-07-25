import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../../libs/prismadb';
import { NextResponse } from 'next/server';
import { AuditLogger, AuditEventType, AuditSeverity } from '../../../../utils/auditLogger';

interface IParams {
  id: string;
}

/**
 * GET: Fetch specific simple product
 */
export async function GET(request: Request, { params }: { params: IParams }) {
  try {
    const product = await prisma.product.findUnique({
      where: {
        id: params.id,
        productType: 'SIMPLE',
        isDeleted: false
      },
      include: {
        category: true,
        reviews: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdDate: 'desc' }
        },
        productPromotions: {
          where: { isActive: true },
          include: { promotion: true }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching simple product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT: Update simple product
 */
export async function PUT(request: Request, { params }: { params: IParams }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, price, inStock, categoryId, thumbnail, galleryImages, priority } = body;

    // Validation
    if (!name || !description || !categoryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id, productType: 'SIMPLE' }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: {
        name,
        description,
        price: price ? parseFloat(price) : existingProduct.price,
        inStock: inStock !== undefined ? parseInt(inStock) : existingProduct.inStock,
        categoryId,
        thumbnail: thumbnail !== undefined ? thumbnail : existingProduct.thumbnail,
        galleryImages: galleryImages !== undefined ? galleryImages : existingProduct.galleryImages,
        priority: priority !== undefined ? parseInt(priority) : existingProduct.priority
      }
    });

    // Audit log
    await AuditLogger.log({
      eventType: AuditEventType.PRODUCT_UPDATED,
      severity: AuditSeverity.MEDIUM,
      userId: currentUser.id,
      userEmail: currentUser.email!,
      userRole: 'ADMIN',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      description: `Cập nhật sản phẩm đơn: ${name}`,
      details: {
        productName: name,
        productType: 'SIMPLE',
        changes: {
          name: { old: existingProduct.name, new: name },
          price: { old: existingProduct.price, new: price ? parseFloat(price) : existingProduct.price },
          inStock: {
            old: existingProduct.inStock,
            new: inStock !== undefined ? parseInt(inStock) : existingProduct.inStock
          }
        }
      },
      resourceId: params.id,
      resourceType: 'Product'
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating simple product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE: Delete simple product (soft delete)
 */
export async function DELETE(request: Request, { params }: { params: IParams }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id, productType: 'SIMPLE' }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Soft delete
    await prisma.product.update({
      where: { id: params.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: currentUser.id
      }
    });

    // Audit log
    await AuditLogger.log({
      eventType: AuditEventType.PRODUCT_DELETED,
      severity: AuditSeverity.HIGH,
      userId: currentUser.id,
      userEmail: currentUser.email!,
      userRole: 'ADMIN',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      description: `Xóa sản phẩm đơn: ${existingProduct.name}`,
      details: {
        productName: existingProduct.name,
        productType: 'SIMPLE',
        price: existingProduct.price,
        inStock: existingProduct.inStock
      },
      resourceId: params.id,
      resourceType: 'Product'
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting simple product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

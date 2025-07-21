import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../../libs/prismadb';
import { NextResponse } from 'next/server';
import { AuditLogger, AuditEventType, AuditSeverity } from '../../../../utils/auditLogger';

interface IParams {
  id?: string;
}

/**
 * PUT: Restore soft-deleted product
 */
export async function PUT(request: Request, { params }: { params: IParams }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if product exists and is deleted
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        variants: true
      }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!existingProduct.isDeleted) {
      return NextResponse.json({ error: 'Product is not deleted' }, { status: 400 });
    }

    // Restore product
    await prisma.$transaction(async tx => {
      // Restore main product
      await tx.product.update({
        where: { id: params.id },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          updatedAt: new Date()
        }
      });

      // For variant products, reactivate variants
      if (existingProduct.productType === 'VARIANT' && existingProduct.variants.length > 0) {
        await tx.productVariant.updateMany({
          where: { productId: params.id },
          data: {
            isActive: true,
            updatedAt: new Date()
          }
        });
      }
    });

    // Audit log
    await AuditLogger.log({
      eventType: AuditEventType.PRODUCT_UPDATED,
      severity: AuditSeverity.MEDIUM,
      userId: currentUser.id,
      userEmail: currentUser.email!,
      userRole: currentUser.role,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      description: `Khôi phục sản phẩm: ${existingProduct.name}`,
      details: {
        productName: existingProduct.name,
        productType: existingProduct.productType,
        price: existingProduct.price,
        inStock: existingProduct.inStock,
        action: 'restore'
      },
      resourceId: params.id,
      resourceType: 'Product'
    });

    return NextResponse.json({
      message: 'Product restored successfully',
      product: {
        id: existingProduct.id,
        name: existingProduct.name,
        isDeleted: false
      }
    });
  } catch (error) {
    console.error('Error restoring product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

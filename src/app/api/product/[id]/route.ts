import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.error();
  }

  // Get product data before deletion for audit trail
  const productToDelete = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      category: { select: { name: true } },
      variants: { select: { id: true, sku: true, stock: true } }
    }
  });

  if (!productToDelete) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  // TODO: Implement soft delete after database update
  // For now, use hard delete
  const product = await prisma.product.delete({
    where: { id: params.id }
  });

  // 🎯 AUDIT LOG: Product Deleted
  await AuditLogger.log({
    eventType: AuditEventType.PRODUCT_DELETED,
    severity: AuditSeverity.HIGH, // HIGH because deleting products is critical
    userId: currentUser.id,
    userEmail: currentUser.email!,
    userRole: 'ADMIN',
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    description: `Xóa sản phẩm: ${productToDelete.name}`,
    details: {
      productName: productToDelete.name,
      productType: productToDelete.productType,
      price: productToDelete.price,
      inStock: productToDelete.inStock,
      categoryName: productToDelete.category?.name || 'No category',
      variantsCount: productToDelete.variants?.length || 0,
      totalVariantStock: productToDelete.variants?.reduce((sum, v) => sum + v.stock, 0) || 0,
      deletedAt: new Date()
    },
    resourceId: params.id,
    resourceType: 'Product',
    oldValue: {
      name: productToDelete.name,
      productType: productToDelete.productType,
      price: productToDelete.price,
      inStock: productToDelete.inStock,
      variantsCount: productToDelete.variants?.length || 0
    }
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

    // Check for stock changes for audit logging
    const stockChanged = productType === 'SIMPLE' && existingProduct.inStock !== parseInt(inStock);
    const oldStock = existingProduct.inStock;
    const newStock = parseInt(inStock) || 0;

    const product = await prisma.product.update({
      where: { id: params.id },
      data: updateData
    });

    // 🎯 AUDIT LOG: Inventory Update (if stock changed)
    if (stockChanged) {
      await AuditLogger.log({
        eventType: AuditEventType.INVENTORY_UPDATED,
        severity: AuditSeverity.MEDIUM, // MEDIUM for admin product updates
        userId: currentUser.id,
        userEmail: currentUser.email!,
        userRole: currentUser.role || 'ADMIN',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        description: `Cập nhật tồn kho sản phẩm: ${product.name}`,
        details: {
          productId: params.id,
          productName: product.name,
          oldStock: oldStock,
          newStock: newStock,
          stockChange: newStock - (oldStock || 0),
          updateMethod: 'product_edit',
          endpoint: '/api/product/[id]',
          riskLevel: 'MEDIUM',
          businessContext: 'Admin product management',
          additionalChanges: {
            nameChanged: existingProduct.name !== name,
            priceChanged: existingProduct.price !== parseFloat(price),
            categoryChanged: existingProduct.categoryId !== categoryId
          }
        },
        resourceId: params.id,
        resourceType: 'Product'
      });
    }

    // 🎯 AUDIT LOG: Product Updated
    await AuditLogger.log({
      eventType: AuditEventType.PRODUCT_UPDATED,
      severity: AuditSeverity.MEDIUM,
      userId: currentUser.id,
      userEmail: currentUser.email!,
      userRole: 'ADMIN',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      description: `Cập nhật sản phẩm: ${name}`,
      details: {
        productName: name,
        productType,
        changes: {
          name: { old: existingProduct.name, new: name },
          price: {
            old: existingProduct.price,
            new: productType === 'SIMPLE' ? parseFloat(price) : parseFloat(basePrice)
          },
          inStock: { old: existingProduct.inStock, new: productType === 'SIMPLE' ? parseInt(inStock) : 0 },
          categoryId: { old: existingProduct.categoryId, new: categoryId },
          productType: { old: existingProduct.productType, new: productType }
        }
      },
      resourceId: product.id,
      resourceType: 'Product',
      oldValue: {
        name: existingProduct.name,
        price: existingProduct.price,
        inStock: existingProduct.inStock,
        productType: existingProduct.productType
      },
      newValue: {
        name,
        price: productType === 'SIMPLE' ? parseFloat(price) : parseFloat(basePrice),
        inStock: productType === 'SIMPLE' ? parseInt(inStock) : 0,
        productType
      }
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

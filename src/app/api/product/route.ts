import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.error();
  }

  // Invoking data JSON from request
  const body = await request.json();
  const { name, description, price, categoryId, inStock, images } = body;

  // create new product in db by Prisma
  const product = await prisma.product.create({
    data: {
      name,
      description,
      categoryId,
      inStock: parseInt(inStock),
      images,
      price: parseFloat(price)
    }
  });

  // 🎯 AUDIT LOG: Product Created
  await AuditLogger.log({
    eventType: AuditEventType.PRODUCT_CREATED,
    severity: AuditSeverity.MEDIUM,
    userId: currentUser.id,
    userEmail: currentUser.email!,
    userRole: 'ADMIN',
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    description: `Tạo sản phẩm: ${name}`,
    details: {
      productName: name,
      productType: 'SIMPLE',
      price: parseFloat(price),
      inStock: parseInt(inStock),
      categoryId,
      imagesCount: images?.length || 0
    },
    resourceId: product.id,
    resourceType: 'Product'
  });

  return NextResponse.json(product);
}

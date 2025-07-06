import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.error();
  }

  const body = await request.json();
  const { quantity } = body;

  // Lấy số lượng tồn kho hiện tại của sản phẩm từ database
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: { inStock: true, name: true, price: true }
  });

  if (!product) {
    return NextResponse.error();
  }

  const oldStock = product.inStock ?? 0;
  const newStock = oldStock - quantity;

  // 🚨 CRITICAL RISK: Manual stock deduction (legacy endpoint)
  const updatedProduct = await prisma.product.update({
    where: { id: params.id },
    data: {
      inStock: newStock
    }
  });

  // 🎯 AUDIT LOG: Manual Stock Update (CRITICAL RISK)
  await AuditLogger.log({
    eventType: AuditEventType.INVENTORY_UPDATED,
    severity: AuditSeverity.HIGH, // HIGH because manual stock changes are risky
    userId: currentUser.id,
    userEmail: currentUser.email!,
    userRole: currentUser.role || 'ADMIN',
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    description: `Cập nhật tồn kho thủ công: ${product.name}`,
    details: {
      productId: params.id,
      productName: product.name,
      oldStock: oldStock,
      newStock: newStock,
      quantityDeducted: quantity,
      stockChange: newStock - oldStock,
      updateMethod: 'manual_deduction',
      endpoint: '/api/updateStock/[id]',
      riskLevel: 'CRITICAL', // Manual stock changes bypass business logic
      securityNote: 'Legacy endpoint - should be replaced with atomic transactions',
      businessImpact: 'Direct inventory modification without order context'
    },
    resourceId: params.id,
    resourceType: 'Product'
  });

  return NextResponse.json(updatedProduct);
}

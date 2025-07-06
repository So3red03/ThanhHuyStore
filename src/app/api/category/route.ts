import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';
import { AuditLogger, AuditEventType, AuditSeverity } from '@/app/utils/auditLogger';

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.error();
  }

  const body = await request.json();
  const { name, slug, description, icon, image, parentId } = body;

  const category = await prisma.category.create({
    data: {
      name,
      slug,
      description,
      icon,
      image,
      parentId
    }
  });

  // 🎯 AUDIT LOG: Product Category Created
  await AuditLogger.log({
    eventType: AuditEventType.CATEGORY_CREATED,
    severity: AuditSeverity.LOW,
    userId: currentUser.id,
    userEmail: currentUser.email!,
    userRole: 'ADMIN',
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    description: `Tạo danh mục sản phẩm: ${name}`,
    details: {
      categoryName: name,
      slug,
      description,
      hasIcon: !!icon,
      hasImage: !!image,
      isSubcategory: !!parentId,
      parentId
    },
    resourceId: category.id,
    resourceType: 'ProductCategory'
  });

  return NextResponse.json(category);
}

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ message: 'Không thể lấy danh sách danh mục' }, { status: 500 });
  }
}

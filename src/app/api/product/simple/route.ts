import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';
import { AuditLogger, AuditEventType, AuditSeverity } from '../../../utils/auditLogger';

/**
 * GET: Fetch all simple products
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      productType: 'SIMPLE',
      isDeleted: false
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Get products
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          reviews: {
            include: { user: true },
            orderBy: { createdDate: 'desc' }
          },
          productPromotions: {
            where: { isActive: true },
            include: { promotion: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching simple products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST: Create new simple product
 */
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, price, categoryId, inStock, thumbnail, galleryImages, priority } = body;

    // Validation
    if (!name || !description || !categoryId || !price || inStock === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (parseFloat(price) <= 0) {
      return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 });
    }

    if (parseInt(inStock) < 0) {
      return NextResponse.json({ error: 'Stock cannot be negative' }, { status: 400 });
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        categoryId,
        inStock: parseInt(inStock),
        productType: 'SIMPLE',
        thumbnail: thumbnail || null,
        galleryImages: galleryImages || [],
        priority: priority !== undefined ? parseInt(priority) : 0
      }
    });

    // Audit log
    await AuditLogger.log({
      eventType: AuditEventType.PRODUCT_CREATED,
      severity: AuditSeverity.MEDIUM,
      userId: currentUser.id,
      userEmail: currentUser.email!,
      userRole: 'ADMIN',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      description: `Tạo sản phẩm đơn: ${name}`,
      details: {
        productName: name,
        productType: 'SIMPLE',
        price: parseFloat(price),
        inStock: parseInt(inStock),
        categoryId
      },
      resourceId: product.id,
      resourceType: 'Product'
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error creating simple product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

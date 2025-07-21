import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from './../../libs/prismadb';
import { NextResponse } from 'next/server';
/**
 * GET: Fetch all products (simple and variant) for admin management
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '1000'); // High limit for admin
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const forAdmin = searchParams.get('admin') === 'true';
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    const onlyDeleted = searchParams.get('onlyDeleted') === 'true';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Handle soft delete filtering
    if (onlyDeleted) {
      where.isDeleted = true;
    } else if (!includeDeleted) {
      where.isDeleted = false;
    }
    // If includeDeleted is true and onlyDeleted is false, don't filter by isDeleted

    // For admin, include both SIMPLE and VARIANT products
    if (!forAdmin) {
      where.productType = 'SIMPLE'; // For public API, only simple products
    }

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
          variants: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
          },
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

import prisma from '../../../../libs/prismadb';
import { NextResponse } from 'next/server';
export async function GET(request: Request, { params }: { params: { skip: string; take: string } }) {
  try {
    const skip = parseInt(params.skip || '0');
    const take = parseInt(params.take || '4');

    const articles = await prisma.article.findMany({
      skip,
      take,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        category: true
      }
    });

    return NextResponse.json(articles, {
      headers: {
        // Cache for 30 minutes - articles don't change very frequently
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600'
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy bài viết:', error);
    return NextResponse.json({ error: 'Lỗi khi lấy bài viết' }, { status: 500 });
  }
}

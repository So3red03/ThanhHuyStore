import prisma from '../libs/prismadb';
export interface ArticleParams {
  searchTerm?: string | null;
}

export async function getArticlesBySearchParams(params: ArticleParams) {
  try {
    const { searchTerm } = params;
    let searchString = searchTerm || '';
    let query: any = {};

    const articles = await prisma.article.findMany({
      where: {
        ...query,
        // Tìm kiếm theo tên hoặc mô tả
        OR: [
          {
            title: {
              contains: searchString,
              // Tìm kiếm không phân biệt chữ hoa chữ thường
              mode: 'insensitive'
            },
            content: {
              contains: searchString,
              mode: 'insensitive'
            }
          }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        category: true
      }
    });
    return articles;
  } catch (error: any) {
    throw new Error(error);
  }
}

import prisma from '../libs/prismadb';

export async function getArticles() {
  try {
    const articles = await prisma.article.findMany({
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

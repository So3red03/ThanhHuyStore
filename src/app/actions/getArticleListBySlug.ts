import prisma from '../libs/prismadb';

export interface IParams {
	slug: string;
}

export async function getArticleListBySlug(params: IParams) {
	try {
		// Truy vấn danh sách bài viết từ Prisma theo category
		const { slug } = params;

		const category = await prisma.articleCategory.findFirst({
			where: { slug }
		});

		if (!category) {
			throw new Error('Sản phẩm không tìm thấy');
		}

		// Lấy bài viết trong danh mục từ Prisma
		const articles = await prisma.article.findMany({
			where: { categoryId: category.id },
			include: { category: true },
			orderBy: {
				createdAt: 'desc'
			}
		});

		return articles;
	} catch (error) {
		console.log(error);
	}
}

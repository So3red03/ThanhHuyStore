import prisma from '../libs/prismadb';

export interface IParams {
	articleId: string;
	takeReviews?: number;
	skipReviews?: number;
}

export async function getArticleById(params: IParams) {
	try {
		const { articleId, takeReviews = 2, skipReviews = 0 } = params;
		if (!articleId) {
			throw new Error('Không có bài viết');
		}
		const article = await prisma.article.findUnique({
			where: {
				id: articleId,
			},
			include: {
				reviews: {
					take: takeReviews,
					skip: skipReviews,
					include: {
						user: { select: { id: true, name: true, image: true } }, // Lấy thông tin user
						replies: {
							// take: 2, // Lấy 2 phản hồi đầu tiên trong mỗi bình luận
							include: {
								user: { select: { id: true, name: true, image: true } }, // Lấy thông tin user của phản hồi
							},
						},
					},
					orderBy: {
						createdDate: 'desc', // Sắp xếp theo thời gian giảm dần
					},
				},
			},
		});
		return article;
	} catch (error: any) {
		throw new Error(error);
	}
}

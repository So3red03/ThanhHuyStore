import prisma from '../libs/prismadb';

export async function getReviews() {
	try {
		const reviews = await prisma.review.findMany({
			include: {
				user: true,
				product: true,
			},
			orderBy: {
				createdDate: 'desc',
			},
		});
		if (!reviews) {
			return [];
		}
		return reviews;
	} catch (error: any) {
		throw new Error(error);
	}
}

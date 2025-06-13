import prisma from '../libs/prismadb';

export async function getPromotions() {
	try {
		const promotions = await prisma.promotion.findMany({
			orderBy: {
				createdAt: 'desc'
			}
		});

		// Fetch related products and categories for each promotion
		const promotionsWithDetails = await Promise.all(
			promotions.map(async (promotion) => {
				const products = await prisma.product.findMany({
					where: {
						id: { in: promotion.productIds }
					},
					select: {
						id: true,
						name: true,
						price: true
					}
				});

				const categories = await prisma.category.findMany({
					where: {
						id: { in: promotion.categoryIds }
					},
					select: {
						id: true,
						name: true
					}
				});

				return {
					...promotion,
					products,
					categories
				};
			})
		);

		return promotionsWithDetails;
	} catch (error: any) {
		console.error('Error fetching promotions:', error);
		return [];
	}
}

export async function getPromotionById(id: string) {
	try {
		const promotion = await prisma.promotion.findUnique({
			where: { id }
		});

		if (!promotion) return null;

		const products = await prisma.product.findMany({
			where: {
				id: { in: promotion.productIds }
			},
			select: {
				id: true,
				name: true,
				price: true
			}
		});

		const categories = await prisma.category.findMany({
			where: {
				id: { in: promotion.categoryIds }
			},
			select: {
				id: true,
				name: true
			}
		});

		return {
			...promotion,
			products,
			categories
		};
	} catch (error: any) {
		console.error('Error fetching promotion:', error);
		return null;
	}
}

export async function getActivePromotions() {
	try {
		const now = new Date();
		const promotions = await prisma.promotion.findMany({
			where: {
				isActive: true,
				startDate: { lte: now },
				endDate: { gte: now }
			},
			orderBy: {
				createdAt: 'desc'
			}
		});

		return promotions;
	} catch (error: any) {
		console.error('Error fetching active promotions:', error);
		return [];
	}
}

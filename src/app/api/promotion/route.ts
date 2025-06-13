import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
	const currentUser = await getCurrentUser();

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const {
		title,
		description,
		discountType,
		discountValue,
		maxDiscount,
		startDate,
		endDate,
		applyToAll,
		productIds,
		categoryIds
	} = body;

	try {
		const promotion = await prisma.promotion.create({
			data: {
				title,
				description,
				discountType,
				discountValue: parseFloat(discountValue),
				maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
				startDate: new Date(startDate),
				endDate: new Date(endDate),
				applyToAll: applyToAll || false,
				productIds: productIds || [],
				categoryIds: categoryIds || []
			}
		});
		return NextResponse.json(promotion);
	} catch (error) {
		console.error('Error creating promotion:', error);
		return NextResponse.json({ error: 'Failed to create promotion' }, { status: 500 });
	}
}

export async function GET() {
	const currentUser = await getCurrentUser();

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

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

		return NextResponse.json(promotionsWithDetails);
	} catch (error) {
		console.error('Error fetching promotions:', error);
		return NextResponse.json({ error: 'Failed to fetch promotions' }, { status: 500 });
	}
}

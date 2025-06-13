import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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
		isActive,
		applyToAll,
		productIds,
		categoryIds
	} = body;

	try {
		const promotion = await prisma.promotion.update({
			where: { id: params.id },
			data: {
				title,
				description,
				discountType,
				discountValue: parseFloat(discountValue),
				maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
				startDate: new Date(startDate),
				endDate: new Date(endDate),
				isActive,
				applyToAll: applyToAll || false,
				productIds: productIds || [],
				categoryIds: categoryIds || []
			}
		});
		return NextResponse.json(promotion);
	} catch (error) {
		console.error('Error updating promotion:', error);
		return NextResponse.json({ error: 'Failed to update promotion' }, { status: 500 });
	}
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
	const currentUser = await getCurrentUser();

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		await prisma.promotion.delete({
			where: { id: params.id }
		});
		return NextResponse.json({ message: 'Promotion deleted successfully' });
	} catch (error) {
		console.error('Error deleting promotion:', error);
		return NextResponse.json({ error: 'Failed to delete promotion' }, { status: 500 });
	}
}

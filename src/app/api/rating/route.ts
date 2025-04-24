import { Review } from '@prisma/client';
import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';

export async function POST(request: Request) {
	const currentUser = await getCurrentUser();
	const body = await request.json();
	const { comment, rating, product, userId } = body;

	if (!currentUser) {
		return NextResponse.json({ error: 'User not found' }, { status: 404 });
	}

	const userReview = await product.reviews.find((review: Review) => {
		return review.userId === currentUser?.id;
	});

	if (userReview) {
		return NextResponse.error();
	}

	const review = await prisma.review.create({
		data: {
			comment,
			rating,
			productId: product.id,
			userId,
		},
	});
	// Gửi thông báo sau khi user comment
	await prisma.notification.create({
		data: {
			userId: currentUser.id, // ID của người gửi thông báo
			type: 'COMMENT_RECEIVED',
			message: `Người dùng comment`,
		},
	});
	return NextResponse.json(review);
}

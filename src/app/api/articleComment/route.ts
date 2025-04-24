import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';

export async function POST(request: Request) {
	try {
		const currentUser = await getCurrentUser();
		const body = await request.json();
		const { articleId, comment, parentId, rating } = body;

		if (!currentUser) {
			return NextResponse.json({ error: 'Không tìm thấy user' }, { status: 404 });
		}

		const review = await prisma.articleReview.create({
			data: {
				articleId,
				userId: currentUser.id,
				comment: comment || null,
				parentId: parentId || null,
				rating: rating || null,
			},
		});

		return NextResponse.json(review);
	} catch (error) {
		return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
	}
}

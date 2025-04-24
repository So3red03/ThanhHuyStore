import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';

export async function PUT(request: Request) {
	const currentUser = await getCurrentUser();

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return NextResponse.json({ message: 'Không đủ quyền' }, { status: 403 });
	}

	const body = await request.json();
	const { id, edit } = body;

	const review = await prisma.review.update({
		where: { id },
		data: { reply: edit }
	});
	return NextResponse.json(review);
}

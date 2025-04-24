import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
	const currentUser = await getCurrentUser();

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return NextResponse.error();
	}

	const review = await prisma.review.delete({
		where: { id: params.id },
	});
	return NextResponse.json(review);
}
export async function PUT(request: Request, { params }: { params: { id: string } }) {
	const currentUser = await getCurrentUser();

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
	}

	const body = await request.json();
	const { reply } = body;

	const review = await prisma.review.update({
		where: { id: params.id },
		data: { reply },
	});
	return NextResponse.json(review);
}

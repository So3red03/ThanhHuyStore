import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
	const currentUser = await getCurrentUser();

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return NextResponse.json({ message: 'Không đủ quyền' }, { status: 403 });
	}

	const body = await request.json();
	const { isRead } = body;

	const notification = await prisma.notification.update({
		where: { id: params.id },
		data: { isRead },
	});
	return NextResponse.json(notification);
}

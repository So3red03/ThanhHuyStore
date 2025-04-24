import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
	const currentUser = await getCurrentUser();

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return NextResponse.error();
	}

	const banner = await prisma.banner.delete({
		where: { id: params.id },
	});
	return NextResponse.json(banner);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
	const currentUser = await getCurrentUser();

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return NextResponse.error();
	}

	const body = await request.json();
	const { name, description, status, image } = body;

	const banner = await prisma.banner.update({
		where: { id: params.id },
		data: { name: name, description: description, status: status, image: image },
	});
	return NextResponse.json(banner);
}

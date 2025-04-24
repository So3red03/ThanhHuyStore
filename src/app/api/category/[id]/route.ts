import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
	const currentUser = await getCurrentUser();

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return NextResponse.error();
	}

	const category = await prisma.category.delete({
		where: { id: params.id }
	});
	return NextResponse.json(category);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
	const currentUser = await getCurrentUser();

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return NextResponse.error();
	}

	const body = await request.json();
	const { name, image, icon, description, slug, parentId } = body;

	const category = await prisma.category.update({
		where: { id: params.id },
		data: { name, image, icon, description, slug, parentId }
	});
	return NextResponse.json(category);
}

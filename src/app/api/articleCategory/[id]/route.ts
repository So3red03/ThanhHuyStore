import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
	const currentUser = await getCurrentUser();

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return NextResponse.error();
	}

	const articleCategory = await prisma.articleCategory.delete({
		where: { id: params.id },
	});
	return NextResponse.json(articleCategory);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
	const currentUser = await getCurrentUser();

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return NextResponse.error();
	}

	const body = await request.json();
	const { name, description, icon, isActive, slug } = body;

	const articleCategory = await prisma.articleCategory.update({
		where: { id: params.id },
		data: { name, description, icon, isActive, slug },
	});
	return NextResponse.json(articleCategory);
}

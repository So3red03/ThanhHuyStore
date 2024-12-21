import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
	const currentUser = await getCurrentUser();

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return NextResponse.error();
	}

	const body = await request.json();
	const { name, slug, description, isActive } = body;

	const articleCategory = await prisma.articleCategory.create({
		data: {
			name,
			slug,
			description,
			isActive,
		},
	});
	return NextResponse.json(articleCategory);
}

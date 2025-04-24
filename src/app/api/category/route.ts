import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
	const currentUser = await getCurrentUser();

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return NextResponse.error();
	}

	const body = await request.json();
	const { name, slug, description, icon, image, parentId } = body;

	const category = await prisma.category.create({
		data: {
			name,
			slug,
			description,
			icon,
			image,
			parentId
		}
	});
	return NextResponse.json(category);
}

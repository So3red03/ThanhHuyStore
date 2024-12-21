import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
	const currentUser = await getCurrentUser();

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return NextResponse.error();
	}

	// Invoking data JSON from request
	const body = await request.json();
	const { name, description, status, startDate, endDate, image, imageResponsive } = body;

	// create new user in db by Prisma
	const banner = await prisma.banner.create({
		data: {
			name,
			description,
			status,
			startDate,
			endDate,
			image,
			imageResponsive,
		},
	});
	return NextResponse.json(banner);
}

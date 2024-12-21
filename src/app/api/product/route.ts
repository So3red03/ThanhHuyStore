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
	const { name, description, price, brand, category, inStock, images } = body;

	// create new user in db by Prisma
	const product = await prisma.product.create({
		data: {
			name,
			description,
			brand,
			category,
			inStock: parseInt(inStock),
			images,
			price: parseFloat(price),
		},
	});
	return NextResponse.json(product);
}

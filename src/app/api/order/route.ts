import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const paymentIntentId = url.searchParams.get('paymentIntentId');

		if (!paymentIntentId) {
			return new NextResponse('Payment Intent ID is required', { status: 400 });
		}

		const order = await prisma.order.findUnique({
			where: { paymentIntentId },
			include: {
				user: true,
			},
		});

		if (!order) {
			return new NextResponse('Order not found', { status: 404 });
		}

		return NextResponse.json(order);
	} catch (error) {
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}

export async function PUT(request: Request) {
	const currentUser = await getCurrentUser();

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return NextResponse.error();
	}

	// Invoking data JSON from request
	const body = await request.json();
	const { id, deliveryStatus } = body;

	// create new user in db by Prisma
	const order = await prisma.order.update({
		where: { id },
		data: { deliveryStatus },
	});
	return NextResponse.json(order);
}

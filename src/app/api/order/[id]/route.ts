import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';
export async function PUT(request: Request, { params }: { params: { id: string } }) {
	const currentUser = await getCurrentUser();

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return NextResponse.error();
	}

	const body = await request.json();
	const { status } = body;

	const order = await prisma.order.update({
		where: { id: params.id },
		data: { status }
	});
	return NextResponse.json(order);
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
	try {
		const order = await prisma.order.findUnique({
			where: { paymentIntentId: params.id },
			include: { user: true }
		});

		if (!order) {
			return NextResponse.json({ message: 'Order not found' }, { status: 404 });
		}

		return NextResponse.json(order);
	} catch (error) {
		console.error('Error fetching order:', error);
		return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
	}
}

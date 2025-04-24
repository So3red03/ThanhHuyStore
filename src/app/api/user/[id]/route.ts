import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../pages/api/auth/[...nextauth]';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
	const currentUser = await getCurrentUser();

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return NextResponse.error();
	}

	const user = await prisma.user.delete({
		where: { id: params.id },
	});
	return NextResponse.json(user);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
	const currentUser = await getCurrentUser();

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return NextResponse.error();
	}

	// Invoking data JSON from request
	const body = await request.json();
	const { name, newPassword, role } = body;

	const hashedPassword = await bcrypt.hash(newPassword, 10);

	const user = await prisma.user.update({
		where: { id: params.id },
		data: { name, hashedPassword, role },
	});
	return NextResponse.json(user);
}

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.email) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const currentUser = await prisma.user.findUnique({
			where: { email: session.user.email },
			include: { orders: true },
		});

		if (!currentUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		return NextResponse.json({
			...currentUser,
			createAt: currentUser.createAt.toISOString(),
			updateAt: currentUser.updateAt.toISOString(),
			emailVerified: currentUser.emailVerified?.toString() || null,
		});
	} catch (error) {
		console.error('Error fetching user:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

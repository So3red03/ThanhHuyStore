import bcrypt from 'bcrypt';
import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';

export async function POST(request: Request) {
	try {
		// Invoking data JSON from request(payload)
		const body = await request.json();
		const { name, email, password } = body;

		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			return NextResponse.json({ message: 'Email đã tồn tại' }, { status: 400 });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		// create new user in db by Prisma
		const user = await prisma.user.create({
			data: {
				name,
				email,
				hashedPassword,
			},
		});
		return NextResponse.json(user);
	} catch (error) {
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}

export async function PUT(request: Request) {
	try {
		const currentUser = await getCurrentUser();
		if (!currentUser) {
			return NextResponse.error();
		}
		// Invoking data JSON from request
		const body = await request.json();
		const { name, phone } = body;

		const user = await prisma.user.update({
			where: { id: currentUser.id },
			data: {
				name,
				phoneNumber: phone,
			},
		});
		return NextResponse.json(user);
	} catch (error) {
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}

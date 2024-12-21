import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

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

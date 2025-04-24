import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';
export async function GET(request: Request, { params }: { params: { chatRoomId: string } }) {
	try {
		const messages = await prisma.message.findMany({
			where: {
				chatroomId: params.chatRoomId,
			},
			include: {
				seen: true,
				sender: true,
			},
			orderBy: {
				createdAt: 'asc',
			},
		});
		return NextResponse.json(messages);
	} catch (error) {
		return new NextResponse('Internal Server Error', { status: 500 });
	}
}

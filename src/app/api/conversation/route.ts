import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';
import { pusherServer } from '@/app/libs/pusher';

export async function POST(request: Request) {
	try {
		const currentUser = await getCurrentUser();
		if (!currentUser || currentUser.role !== 'ADMIN') {
			return new NextResponse('Unauthorized', { status: 401 });
		}

		// Invoking data JSON from request
		const body = await request.json();
		const { userId } = body;
		// Kiểm tra nếu đã tồn tại ChatRoom giữa hai người dùng
		const existingChatroom = await prisma.chatRoom.findFirst({
			where: {
				AND: [
					{
						users: {
							//  Truy vấn trên các quan hệ nhiều-nhiều.
							some: {
								id: currentUser.id,
							},
						},
					},
					{
						users: {
							some: {
								id: userId,
							},
						},
					},
				],
			},
			include: {
				users: true,
			},
		});

		if (existingChatroom) {
			return NextResponse.json(existingChatroom);
		}

		const newConversation = await prisma.chatRoom.create({
			data: {
				users: {
					connect: [
						{
							id: currentUser.id,
						},
						{
							id: userId,
						},
					],
				},
			},
			include: {
				users: true,
			},
		});

		newConversation.users.map((user) => {
			if (user.email) {
				pusherServer.trigger(user.email, 'conversation:new', newConversation);
			}
		});
		return NextResponse.json(newConversation);
	} catch (error) {
		return new NextResponse('Internal Error', { status: 500 });
	}
}

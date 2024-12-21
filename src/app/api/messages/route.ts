import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';
import { pusherServer } from './../../libs/pusher';

export async function POST(request: Request) {
	try {
		const currentUser = await getCurrentUser();
		if (!currentUser) {
			return new NextResponse('Not found user', { status: 404 });
		}

		// Invoking data JSON from request
		const body = await request.json();
		const { message, chatRoomId } = body;

		if (!message || !chatRoomId) {
			return new NextResponse('Missing required fields', { status: 400 });
		}

		const newMessage = await prisma.message.create({
			data: {
				body: message,
				chatroom: {
					connect: {
						id: chatRoomId,
					},
				},
				sender: {
					connect: {
						id: currentUser.id,
					},
				},
				// Seen hiện tại id không chính xác
				seen: {
					connect: {
						id: currentUser.id,
					},
				},
			},
			include: {
				seen: true,
				sender: true,
			},
		});
		const updateMessage = await prisma.chatRoom.update({
			where: {
				id: chatRoomId,
			},
			data: {
				lastMessageAt: new Date(),
				messages: {
					connect: {
						id: newMessage.id,
					},
				},
			},
			include: {
				users: true,
				messages: {
					include: {
						seen: true,
					},
				},
			},
		});
		// Gửi sự kiện đến kênh
		await pusherServer.trigger(chatRoomId, 'messages:new', newMessage);

		// Update lastest message bên sidebar
		const lastestMessage = updateMessage.messages[updateMessage.messages.length - 1];
		updateMessage.users.map((user) => {
			pusherServer.trigger(user.email!, 'conversation:update', {
				id: chatRoomId,
				message: [lastestMessage],
			});
		});
		return NextResponse.json(newMessage);
	} catch (error) {
		return new NextResponse('Internal Error', { status: 500 });
	}
}

import prisma from '../libs/prismadb';
import { getCurrentUser } from './getCurrentUser';

export async function getConversations() {
	const currentUser = await getCurrentUser();
	if (!currentUser?.id) {
		return [];
	}
	try {
		const conversations = await prisma.chatRoom.findMany({
			orderBy: {
				lastMessageAt: 'desc',
			},
			where: {
				userIds: {
					has: currentUser.id,
				},
			},
			include: {
				users: true,
				messages: {
					include: {
						// Nên config cái lại seen thành object chứ ko phải array nếu k làm group chat
						seen: true,
						sender: true,
					},
				},
			},
		});
		return conversations;
	} catch (error: any) {
		throw [];
	}
}

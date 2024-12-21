import prisma from '../libs/prismadb';
import { getCurrentUser } from './getCurrentUser';

export async function getConversationById(params: string) {
	try {
		const currentUser = await getCurrentUser();
		if (!currentUser?.email) {
			return null;
		}
		const conversation = await prisma.chatRoom.findUnique({
			where: {
				id: params,
			},
			include: {
				users: true,
			},
		});
		return conversation;
	} catch (error: any) {
		return null;
	}
}

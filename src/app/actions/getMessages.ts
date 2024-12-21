import prisma from '../libs/prismadb';

export async function getMessages(params: string) {
	try {
		const messages = await prisma.message.findMany({
			where: {
				chatroomId: params,
			},
			include: {
				seen: true,
				sender: true,
			},
			orderBy: {
				createdAt: 'asc',
			},
		});
		return messages;
	} catch (error: any) {
		throw [];
	}
}

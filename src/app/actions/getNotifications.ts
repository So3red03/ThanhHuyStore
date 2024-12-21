import prisma from '../libs/prismadb';

export async function getNotifications() {
	try {
		const notifications = await prisma.notification.findMany({
			include: {
				user: true,
				product: true,
			},
		});

		return notifications;
	} catch (error: any) {
		throw new Error(error);
	}
}

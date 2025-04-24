import prisma from '../libs/prismadb';

export async function getOrdersById(userId: string) {
	try {
		const orders = await prisma.order.findMany({
			include: {
				user: true,
			},
			where: {
				userId: userId,
			},
			orderBy: {
				createDate: 'desc',
			},
		});
		return orders;
	} catch (error: any) {
		throw new Error(error);
	}
}

import prisma from '../libs/prismadb';

export async function getOrders() {
	try {
		const orders = await prisma.order.findMany({
			// Lấy tất cả user liên quan đến order
			include: {
				user: true,
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

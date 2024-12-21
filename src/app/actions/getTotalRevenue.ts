import prisma from '../libs/prismadb';

export async function getTotalRevenue() {
	try {
		const orders = await prisma.order.findMany({
			where: {
				status: 'completed',
			},
		});
		return orders.reduce((total: any, order: any) => total + order.amount, 0);
	} catch (error: any) {
		throw new Error(error);
	}
}

import prisma from '../libs/prismadb';

export async function getOrderByPaymentId(paymentId: string | null) {
	try {
		if (paymentId === null) return;
		const order = await prisma.order.findUnique({
			include: {
				user: true,
			},
			where: {
				paymentIntentId: paymentId,
			},
		});
		return order;
	} catch (error: any) {
		throw new Error(error);
	}
}

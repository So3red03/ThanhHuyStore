import prisma from '../libs/prismadb';

export async function getVouchers() {
	try {
		const vouchers = await prisma.voucher.findMany({
			include: {
				userVouchers: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true
							}
						}
					}
				}
			},
			orderBy: {
				createdAt: 'desc'
			}
		});

		return vouchers;
	} catch (error: any) {
		console.error('Error fetching vouchers:', error);
		return [];
	}
}

export async function getVoucherById(id: string) {
	try {
		const voucher = await prisma.voucher.findUnique({
			where: { id },
			include: {
				userVouchers: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true
							}
						}
					}
				}
			}
		});

		return voucher;
	} catch (error: any) {
		console.error('Error fetching voucher:', error);
		return null;
	}
}

export async function getActiveVouchers() {
	try {
		const now = new Date();
		const vouchers = await prisma.voucher.findMany({
			where: {
				isActive: true,
				startDate: { lte: now },
				endDate: { gte: now },
				quantity: { gt: 0 }
			},
			orderBy: {
				createdAt: 'desc'
			}
		});

		return vouchers;
	} catch (error: any) {
		console.error('Error fetching active vouchers:', error);
		return [];
	}
}

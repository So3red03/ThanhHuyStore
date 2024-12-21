import prisma from '../libs/prismadb';

export interface IParams {
	userId: string;
}

export async function getUserById(params: IParams) {
	try {
		const { userId } = params;
		if (!userId) {
			throw new Error('Người dùng không tìm thấy');
		}
		const user = await prisma.user.findUnique({
			where: {
				id: userId,
			},
			include: {
				orders: true,
				reviews: {
					include: {
						user: true,
					},
					orderBy: {
						createdDate: 'desc',
					},
				},
			},
		});
		return user;
	} catch (error: any) {
		throw new Error(error);
	}
}

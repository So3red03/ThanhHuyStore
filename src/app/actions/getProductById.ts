import prisma from '../libs/prismadb';

export interface IParams {
	productId: string;
}

export async function getProductById(params: IParams) {
	try {
		const { productId } = params;
		if (!productId) {
			throw new Error('Sản phẩm không tìm thấy');
		}
		const product = await prisma.product.findUnique({
			where: {
				id: productId
			},
			include: {
				reviews: {
					include: {
						user: true
					},
					orderBy: {
						createdDate: 'desc'
					}
				},
				category: true
			}
		});
		return product;
	} catch (error) {
		console.log(error);
	}
}

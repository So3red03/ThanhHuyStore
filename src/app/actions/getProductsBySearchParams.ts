import prisma from '../libs/prismadb';
export interface IParams {
	searchTerm?: string | null;
}

export async function getProductsBySearchParams(params: IParams) {
	try {
		const { searchTerm } = params;
		let searchString = searchTerm || '';
		const products = await prisma.product.findMany({
			where: {
				OR: [
					{
						name: {
							contains: searchString,
							mode: 'insensitive' // Không phân biệt chữ hoa/chữ thường
						}
					},
					{
						description: {
							contains: searchString,
							mode: 'insensitive'
						}
					}
				]
			},
			orderBy: {
				createdAt: 'desc'
			},
			include: {
				category: true
			}
		});
		return products;
	} catch (error) {
		console.log(error);
	}
}

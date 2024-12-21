import prisma from '../libs/prismadb';

export interface IProductParams {
	category?: string | null;
	searchTerm?: string | null;
}

export async function getProducts(params: IProductParams) {
	try {
		const { category, searchTerm } = params;
		let searchString = searchTerm || '';
		let query: any = {};

		if (category) {
			query.category = category;
		}

		const products = await prisma.product.findMany({
			where: {
				...query,
				// Tìm kiếm theo tên hoặc mô tả
				OR: [
					{
						name: {
							contains: searchString,
							// Tìm kiếm không phân biệt chữ hoa chữ thường
							mode: 'insensitive',
						},
						description: {
							contains: searchString,
							mode: 'insensitive',
						},
					},
				],
			},
			include: {
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
		return products;
	} catch (error: any) {
		throw new Error(error);
	}
}

export async function getProductsByCategory(category: string) {
	return getProducts({ category });
}

import prisma from '../libs/prismadb';

export async function getAllProductCategories() {
	try {
		const categories = await prisma.category.findMany({
			where: {
				image: { not: null }
			},
			include: {
				subcategories: true
			}
		});
		return categories;
	} catch (error) {
		console.log(error);
	}
}
export async function getProductCategories() {
	try {
		const categories = await prisma.category.findMany({
			where: {
				image: { not: null }
			}
		});
		return categories;
	} catch (error) {
		console.log(error);
	}
}

export async function getSubCategories() {
	try {
		const subCategories = await prisma.category.findMany({
			where: {
				parentId: { not: null }
			}
		});
		return subCategories;
	} catch (error) {
		console.log(error);
	}
}

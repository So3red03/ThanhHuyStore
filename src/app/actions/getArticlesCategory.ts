import prisma from '../libs/prismadb';

export async function getArticlesCategory() {
	try {
		const articleCategory = await prisma.articleCategory.findMany();
		return articleCategory;
	} catch (error: any) {
		throw new Error(error);
	}
}

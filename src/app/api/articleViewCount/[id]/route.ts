import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
	try {
		const body = await request.json();
		const { title, image, content, categoryId } = body;

		// const article = await prisma.article.update({
		// 	where: { id: params.id },
		// 	data: { userId: currentUser.id, title, image, content, categoryId }
		// });
		// const articleId = params.id;

		// const updatedArticle = await prisma.article.update({
		// 	where: { id: articleId },
		// 	data: {
		// 		viewCount: {
		// 			increment: 1
		// 		}
		// 	}
		// });

		// return NextResponse.json(updatedArticle);
	} catch (error) {
		return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
	}
}

import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
	const currentUser = await getCurrentUser();

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return NextResponse.json({ message: 'Không đủ quyền' }, { status: 403 });
	}

	const body = await request.json();
	const { title, image, content, categoryId } = body;

	// create new user in db by Prisma
	const article = await prisma.article.create({
		data: {
			userId: currentUser.id,
			title,
			image,
			content,
			categoryId,
		},
	});
	return NextResponse.json(article);
}

export async function GET() {
	try {
		const articles = await prisma.article.findMany({
			orderBy: {
				createdAt: 'desc',
			},
		});
		return NextResponse.json(articles);
	} catch (error) {
		return NextResponse.json({ message: 'Không thể lấy danh sách bài viết' }, { status: 500 });
	}
}

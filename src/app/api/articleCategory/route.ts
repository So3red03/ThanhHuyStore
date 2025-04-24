import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
	const currentUser = await getCurrentUser();

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return NextResponse.error();
	}

	const body = await request.json();
	const { name, slug, icon, description, isActive } = body;

	const articleCategory = await prisma.articleCategory.create({
		data: {
			name,
			slug,
			icon,
			description,
			isActive,
		},
	});
	return NextResponse.json(articleCategory);
}

export async function GET() {
	try {
		const articles = await prisma.articleCategory.findMany();
		return NextResponse.json(articles);
	} catch (error) {
		return NextResponse.json({ message: 'Không thể lấy danh sách danh mục bài viết' }, { status: 500 });
	}
}

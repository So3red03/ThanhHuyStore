import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
	const currentUser = await getCurrentUser();

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return NextResponse.error();
	}

	const article = await prisma.article.delete({
		where: { id: params.id },
	});
	return NextResponse.json(article);
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
	try {
		if (!params.id) {
			return NextResponse.json({ error: 'Không có bài viết' }, { status: 400 });
		}

		// Lấy tham số query từ request
		const url = new URL(request.url);
		const offset = parseInt(url.searchParams.get('offset') || '0'); // Lấy giá trị offset, mặc định là 0
		const take = 2; // Số bình luận mỗi lần lấy

		// Truy vấn bài viết cùng với các bình luận và phản hồi
		const article = await prisma.article.findUnique({
			where: {
				id: params.id,
			},
			include: {
				reviews: {
					// take: take, // Lấy tối đa 2 bình luận mỗi lần
					// skip: offset, // Bỏ qua số lượng bình luận đã tải trước đó
					include: {
						user: { select: { id: true, name: true, image: true } }, // Lấy thông tin user
						replies: {
							include: {
								user: { select: { id: true, name: true, image: true } }, // Lấy thông tin user của phản hồi
							},
						},
					},
					orderBy: {
						createdDate: 'desc', // Sắp xếp bình luận theo thời gian giảm dần
					},
				},
				category: true,
			},
		});

		return NextResponse.json(article);
	} catch (error) {
		return NextResponse.json({ error: 'Lỗi truy vấn', message: error }, { status: 500 });
	}
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
	const currentUser = await getCurrentUser();

	if (!currentUser || currentUser.role !== 'ADMIN') {
		return NextResponse.error();
	}

	const body = await request.json();
	const { title, image, content, categoryId } = body;

	const article = await prisma.article.update({
		where: { id: params.id },
		data: { userId: currentUser.id, title, image, content, categoryId },
	});
	return NextResponse.json(article);
}

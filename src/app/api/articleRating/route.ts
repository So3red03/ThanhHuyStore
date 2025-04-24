import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';

export async function POST(request: Request) {
	try {
		const currentUser = await getCurrentUser();
		const body = await request.json();
		const { articleId, rating } = body;

		if (!currentUser) {
			return NextResponse.json({ error: 'Không tìm thấy user' }, { status: 404 });
		}
		// Nếu có `rating`, kiểm tra xem user đã đánh giá bài viết chưa
		if (rating !== undefined && rating !== null) {
			const existingReview = await prisma.articleReview.findFirst({
				where: {
					articleId,
					userId: currentUser.id,
					rating: { not: null }, // Chỉ kiểm tra các đánh giá có rating
				},
			});

			if (existingReview) {
				return NextResponse.json({ error: 'Bạn chỉ có thể đánh giá bài viết này một lần.' }, { status: 400 });
			}
		}
		const review = await prisma.articleReview.create({
			data: {
				articleId,
				userId: currentUser.id,
				rating,
			},
		});

		return NextResponse.json(review);
	} catch (error) {
		return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
	}
}

export async function GET(request: Request) {
	try {
		const currentUser = await getCurrentUser();
		const body = await request.json();
		const { articleId, rating } = body;
		if (!currentUser) {
			return NextResponse.json({ message: 'Vui lòng đăng nhập để thực hiện chức năng này.' }, { status: 401 });
		}

		// Kiểm tra user đã đánh giá bài viết hay chưa
		const existingReview = await prisma.articleReview.findFirst({
			where: {
				articleId,
				userId: currentUser.id,
			},
		});

		// Trả về kết quả
		if (existingReview) {
			return NextResponse.json(
				{ message: 'Bạn đã đánh giá bài viết này.', reviewed: true, rating: existingReview.rating },
				{ status: 200 }
			);
		} else {
			return NextResponse.json({ message: 'Bạn chưa đánh giá bài viết này.', reviewed: false }, { status: 200 });
		}
	} catch (error) {
		console.error('Lỗi kiểm tra đánh giá:', error);
		return NextResponse.json({ message: 'Đã xảy ra lỗi khi kiểm tra đánh giá.' }, { status: 500 });
	}
}

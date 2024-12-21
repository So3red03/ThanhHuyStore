import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';

export async function POST(req: any) {
	const { orderId, resultCode } = await req.json();

	console.log('MoMo Callback Received:', req.body);

	if (resultCode === 0) {
		// Thanh toán thành công
		const updatedOrder = await prisma.order.update({
			where: { id: orderId },
			data: {
				status: 'completed',
			},
		});

		if (!updatedOrder) {
			throw new Error('Lỗi khi cập nhật đơn hàng trong db');
		}

		return NextResponse.json({ success: true, updatedOrder });
	} else {
		// Xử lý thất bại, có thể giữ nguyên trạng thái pending hoặc chuyển sang failed
		return NextResponse.json({ success: false, message: 'Thanh toán thất bại.' });
	}
}

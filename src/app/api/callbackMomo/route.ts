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

		// Tự động tạo PDF và gửi email
		try {
			const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
			await fetch(`${baseUrl}/api/orders/process-payment`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					orderId: updatedOrder.id,
					paymentIntentId: updatedOrder.paymentIntentId,
				}),
			});
		} catch (error) {
			console.error('Error processing payment in MoMo callback:', error);
		}

		return NextResponse.json({ success: true, updatedOrder });
	} else {
		// Xử lý thất bại, có thể giữ nguyên trạng thái pending hoặc chuyển sang failed
		return NextResponse.json({ success: false, message: 'Thanh toán thất bại.' });
	}
}

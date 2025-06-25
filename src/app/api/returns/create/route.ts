import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, type, reason, description, images } = await request.json();

    // Validate required fields
    if (!orderId || !type || !reason) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    // Kiểm tra đơn hàng tồn tại và thuộc về user
    // For testing: validate ObjectID format first
    if (!orderId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ error: 'Order ID không hợp lệ' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    });

    if (!order) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    if (order.userId !== currentUser.id) {
      return NextResponse.json({ error: 'Không có quyền truy cập đơn hàng này' }, { status: 403 });
    }

    // Kiểm tra trạng thái đơn hàng (chỉ cho phép đơn hàng đã hoàn thành)
    if (order.status !== 'completed') {
      return NextResponse.json({ error: 'Chỉ có thể đổi/trả đơn hàng đã hoàn thành' }, { status: 400 });
    }

    // Kiểm tra thời gian (7 ngày)
    const daysSinceOrder = Math.floor((Date.now() - order.createDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceOrder > 7) {
      return NextResponse.json({ error: 'Đã quá thời hạn đổi/trả hàng (7 ngày)' }, { status: 400 });
    }

    // TODO: Implement after schema sync
    // const existingRequest = await prisma.returnRequest.findFirst({
    //   where: {
    //     orderId,
    //     status: {
    //       in: ['PENDING', 'APPROVED'],
    //     },
    //   },
    // });

    // if (existingRequest) {
    //   return NextResponse.json(
    //     { error: 'Đơn hàng này đã có yêu cầu đổi/trả đang xử lý' },
    //     { status: 400 }
    //   );
    // }

    // // Tạo yêu cầu đổi/trả
    // const returnRequest = await prisma.returnRequest.create({
    //   data: {
    //     orderId,
    //     userId: currentUser.id,
    //     type,
    //     reason,
    //     description: description || null,
    //     images: images || [],
    //   },
    //   include: {
    //     order: {
    //       include: {
    //         user: true,
    //       },
    //     },
    //   },
    // });

    // TODO: Implement after schema sync
    return NextResponse.json({
      success: true,
      message: 'Tính năng đổi/trả hàng sẽ được kích hoạt sau khi cập nhật database schema',
      data: {
        orderId,
        type,
        reason,
        description
      }
    });
  } catch (error) {
    console.error('Error creating return request:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}

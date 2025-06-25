import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
// import prisma from '@/app/libs/prismadb'; // TODO: Uncomment after schema sync

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, adminNote } = await request.json();
    const returnRequestId = params.id;

    // Validate action
    if (!['APPROVE', 'REJECT', 'COMPLETE'].includes(action)) {
      return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
    }

    // TODO: Implement after schema sync
    return NextResponse.json({
      success: true,
      message: 'Tính năng đổi/trả hàng sẽ được kích hoạt sau khi cập nhật database schema',
      data: {
        returnRequestId,
        action,
        adminNote
      }
    });

    // TODO: Uncomment after schema sync
    // const returnRequest = await prisma.returnRequest.findUnique({
    //   where: { id: returnRequestId },
    //   include: {
    //     order: {
    //       include: {
    //         user: true,
    //       },
    //     },
    //     user: true,
    //   },
    // });

    // if (!returnRequest) {
    //   return NextResponse.json({ error: 'Không tìm thấy yêu cầu đổi/trả' }, { status: 404 });
    // }

    // // Determine new status
    // let newStatus: string;
    // let updateData: any = {
    //   processedBy: currentUser.id,
    //   processedAt: new Date(),
    //   adminNote: adminNote || null
    // };

    // switch (action) {
    //   case 'APPROVE':
    //     if (returnRequest.status !== 'PENDING') {
    //       return NextResponse.json({ error: 'Chỉ có thể duyệt yêu cầu đang chờ xử lý' }, { status: 400 });
    //     }
    //     newStatus = 'APPROVED';
    //     break;

    //   case 'REJECT':
    //     if (returnRequest.status !== 'PENDING') {
    //       return NextResponse.json({ error: 'Chỉ có thể từ chối yêu cầu đang chờ xử lý' }, { status: 400 });
    //     }
    //     newStatus = 'REJECTED';
    //     break;

    //   case 'COMPLETE':
    //     if (returnRequest.status !== 'APPROVED') {
    //       return NextResponse.json({ error: 'Chỉ có thể hoàn tất yêu cầu đã được duyệt' }, { status: 400 });
    //     }
    //     newStatus = 'COMPLETED';

    //     // Cập nhật trạng thái đơn hàng nếu cần
    //     if (returnRequest.type === 'RETURN' || returnRequest.type === 'REFUND') {
    //       await prisma.order.update({
    //         where: { id: returnRequest.orderId },
    //         data: {
    //           deliveryStatus: 'returned'
    //         }
    //       });
    //     }
    //     break;

    //   default:
    //     return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
    // }

    // updateData.status = newStatus;

    // // Update return request
    // const updatedRequest = await prisma.returnRequest.update({
    //   where: { id: returnRequestId },
    //   data: updateData,
    //   include: {
    //     order: {
    //       include: {
    //         user: true
    //       }
    //     },
    //     user: true
    //   }
    // });

    // // Create activity log
    // await prisma.activity.create({
    //   data: {
    //     userId: returnRequest.userId,
    //     type: 'ORDER_UPDATED',
    //     title: `Yêu cầu đổi/trả ${
    //       action === 'APPROVE' ? 'đã được duyệt' : action === 'REJECT' ? 'bị từ chối' : 'đã hoàn tất'
    //     }`,
    //     description: `Yêu cầu ${
    //       returnRequest.type === 'EXCHANGE' ? 'đổi' : returnRequest.type === 'RETURN' ? 'trả' : 'hoàn tiền'
    //     } hàng cho đơn #${returnRequest.order.paymentIntentId.slice(-6).toUpperCase()} ${
    //       action === 'APPROVE' ? 'đã được duyệt' : action === 'REJECT' ? 'bị từ chối' : 'đã hoàn tất'
    //     }`,
    //     data: {
    //       orderId: returnRequest.orderId,
    //       returnRequestId: returnRequest.id,
    //       action,
    //       adminNote,
    //       processedBy: currentUser.id
    //     }
    //   }
    // });

    // // TODO: Gửi thông báo Discord
    // // TODO: Gửi email thông báo cho khách hàng

    // return NextResponse.json({
    //   success: true,
    //   message: `Yêu cầu đã được ${
    //     action === 'APPROVE' ? 'duyệt' : action === 'REJECT' ? 'từ chối' : 'hoàn tất'
    //   } thành công`,
    //   returnRequest: {
    //     id: updatedRequest.id,
    //     status: updatedRequest.status,
    //     adminNote: updatedRequest.adminNote,
    //     processedAt: updatedRequest.processedAt
    //   }
    // });
  } catch (error) {
    console.error('Error processing return request:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}

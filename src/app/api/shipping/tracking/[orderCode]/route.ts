import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import GHNService from '@/app/services/ghnService';

export async function GET(request: NextRequest, { params }: { params: { orderCode: string } }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderCode = params.orderCode;

    // TODO: Find order by shipping code after schema sync
    // For now, find by paymentIntentId (temporary)
    const order = await prisma.order.findFirst({
      where: {
        paymentIntentId: { contains: orderCode.slice(-6) }
      },
      include: { user: true }
    });

    if (!order) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng với mã vận chuyển này' }, { status: 404 });
    }

    // Check permission (admin or order owner)
    if (currentUser.role !== 'ADMIN' && currentUser.id !== order.userId) {
      return NextResponse.json({ error: 'Không có quyền truy cập thông tin này' }, { status: 403 });
    }

    // For testing purposes, return mock data
    // In production, this would call actual GHN API
    const mockTrackingData = {
      order_code: orderCode,
      status: 'delivered',
      status_text: 'Đã giao hàng',
      created_date: '2024-01-15T10:00:00Z',
      updated_date: '2024-01-18T16:30:00Z',
      log: [
        {
          status: 'ready_to_pick',
          updated_date: '2024-01-15T10:00:00Z',
          description: 'Đơn hàng đã được tạo'
        },
        {
          status: 'picking',
          updated_date: '2024-01-15T14:00:00Z',
          description: 'Đang lấy hàng'
        },
        {
          status: 'picked',
          updated_date: '2024-01-15T16:00:00Z',
          description: 'Đã lấy hàng thành công'
        },
        {
          status: 'storing',
          updated_date: '2024-01-16T08:00:00Z',
          description: 'Hàng đang ở kho trung chuyển'
        },
        {
          status: 'transporting',
          updated_date: '2024-01-17T09:00:00Z',
          description: 'Đang vận chuyển'
        },
        {
          status: 'sorting',
          updated_date: '2024-01-18T10:00:00Z',
          description: 'Đang phân loại tại kho giao hàng'
        },
        {
          status: 'delivering',
          updated_date: '2024-01-18T14:00:00Z',
          description: 'Đang giao hàng'
        },
        {
          status: 'delivered',
          updated_date: '2024-01-18T16:30:00Z',
          description: 'Đã giao hàng thành công'
        }
      ]
    };

    const trackingData = mockTrackingData;

    // Map GHN status to system status for testing
    const mapGHNStatusToSystem = (ghnStatus: string) => {
      switch (ghnStatus) {
        case 'ready_to_pick':
        case 'picking':
        case 'picked':
        case 'storing':
          return 'not_shipped';
        case 'transporting':
        case 'sorting':
        case 'delivering':
          return 'in_transit';
        case 'delivered':
          return 'delivered';
        case 'return':
        case 'returned':
          return 'returned';
        default:
          return 'not_shipped';
      }
    };

    const systemStatus = mapGHNStatusToSystem(trackingData.status);

    // if (order.deliveryStatus !== systemStatus) {
    //   await prisma.order.update({
    //     where: { id: order.id },
    //     data: {
    //       deliveryStatus: systemStatus as any,
    //       shippingStatus: trackingData.status
    //     }
    //   });

    //   // Create activity log for status change
    //   await prisma.activity.create({
    //     data: {
    //       userId: order.userId,
    //       type: 'ORDER_UPDATED',
    //       title: 'Cập nhật trạng thái vận chuyển',
    //       description: `Đơn hàng #${order.paymentIntentId.slice(-6).toUpperCase()} - ${trackingData.status_text}`,
    //       data: {
    //         orderId: order.id,
    //         shippingCode: orderCode,
    //         oldStatus: order.deliveryStatus,
    //         newStatus: systemStatus,
    //         ghnStatus: trackingData.status,
    //         statusText: trackingData.status_text
    //       }
    //     }
    //   });
    // }

    // Format response
    const formattedTracking = {
      orderCode: trackingData.order_code,
      status: trackingData.status,
      statusText: trackingData.status_text,
      systemStatus,
      createdDate: trackingData.created_date,
      updatedDate: trackingData.updated_date,
      timeline: trackingData.log.map((log: any) => ({
        status: log.status,
        description: log.description,
        updatedDate: log.updated_date
      })),
      order: {
        id: order.id,
        paymentIntentId: order.paymentIntentId,
        amount: order.amount,
        createDate: order.createDate,
        customerName: order.user.name,
        customerPhone: order.phoneNumber,
        address: order.address
      }
    };

    return NextResponse.json({
      success: true,
      data: formattedTracking
    });
  } catch (error) {
    console.error('Error tracking order:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống khi lấy thông tin tracking' }, { status: 500 });
  }
}

// POST endpoint để cập nhật trạng thái từ webhook GHN
export async function POST(request: NextRequest, { params }: { params: { orderCode: string } }) {
  try {
    const webhookData = await request.json();
    const orderCode = params.orderCode;

    // Verify webhook (nếu GHN có signature verification)
    // TODO: Implement webhook signature verification

    // TODO: Find order by shipping code after schema sync
    const order = await prisma.order.findFirst({
      where: {
        paymentIntentId: { contains: orderCode.slice(-6) }
      },
      include: { user: true }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // TODO: Update order status after schema sync
    const systemStatus = GHNService.mapGHNStatusToSystem(webhookData.Status);

    // await prisma.order.update({
    //   where: { id: order.id },
    //   data: {
    //     deliveryStatus: systemStatus as any,
    //     shippingStatus: webhookData.Status,
    //     shippingData: webhookData
    //   }
    // });

    // Create activity log
    await prisma.activity.create({
      data: {
        userId: order.userId,
        type: 'ORDER_UPDATED',
        title: 'Cập nhật trạng thái vận chuyển',
        description: `Đơn hàng #${order.paymentIntentId.slice(-6).toUpperCase()} - ${
          webhookData.Description || webhookData.Status
        }`,
        data: {
          orderId: order.id,
          shippingCode: orderCode,
          webhookData,
          systemStatus
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

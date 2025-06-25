import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import GHNService from '@/app/services/ghnService';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Thiếu thông tin orderId' }, { status: 400 });
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    if ((order as any).shippingCode) {
      return NextResponse.json({ error: 'Đơn hàng đã có mã vận chuyển' }, { status: 400 });
    }

    if (!order.address) {
      return NextResponse.json({ error: 'Đơn hàng không có địa chỉ giao hàng' }, { status: 400 });
    }

    // Calculate total weight from products
    const products = order.products as any[];
    const totalWeight = GHNService.calculateTotalWeight(products);

    // Prepare GHN order data
    const ghnOrderData = {
      payment_type_id: 1, // Người gửi trả phí
      note: `Đơn hàng ThanhHuyStore #${order.paymentIntentId.slice(-6).toUpperCase()}`,
      required_note: 'CHOXEMHANGKHONGTHU',
      to_name: order.user.name || 'Khách hàng',
      to_phone: order.phoneNumber || order.user.phoneNumber || '',
      to_address: GHNService.formatAddress({
        line1: order.address.line1,
        line2: order.address.line2 || undefined,
        city: order.address.city,
        postal_code: order.address.postal_code
      }),
      to_ward_code: order.address.postal_code, // Assuming postal_code is ward_code
      to_district_id: parseInt(process.env.GHN_DEFAULT_DISTRICT_ID || '1442'), // Default district
      weight: totalWeight,
      service_type_id: 2, // Tiêu chuẩn
      items: products.map(product => ({
        name: product.name,
        quantity: product.quantity,
        weight: 500 // Default weight per item
      })),
      insurance_value: Math.min(order.amount, 5000000) // Max 5M VND
    };

    // Create shipping order with GHN
    const ghnResponse = await GHNService.createShippingOrder(ghnOrderData);

    if (ghnResponse.code !== 200) {
      return NextResponse.json({ error: ghnResponse.message || 'Lỗi tạo đơn vận chuyển' }, { status: 400 });
    }

    // TODO: Update order with shipping info after schema sync
    // const updatedOrder = await prisma.order.update({
    //   where: { id: orderId },
    //   data: {
    //     shippingCode: ghnResponse.data.order_code,
    //     shippingStatus: 'ready_to_pick',
    //     shippingData: ghnResponse.data,
    //     deliveryStatus: 'not_shipped'
    //   }
    // });

    // Create activity log
    await prisma.activity.create({
      data: {
        userId: order.userId,
        type: 'ORDER_UPDATED',
        title: 'Đơn hàng đã được tạo vận đơn',
        description: `Đơn hàng #${order.paymentIntentId.slice(-6).toUpperCase()} đã được tạo vận đơn GHN: ${
          ghnResponse.data.order_code
        }`,
        data: {
          orderId: order.id,
          shippingCode: ghnResponse.data.order_code,
          totalFee: ghnResponse.data.total_fee,
          expectedDelivery: ghnResponse.data.expected_delivery_time
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Tạo đơn vận chuyển thành công',
      data: {
        orderId: order.id,
        shippingCode: ghnResponse.data.order_code,
        totalFee: ghnResponse.data.total_fee,
        expectedDeliveryTime: ghnResponse.data.expected_delivery_time,
        sortCode: ghnResponse.data.sort_code
      }
    });
  } catch (error) {
    console.error('Error creating shipping order:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống khi tạo đơn vận chuyển' }, { status: 500 });
  }
}

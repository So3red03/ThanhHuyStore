import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

// POST - Sửa các notification có title null (chỉ admin)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Tìm tất cả notifications có title null
    const nullTitleNotifications = await prisma.notification.findMany({
      where: {
        title: null
      }
    });

    console.log(`Found ${nullTitleNotifications.length} notifications with null title`);

    // Cập nhật từng notification với title mặc định dựa trên type
    const updatePromises = nullTitleNotifications.map(async (notification) => {
      let defaultTitle = 'Thông báo';
      let defaultMessage = 'Thông báo hệ thống';

      switch (notification.type) {
        case 'ORDER_PLACED':
          defaultTitle = 'Đơn hàng mới';
          defaultMessage = 'Bạn có đơn hàng mới cần xử lý';
          break;
        case 'MESSAGE_RECEIVED':
          defaultTitle = 'Tin nhắn mới';
          defaultMessage = 'Bạn có tin nhắn mới';
          break;
        case 'COMMENT_RECEIVED':
          defaultTitle = 'Bình luận mới';
          defaultMessage = 'Sản phẩm của bạn có bình luận mới';
          break;
        case 'LOW_STOCK':
          defaultTitle = 'Cảnh báo hết hàng';
          defaultMessage = 'Sản phẩm sắp hết hàng';
          break;
        case 'SYSTEM_ALERT':
          defaultTitle = 'Thông báo hệ thống';
          defaultMessage = 'Thông báo từ hệ thống';
          break;
        default:
          defaultTitle = 'Thông báo';
          defaultMessage = 'Thông báo hệ thống';
      }

      return prisma.notification.update({
        where: { id: notification.id },
        data: {
          title: defaultTitle,
          message: notification.message || defaultMessage
        }
      });
    });

    const updatedNotifications = await Promise.all(updatePromises);

    return NextResponse.json({
      message: `Fixed ${updatedNotifications.length} notifications with null title`,
      count: updatedNotifications.length
    });
  } catch (error) {
    console.error('Error fixing null title notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

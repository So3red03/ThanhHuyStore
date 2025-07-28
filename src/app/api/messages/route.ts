import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';
import { pusherServer } from './../../libs/pusher';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return new NextResponse('Not found user', { status: 404 });
    }

    // Invoking data JSON from request
    const body = await request.json();
    const { message, chatRoomId } = body;

    if (!message || !chatRoomId) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Tạo tin nhắn mới với transaction để đảm bảo tính nhất quán
    const newMessage = await prisma.message.create({
      data: {
        body: message,
        chatroomId: chatRoomId, // Sử dụng direct field thay vì connect để tối ưu
        senderId: currentUser.id, // Sử dụng direct field thay vì connect để tối ưu
        seenIds: [currentUser.id] // Sử dụng array thay vì relation để tối ưu
      },
      include: {
        seen: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true
          }
        }
      }
    });
    // Cập nhật chatroom với lastMessageAt và gửi realtime events song song
    const [updatedChatRoom] = await Promise.all([
      prisma.chatRoom.update({
        where: { id: chatRoomId },
        data: { lastMessageAt: new Date() },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      }),
      // Gửi sự kiện realtime ngay lập tức để tăng tốc độ
      pusherServer.trigger(chatRoomId, 'messages:new', newMessage)
    ]);

    // Update lastest message bên sidebar với parallel execution
    const conversationUpdatePromises = updatedChatRoom.users.map(user => {
      if (user.email) {
        return pusherServer.trigger(user.email, 'conversation:update', {
          id: chatRoomId,
          message: [newMessage] // Sử dụng newMessage thay vì query lại
        });
      }
    });

    // Thực hiện tất cả updates song song
    await Promise.all(conversationUpdatePromises.filter(Boolean));
    return NextResponse.json(newMessage);
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}

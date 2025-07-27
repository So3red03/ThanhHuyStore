import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { NextResponse } from 'next/server';
import prisma from '../../../../libs/prismadb';
import { pusherServer } from '@/app/libs/pusher';

interface IParams {
  id?: string;
}

export async function POST(request: Request, { params }: { params: IParams }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Invoking data JSON from request
    const { id } = params;
    // Kiểm tra nếu đã tồn tại ChatRoom giữa hai người dùng
    const conversation = await prisma.chatRoom.findUnique({
      where: {
        id: id
      },
      include: {
        messages: {
          include: {
            seen: true
          }
        },
        users: true
      }
    });
    if (!conversation) {
      return new NextResponse('Invalid ID', { status: 400 });
    }
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (!lastMessage) {
      return NextResponse.json(conversation);
    }

    // Update seen of last message
    const updatedMessage = await prisma.message.update({
      where: {
        id: lastMessage.id
      },
      include: {
        sender: true,
        seen: true
      },
      data: {
        seen: {
          connect: {
            id: currentUser.id
          }
        }
      }
    });

    // Gửi thông báo qua Pusher đến email của người dùng hiện tại với sự cập nhật tin nhắn mới bên chatlist.
    await pusherServer.trigger(currentUser.email, 'conversation:update', {
      id: id,
      messages: [updatedMessage]
    });

    // Kiểm tra xem người dùng hiện tại đã xem tin nhắn cuối cùng chưa.
    // Nếu đã xem, trả về thông tin cuộc trò chuyện mà không cập nhật thêm gì.
    if (lastMessage.seenIds.indexOf(currentUser.id) !== -1) {
      return NextResponse.json(conversation);
    }
    // Nếu người dùng chưa xem tin nhắn cuối cùng, gửi thông báo qua Pusher cho tất cả các thành viên của cuộc trò chuyện về sự cập nhật của tin nhắn.
    await pusherServer.trigger(id!, 'message:update', updatedMessage);
    return NextResponse.json(updatedMessage);
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}

import { getConversationById } from '@/app/actions/getConversationById';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { getMessages } from '@/app/actions/getMessages';
import ChatPageClient from '@/app/components/admin/chat/ChatPageClient';

const ChatroomId = async ({ params }: { params: { id: string } }) => {
  const conversation = await getConversationById(params.id);
  const messages = await getMessages(params.id);
  const currentUser = await getCurrentUser();
  if (!conversation) {
    return <div className='flex flex-col'>Bắt đầu cuộc trò chuyện mới</div>;
  }

  return (
    <ChatPageClient conversation={conversation} messages={messages} currentUser={currentUser} chatRoomId={params.id} />
  );
};

export default ChatroomId;

import { getConversationById } from '@/app/actions/getConversationById';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { getMessages } from '@/app/actions/getMessages';
import Body from '@/app/components/admin/chat/Body';
import ChatForm from '@/app/components/admin/chat/ChatForm';
import Header from '@/app/components/admin/chat/Header';

const ChatroomId = async ({ params }: { params: { id: string } }) => {
	const conversation = await getConversationById(params.id);
	const messages = await getMessages(params.id);
	const currentUser = await getCurrentUser();
	if (!conversation) {
		return <div className="flex flex-col">Bắt đầu cuộc trò chuyện mới</div>;
	}
	return (
		<div className="h-full flex flex-col">
			<Header conversation={conversation} />
			<Body Messages={messages} currentUser={currentUser} chatRoomId={params.id} />
			<ChatForm chatRoomId={params.id} />
		</div>
	);
};

export default ChatroomId;

import { getConversations } from '@/app/actions/getConversations';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { getSessionUsers } from '@/app/actions/getUsers';
import ChatList from '@/app/components/admin/chat/ChatList';
import Container from '@/app/components/Container';
import NullData from '@/app/components/NullData';

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
	const userInSession = await getSessionUsers();
	// Trả về các conversation của client hiện tại không phải danh sách bạn bè
	const conversations = await getConversations();
	const currentUser = await getCurrentUser();
	if (!currentUser || currentUser.role !== 'ADMIN') {
		return <NullData title="Từ chối đăng nhập" />;
	}
	return (
		<Container custom="!p-0 h-[89vh] flex rounded-lg border border-gray-300 mt-6">
			<ChatList conversations={conversations} userInSession={userInSession} />
			<div className="flex-1">{children}</div>
		</Container>
	);
}

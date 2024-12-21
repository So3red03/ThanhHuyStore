'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import Avatar from './Avatar';
import { format } from 'date-fns';
import { ChatRoomType } from '../../../../../types';
import { useSession } from 'next-auth/react';
import { useOtherUser } from '@/app/actions/getOtherUser';
import { User } from '@prisma/client';

interface ChatBoxProps {
	conversation: ChatRoomType;
	userInSession: User;
	selected?: boolean;
	onClick: () => void;
}
const ChatBox: React.FC<ChatBoxProps> = ({ conversation, selected, userInSession, onClick }) => {
	const [isLoading, setIsLoading] = useState(false);
	// Dùng session phải khai báo provider xử lý bên phía client
	const session = useSession();
	const router = useRouter();
	// Hàm này trả về các user có conversation với currentUser nên có vẻ k cần dùng
	// const otherUser = getOtherUser(conversation);
	const handleClick = useCallback(() => {
		onClick();
		if (conversation) {
			return router.push(`/admin/chat/${conversation?.id}`);
		}
		axios
			.post('/api/conversation', { userId: userInSession?.id })
			.then((response) => {
				router.push(`/admin/chat/${response.data.id}`);
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [conversation, userInSession?.id, router, onClick]);

	const { lastMessage, lastMessageText } = useMemo(() => {
		// Lấy tất cả dữ liệu của mess
		const messages = conversation?.messages || [];
		// Lấy mess cuối
		const lastMessage = messages[messages.length - 1];
		let lastMessageText = 'Chưa có tin nhắn';
		if (lastMessage) {
			const isOwnMessage = lastMessage?.sender?.email === session?.data?.user?.email;

			lastMessageText = isOwnMessage ? `Bạn: ${lastMessage.body || ''}` : lastMessage.body || '';
		}

		return { lastMessage, lastMessageText };
	}, [conversation?.messages, session?.data?.user?.email]);

	const userEmail = useMemo(() => {
		return session?.data?.user?.email;
	}, [session?.data?.user?.email]);

	const hasSeen = useMemo(() => {
		if (!lastMessage) {
			return false;
		}
		const seenArray = lastMessage.seen || [];

		if (!userEmail) {
			return false;
		}
		return seenArray.filter((user) => user.email === userEmail).length !== 0;
	}, [lastMessage, userEmail]);

	return (
		<div
			onClick={handleClick}
			className={`w-full relative flex items-center space-x-3 p-3 px-4 hover:bg-neutral-100  transition-none cursor-pointer ${
				selected ? 'bg-neutral-100' : 'bg-white'
			}`}
		>
			<Avatar user={userInSession} />
			<div className="flex-1">
				<div className="focus:outline-none">
					<div className="flex justify-between items-center mb-1">
						<p className="text-sm font-medium text-gray-900">{userInSession.name}</p>
						{lastMessage?.createdAt && (
							<p className="text-xs text-gray-400 font-light">
								{format(new Date(lastMessage.createdAt), 'p')}
							</p>
						)}
					</div>
					<p className={`truncate text-sm ${hasSeen ? 'text-gray-500' : 'text-gray-500 font-semibold'}`}>
						{lastMessageText}
					</p>
				</div>
			</div>
		</div>
	);
};

export default ChatBox;

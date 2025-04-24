'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageType, SafeUser } from '../../../../../types';
import MessageBox from './MessageBox';
import axios from 'axios';
import { pusherClient } from '@/app/libs/pusher';

interface BodyProps {
	Messages: MessageType[];
	chatRoomId: string;
	className?: string;
	currentUser: SafeUser | null | undefined;
}
const Body: React.FC<BodyProps> = ({ Messages, chatRoomId, className, currentUser }) => {
	const [messages, setMessages] = useState(Messages);
	const bottomRef = useRef<HTMLDivElement>(null); // Tham chiếu đến tin nhắn cuối (tự động cuộn)
	const [isScrolledUp, setIsScrolledUp] = useState(false); // Thêm state để kiểm tra cuộn
	const containerRef = useRef<HTMLDivElement>(null); // Tham chiếu đến container chứa tin nhắn

	// Đánh dấu là cuộc trò chuyện đã xem
	useEffect(() => {
		axios.post(`/api/conversation/${chatRoomId}/seen`);
	}, [chatRoomId]);

	// Server gửi sự kiện messages:new đến Pusher.
	// Pusher truyền sự kiện này đến tất cả các client đã đăng ký lắng nghe sự kiện messages:new.
	// Client nhận được sự kiện này và gọi hàm messageHandler để cập nhật giao diện người dùng (ví dụ: hiển thị tin nhắn mới).
	useEffect(() => {
		axios.post(`/api/conversation/${chatRoomId}/seen`);
		// Đăng ký kênh Pusher cho phòng trò chuyện (chatRoomId) và lắng nghe các tin nhắn mới.
		pusherClient.subscribe(chatRoomId);
		bottomRef?.current?.scrollIntoView();

		// Hàm xử lý khi có tin nhắn mới.
		const messageHandler = (newMessage: MessageType) => {
			// Cập nhật danh sách tin nhắn bằng cách thêm tin nhắn mới nếu nó chưa tồn tại trong danh sách
			setMessages((currentMsg) => {
				if (currentMsg.find((m) => m.id === newMessage.id)) {
					return currentMsg;
				}
				return [...currentMsg, newMessage];
			});
		};

		// Hàm update để check xem tin nhắn đã được seen chưa
		const updatedMessageHandler = (newMessage: MessageType) => {
			// Cập nhật danh sách tin nhắn bằng cách thêm tin nhắn mới nếu nó chưa tồn tại trong danh sách
			setMessages((currentMsg) =>
				currentMsg.map((currentMessage) => {
					if (currentMessage.id === newMessage.id) {
						return newMessage;
					}
					return currentMessage;
				})
			);
		};

		// Lắng nghe sự kiện messages:new từ Pusher và gọi messageHandler khi có tin nhắn mới.
		pusherClient.bind('messages:new', messageHandler);
		pusherClient.bind('messages:update', updatedMessageHandler);

		// Hàm clean up
		return () => {
			pusherClient.unsubscribe(chatRoomId);
			pusherClient.unbind('messages:new', messageHandler);
		};
	}, [chatRoomId]);

	// Cuộn xuống cuối cùng khi tin nhắn thay đổi
	useEffect(() => {
		//{behavior: ''}
		bottomRef?.current?.scrollIntoView();
	}, [messages]);

	// Lắng nghe sự kiện scroll để kiểm tra xem có cần hiển thị button không
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const handleScroll = () => {
			// Kiểm tra nếu đã cuộn xuống cuối hay chưa
			const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 10;
			setIsScrolledUp(!isAtBottom);
		};

		container.addEventListener('scroll', handleScroll);
		return () => container.removeEventListener('scroll', handleScroll);
	}, []);

	return (
		<div
			className={`relative flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#c0c0c0] bg-[#F7F6FA] scrollbar-track-transparent ${className}`}
		>
			{messages.map((message, i) => (
				<MessageBox
					isLast={i === messages.length - 1}
					key={message.id}
					data={message}
					currentUser={currentUser}
				/>
			))}
			{/* Button chỉ hiện khi người dùng trượt lên */}
			{isScrolledUp && (
				<button
					onClick={() => bottomRef?.current?.scrollIntoView({ behavior: 'smooth' })}
					className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium 
					focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none 
					disabled:opacity-80 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 
					disabled:text-zinc-600 h-9 w-9 absolute right-8 bottom-4 z-10 animate-in rounded-full border border-zinc-300 
					bg-zinc-50 text-zinc-500 transition-opacity duration-300 group-data-[theme=dark]:border-zinc-600 
					group-data-[theme=dark]:bg-zinc-700 group-data-[theme=dark]:text-white opacity-100"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width={24}
						height={24}
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
						className="lucide lucide-chevron-down"
					>
						<path d="m6 9 6 6 6-6" />
					</svg>
					<span className="sr-only">Scroll to bottom</span>
				</button>
			)}
			<div ref={bottomRef} />
		</div>
	);
};

export default Body;

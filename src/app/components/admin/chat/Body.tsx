'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageType } from '../../../../../types';
import MessageBox from './MessageBox';
import axios from 'axios';
import { pusherClient } from '@/app/libs/pusher';

interface BodyProps {
	Messages: MessageType[];
	chatRoomId: string;
	className?: string;
}
const Body: React.FC<BodyProps> = ({ Messages, chatRoomId, className }) => {
	const [messages, setMessages] = useState(Messages);
	// Tham chiếu đến tin nhắn cuối (tự động cuộn)
	const bottomRef = useRef<HTMLDivElement>(null);

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

	return (
		<div
			className={`flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#c0c0c0] bg-[#F7F6FA]  scrollbar-track-transparent ${className}`}
		>
			{messages.map((message, i) => (
				<MessageBox isLast={i === messages.length - 1} key={message.id} data={message} />
			))}
			<div ref={bottomRef} />
		</div>
	);
};

export default Body;

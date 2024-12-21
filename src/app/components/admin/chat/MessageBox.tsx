'use client';

import { useSession } from 'next-auth/react';
import { MessageType } from '../../../../../types';
import Avatar from './Avatar';
import { format } from 'date-fns';

interface MessageBoxProps {
	data: MessageType;
	isLast: boolean;
	smallChatBox?: boolean;
}
const MessageBox: React.FC<MessageBoxProps> = ({ data, isLast, smallChatBox }) => {
	const session = useSession();
	const isOwn = session?.data?.user?.email === data?.sender?.email;
	// console.log(session?.data?.user?.email);
	// console.log(data?.sender?.email);

	return (
		<div className={`flex gap-3 p-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
			<div className={`${isOwn && 'order-1'}`}>
				<Avatar user={data.sender} small={smallChatBox} />
			</div>
			<div className={`flex flex-col gap-2 ${isOwn && 'items-end'}`}>
				<div className="flex items-center gap-1">
					<div className="text-sm text-gray-500">{data.sender.name}</div>
					<div className="text-xs text-gray-400">{format(new Date(data.createdAt), 'p')}</div>
				</div>
				<div
					className={`text-sm w-fit rounded-full py-2 px-3 overflow-hidden shadow ${
						isOwn ? 'bg-[#16b1ff] text-white' : 'bg-white'
					}`}
				>
					<div>{data.body}</div>
				</div>
			</div>
		</div>
	);
};

export default MessageBox;

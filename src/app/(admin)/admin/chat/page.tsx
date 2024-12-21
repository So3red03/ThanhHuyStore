import { HiOutlineChatBubbleLeftRight } from 'react-icons/hi2';

export const dynamic = 'force-dynamic';

const ChatClient = async () => {
	return (
		<div className="flex h-full w-full bg-[#F7F6FA] items-center justify-center flex-col">
			<div
				className="p-6 font-semibold rounded-full bg-[#D3EAFB] mb-5 flex items-center justify-center"
				style={{ width: 98, height: 98 }}
			>
				<HiOutlineChatBubbleLeftRight className="text-[70px] font-semibold text-[#16B1FF]" />
			</div>
			<p
				className="text-center text-disabled text-gray-500 lg:whitespace-nowrap whitespace-normal"
				style={{ maxInlineSize: '40ch', textWrap: 'balance' }}
			>
				Bắt đầu chat bằng cách chọn tin nhắn.
			</p>
		</div>
	);
};

export default ChatClient;

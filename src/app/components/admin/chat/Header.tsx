'use client';

import { useOtherUser } from '@/app/actions/getOtherUser';
import { ChatRoom, User } from '@prisma/client';
import Link from 'next/link';
import { MdChevronLeft } from 'react-icons/md';
import Avatar from './Avatar';

interface HeaderProps {
	conversation: ChatRoom & { users: User[] };
}
const Header: React.FC<HeaderProps> = ({ conversation }) => {
	const otherUser = useOtherUser(conversation);
	return (
		<div className="w-full flex border-b-[1px] bg-[#F7F6FA]  border-gray-300 sm:px-4 py-3 pt-4 px-4 lg:px-6 justify-between items-center">
			<div className="flex gap-3 items-center">
				<Link
					className="lg:hidden block text-sky-500 hover:text-sky-text-sky-600 transition cursor-pointer"
					href="/chat"
				>
					<MdChevronLeft size={32} />
				</Link>
				<Avatar user={otherUser} />
				<div className="flex flex-col">
					<div>{otherUser?.name}</div>
					<div className="text-sm font-light text-neutral-500">Hoạt động</div>
				</div>
			</div>
		</div>
	);
};

export default Header;
